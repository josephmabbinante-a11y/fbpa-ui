import express from 'express';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { CarrierRateLog } from './models.js';
import {
  CONTINENTAL_STATES,
  GEO_DATABASE_VERSION,
  getGeoCoverageSummary,
  resolveMarketRegionByZip3,
  resolveStateByCode,
} from './geoMarketDatabase.js';
import {
  getSaiaHealthStatus,
  quoteSaiaRate,
  sanitizeQuoteForFrontend,
  toPricingInput,
} from './services/carriers/saia/saiaRateService.js';

const router = express.Router();

const FEATURE_SCHEMA_VERSION = '1.0';
const ENGINE_VERSION = 'rules_v1.2';
const RESPONSE_VERSION = '2.0';

const quoteOutcomes = [];
const carrierRateLogFallback = [];

const FEATURE_SCHEMA = {
  feature_schema_version: 'string',
  origin_zip3: 'string',
  destination_zip3: 'string',
  miles: 'number',
  equipment_type: 'string',
  pickup_date: 'string',
  fuel_price: 'number',
  lane_7d_avg: 'number',
  lane_30d_avg: 'number',
  lane_volatility: 'number',
  load_to_truck_ratio: 'number',
  carrier_score: 'number',
};

const EQUIPMENT_BASE_RATE_PER_MILE = {
  van: 1.95,
  reefer: 2.35,
  flatbed: 2.2,
};

const LANE_TYPE_MULTIPLIER = {
  'line haul': 1,
  drayage: 0.82,
  intermodal: 0.9,
};

const ROUTE_MULTIPLIERS = {
  'los angeles, ca|dallas, tx': 1.05,
  'chicago, il|atlanta, ga': 1.02,
  'seattle, wa|phoenix, az': 1.08,
};

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function toMoney(value) {
  return Math.round(value);
}

function toAmount(value) {
  return Number(Number(value || 0).toFixed(2));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toRate(value) {
  return Number(Number(value || 0).toFixed(4));
}

function toPct(value) {
  return Number((Number(value || 0) * 100).toFixed(2));
}

function toIsoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function normalizeZip3(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length >= 3) return digits.slice(0, 3);
  return String(value || '').trim().slice(0, 3);
}

function normalizeEquipmentType(value) {
  const raw = normalizeText(value).replace(/\s+/g, '_');
  if (raw === 'dry_van' || raw === 'van') return 'dry_van';
  if (raw === 'reefer') return 'reefer';
  if (raw === 'flatbed') return 'flatbed';
  return 'dry_van';
}

function standardDeviation(values = []) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const numeric = values.map((value) => Number(value || 0)).filter((value) => Number.isFinite(value));
  if (!numeric.length) return 0;
  const mean = numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
  const variance = numeric.reduce((sum, value) => {
    const delta = value - mean;
    return sum + (delta * delta);
  }, 0) / numeric.length;
  return Math.sqrt(Math.max(0, variance));
}

function volatilityModel({ laneHistory = [], rejectionTrend = 0, rpmVariance = 0, lane7dAvg = 0, lane30dAvg = 0 }) {
  const baseline = Math.max(0.5, Number(lane30dAvg || lane7dAvg || 0));
  const historyVariance = standardDeviation(laneHistory);
  const normalizedVariance = clamp(Number(rpmVariance || historyVariance) / Math.max(0.25, baseline), 0, 1);
  const velocity = clamp(Math.abs(Number(lane7dAvg || 0) - Number(lane30dAvg || 0)) / baseline, 0, 1);
  const normalizedRejectionTrend = clamp(Number(rejectionTrend || 0), 0, 1);

  const volatilityDecimal = clamp((normalizedVariance * 0.44) + (normalizedRejectionTrend * 0.36) + (velocity * 0.2), 0.08, 0.85);
  return {
    decimal: Number(volatilityDecimal.toFixed(4)),
    index: Math.round(volatilityDecimal * 100),
  };
}

