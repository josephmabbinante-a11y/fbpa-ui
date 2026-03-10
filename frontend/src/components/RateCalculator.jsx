import React, { useEffect, useMemo, useState } from 'react';
// Top-level error boundary for RateCalculator
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: 24 }}><b>Something went wrong:</b> {this.state.error?.message || 'Unknown error.'}</div>;
    }
    return this.props.children;
  }
}

function safeString(val) {
  if (val == null) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
import { useNavigate } from 'react-router-dom';
import LoadInputs from './LoadInputs';
import RateBreakdown from './RateBreakdown';
import MarketTrends from './MarketTrends';
import styles from './RateCalculator.module.css';
import {
  getRateLogicMetrics,
  logQuoteOutcome,
  calculateRateLogic,
  quoteSaiaCarrierRate,
} from '../api/client';
import { createLoad, listLoads, sendToBidNetwork as sendLoadToBidNetwork } from '../api/loadsClient';
import { estimateMileage as estimateMileageService } from '../services/mileageService';
import { useTheme, themes } from '../contexts/ThemeContext';

const STATE_DEFAULT_ZIP3 = {
  AL: '352', AZ: '850', AR: '722', CA: '900', CO: '802', CT: '061', DE: '198', FL: '331', GA: '303',
  ID: '837', IL: '606', IN: '462', IA: '503', KS: '661', KY: '402', LA: '701', ME: '041', MD: '212',
  MA: '021', MI: '482', MN: '554', MS: '392', MO: '631', MT: '591', NE: '681', NV: '891', NH: '031',
  NJ: '071', NM: '871', NY: '100', NC: '282', ND: '581', OH: '441', OK: '731', OR: '972', PA: '191',
  RI: '029', SC: '292', SD: '571', TN: '372', TX: '752', UT: '841', VT: '054', VA: '232', WA: '981',
  WV: '253', WI: '532', WY: '820',
};

const ZIP3_REGION_BANDS = [
  { start: 0, end: 199, region: 'Northeast' },
  { start: 200, end: 299, region: 'Mid-Atlantic' },
  { start: 300, end: 399, region: 'Southeast' },
  { start: 400, end: 599, region: 'Midwest' },
  { start: 600, end: 799, region: 'South Central' },
  { start: 800, end: 899, region: 'Mountain' },
  { start: 900, end: 999, region: 'West' },
];

function resolveRegionFallback(zip3) {
  const numeric = Number.parseInt(String(zip3 || '').replace(/\D/g, '').slice(0, 3), 10);
  if (!Number.isFinite(numeric)) return null;
  const band = ZIP3_REGION_BANDS.find((entry) => numeric >= entry.start && numeric <= entry.end);
  return band?.region || null;
}

function parseZip3(locationText) {
  const match = String(locationText || '').match(/(\d{3,5})/);
  if (match?.[1]) return match[1].slice(0, 3);

  const stateMatch = String(locationText || '').toUpperCase().match(/,\s*([A-Z]{2})\b/);
  if (stateMatch?.[1] && STATE_DEFAULT_ZIP3[stateMatch[1]]) {
    return STATE_DEFAULT_ZIP3[stateMatch[1]];
  }

  return '000';
}

function calculateStdDev(values = []) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
  const variance = values.reduce((sum, value) => {
    const delta = Number(value || 0) - mean;
    return sum + (delta * delta);
  }, 0) / values.length;
  return Math.sqrt(Math.max(0, variance));
}

function normalizeEquipmentToken(value) {
  const token = String(value || '').trim().toLowerCase().replaceAll('_', ' ');
  if (!token) return 'van';
  if (token === 'dry van') return 'van';
  return token;
}

function parseLocationParts(value) {
  const text = String(value || '').trim();
  if (!text) return { city: '', state: '' };
  const city = text.split(',')[0]?.trim() || '';
  const stateMatch = text.toUpperCase().match(/,\s*([A-Z]{2})\b/);
  return {
    city,
    state: stateMatch?.[1] || '',
  };
}

function buildCapacityHeatMapScores({
  harvestedScores,
  origin,
  destination,
  originCapacityScore,
  destinationCapacityScore,
  laneVolatilityIndex,
  capacityHeatScore,
}) {
  const baseScores = (harvestedScores && typeof harvestedScores === 'object') ? { ...harvestedScores } : {};

  const normalizedVolatility = Math.max(0, Math.min(100, Number(laneVolatilityIndex || 0)));
  const normalizedHeat = Math.max(0, Math.min(100, Number(capacityHeatScore || 0)));

  const setScore = (stateCode, score) => {
    const code = String(stateCode || '').trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) return;
    const current = Number(baseScores[code]);
    const next = Math.round(Math.max(0, Math.min(100, Number(score || 0))));
    if (!Number.isFinite(current)) {
      baseScores[code] = next;
      return;
    }
    baseScores[code] = Math.round((current * 0.6) + (next * 0.4));
  };

  const fallbackOriginScore = Math.round(Math.max(20, Math.min(100, Number(originCapacityScore || normalizedHeat || 55))));
  const fallbackDestinationScore = Math.round(Math.max(20, Math.min(100, Number(destinationCapacityScore || normalizedHeat || 55))));

  const { state: originState } = parseLocationParts(origin);
  const { state: destinationState } = parseLocationParts(destination);

  setScore(originState, fallbackOriginScore);
  setScore(destinationState, fallbackDestinationScore);

  if (Object.keys(baseScores).length < 4) {
    const blended = Math.round((fallbackOriginScore + fallbackDestinationScore + normalizedVolatility + normalizedHeat) / 4);
    const defaults = {
      TX: blended,
      CA: Math.max(18, blended - 4),
      IL: Math.max(18, blended - 2),
      GA: Math.max(18, blended - 1),
      NJ: Math.max(18, blended + 1),
      FL: Math.max(18, blended + 2),
    };
    Object.entries(defaults).forEach(([stateCode, score]) => {
      if (!Number.isFinite(Number(baseScores[stateCode]))) {
        baseScores[stateCode] = Math.round(Math.min(100, score));
      }
    });
  }

  return baseScores;
}

function locationKeyFromText(value) {
  const parsed = parseLocationParts(value);
  return `${String(parsed.city || '').toLowerCase()}|${String(parsed.state || '').toLowerCase()}`;
}

function locationKeyFromLoadLocation(location) {
  return `${String(location?.city || '').trim().toLowerCase()}|${String(location?.state || '').trim().toLowerCase()}`;
}

function average(values = []) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

function clampCapacityIndex(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
}

