import express from 'express';

const router = express.Router();

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
  const fuelSurcharge = numericMileage * 0.18;
  const quote = toMoney(laneAverage + fuelSurcharge);

  const positionRatio = quote / laneAverage;
  const marketPosition =
    positionRatio > 1.04 ? 'Above Avg' : positionRatio < 0.97 ? 'Below Avg' : 'At Avg';

  const confidence = clamp(
    Math.round(96 - Math.abs(1 - positionRatio) * 120),
    70,
    98
  );

  return res.json({
    quote,
    confidence,
    marketPosition,
    laneData: buildMarketRows(laneAverage),
    shortTermHistory: buildShortTermHistory(laneAverage),
    topCarriers: buildTopCarriers(laneAverage),
    loadBoard: buildLoadBoard(),
  });
});

export default router;