function capacityModel({ availableTrucks = 120, inboundLoads = 100, regionDensity = 1 }) {
  const normalizedTrucks = Math.max(1, Number(availableTrucks || 0));
  const normalizedLoads = Math.max(0, Number(inboundLoads || 0));
  const normalizedDensity = clamp(Number(regionDensity || 1), 0.5, 1.6);
  const pressure = normalizedLoads / normalizedTrucks;

  const heatScore = clamp((pressure * 42) + (normalizedDensity * 26), 18, 100);
  const loadToTruckRatio = clamp(0.9 + (heatScore / 33), 0.95, 4.2);

  return {
    heatScore: Math.round(heatScore),
    loadToTruckRatio: Number(loadToTruckRatio.toFixed(2)),
  };
}

function inferHistoricalBounds(lane30dAvg, volatility) {
  const normalizedAvg = Math.max(0.5, Number(lane30dAvg || 0));
  const normalizedVolatility = clamp(Number(volatility || 0), 0, 1.25);
  const low = normalizedAvg * (1 - Math.min(0.45, normalizedVolatility * 1.5));
  const high = normalizedAvg * (1 + Math.min(0.55, normalizedVolatility * 1.7));
  return {
    historical_30d_low: toRate(Math.max(0.5, low)),
    historical_30d_high: toRate(Math.max(low + 0.05, high)),
  };
}

function normalizeFeaturePayload(payload = {}) {
  const laneHistory = Array.isArray(payload.lane_history)
    ? payload.lane_history.map((value) => Number(value || 0)).filter((value) => Number.isFinite(value) && value > 0)
    : [];

  const lane7dAvg = Number(payload.lane_7d_avg || 0);
  const lane30dAvg = Number(payload.lane_30d_avg || 0);
  const derivedVolatility = volatilityModel({
    laneHistory,
    rejectionTrend: Number(payload.rejection_trend || 0),
    rpmVariance: Number(payload.rpm_variance || 0),
    lane7dAvg,
    lane30dAvg,
  });

  const derivedCapacity = capacityModel({
    availableTrucks: Number(payload.available_trucks || 120),
    inboundLoads: Number(payload.inbound_loads || 100),
    regionDensity: Number(payload.region_density || 1),
  });

  const result = {
    feature_schema_version: String(payload.feature_schema_version || FEATURE_SCHEMA_VERSION),
    origin_zip3: normalizeZip3(payload.origin_zip3),
    destination_zip3: normalizeZip3(payload.destination_zip3),
    miles: Number(payload.miles || 0),
    equipment_type: normalizeEquipmentType(payload.equipment_type),
    pickup_date: toIsoDate(payload.pickup_date),
    fuel_price: Number(payload.fuel_price || 0),
    lane_7d_avg: lane7dAvg,
    lane_30d_avg: lane30dAvg,
    lane_volatility: derivedVolatility.decimal,
    load_to_truck_ratio: derivedCapacity.loadToTruckRatio,
    lane_volatility_index: derivedVolatility.index,
    capacity_heat_score: derivedCapacity.heatScore,
    rejection_trend: clamp(Number(payload.rejection_trend || 0), 0, 1),
    rpm_variance: Number(payload.rpm_variance || standardDeviation(laneHistory || [])),
    available_trucks: Number(payload.available_trucks || 120),
    inbound_loads: Number(payload.inbound_loads || 100),
    region_density: clamp(Number(payload.region_density || 1), 0.5, 1.6),
    carrier_score: Number(payload.carrier_score || 0),
  };

  const inferredBounds = inferHistoricalBounds(result.lane_30d_avg, result.lane_volatility);
  result.historical_30d_low = Number.isFinite(Number(payload.historical_30d_low))
    ? toRate(Number(payload.historical_30d_low))
    : inferredBounds.historical_30d_low;
  result.historical_30d_high = Number.isFinite(Number(payload.historical_30d_high))
    ? toRate(Number(payload.historical_30d_high))
    : inferredBounds.historical_30d_high;

  return result;
}