function RateCalculator() {
    const buildLocalDeterministicPrediction = (features) => {
      const lane7d = Number(features?.lane_7d_avg || 0);
      const lane30d = Number(features?.lane_30d_avg || 0);
      const baseRate = Math.max(lane7d, lane30d);
      const fuelPrice = Number(features?.fuel_price || 0);
      const ltr = Number(features?.load_to_truck_ratio || 0);
      const carrierScore = Number(features?.carrier_score || 0);
      const volatility = Number(features?.lane_volatility || 0);
      const equipmentType = String(features?.equipment_type || 'dry_van').toLowerCase();

      const equipmentMultiplierMap = {
        dry_van: 1,
        reefer: 1.09,
        flatbed: 1.06,
      };
      const equipmentMultiplier = equipmentMultiplierMap[equipmentType] || 1;

      const fuelComponent = Math.max(0, 0.18 + ((fuelPrice - 3.0) * 0.12));
      const marketMultiplier = Math.max(0.9, Math.min(1.35, 0.88 + (ltr * 0.09)));
      const carrierAdjustment = Math.max(0.92, Math.min(1.08, 0.92 + (carrierScore * 0.16)));
      const unclamped = (baseRate * equipmentMultiplier * marketMultiplier * carrierAdjustment) + fuelComponent;

      const floor = Math.max(0.5, lane30d * (1 - Math.min(0.45, volatility * 1.5)));
      const historicalHigh = Math.max(floor + 0.05, lane30d * (1 + Math.min(0.55, volatility * 1.7)));
      const ceiling = historicalHigh * 1.08;
      const clamped = Math.max(floor, Math.min(ceiling, unclamped));

      return {
        version: '2.0',
        feature_schema_version: '1.0',
        engine_version: 'rules_v1.2-local-fallback',
        rule_rate: Number(clamped.toFixed(4)),
        ml_rate: null,
        confidence: Number((Math.max(0.55, Math.min(0.96, 0.9 - (volatility * 0.35)))).toFixed(2)),
        recommended_band: {
          low: Number((clamped - Math.max(0.03, volatility * 0.35)).toFixed(4)),
          high: Number((clamped + Math.max(0.03, volatility * 0.35)).toFixed(4)),
        },
        guardrails: {
          floor: Number(floor.toFixed(4)),
          ceiling: Number(ceiling.toFixed(4)),
          clamped: clamped !== unclamped,
          unclamped_rate: Number(unclamped.toFixed(4)),
        },
        components: {
          base_rate: Number(baseRate.toFixed(4)),
          equipment_multiplier: Number(equipmentMultiplier.toFixed(4)),
          fuel_component: Number(fuelComponent.toFixed(4)),
          market_multiplier: Number(marketMultiplier.toFixed(4)),
          carrier_adjustment: Number(carrierAdjustment.toFixed(4)),
        },
        feature_snapshot: features,
      };
    };

  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = theme || {};

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [equipmentType, setEquipmentType] = useState('dry_van');
  const [mileageEstimate, setMileageEstimate] = useState({ miles: 900, method: 'estimated', confidence: 0.45 });
  const [mileageLoading, setMileageLoading] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState({
    weight: '',
    commodity: '',
    reference: '',
    shipDate: '',
    serviceLevel: 'standard',
    declaredValue: '',
    pickupWindowStart: '08:00',
    pickupWindowEnd: '17:00',
    hazmat: false,
    tempControlled: false,
  });
  const [shipmentErrors, setShipmentErrors] = useState({});
  const [harvestedPricing, setHarvestedPricing] = useState({
    loading: false,
    source: 'seed',
    totalLoads: 0,
    matchedLoads: 0,
    lane7dRpm: 0,
    lane30dRpm: 0,
    laneCarrierCostRpm: 0,
    laneRates: [],
    bookedLoads: [],
    topCarriers: [],
    laneSummary: null,
    stateCapacityScores: {},
  });

  const [forecast, setForecast] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [sendingToBidNetwork, setSendingToBidNetwork] = useState(false);
  const [loggingOutcome, setLoggingOutcome] = useState(false);
  const [quoteLocked, setQuoteLocked] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [dataUpdatedAt, setDataUpdatedAt] = useState(new Date());
  const [metrics, setMetrics] = useState(null);
  const [saiaQuote, setSaiaQuote] = useState(null);
  const [quotingSaia, setQuotingSaia] = useState(false);
  const [geoCoverage, setGeoCoverage] = useState({
    loading: false,
    originZip3: '',
    destinationZip3: '',
    originRegion: '',
    destinationRegion: '',
    source: 'local',
  });

  const [outcomeAccepted, setOutcomeAccepted] = useState('unknown');
  const [outcomeBookedRate, setOutcomeBookedRate] = useState('');
  const [outcomeTimeToCover, setOutcomeTimeToCover] = useState('37');
  const [outcomeErrors, setOutcomeErrors] = useState({ bookedRate: '', timeToCover: '' });
  const [sensitivity, setSensitivity] = useState(0);
  const [winProb, setWinProb] = useState(0);
  const [pendingSwapRecalc, setPendingSwapRecalc] = useState(false);
  const [quoteTelemetry, setQuoteTelemetry] = useState([]);

  useEffect(() => {
    let active = true;

    const resolveMileage = async () => {
      const equipmentMap = {
        dry_van: 'van',
        reefer: 'reefer',
        flatbed: 'flatbed',
      };

      setMileageLoading(true);
      const resolved = await estimateMileageService(
        origin,
        destination,
        equipmentMap[String(equipmentType || '').toLowerCase()] || 'van'
      );

      if (!active) return;
      setMileageEstimate({
        miles: Math.max(1, Number(resolved?.miles || 0) || 900),
        method: String(resolved?.method || 'estimated'),
        confidence: Number(resolved?.confidence || 0) || 0,
      });
      setMileageLoading(false);
    };

    resolveMileage();

    return () => {
      active = false;
    };
  }, [origin, destination, equipmentType]);

  useEffect(() => {
    let active = true;

    const harvestPricingFromLoads = async () => {
      setHarvestedPricing((prev) => ({ ...prev, loading: true }));

      const result = await listLoads({ page: 1, pageSize: 300, sort: '-updatedAt' });
      if (!active) return;

      const source = String(result?.source || (result?.networkOffline ? 'mock-offline' : 'api'));
      const items = Array.isArray(result?.items) ? result.items : [];
      const normalizedEquipment = normalizeEquipmentToken(equipmentType);
      const originKey = locationKeyFromText(origin);
      const destinationKey = locationKeyFromText(destination);

      const rows = items
        .map((load) => {
          const miles = Number(load?.miles || 0);
          const revenue = Number(load?.revenue || 0);
          const carrierCost = Number(load?.carrierCost || 0);
          if (!Number.isFinite(miles) || !Number.isFinite(revenue) || miles <= 0 || revenue <= 0) return null;

          const rate = revenue / miles;
          if (!Number.isFinite(rate) || rate <= 0) return null;

          return {
            id: load.id,
            carrier: String(load?.carrier?.name || 'Carrier').trim() || 'Carrier',
            equipment: normalizeEquipmentToken(load?.equipment),
            originKey: locationKeyFromLoadLocation(load?.origin),
            destinationKey: locationKeyFromLoadLocation(load?.destination),
            originState: String(load?.origin?.state || '').trim().toUpperCase(),
            destinationState: String(load?.destination?.state || '').trim().toUpperCase(),
            rate,
            carrierCostRate: Number.isFinite(carrierCost) && carrierCost > 0 ? (carrierCost / miles) : 0,
            margin: revenue - carrierCost,
            status: String(load?.status || '').toLowerCase(),
            updatedAt: new Date(load?.updatedAt || load?.pickupAt || load?.deliveryAt || Date.now()).getTime(),
          };
        })
        .filter(Boolean)
        .sort((left, right) => right.updatedAt - left.updatedAt);

      const laneAndEquipment = rows.filter((row) => row.originKey === originKey && row.destinationKey === destinationKey && row.equipment === normalizedEquipment);
      const laneOnly = rows.filter((row) => row.originKey === originKey && row.destinationKey === destinationKey);
      const equipmentRows = rows.filter((row) => row.equipment === normalizedEquipment);
      const selectedRows = laneAndEquipment.length > 0
        ? laneAndEquipment
        : laneOnly.length > 0
          ? laneOnly
          : rows;

      const laneRates = selectedRows.slice(0, 60).map((row) => Number(row.rate || 0)).filter((value) => Number.isFinite(value) && value > 0);
      const laneCarrierCostRates = selectedRows
        .slice(0, 60)
        .map((row) => Number(row.carrierCostRate || 0))
        .filter((value) => Number.isFinite(value) && value > 0);
      const lane7dWindow = selectedRows.slice(0, Math.min(7, selectedRows.length));
      const lane30dWindow = selectedRows.slice(0, Math.min(30, selectedRows.length));
      const lane7dRpm = average(lane7dWindow.map((row) => row.rate));
      const lane30dRpm = average(lane30dWindow.map((row) => row.rate));
      const laneCarrierCostRpm = average(laneCarrierCostRates);

      const grouped = selectedRows.reduce((acc, row) => {
        const key = row.carrier || 'Carrier';
        if (!acc[key]) {
          acc[key] = { carrier: key, rates: [], margins: [], statuses: [] };
        }
        acc[key].rates.push(row.rate);
        acc[key].margins.push(row.margin);
        acc[key].statuses.push(row.status);
        return acc;
      }, {});

      const topCarriers = Object.values(grouped)
        .map((entry) => {
          const avgRateRpm = average(entry.rates);
          const onTime = Math.round((entry.statuses.filter((status) => status !== 'uncovered' && status !== 'at_risk').length / Math.max(1, entry.statuses.length)) * 100);
          const riskScore = Number((Math.min(0.99, Math.max(0.1, 1 - (onTime / 100)))).toFixed(2));
          const margin = Math.round(average(entry.margins));
          return {
            carrier: entry.carrier,
            avgRate: Math.round(avgRateRpm * 1000),
            onTime,
            riskScore,
            margin,
          };
        })
        .sort((left, right) => right.avgRate - left.avgRate)
        .slice(0, 6);

      const bookedLoads = topCarriers.map((entry) => ({
        carrier: entry.carrier,
        avgRate: entry.avgRate,
        riskScore: Math.round(entry.riskScore * 1000),
      }));

      const selectedRateValues = selectedRows.map((row) => row.rate);
      const avgLaneRate = average(selectedRateValues);
      const laneRiskScore = Number((Math.min(0.99, Math.max(0.08, calculateStdDev(selectedRateValues) / Math.max(0.35, avgLaneRate)))).toFixed(2));
      const onTimeLane = Math.round((selectedRows.filter((row) => row.status !== 'uncovered' && row.status !== 'at_risk').length / Math.max(1, selectedRows.length)) * 100);

      const capacityUniverse = equipmentRows.length > 0 ? equipmentRows : rows;

      const stateStats = capacityUniverse.reduce((acc, row) => {
        const register = (stateCode) => {
          const code = String(stateCode || '').trim().toUpperCase();
          if (!/^[A-Z]{2}$/.test(code)) return;
          if (!acc[code]) {
            acc[code] = { touches: 0, risky: 0 };
          }
          acc[code].touches += 1;
          if (row.status === 'uncovered' || row.status === 'at_risk') {
            acc[code].risky += 1;
          }
        };

        register(row.originState);
        register(row.destinationState);
        return acc;
      }, {});

      const stateCapacityScores = Object.entries(stateStats).reduce((acc, [code, stats]) => {
        const touches = Number(stats?.touches || 0);
        const risky = Number(stats?.risky || 0);
        const riskRatio = touches > 0 ? (risky / touches) : 0;
        const score = Math.round(Math.max(10, Math.min(100, 28 + (Math.min(22, touches) * 2.1) + (riskRatio * 38))));
        acc[code] = score;
        return acc;
      }, {});

      setHarvestedPricing({
        loading: false,
        source,
        totalLoads: rows.length,
        matchedLoads: selectedRows.length,
        lane7dRpm: Number(lane7dRpm.toFixed(4)),
        lane30dRpm: Number(lane30dRpm.toFixed(4)),
        laneCarrierCostRpm: Number(laneCarrierCostRpm.toFixed(4)),
        laneRates,
        bookedLoads,
        topCarriers,
        laneSummary: {
          totalLoads: selectedRows.length,
          avgRate: Number(avgLaneRate.toFixed(2)),
          onTime: onTimeLane,
          riskScore: laneRiskScore,
        },
        stateCapacityScores,
      });
    };

    harvestPricingFromLoads();
    const refreshTimer = window.setInterval(harvestPricingFromLoads, 45000);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, [origin, destination, equipmentType]);

  const rpm = Number(harvestedPricing.lane7dRpm || 0);

  const laneHistory = useMemo(
    () => {
      if (Array.isArray(harvestedPricing.laneRates) && harvestedPricing.laneRates.length > 0) {
        return harvestedPricing.laneRates;
      }
      return [];
    },
    [harvestedPricing.laneRates]
  );

  const marketModels = useMemo(() => {
    const lane7d = Number(rpm || 0);
    const lane30d = Number(harvestedPricing.lane30dRpm || Math.max(0.5, lane7d - 0.06));
    const rpmVariance = calculateStdDev(laneHistory.length ? laneHistory : [lane30d, lane7d]);
    const baselineRate = Math.max(0.5, lane30d);
    const velocity = Math.min(1, Math.abs(lane7d - lane30d) / baselineRate);
    const varianceFactor = Math.min(1, rpmVariance / Math.max(0.25, baselineRate));
    const rejectionTrend = Math.min(
      1,
      0.22
      + (forecast.frontEvents ? 0.17 : 0)
      + (forecast.fiveNDR ? 0.13 : 0)
      + (forecast.marketSoftening ? 0.09 : 0)
      + (forecast.addDetention ? 0.04 : 0)
    );

    const laneVolatilityDecimal = Math.max(0.08, Math.min(0.85, (varianceFactor * 0.44) + (rejectionTrend * 0.36) + (velocity * 0.2)));
    const laneVolatilityIndex = Math.round(laneVolatilityDecimal * 100);

    const originZip3 = Number.parseInt(parseZip3(origin), 10) || 0;
    const destinationZip3 = Number.parseInt(parseZip3(destination), 10) || 0;
    const regionalSpread = Math.min(1, Math.abs(originZip3 - destinationZip3) / 1000);
    const hasVendorFeed = Boolean(import.meta.env.VITE_DAT_API_KEY || import.meta.env.VITE_GREENSCREENS_API_KEY);

    const normalizedEquipment = normalizeEquipmentToken(equipmentType);
    const equipmentPressureMultiplierMap = {
      van: 1,
      reefer: 1.1,
      flatbed: 1.06,
      power_only: 0.96,
    };
    const equipmentCapacityMultiplierMap = {
      van: 1,
      reefer: 0.93,
      flatbed: 0.95,
      power_only: 1.05,
    };
    const equipmentPressureMultiplier = equipmentPressureMultiplierMap[normalizedEquipment] || 1;
    const equipmentCapacityMultiplier = equipmentCapacityMultiplierMap[normalizedEquipment] || 1;

    const availableTrucksHeuristic = Math.max(80, Math.round((190 - Math.round((rejectionTrend * 55) + (regionalSpread * 18))) * equipmentCapacityMultiplier));
    const inboundLoadsHeuristic = Math.max(55, Math.round((120 + Math.round((rejectionTrend * 64) + (velocity * 22))) * equipmentPressureMultiplier));

    const simulatedLoads = Math.max(800, Math.round((2800 + (rejectionTrend * 1300) + (velocity * 700)) * equipmentPressureMultiplier));
    const simulatedTrucks = Math.max(700, Math.round((1100 + ((1 - rejectionTrend) * 520) - (regionalSpread * 140)) * equipmentCapacityMultiplier));
    const simulatedLtr = simulatedLoads / Math.max(1, simulatedTrucks);
    const simulatedCapacityRaw = clampCapacityIndex((simulatedLtr / 5) * 100);

    const heuristicLtr = inboundLoadsHeuristic / Math.max(1, availableTrucksHeuristic);
    const heuristicCapacityRaw = clampCapacityIndex((heuristicLtr / 5) * 100);

    const rawCapacityIndex = hasVendorFeed ? heuristicCapacityRaw : simulatedCapacityRaw;
    const yesterdayCapacityIndex = clampCapacityIndex(rawCapacityIndex - ((velocity * 12) - (rejectionTrend * 6)));
    const twoDaysAgoCapacityIndex = clampCapacityIndex(yesterdayCapacityIndex - ((velocity * 8) - (rejectionTrend * 4)));
    const smoothedCapacityIndex = clampCapacityIndex((rawCapacityIndex * 0.4) + (yesterdayCapacityIndex * 0.3) + (twoDaysAgoCapacityIndex * 0.3));
    const capacityVolatilityFlag = Math.abs(rawCapacityIndex - yesterdayCapacityIndex) > 10;

    const inboundLoads = hasVendorFeed ? inboundLoadsHeuristic : simulatedLoads;
    const availableTrucks = hasVendorFeed ? availableTrucksHeuristic : simulatedTrucks;
    const regionDensity = Math.max(0.55, Math.min(1.45, 0.82 + (regionalSpread * 0.45)));
    const loadPressure = inboundLoads / Math.max(1, availableTrucks);
    const pressureCapacityScore = Math.round(Math.max(18, Math.min(100, ((loadPressure * 42) + (regionDensity * 26) + (rejectionTrend * 30)))));
    const capacityHeatScore = Math.round((smoothedCapacityIndex * 0.65) + (pressureCapacityScore * 0.35));
    const loadToTruckRatio = Number((Math.max(0.95, Math.min(4.2, 0.9 + (capacityHeatScore / 33)))).toFixed(2));

    const originCapacityScore = Math.round(
      Math.max(18, Math.min(100, capacityHeatScore - (regionalSpread * 10) + (((originZip3 % 17) - 8) * 0.6)))
    );
    const destinationCapacityScore = Math.round(
      Math.max(18, Math.min(100, capacityHeatScore + (regionalSpread * 10) + (((destinationZip3 % 17) - 8) * 0.6)))
    );

    const rejectionSpikeRisk = laneVolatilityIndex >= 65 || capacityHeatScore >= 78
      ? 'High'
      : laneVolatilityIndex >= 38 || capacityHeatScore >= 55
        ? 'Moderate'
        : 'Low';

    return {
      lane7d,
      lane30d,
      rpmVariance,
      rejectionTrend,
      laneVolatilityDecimal,
      laneVolatilityIndex,
      availableTrucks,
      inboundLoads,
      regionDensity,
      capacityHeatScore,
      originCapacityScore,
      destinationCapacityScore,
      loadToTruckRatio,
      rejectionSpikeRisk,
      marketDataMode: hasVendorFeed ? 'vendor' : 'simulated',
      capacityRawIndex: Number(rawCapacityIndex.toFixed(2)),
      capacitySmoothedIndex: Number(smoothedCapacityIndex.toFixed(2)),
      capacityYesterdayIndex: Number(yesterdayCapacityIndex.toFixed(2)),
      capacityTwoDaysAgoIndex: Number(twoDaysAgoCapacityIndex.toFixed(2)),
      capacityVolatilityFlag,
      capacityTelemetry: {
        loads: inboundLoads,
        trucks: availableTrucks,
        ltr: Number(loadToTruckRatio.toFixed(4)),
        capacity_index: Number(smoothedCapacityIndex.toFixed(2)),
        capacity_index_raw: Number(rawCapacityIndex.toFixed(2)),
        timestamp: new Date().toISOString(),
      },
    };
  }, [rpm, harvestedPricing.lane30dRpm, laneHistory, forecast.frontEvents, forecast.fiveNDR, forecast.marketSoftening, forecast.addDetention, origin, destination, equipmentType]);

  const featureSnapshot = useMemo(() => {
    const miles = Math.max(1, Number(mileageEstimate.miles || 0));
    const lane7d = Number(marketModels.lane7d || 0);
    const lane30d = Number(marketModels.lane30d || 0);
    const laneVolatility = Math.max(0.04, Number(marketModels.laneVolatilityDecimal || 0));
    const ltr = Number((Number(marketModels.loadToTruckRatio || 1)).toFixed(2));
    const inferredCarrierScore = Number((Math.max(0.4, Math.min(0.98, Number(winProb || 0) / 100))).toFixed(2));

    return {
      feature_schema_version: '1.0',
      origin_zip3: parseZip3(origin),
      destination_zip3: parseZip3(destination),
      miles,
      mileage_method: mileageEstimate.method,
      mileage_confidence: Number(mileageEstimate.confidence || 0),
      equipment_type: equipmentType,
      pickup_date: shipmentDetails.shipDate || new Date().toISOString().slice(0, 10),
      fuel_price: 3.87,
      lane_7d_avg: lane7d,
      lane_30d_avg: lane30d,
      lane_volatility: Number(laneVolatility.toFixed(4)),
      load_to_truck_ratio: ltr,
      lane_volatility_index: Number(marketModels.laneVolatilityIndex || 0),
      capacity_heat_score: Number(marketModels.capacityHeatScore || 0),
      rejection_spike_risk: marketModels.rejectionSpikeRisk,
      rpm_variance: Number(marketModels.rpmVariance || 0),
      rejection_trend: Number(marketModels.rejectionTrend || 0),
      available_trucks: Number(marketModels.availableTrucks || 0),
      inbound_loads: Number(marketModels.inboundLoads || 0),
      region_density: Number(marketModels.regionDensity || 0),
      market_data_mode: marketModels.marketDataMode,
      capacity_index_raw: Number(marketModels.capacityRawIndex || 0),
      capacity_index_smoothed: Number(marketModels.capacitySmoothedIndex || 0),
      capacity_volatility_flag: Boolean(marketModels.capacityVolatilityFlag),
      capacity_telemetry: marketModels.capacityTelemetry,
      carrier_score: inferredCarrierScore,
      shipment_weight: Number(shipmentDetails.weight || 0),
      commodity: shipmentDetails.commodity,
      service_level: shipmentDetails.serviceLevel,
      hazmat: shipmentDetails.hazmat,
      temp_controlled: shipmentDetails.tempControlled,
      declared_value: Number(shipmentDetails.declaredValue || 0),
    };
  }, [origin, destination, winProb, equipmentType, shipmentDetails, marketModels, mileageEstimate]);

  const shipmentAdjustmentMultiplier = useMemo(() => {
    return 1;
  }, []);

  const capacityHeatMapScores = useMemo(() => buildCapacityHeatMapScores({
    harvestedScores: harvestedPricing.stateCapacityScores,
    origin,
    destination,
    originCapacityScore: marketModels.originCapacityScore,
    destinationCapacityScore: marketModels.destinationCapacityScore,
    laneVolatilityIndex: marketModels.laneVolatilityIndex,
    capacityHeatScore: marketModels.capacityHeatScore,
  }), [
    harvestedPricing.stateCapacityScores,
    origin,
    destination,
    marketModels.originCapacityScore,
    marketModels.destinationCapacityScore,
    marketModels.laneVolatilityIndex,
    marketModels.capacityHeatScore,
  ]);

  const capacityPricingMultiplier = Number((1 + (Number(marketModels.capacityHeatScore || 0) / 1200)).toFixed(4));
  const fallbackRuleRate = Number((Number(rpm || 2.3) * capacityPricingMultiplier).toFixed(4));
  const ruleRate = Number(prediction?.rule_rate || fallbackRuleRate);
  const harvestedCarrierCostRate = Number(harvestedPricing.laneCarrierCostRpm || 0);
  const carrierCostRate = Number((harvestedCarrierCostRate > 0 ? harvestedCarrierCostRate : (ruleRate * 0.9)).toFixed(4));
  const recommendedSellRate = Number((ruleRate * (1 + (Number(sensitivity || 0) / 100)) * shipmentAdjustmentMultiplier).toFixed(4));
  const marginPerMile = Number((recommendedSellRate - carrierCostRate).toFixed(4));
  const deltaVsMarketPct = ruleRate > 0 ? Number((((recommendedSellRate - ruleRate) / ruleRate) * 100).toFixed(2)) : 0;

  const miles = Number(featureSnapshot.miles || 0);
  const predictedMarket = Math.round(ruleRate * miles);
  const recommendedSell = Math.round(recommendedSellRate * miles);
  const swing = Math.round(Math.abs(recommendedSellRate - ruleRate) * miles);

  const rateIndexBreakdown = useMemo(() => {
    const baseMarketRpm = Number(rpm || 0);
    const volatilityMultiplier = Number((1 + (Number(marketModels.laneVolatilityIndex || 0) / 1000)).toFixed(4));
    const capacityMultiplier = Number((1 + (Number(marketModels.capacityHeatScore || 0) / 1200)).toFixed(4));
    const fuelIndexAdjustment = Number(((Number(featureSnapshot.fuel_price || 0) - 3.0) * 0.02).toFixed(4));
    const riskAdjustment = marketModels.rejectionSpikeRisk === 'High'
      ? -0.03
      : marketModels.rejectionSpikeRisk === 'Moderate'
        ? -0.01
        : 0;

    const multiplierFromAdjustments = 1 + fuelIndexAdjustment + riskAdjustment;
    const totalMultiplier = Number((volatilityMultiplier * capacityMultiplier * multiplierFromAdjustments).toFixed(4));
    const finalRateIndex = Number((baseMarketRpm * totalMultiplier).toFixed(4));

    return {
      baseMarketRpm,
      volatilityMultiplier,
      capacityMultiplier,
      fuelIndexAdjustment,
      riskAdjustment,
      totalMultiplier,
      finalRateIndex,
    };
  }, [rpm, marketModels.laneVolatilityIndex, marketModels.capacityHeatScore, marketModels.rejectionSpikeRisk, featureSnapshot.fuel_price]);

  const kpis = useMemo(() => ({
    // No mock KPIs, use only real or calculated values
    carrierCost: carrierCostRate,
    predictedMarket,
    recommendedSell,
    swing,
    winProb,
  }), [carrierCostRate, predictedMarket, recommendedSell, swing, winProb]);

  const laneData = useMemo(() => {
    const floorRate = Number(prediction?.guardrails?.floor || Math.max(0.5, ruleRate * 0.9));
    const ceilingRate = Number(prediction?.guardrails?.ceiling || Math.max(floorRate + 0.1, ruleRate * 1.08));
    return [
      { source: 'Rule Engine', rate: Math.round(ruleRate * miles) },
      { source: 'Guardrail Floor', rate: Math.round(floorRate * miles) },
      { source: 'Guardrail Ceiling', rate: Math.round(ceilingRate * miles) },
    ];
  }, [prediction, ruleRate, miles]);

  const riskBadge = useMemo(() => {
    if (marketModels.rejectionSpikeRisk === 'High') {
      return { icon: '🔴', label: 'Rejection Spike Risk', color: t.error };
    }
    if (marketModels.capacityHeatScore >= 75 || featureSnapshot.load_to_truck_ratio >= 3.3) {
      return { icon: '🟡', label: 'Tight Capacity', color: t.warning };
    }
    return { icon: '🟢', label: 'Balanced Market', color: t.success };
  }, [marketModels.rejectionSpikeRisk, marketModels.capacityHeatScore, featureSnapshot.load_to_truck_ratio, t.error, t.warning, t.success]);

  const confidenceValue = Number(prediction?.confidence || 0.76);
  const confidenceMeta = useMemo(() => {
    const level = confidenceValue >= 0.82 ? 'High' : confidenceValue >= 0.68 ? 'Moderate' : 'Low';
    const volatilityLabel = marketModels.laneVolatilityIndex >= 65 ? 'High' : marketModels.laneVolatilityIndex >= 35 ? 'Moderate' : 'Low';
    const sampleSize = Math.max(120, Math.round((miles / 4) + (marketModels.capacityHeatScore * 1.4)));
    const mae = Number(metrics?.mean_absolute_error_7d || 0);
    const acceptanceRate = Number(metrics?.acceptance_rate_rule || 0);
    const adjustedLevel = mae <= 0.06 && acceptanceRate >= 0.62
      ? 'High'
      : mae <= 0.14 && acceptanceRate >= 0.5
        ? 'Moderate'
        : level;

    return {
      value: confidenceValue,
      level: adjustedLevel,
      sampleSize,
      volatilityLabel,
      engineVersion: prediction?.engine_version || 'rules_v1.2',
      dataFreshness: `${Math.max(1, Math.round((Date.now() - dataUpdatedAt.getTime()) / 60000))} min ago`,
      fuelSource: 'DOE Weekly',
      marketSource: 'Internal Load Harvest + DAT + Greenscreens',
    };
  }, [confidenceValue, marketModels.laneVolatilityIndex, miles, marketModels.capacityHeatScore, prediction?.engine_version, dataUpdatedAt, metrics]);

  const driftWarning = useMemo(() => {
    const baseline = Number(featureSnapshot.lane_30d_avg || 0);
    const current = Number(featureSnapshot.lane_7d_avg || 0);
    const driftScore = Number(metrics?.lane_drift_score || 0);
    if (driftScore >= 0.65) return 'Lane behavior deviating from 30-day baseline';
    if (!baseline || baseline <= 0) return '';
    const delta = Math.abs((current - baseline) / baseline);
    if (delta >= 0.12) return 'Lane behavior deviating from 30-day baseline';
    return '';
  }, [featureSnapshot.lane_7d_avg, featureSnapshot.lane_30d_avg, metrics]);

  const refreshMetrics = async () => {
    const result = await getRateLogicMetrics();
    if (!result?.error) {
      setMetrics(result);
    }
  };

  useEffect(() => {
    refreshMetrics();
  }, []);


  // Use route engine for region info, not external geo API
  useEffect(() => {
    const originZip3 = parseZip3(origin);
    const destinationZip3 = parseZip3(destination);
    setGeoCoverage((prev) => ({
      ...prev,
      loading: false,
      originZip3,
      destinationZip3,
      originRegion: resolveRegionFallback(originZip3) || 'Unknown',
      destinationRegion: resolveRegionFallback(destinationZip3) || 'Unknown',
      source: 'route-engine',
    }));
  }, [origin, destination]);

  const handlePredictRate = async () => {
    const nextShipmentErrors = {};
    if (!String(origin || '').trim()) nextShipmentErrors.origin = 'Required';
    if (!String(destination || '').trim()) nextShipmentErrors.destination = 'Required';

    setShipmentErrors(nextShipmentErrors);
    if (Object.keys(nextShipmentErrors).length > 0) {
      setActionMessage('Origin and destination are required before predicting.');
      return;
    }

    setPredicting(true);
    setActionMessage('');
    // Prepare payload for backend route engine
    const payload = {
      origin,
      destination,
      equipment: equipmentType,
      mileage: featureSnapshot.miles,
      // Optionally add more fields if backend expects them
    };
    let result = await calculateRateLogic(payload);
    setPredicting(false);

    let resolved;
    if (result?.error) {
      setActionMessage('Backend route engine unavailable. Please try again later.');
      setPredicting(false);
      return;
    } else {
      resolved = {
        ...result,
        rule_rate: result.ratePerMile || result.rule_rate,
        confidence: result.confidence || 0.8,
        engine_version: result.engine_version || 'route-engine',
      };
    }
    setPrediction(resolved);
    setDataUpdatedAt(new Date());
    setSensitivity(0);
    const confidencePct = Math.round(Number(resolved.confidence || 0) * 100);
    setWinProb(confidencePct);
    setOutcomeBookedRate(Number(resolved.rule_rate || 0).toFixed(4));
    setActionMessage(`Predicted rule rate ${Number(resolved.rule_rate || 0).toFixed(2)} RPM at ${confidencePct}% confidence.`);

    setQuotingSaia(true);
    setSaiaQuote(null);
    const saiaResult = await quoteSaiaCarrierRate({
      shipment: {
        originZip: parseZip3(origin),
        destinationZip: parseZip3(destination),
        pickupDate: shipmentDetails.shipDate || new Date().toISOString().slice(0, 10),
        serviceType: shipmentDetails.serviceLevel || 'standard',
      },
      freightDetails: [{
        nmfc: String(shipmentDetails.reference || '').trim(),
        freightClass: '70',
        weight: Number(shipmentDetails.weight || 0) || 1000,
        pieces: 1,
      }],
      accessorials: [
        shipmentDetails?.residential ? 'RESIDENTIAL' : null,
        shipmentDetails?.appointment ? 'APPOINTMENT' : null,
      ].filter(Boolean),
      feature_snapshot: featureSnapshot,
      pricing: {
        marginPct: 0.12,
        volatilityIndex: marketModels.laneVolatilityIndex,
        capacityHeatScore: marketModels.capacityHeatScore,
        customerTierMultiplier: 1,
      },
    });
    setQuotingSaia(false);

    if (saiaResult?.error) {
      setSaiaQuote({ error: saiaResult.error });
      return;
    }

    setSaiaQuote({
      ...saiaResult.display,
      carrierQuote: saiaResult.carrierQuote,
      pricingInput: saiaResult.pricingInput,
      pricingResult: saiaResult.pricingResult,
    });
  };

  const handleLogQuoteOutcome = async () => {
    if (!prediction) {
      setActionMessage('Run Predict Rate first.');
      return;
    }

    const parsedBookedRate = Number(outcomeBookedRate);
    const bookedRate = Number.isFinite(parsedBookedRate) && parsedBookedRate > 0
      ? Number(parsedBookedRate.toFixed(4))
      : null;
    const parsedTimeToCover = Number.parseInt(String(outcomeTimeToCover || ''), 10);
    const timeToCoverMinutes = Number.isFinite(parsedTimeToCover) && parsedTimeToCover >= 0
      ? parsedTimeToCover
      : null;
    const accepted = outcomeAccepted === 'accepted'
      ? true
      : outcomeAccepted === 'rejected'
        ? false
        : null;
    const margin = bookedRate !== null ? Number((bookedRate - carrierCostRate).toFixed(4)) : null;

    const nextErrors = {
      bookedRate: bookedRate === null ? 'Enter a valid booked rate > 0.' : '',
      timeToCover: timeToCoverMinutes === null ? 'Enter a valid non-negative time to cover.' : '',
    };
    setOutcomeErrors(nextErrors);
    if (nextErrors.bookedRate || nextErrors.timeToCover) {
      setActionMessage('Fix outcome fields before logging.');
      return;
    }

    setLoggingOutcome(true);
    setActionMessage('');
    const result = await logQuoteOutcome({
      engine_version: prediction.engine_version || 'rules_v1.2',
      rule_rate: ruleRate,
      ml_rate: null,
      accepted,
      booked_rate: bookedRate,
      margin,
      time_to_cover_minutes: timeToCoverMinutes,
      feature_snapshot: featureSnapshot,
      quote_events: quoteTelemetry,
    });
    setLoggingOutcome(false);

    if (result?.error) {
      setActionMessage(result.error);
      return;
    }

    setOutcomeErrors({ bookedRate: '', timeToCover: '' });
    setActionMessage(`Quote outcome logged (${result?.quote?.quote_id || 'saved'}).`);
    refreshMetrics();
  };

  const handleAutoFillOutcome = () => {
    if (quoteLocked) {
      setActionMessage('Quote is locked. Unlock to auto-fill outcome fields.');
      return;
    }
    setOutcomeBookedRate(Number(recommendedSellRate || ruleRate || 0).toFixed(4));
    setOutcomeTimeToCover('37');
    setOutcomeErrors({ bookedRate: '', timeToCover: '' });
    setActionMessage('Outcome fields auto-filled from current pricing decision.');
  };

  const handlePushToLoadBoard = () => {
    const equipmentMap = {
      dry_van: 'van',
      reefer: 'reefer',
      flatbed: 'flatbed',
    };
    const normalizedEquipment = equipmentMap[String(equipmentType || '').toLowerCase()] || 'van';
    const normalizedMiles = Math.max(1, Number(featureSnapshot.miles || 0));
    const estimatedRevenue = Math.max(0, Math.round(recommendedSellRate * normalizedMiles));
    const estimatedCarrierCost = Math.max(0, Math.round(carrierCostRate * normalizedMiles));

    setActionMessage('Quote pushed to Load Board workflow.');
    navigate('/load-board', {
      state: {
        autoCreate: true,
        prefillLoad: {
          source: 'rate-logic',
          customerName: 'Rate Logic Quote',
          equipment: normalizedEquipment,
          miles: normalizedMiles,
          revenue: estimatedRevenue,
          carrierCost: estimatedCarrierCost,
          origin,
          destination,
          shipmentDetails,
          createdAt: new Date().toISOString(),
        },
      },
    });
  };

  const handleSendToBidNetwork = async () => {
    if (!prediction) {
      setActionMessage('Run Predict Rate first.');
      return;
    }

    setSendingToBidNetwork(true);
    setActionMessage('');

    const equipmentMap = {
      dry_van: 'van',
      reefer: 'reefer',
      flatbed: 'flatbed',
    };
    const normalizedEquipment = equipmentMap[String(equipmentType || '').toLowerCase()] || 'van';
    const normalizedMiles = Math.max(1, Number(featureSnapshot.miles || 0));
    const estimatedRevenue = Math.max(0, Math.round(recommendedSellRate * normalizedMiles));
    const estimatedCarrierCost = Math.max(0, Math.round(carrierCostRate * normalizedMiles));

    const createResult = await createLoad({
      customerName: 'Rate Logic Quote',
      equipment: normalizedEquipment,
      miles: normalizedMiles,
      revenue: estimatedRevenue,
      carrierCost: estimatedCarrierCost,
      origin: {
        city: String(origin || '').split(',')[0]?.trim() || 'Not set',
        state: (String(origin || '').toUpperCase().match(/,\s*([A-Z]{2})\b/) || [])[1] || '',
      },
      destination: {
        city: String(destination || '').split(',')[0]?.trim() || 'Not set',
        state: (String(destination || '').toUpperCase().match(/,\s*([A-Z]{2})\b/) || [])[1] || '',
      },
      shipmentDetails,
    });

    if (createResult?.error || !createResult?.load?.id) {
      setSendingToBidNetwork(false);
      setActionMessage(createResult?.error || 'Failed to create load for bid network.');
      return;
    }

    const bidResult = await sendLoadToBidNetwork(createResult.load.id, {
      network: 'rate-logic-bid-network',
      source: 'rate-logic',
      ruleRate,
      recommendedSellRate,
      featureSnapshot,
      shipmentDetails,
    });

    setSendingToBidNetwork(false);

    if (bidResult?.error) {
      setActionMessage(`Load ${createResult.load.id} created, but bid push failed: ${bidResult.error}`);
      return;
    }

    setActionMessage(`Load ${createResult.load.id} sent to bid network successfully.`);
    navigate('/load-board', {
      state: {
        source: 'rate-logic',
        selectedLoadId: createResult.load.id,
      },
    });
  };

  const updateShipmentDetails = (field, value) => {
    setShipmentDetails((prev) => ({ ...prev, [field]: value }));
    setShipmentErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const appendTelemetry = (event, meta = {}) => {
    setQuoteTelemetry((previous) => ([
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        event,
        label: `${event} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        timestamp: new Date().toISOString(),
        ...meta,
      },
      ...previous,
    ].slice(0, 20)));
  };

  const handleSwapLane = () => {
    const previousOrigin = origin;
    const previousDestination = destination;
    setOrigin(previousDestination);
    setDestination(previousOrigin);
    appendTelemetry('lane_swap', {
      from: `${previousOrigin} -> ${previousDestination}`,
      to: `${previousDestination} -> ${previousOrigin}`,
    });
    setPendingSwapRecalc(true);
    setActionMessage('Lane swapped. Recalculating deterministic rate index...');
  };

  useEffect(() => {
    if (!pendingSwapRecalc) return;
    setPendingSwapRecalc(false);
    handlePredictRate();
  }, [pendingSwapRecalc]);

  const handleSendToCarrierList = () => {
    setActionMessage('Quote sent to Carrier List workflow.');
    navigate('/carriers-list');
  };

  const handleLockQuote = () => {
    setQuoteLocked((prev) => {
      const next = !prev;
      setActionMessage(next ? 'Quote locked for execution.' : 'Quote unlocked for edits.');
      return next;
    });
  };

  const handleSimulateMarginImpact = () => {
    const simulatedLow = Number((recommendedSellRate * 0.985).toFixed(4));
    const simulatedHigh = Number((recommendedSellRate * 1.015).toFixed(4));
    const lowMargin = Number((simulatedLow - carrierCostRate).toFixed(4));
    const highMargin = Number((simulatedHigh - carrierCostRate).toFixed(4));
    setActionMessage(`Simulated margin impact: ${lowMargin.toFixed(4)} to ${highMargin.toFixed(4)} per mile.`);
  };

  // Defensive checks for key props
  const safeFeatureSnapshot = featureSnapshot || {};
  const safeHarvestedPricing = harvestedPricing || {};
  const safeMarketModels = marketModels || {};
  const safeMileageEstimate = mileageEstimate || {};
  const safeGeoCoverage = geoCoverage || {};
  const safeConfidenceMeta = confidenceMeta || {};
  const safeKpis = kpis || {};
  const safeLaneData = laneData || [];
  const safeTopCarriers = safeHarvestedPricing.topCarriers || [];
  const safeBookedLoads = safeHarvestedPricing.bookedLoads || [];
  const safeLaneSummary = safeHarvestedPricing.laneSummary || {};
  const safeStateCapacityScores = capacityHeatMapScores || {};

  return (
    <ErrorBoundary>
      <div className={styles.container}>
      <header className={styles.header}>
        <h1>Truckload Rate Calculator</h1>
        <div className={styles.headerIcons} />
      </header>

      <div style={{ padding: '0 32px', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', color: t.textSecondary, fontSize: 12 }}>
        <span>Data Updated: {safeString(safeConfidenceMeta.dataFreshness)}</span>
        <span>Fuel Index: {safeString(safeConfidenceMeta.fuelSource)}</span>
        <span>Engine: {safeString(safeConfidenceMeta.engineVersion)}</span>
        <span>Sources: {safeString(safeConfidenceMeta.marketSource)}</span>
        <span>{safeHarvestedPricing.loading ? 'Harvesting loads...' : `Harvest: ${safeString(safeHarvestedPricing.matchedLoads)}/${safeString(safeHarvestedPricing.totalLoads)} (${safeString(safeHarvestedPricing.source)})`}</span>
        <span>Capacity Mode: {safeString(safeMarketModels.marketDataMode)}</span>
        <span>Volatility: {safeMarketModels.capacityVolatilityFlag ? 'High' : 'Normal'}</span>
      </div>

      <div
        style={{
          margin: '8px 32px 0 32px',
          border: `1px solid ${t.border}`,
          borderRadius: 10,
          background: t.bgAlt,
          padding: '8px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          fontSize: 12,
        }}
      >
        <strong style={{ color: t.textSecondary }}>Geo Coverage</strong>
        <span>
          Origin {safeString(safeGeoCoverage.originZip3 || '---')} ({safeString(safeGeoCoverage.originRegion || 'Unknown')})
          {'  '}→{'  '}
          Destination {safeString(safeGeoCoverage.destinationZip3 || '---')} ({safeString(safeGeoCoverage.destinationRegion || 'Unknown')})
        </span>
        <span>
          Miles: {safeString(Number(safeFeatureSnapshot.miles || 0).toLocaleString())}
          {'  '}({safeString(safeMileageEstimate.method || 'estimated')} • {safeString(Math.round(Number(safeMileageEstimate.confidence || 0) * 100))}%)
          {'  '}|{'  '}
          Origin Capacity: {safeString(Number(safeMarketModels.originCapacityScore || 0).toFixed(0))}/100
          {'  '}|{'  '}
          Destination Capacity: {safeString(Number(safeMarketModels.destinationCapacityScore || 0).toFixed(0))}/100
        </span>
        <span style={{ color: t.textSecondary }}>
          {mileageLoading ? 'Resolving mileage...' : (safeGeoCoverage.loading ? 'Resolving...' : `Source: ${safeString(safeGeoCoverage.source)}`)}
        </span>
      </div>

      <main className={styles.main}>
        <section className={styles.leftPanel}>
          <LoadInputs
            origin={safeString(origin)}
            setOrigin={setOrigin}
            destination={safeString(destination)}
            setDestination={setDestination}
            shipmentDetails={shipmentDetails || {}}
            onShipmentChange={updateShipmentDetails}
            shipmentErrors={shipmentErrors || {}}
            rpm={rpm}
            predictedSwing={undefined}
            equipmentType={safeString(equipmentType)}
            setEquipmentType={setEquipmentType}
            onSwapLane={handleSwapLane}
            laneVolatilityIndex={safeMarketModels.laneVolatilityIndex}
            capacityHeatScore={safeMarketModels.capacityHeatScore}
            rejectionSpikeRisk={safeMarketModels.rejectionSpikeRisk}
            onPredictRate={handlePredictRate}
            predicting={predicting}
          />
        </section>

        <section className={styles.centerPanel}>
          <section
            style={{
              border: `1px solid ${t.border}`,
              borderRadius: 10,
              padding: '10px 12px',
              marginBottom: 10,
              background: t.bgAlt,
              display: 'grid',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
              <strong style={{ fontSize: 13 }}>Saia Rate Result</strong>
              <span style={{ fontSize: 11, color: t.textSecondary }}>
                {quotingSaia ? 'Requesting Saia quote...' : (saiaQuote?.carrier ? 'Live quote' : 'No quote yet')}
              </span>
            </div>
            {!saiaQuote && !quotingSaia && (
              <div style={{ fontSize: 12, color: t.textSecondary }}>
                Run Predict Rate to request a Saia quote.
              </div>
            )}
            {saiaQuote?.error && (
              <div style={{ fontSize: 12, color: t.textSecondary }}>
                {saiaQuote.error}
              </div>
            )}
            {saiaQuote?.carrier && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, fontSize: 12 }}>
                <div><strong>Carrier:</strong> {saiaQuote.carrier}</div>
                <div><strong>Total Rate:</strong> ${Number(saiaQuote.totalRate || 0).toLocaleString()}</div>
                <div><strong>Transit Days:</strong> {Number(saiaQuote.transitDays || 0)}</div>
                <div><strong>Service:</strong> {saiaQuote.serviceType || saiaQuote?.carrierQuote?.serviceLevel || 'STANDARD'}</div>
                <div><strong>Fuel:</strong> ${Number(saiaQuote?.fuelBreakdown?.fuelSurcharge || 0).toLocaleString()}</div>
                <div><strong>Fuel %:</strong> {Number(saiaQuote?.fuelBreakdown?.fuelPct || 0).toFixed(2)}%</div>
              </div>
            )}
          </section>

          <RateBreakdown
            kpis={safeKpis}
            winProb={winProb}
            setWinProb={setWinProb}
            ruleRate={ruleRate}
            confidence={prediction?.confidence || confidenceValue}
            recommendedBand={prediction?.recommended_band}
            onLogQuoteOutcome={handleLogQuoteOutcome}
            predicting={predicting}
            loggingOutcome={loggingOutcome}
            actionMessage={actionMessage}
            outcomeAccepted={outcomeAccepted}
            setOutcomeAccepted={(value) => {
              if (quoteLocked) {
                setActionMessage('Quote is locked. Unlock to edit outcome fields.');
                return;
              }
              setOutcomeAccepted(value);
            }}
            outcomeBookedRate={outcomeBookedRate}
            setOutcomeBookedRate={(value) => {
              if (quoteLocked) {
                setActionMessage('Quote is locked. Unlock to edit outcome fields.');
                return;
              }
              setOutcomeBookedRate(value);
              setOutcomeErrors((prev) => ({ ...prev, bookedRate: '' }));
            }}
            outcomeTimeToCover={outcomeTimeToCover}
            setOutcomeTimeToCover={(value) => {
              if (quoteLocked) {
                setActionMessage('Quote is locked. Unlock to edit outcome fields.');
                return;
              }
              setOutcomeTimeToCover(value);
              setOutcomeErrors((prev) => ({ ...prev, timeToCover: '' }));
            }}
            outcomeErrors={outcomeErrors || {}}
            sensitivity={sensitivity}
            setSensitivity={setSensitivity}
            recommendedSellRate={recommendedSellRate}
            deltaVsMarketPct={deltaVsMarketPct}
            marginPerMile={marginPerMile}
            riskBadge={riskBadge}
            onPushToLoadBoard={handlePushToLoadBoard}
            onSendToBidNetwork={handleSendToBidNetwork}
            onSendToCarrierList={handleSendToCarrierList}
            onLockQuote={handleLockQuote}
            onSimulateMarginImpact={handleSimulateMarginImpact}
            quoteLocked={quoteLocked}
            confidenceMeta={safeConfidenceMeta}
            driftWarning={driftWarning}
            onAutoFillOutcome={handleAutoFillOutcome}
            sendingToBidNetwork={sendingToBidNetwork}
            rateIndexBreakdown={rateIndexBreakdown}
            quoteTelemetry={quoteTelemetry || []}
          />
        </section>

        <section className={styles.rightPanel}>
          <MarketTrends
            forecast={forecast || {}}
            setForecast={setForecast}
            topCarriers={safeTopCarriers}
            laneData={safeLaneData}
            bookedLoads={safeBookedLoads}
            laneSummary={safeLaneSummary}
            stateCapacityScores={safeStateCapacityScores}
            routeEngineView={{
              origin: safeString(origin),
              destination: safeString(destination),
              miles: Number(safeFeatureSnapshot.miles || 0),
              method: safeString(safeMileageEstimate.method || 'estimated'),
              confidence: Number(safeMileageEstimate.confidence || 0),
              loading: mileageLoading,
            }}
          />
        </section>
      </main>
      </div>
    </ErrorBoundary>
  );
}

export default RateCalculator;