function validateFeaturePayload(featureSnapshot) {
  const issues = [];

  if (featureSnapshot.feature_schema_version !== FEATURE_SCHEMA_VERSION) {
    issues.push(`feature_schema_version must be ${FEATURE_SCHEMA_VERSION}`);
  }
  if (!featureSnapshot.origin_zip3 || String(featureSnapshot.origin_zip3).length < 3) {
    issues.push('origin_zip3 must have at least 3 characters');
  }
  if (!featureSnapshot.destination_zip3 || String(featureSnapshot.destination_zip3).length < 3) {
    issues.push('destination_zip3 must have at least 3 characters');
  }
  if (!Number.isFinite(featureSnapshot.miles) || featureSnapshot.miles <= 0) {
    issues.push('miles must be a positive number');
  }
  if (!featureSnapshot.pickup_date) {
    issues.push('pickup_date must be a valid date');
  }

  ['fuel_price', 'lane_7d_avg', 'lane_30d_avg', 'lane_volatility', 'load_to_truck_ratio', 'carrier_score']
    .forEach((key) => {
      if (!Number.isFinite(featureSnapshot[key])) {
        issues.push(`${key} must be numeric`);
      }
    });

  if (featureSnapshot.carrier_score < 0 || featureSnapshot.carrier_score > 1) {
    issues.push('carrier_score must be in range [0, 1]');
  }
  if (featureSnapshot.lane_7d_avg <= 0 || featureSnapshot.lane_30d_avg <= 0) {
    issues.push('lane_7d_avg and lane_30d_avg must be positive');
  }
  if (featureSnapshot.historical_30d_low <= 0 || featureSnapshot.historical_30d_high <= 0) {
    issues.push('historical_30d_low and historical_30d_high must be positive');
  }
  if (featureSnapshot.historical_30d_low > featureSnapshot.historical_30d_high) {
    issues.push('historical_30d_low cannot exceed historical_30d_high');
  }

  return issues;
}

function calculateDeterministicRate(featureSnapshot) {
  const baseRate = Math.max(featureSnapshot.lane_7d_avg, featureSnapshot.lane_30d_avg);

  const equipmentMultiplierMap = {
    dry_van: 1,
    reefer: 1.09,
    flatbed: 1.06,
  };
  const equipmentMultiplier = equipmentMultiplierMap[String(featureSnapshot.equipment_type || 'dry_van')] || 1;

  const fuelBaseline = 3.0;
  const fuelSensitivity = 0.12;
  const fuelComponent = Math.max(0, 0.18 + ((featureSnapshot.fuel_price - fuelBaseline) * fuelSensitivity));

  const marketMultiplier = clamp(0.88 + (featureSnapshot.load_to_truck_ratio * 0.09), 0.9, 1.35);
  const volatilityMultiplier = clamp(1 + (Number(featureSnapshot.lane_volatility_index || 0) / 1000), 1, 1.12);
  const capacityMultiplier = clamp(1 + (Number(featureSnapshot.capacity_heat_score || 0) / 1200), 1, 1.14);
  const fuelIndexAdjustment = Number(((Number(featureSnapshot.fuel_price || 0) - 3.0) * 0.02).toFixed(4));
  const rejectionSpikeRisk = Number(featureSnapshot.lane_volatility_index || 0) >= 65 || Number(featureSnapshot.capacity_heat_score || 0) >= 78
    ? 'High'
    : Number(featureSnapshot.lane_volatility_index || 0) >= 38 || Number(featureSnapshot.capacity_heat_score || 0) >= 55
      ? 'Moderate'
      : 'Low';
  const riskAdjustment = rejectionSpikeRisk === 'High' ? -0.03 : rejectionSpikeRisk === 'Moderate' ? -0.01 : 0;
  const carrierAdjustment = clamp(0.92 + (featureSnapshot.carrier_score * 0.16), 0.92, 1.08);

  const indexMultiplier = volatilityMultiplier * capacityMultiplier * (1 + fuelIndexAdjustment + riskAdjustment);
  const rawRuleRate = ((baseRate * equipmentMultiplier * marketMultiplier * carrierAdjustment * indexMultiplier) + fuelComponent);

  const floor = featureSnapshot.historical_30d_low;
  const ceiling = featureSnapshot.historical_30d_high * 1.08;
  const clamped = clamp(rawRuleRate, floor, ceiling);
  const clampedToGuardrail = clamped !== rawRuleRate;

  const confidenceBase = clamp(
    0.92 - (featureSnapshot.lane_volatility * 0.4) - (clampedToGuardrail ? 0.08 : 0),
    0.55,
    0.96
  );

  const spread = Math.max(0.03, featureSnapshot.lane_volatility * 0.4);

  return {
    rule_rate: toRate(clamped),
    confidence: Number(confidenceBase.toFixed(2)),
    recommended_band: {
      low: toRate(clamped - spread),
      high: toRate(clamped + spread),
    },
    guardrails: {
      floor: toRate(floor),
      ceiling: toRate(ceiling),
      clamped: clampedToGuardrail,
      unclamped_rate: toRate(rawRuleRate),
    },
    components: {
      base_rate: toRate(baseRate),
      equipment_multiplier: Number(equipmentMultiplier.toFixed(4)),
      fuel_component: toRate(fuelComponent),
      market_multiplier: Number(marketMultiplier.toFixed(4)),
      volatility_multiplier: Number(volatilityMultiplier.toFixed(4)),
      capacity_multiplier: Number(capacityMultiplier.toFixed(4)),
      fuel_index_adjustment: Number(fuelIndexAdjustment.toFixed(4)),
      risk_adjustment: Number(riskAdjustment.toFixed(4)),
      rate_index_multiplier: Number(indexMultiplier.toFixed(4)),
      carrier_adjustment: Number(carrierAdjustment.toFixed(4)),
    },
    explanation: [
      'Base rate = max(lane_7d_avg, lane_30d_avg)',
      'Equipment multiplier = f(equipment_type)',
      'Fuel component = DOE-indexed adjustment',
      'Market multiplier = f(load_to_truck_ratio)',
      'Carrier adjustment = f(carrier_score)',
      'Final rate clamped to floor/ceiling guardrails',
    ],
  };
}

function buildPredictResponse(featureSnapshot) {
  const deterministic = calculateDeterministicRate(featureSnapshot);
  return {
    version: RESPONSE_VERSION,
    feature_schema_version: FEATURE_SCHEMA_VERSION,
    engine_version: ENGINE_VERSION,
    rule_rate: deterministic.rule_rate,
    ml_rate: null,
    confidence: deterministic.confidence,
    recommended_band: deterministic.recommended_band,
    guardrails: deterministic.guardrails,
    components: deterministic.components,
    explanation: deterministic.explanation,
    feature_snapshot: featureSnapshot,
  };
}

function scoreDrift() {
  if (!quoteOutcomes.length) {
    return {
      mean_absolute_error_7d: null,
      acceptance_rate_rule: null,
      acceptance_rate_ml_shadow: null,
      lane_drift_score: null,
      margin_compression_trend: null,
    };
  }

  const last7d = quoteOutcomes.filter((quote) => {
    const createdAt = new Date(quote.created_at);
    return (Date.now() - createdAt.getTime()) <= (7 * 24 * 60 * 60 * 1000);
  });

  const errorRows = last7d.filter((row) => Number.isFinite(row.booked_rate) && Number.isFinite(row.rule_rate));
  const mae = errorRows.length
    ? errorRows.reduce((sum, row) => sum + Math.abs(row.booked_rate - row.rule_rate), 0) / errorRows.length
    : null;

  const acceptedRows = last7d.filter((row) => row.accepted === true || row.accepted === false);
  const acceptanceRate = acceptedRows.length
    ? acceptedRows.filter((row) => row.accepted).length / acceptedRows.length
    : null;

  const shadowRows = last7d.filter((row) => Number.isFinite(row.ml_rate) && Number.isFinite(row.booked_rate));
  const mlAcceptedEstimate = shadowRows.length
    ? shadowRows.filter((row) => Math.abs(row.ml_rate - row.booked_rate) <= 0.08).length / shadowRows.length
    : null;

  const margins = last7d
    .filter((row) => Number.isFinite(row.margin))
    .map((row) => row.margin);
  const marginTrend = margins.length
    ? Number((margins[margins.length - 1] - margins[0]).toFixed(4))
    : null;

  const driftScore = Number(
    clamp(
      (mae || 0) * 2.4 + ((acceptanceRate !== null ? Math.abs(0.65 - acceptanceRate) : 0) * 1.1),
      0,
      1
    ).toFixed(4)
  );

  return {
    mean_absolute_error_7d: mae !== null ? toRate(mae) : null,
    acceptance_rate_rule: acceptanceRate !== null ? Number(acceptanceRate.toFixed(4)) : null,
    acceptance_rate_ml_shadow: mlAcceptedEstimate !== null ? Number(mlAcceptedEstimate.toFixed(4)) : null,
    lane_drift_score: driftScore,
    margin_compression_trend: marginTrend,
  };
}

function toCsv(rows) {
  const headers = [
    'quote_id',
    'created_at',
    'engine_version',
    'feature_schema_version',
    'rule_rate',
    'ml_rate',
    'accepted',
    'booked_rate',
    'margin',
    'time_to_cover_minutes',
    'origin_zip3',
    'destination_zip3',
    'miles',
    'equipment_type',
    'pickup_date',
    'fuel_price',
    'lane_7d_avg',
    'lane_30d_avg',
    'lane_volatility',
    'load_to_truck_ratio',
    'carrier_score',
  ];

  const serialized = rows.map((row) => {
    const feature = row.feature_snapshot || {};
    const cells = [
      row.quote_id,
      row.created_at,
      row.engine_version,
      row.feature_schema_version,
      row.rule_rate,
      row.ml_rate ?? '',
      row.accepted,
      row.booked_rate,
      row.margin,
      row.time_to_cover_minutes,
      feature.origin_zip3,
      feature.destination_zip3,
      feature.miles,
      feature.equipment_type,
      feature.pickup_date,
      feature.fuel_price,
      feature.lane_7d_avg,
      feature.lane_30d_avg,
      feature.lane_volatility,
      feature.load_to_truck_ratio,
      feature.carrier_score,
    ];

    return cells
      .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
      .join(',');
  });

  return [headers.join(','), ...serialized].join('\n');
}

function buildMarketRows(laneAverage) {
  return [
    {
      source: 'greenscreens.ai',
      laneAvg: toMoney(laneAverage),
      low: toMoney(laneAverage * 0.83),
      high: toMoney(laneAverage * 1.08),
    },
    {
      source: 'DAT',
      laneAvg: toMoney(laneAverage * 1.01),
      low: toMoney(laneAverage * 0.85),
      high: toMoney(laneAverage * 1.1),
    },
  ];
}

function buildShortTermHistory(laneAverage) {
  const deltas = [-22, 8, 31, -4];
  const today = new Date('2026-02-11T00:00:00.000Z');

  return deltas.map((delta, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (21 - index * 7));
    return {
      date: date.toISOString().slice(0, 10),
      rate: toMoney(laneAverage + delta),
    };
  });
}

function buildTopCarriers(laneAverage) {
  return [
    { carrier: 'SUPER TRUCKING INC', date: 'Feb 2026', rate: toMoney(laneAverage * 1.03) },
    { carrier: 'NEW WAVE CARRIER', date: 'Feb 2026', rate: toMoney(laneAverage * 1.01) },
    { carrier: 'FASTLANE LOGISTICS', date: 'Feb 2026', rate: toMoney(laneAverage * 0.98) },
  ];
}

function buildLoadBoard() {
  return [
    { board: 'Parade', lastPosted: '2026-02-10', requests: 3 },
    { board: 'DAT', lastPosted: '2026-02-09', requests: 1 },
  ];
}

function toNormalizedPct(value, fallback = 0.12) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed > 1) return clamp(parsed / 100, 0, 1);
  return clamp(parsed, 0, 1);
}

async function persistCarrierRateLog(entry) {
  if (mongoose.connection.readyState !== 1) {
    carrierRateLogFallback.unshift(entry);
    if (carrierRateLogFallback.length > 5000) carrierRateLogFallback.length = 5000;
    return { source: 'memory' };
  }

  await CarrierRateLog.create(entry);
  return { source: 'mongodb' };
}

router.post('/calculate', (req, res) => {
  const {
    origin = '',
    destination = '',
    equipment = 'Van',
    laneType = 'Line Haul',
    mileage,
  } = req.body || {};

  const numericMileage = Number(mileage);
  if (!Number.isFinite(numericMileage) || numericMileage <= 0) {
    return res.status(400).json({ error: 'Mileage must be a positive number' });
  }

  const normalizedEquipment = normalizeText(equipment);
  const normalizedLaneType = normalizeText(laneType);
  const routeKey = `${normalizeText(origin)}|${normalizeText(destination)}`;

  const baseRate = EQUIPMENT_BASE_RATE_PER_MILE[normalizedEquipment] || EQUIPMENT_BASE_RATE_PER_MILE.van;
  const laneTypeMultiplier = LANE_TYPE_MULTIPLIER[normalizedLaneType] || 1;
  const routeMultiplier = ROUTE_MULTIPLIERS[routeKey] || 1;

  const laneAverage = numericMileage * baseRate * laneTypeMultiplier * routeMultiplier;
  const laneRatePerMile = laneAverage / numericMileage;

  const features = normalizeFeaturePayload({
    feature_schema_version: FEATURE_SCHEMA_VERSION,
    origin_zip3: String(origin || '').slice(0, 3) || '000',
    destination_zip3: String(destination || '').slice(0, 3) || '000',
    miles: numericMileage,
    equipment_type: normalizedEquipment === 'reefer' ? 'reefer' : normalizedEquipment === 'flatbed' ? 'flatbed' : 'dry_van',
    pickup_date: new Date().toISOString().slice(0, 10),
    fuel_price: 3.85,
    lane_7d_avg: laneRatePerMile,
    lane_30d_avg: laneRatePerMile * 0.98,
    lane_volatility: 0.16,
    load_to_truck_ratio: 2.9,
    carrier_score: 0.74,
  });

  const deterministic = buildPredictResponse(features);
  const quote = toMoney(deterministic.rule_rate * numericMileage);

  const positionRatio = deterministic.rule_rate / Math.max(0.01, features.lane_30d_avg);
  const marketPosition =
    positionRatio > 1.04 ? 'Above Avg' : positionRatio < 0.97 ? 'Below Avg' : 'At Avg';

  const confidence = Math.round(deterministic.confidence * 100);

  return res.json({
    quote,
    confidence,
    marketPosition,
    laneData: buildMarketRows(laneAverage),
    shortTermHistory: buildShortTermHistory(laneAverage),
    topCarriers: buildTopCarriers(laneAverage),
    loadBoard: buildLoadBoard(),
    deterministic,
  });
});

router.get('/feature-schema', (_req, res) => {
  res.json({
    feature_schema_version: FEATURE_SCHEMA_VERSION,
    engine_version: ENGINE_VERSION,
    geo_database_version: GEO_DATABASE_VERSION,
    fields: FEATURE_SCHEMA,
  });
});

router.get('/geo/coverage', (_req, res) => {
  return res.json(getGeoCoverageSummary());
});

router.get('/geo/states', (_req, res) => {
  return res.json({
    geo_database_version: GEO_DATABASE_VERSION,
    states: CONTINENTAL_STATES,
  });
});

router.get('/geo/zip3/:zip3', (req, res) => {
  const rawZip = String(req.params.zip3 || '').replace(/\D/g, '').slice(0, 3);
  if (!rawZip || rawZip.length < 3) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'zip3 must be 3 digits',
      },
    });
  }

  const region = resolveMarketRegionByZip3(rawZip);
  const candidates = CONTINENTAL_STATES.filter((state) => resolveMarketRegionByZip3(state.defaultZip3) === region);

  return res.json({
    geo_database_version: GEO_DATABASE_VERSION,
    zip3: rawZip,
    market_region: region,
    state_candidates: candidates,
  });
});

router.get('/geo/state/:stateCode', (req, res) => {
  const state = resolveStateByCode(req.params.stateCode);
  if (!state) {
    return res.status(404).json({
      error: {
        code: 'STATE_NOT_FOUND',
        message: 'State not found in continental database',
      },
    });
  }

  return res.json({
    geo_database_version: GEO_DATABASE_VERSION,
    state,
    market_region: resolveMarketRegionByZip3(state.defaultZip3),
  });
});

router.post('/predict', (req, res) => {
  const featureSnapshot = normalizeFeaturePayload(req.body || {});
  const issues = validateFeaturePayload(featureSnapshot);
  if (issues.length > 0) {
    return res.status(400).json({
      error: {
        code: 'FEATURE_VALIDATION_FAILED',
        message: 'Invalid feature payload',
        details: issues,
      },
    });
  }

  return res.json(buildPredictResponse(featureSnapshot));
});

router.post('/saia/quote', async (req, res) => {
  const startedAt = Date.now();

  try {
    const result = await quoteSaiaRate(req.body || {});
    const normalizedRate = result.normalizedRate;
    const pricingInput = toPricingInput(normalizedRate);

    const featureSnapshot = normalizeFeaturePayload(req.body?.feature_snapshot || {});
    const marginPct = toNormalizedPct(req.body?.pricing?.marginPct, 0.12);
    const volatilityIndex = Number(req.body?.pricing?.volatilityIndex ?? featureSnapshot.lane_volatility_index ?? 30);
    const capacityHeatScore = Number(req.body?.pricing?.capacityHeatScore ?? featureSnapshot.capacity_heat_score ?? 45);
    const customerTierMultiplier = Number(req.body?.pricing?.customerTierMultiplier ?? 1);

    const volatilityMultiplier = clamp(1 + (Math.max(0, volatilityIndex) / 1000), 1, 1.12);
    const capacityMultiplier = clamp(1 + (Math.max(0, capacityHeatScore) / 1200), 1, 1.14);
    const tierMultiplier = clamp(Number.isFinite(customerTierMultiplier) ? customerTierMultiplier : 1, 0.85, 1.25);
    const finalSellRate = toAmount(
      pricingInput.rawCostInput
      * (1 + marginPct)
      * volatilityMultiplier
      * capacityMultiplier
      * tierMultiplier
    );

    const freightItem = Array.isArray(result.requestPayload?.freight) ? result.requestPayload.freight[0] || {} : {};
    const logEntry = {
      id: `crl-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      carrier: 'SAIA',
      timestamp: new Date(),
      originZip: String(result.requestPayload?.shipment?.originZip || ''),
      destinationZip: String(result.requestPayload?.shipment?.destinationZip || ''),
      weight: Number(freightItem.weight || 0),
      freightClass: String(freightItem.freightClass || ''),
      returnedRate: Number(normalizedRate.totalRate || 0),
      quoteId: String(normalizedRate.quoteId || ''),
      responseTimeMs: Number(normalizedRate.responseTimeMs || Date.now() - startedAt),
      fuelSurcharge: Number(normalizedRate.fuelSurcharge || 0),
      accessorialTotal: Number(normalizedRate.accessorialTotal || 0),
      serviceLevel: String(normalizedRate.serviceLevel || ''),
      status: 'SUCCESS',
      requestPayload: result.requestPayload,
      responsePayload: normalizedRate.rawResponse,
      createdAt: new Date(),
    };

    const persisted = await persistCarrierRateLog(logEntry);

    return res.json({
      carrierQuote: sanitizeQuoteForFrontend(normalizedRate),
      pricingInput,
      pricingResult: {
        rawCostInput: pricingInput.rawCostInput,
        marginPct: Number(marginPct.toFixed(4)),
        volatilityIndex: Math.max(0, Number(volatilityIndex || 0)),
        capacityHeatScore: Math.max(0, Number(capacityHeatScore || 0)),
        customerTierMultiplier: Number(tierMultiplier.toFixed(4)),
        finalSellRate,
      },
      display: {
        carrier: 'SAIA',
        totalRate: pricingInput.rawCostInput,
        transitDays: pricingInput.transitTime,
        serviceType: normalizedRate.serviceLevel,
        fuelBreakdown: {
          fuelSurcharge: toAmount(normalizedRate.fuelSurcharge || 0),
          fuelPct: pricingInput.fuelPct,
        },
      },
      audit: {
        persistedTo: persisted.source,
        responseTimeMs: Number(normalizedRate.responseTimeMs || Date.now() - startedAt),
      },
    });
  } catch (err) {
    const status = Number(err?.status || 500);
    const body = req.body || {};
    const shipment = body?.shipment || body;
    const freight = Array.isArray(shipment?.freightDetails)
      ? shipment.freightDetails[0] || {}
      : Array.isArray(shipment?.freight)
        ? shipment.freight[0] || {}
        : {};

    const errorLogEntry = {
      id: `crl-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      carrier: 'SAIA',
      timestamp: new Date(),
      originZip: String(shipment?.originZip || shipment?.origin?.zip || ''),
      destinationZip: String(shipment?.destinationZip || shipment?.destination?.zip || ''),
      weight: Number(freight?.weight || 0),
      freightClass: String(freight?.freightClass || freight?.class || ''),
      returnedRate: 0,
      quoteId: '',
      responseTimeMs: Date.now() - startedAt,
      fuelSurcharge: 0,
      accessorialTotal: 0,
      serviceLevel: String(shipment?.serviceType || ''),
      status: 'ERROR',
      errorCode: String(err?.details?.code || `HTTP_${status}`),
      requestPayload: body,
      responsePayload: err?.responseBody || { error: err?.message || 'Saia quote failed' },
      createdAt: new Date(),
    };

    try {
      await persistCarrierRateLog(errorLogEntry);
    } catch {
      // no-op
    }

    return res.status(status).json({
      error: {
        code: String(err?.details?.code || 'SAIA_QUOTE_FAILED'),
        message: err?.message || 'Saia quote failed',
        status,
      },
    });
  }
});

router.get('/saia/logs', async (req, res) => {
  const limit = clamp(Number.parseInt(String(req.query.limit || '100'), 10) || 100, 1, 1000);

  if (mongoose.connection.readyState !== 1) {
    return res.json({ items: carrierRateLogFallback.slice(0, limit), source: 'memory' });
  }

  const items = await CarrierRateLog.find({ carrier: 'SAIA' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return res.json({ items, source: 'mongodb' });
});

router.get('/health/saia', async (_req, res) => {
  const health = await getSaiaHealthStatus();
  const statusCode = health.status === 'ACTIVE' ? 200 : health.status === 'DEGRADED' ? 200 : 503;
  return res.status(statusCode).json(health);
});

router.post('/quote-outcomes', (req, res) => {
  const incomingFeature = normalizeFeaturePayload(req.body?.feature_snapshot || req.body?.features || {});
  const issues = validateFeaturePayload(incomingFeature);
  if (issues.length > 0) {
    return res.status(400).json({
      error: {
        code: 'FEATURE_VALIDATION_FAILED',
        message: 'Invalid feature_snapshot',
        details: issues,
      },
    });
  }

  const predicted = buildPredictResponse(incomingFeature);
  const accepted = req.body?.accepted;
  const normalizedAccepted = accepted === true || accepted === false ? accepted : null;

  const record = {
    quote_id: randomUUID(),
    created_at: new Date().toISOString(),
    engine_version: String(req.body?.engine_version || ENGINE_VERSION),
    feature_schema_version: incomingFeature.feature_schema_version,
    rule_rate: Number.isFinite(Number(req.body?.rule_rate)) ? toRate(Number(req.body.rule_rate)) : predicted.rule_rate,
    ml_rate: Number.isFinite(Number(req.body?.ml_rate)) ? toRate(Number(req.body.ml_rate)) : null,
    accepted: normalizedAccepted,
    booked_rate: Number.isFinite(Number(req.body?.booked_rate)) ? toRate(Number(req.body.booked_rate)) : null,
    margin: Number.isFinite(Number(req.body?.margin)) ? toRate(Number(req.body.margin)) : null,
    time_to_cover_minutes: Number.isFinite(Number(req.body?.time_to_cover_minutes))
      ? Math.max(0, Math.round(Number(req.body.time_to_cover_minutes)))
      : null,
    feature_snapshot: incomingFeature,
    prediction_snapshot: {
      rule_rate: predicted.rule_rate,
      confidence: predicted.confidence,
      recommended_band: predicted.recommended_band,
      guardrails: predicted.guardrails,
      components: predicted.components,
    },
  };

  quoteOutcomes.unshift(record);
  if (quoteOutcomes.length > 5000) quoteOutcomes.length = 5000;

  return res.status(201).json({ quote: record });
});

router.get('/quote-outcomes', (req, res) => {
  const limit = clamp(Number.parseInt(String(req.query.limit || '100'), 10) || 100, 1, 1000);
  return res.json({ items: quoteOutcomes.slice(0, limit), total: quoteOutcomes.length });
});

router.get('/metrics', (_req, res) => {
  return res.json({
    generated_at: new Date().toISOString(),
    ...scoreDrift(),
  });
});

router.get('/training-dataset/export', (_req, res) => {
  const rows = quoteOutcomes.filter((row) => Number.isFinite(row.booked_rate));
  return res.json({
    format: 'json',
    generated_at: new Date().toISOString(),
    feature_schema_version: FEATURE_SCHEMA_VERSION,
    row_count: rows.length,
    rows,
  });
});

router.get('/training-dataset/export.csv', (_req, res) => {
  const rows = quoteOutcomes.filter((row) => Number.isFinite(row.booked_rate));
  const csv = toCsv(rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="training_dataset_${Date.now()}.csv"`);
  return res.send(csv);
});

export default router;
