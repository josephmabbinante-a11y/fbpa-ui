import express from 'express';
import { verifyToken } from '../middleware/auth.js';
const router = express.Router();
// Simple test route for debugging
router.get('/test', (req, res) => {
  res.json({ ok: true, message: 'Loads router is working.' });
});

// Require authentication for all loads endpoints
router.use(verifyToken);
// import fs from 'fs';
// import path from 'path';
import { buildMileageLaneKey, estimateMileage } from './mileage.js';
import fs from 'fs';
import path from 'path';
const STORE_DIR = path.resolve('./server/data');
const STORE_FILE = path.join(STORE_DIR, 'loads.json');
import {
  ALLOWED_STATUS_TRANSITIONS,
  canTransitionStatus,
  createStatusHistoryEntry,
  deriveControlsForStatus,
  findTransitionPath,
  formatLoadStatusLabel,
  normalizeLoadStatus,
} from './loadLifecycle.js';


// Removed file-based storage and seedLoads. Now using MongoDB.
import { AuditTrail, Load } from './models.js';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomPick(items) {
  return items[randomInt(0, items.length - 1)];
}

function generateSeedLoads(count = 240) {
  const cityPool = [
    { city: 'Los Angeles', state: 'CA' }, { city: 'San Diego', state: 'CA' },
    { city: 'Phoenix', state: 'AZ' }, { city: 'Denver', state: 'CO' },
    { city: 'Dallas', state: 'TX' }, { city: 'Houston', state: 'TX' },
    { city: 'San Antonio', state: 'TX' }, { city: 'Chicago', state: 'IL' },
    { city: 'Atlanta', state: 'GA' }, { city: 'Miami', state: 'FL' },
    { city: 'Orlando', state: 'FL' }, { city: 'Nashville', state: 'TN' },
    { city: 'Charlotte', state: 'NC' }, { city: 'Newark', state: 'NJ' },
    { city: 'Columbus', state: 'OH' }, { city: 'Kansas City', state: 'MO' },
    { city: 'Seattle', state: 'WA' }, { city: 'Portland', state: 'OR' },
  ];
  const customers = [
    { id: 'C-44', name: 'Amazon' }, { id: 'C-52', name: 'Target' },
    { id: 'C-60', name: 'Walmart' }, { id: 'C-77', name: 'Costco' },
    { id: 'C-88', name: 'Home Depot' }, { id: 'C-91', name: 'Kroger' },
    { id: 'C-102', name: 'Publix' },
  ];
  const carrierPool = [
    { id: 'CR-18', name: 'Prime Logistics' }, { id: 'CR-21', name: 'Velocity Van' },
    { id: 'CR-31', name: 'Summit Freight' }, { id: 'CR-37', name: 'Titan Carriers' },
    { id: 'CR-40', name: 'BlueRoute Transport' }, { id: 'CR-48', name: 'Swiftline Trucking' },
  ];
  const dispatchers = [
    { id: 'U-9', name: 'Alex Smith' }, { id: 'U-10', name: 'Jamie Lee' },
    { id: 'U-12', name: 'Mia Clark' }, { id: 'U-14', name: 'Jordan Patel' },
  ];
  const equipmentTypes = ['van', 'reefer', 'flatbed', 'power_only'];
  const statusPool = ['DRAFT', 'TENDERED', 'PRE_DISPATCH', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION'];
  const statusWeights = [18, 20, 18, 24, 14, 6];

  const weightedStatusPick = () => {
    const roll = randomInt(1, statusWeights.reduce((s, v) => s + v, 0));
    let cursor = 0;
    for (let i = 0; i < statusPool.length; i++) {
      cursor += statusWeights[i];
      if (roll <= cursor) return statusPool[i];
    }
    return 'DRAFT';
  };

  const now = Date.now();
  const result = [];

  for (let idx = 0; idx < count; idx++) {
    const origin = randomPick(cityPool);
    let destination = randomPick(cityPool);
    while (destination.city === origin.city && destination.state === origin.state) {
      destination = randomPick(cityPool);
    }
    const equipment = randomPick(equipmentTypes);
    const status = normalizeLoadStatus(weightedStatusPick());
    const miles = randomInt(180, 2650);
    const baselineRpm = equipment === 'reefer' ? 2.78 : equipment === 'flatbed' ? 2.52 : equipment === 'power_only' ? 2.08 : 2.34;
    const demandVolatility = (Math.random() * 0.55) - 0.2;
    const revenue = Math.round(miles * (baselineRpm + demandVolatility));
    const assignedCarrier = ['DRAFT', 'QUOTED', 'RATE_LOCKED', 'BOOKED', 'TENDERED'].includes(status) ? null : randomPick(carrierPool);
    const carrierCostFactor = status === 'EXCEPTION' ? (0.94 + Math.random() * 0.07) : (0.72 + Math.random() * 0.2);
    const carrierCost = assignedCarrier ? Math.round(revenue * carrierCostFactor) : 0;
    const margin = revenue - carrierCost;
    const marginPct = revenue > 0 ? Number(((margin / revenue) * 100).toFixed(1)) : 0;
    const pickupOffsetHours = randomInt(-36, 96);
    const tripDurationHours = Math.max(8, Math.round((miles / 48) + randomInt(2, 14)));
    const pickupAt = new Date(now + pickupOffsetHours * 3600000);
    const deliveryAt = new Date(pickupAt.getTime() + tripDurationHours * 3600000);
    const updatedAt = new Date(pickupAt.getTime() - randomInt(1, 30) * 3600000);

    result.push({
      id: `L-${String(300000 + idx + 1)}`,
      status,
      customer: randomPick(customers),
      carrier: assignedCarrier
        ? { id: assignedCarrier.id, name: assignedCarrier.name, assigned: true }
        : { id: null, name: 'Pending', assigned: false },
      miles, revenue, carrierCost, margin, marginPct,
      targetMarginPct: 12,
      equipment,
      dispatcher: randomPick(dispatchers),
      origin: { city: origin.city, state: origin.state },
      destination: { city: destination.city, state: destination.state },
      pickupAt: pickupAt.toISOString(),
      deliveryAt: deliveryAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      statusHistory: createInitialStatusHistory(status),
      exceptionReason: status === 'EXCEPTION' ? 'Carrier check call missed SLA window.' : '',
      invoiceLocked: status === 'EXCEPTION',
    });
  }
  return result;
}

const seedLoads = [];

const seedLoadTemplates = [];
const seedEventsByLoad = {};

const riskByLoad = {
  'L-102938': {
    loadId: 'L-102938',
    laneVolatilityScore: 61,
    capacityHeatIndex: 51,
    complianceStatus: 'valid',
    pickupCountdownMinutes: 930,
    warnings: ['margin_below_lane_avg'],
  },
  'L-204811': {
    loadId: 'L-204811',
    laneVolatilityScore: 42,
    capacityHeatIndex: 38,
    complianceStatus: 'valid',
    pickupCountdownMinutes: 610,
    warnings: [],
  },
  'L-887201': {
    loadId: 'L-887201',
    laneVolatilityScore: 73,
    capacityHeatIndex: 69,
    complianceStatus: 'pending',
    pickupCountdownMinutes: 220,
    warnings: ['carrier_not_assigned'],
  },
  'L-492002': {
    loadId: 'L-492002',
    laneVolatilityScore: 55,
    capacityHeatIndex: 60,
    complianceStatus: 'valid',
    pickupCountdownMinutes: 720,
    warnings: ['margin_below_lane_avg'],
  },
};

const seedBotActivityByLoad = {
  'L-102938': [
    {
      id: 'BOT-1001',
      loadId: 'L-102938',
      text: 'Dispatch Bot initialized for this load.',
      createdAt: '2026-03-01T18:10:00Z',
      source: 'system',
    },
  ],
};

let loads = structuredClone(seedLoads);
let loadTemplates = structuredClone(seedLoadTemplates);
let eventsByLoad = structuredClone(seedEventsByLoad);
let botActivityByLoad = structuredClone(seedBotActivityByLoad);

const REQUIRED_LOAD_FIELDS = ['customerName', 'originCity', 'originState', 'destinationCity', 'destinationState'];

function getActor(payload = {}, req = null) {
  const explicit = String(payload?.userId || payload?.actor || '').trim();
  if (explicit) return explicit;
  const fromToken = String(req?.user?.email || req?.user?.id || req?.user?.sub || '').trim();
  return fromToken || 'system';
}

function buildValidationError(details) {
  return {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid load payload',
      details,
    },
  };
}

function validateLoadPayload(payload = {}, { partial = false } = {}) {
  const body = payload || {};
  const errors = [];

  if (!partial) {
    const hasCustomer = String(body.customerName || body.customer?.name || '').trim().length > 0;
    const hasOriginCity = String(body.originCity || body.origin?.city || '').trim().length > 0;
    const hasOriginState = String(body.originState || body.origin?.state || '').trim().length > 0;
    const hasDestinationCity = String(body.destinationCity || body.destination?.city || '').trim().length > 0;
    const hasDestinationState = String(body.destinationState || body.destination?.state || '').trim().length > 0;

    if (!hasCustomer) errors.push({ field: 'customerName', message: 'customerName is required' });
    if (!hasOriginCity) errors.push({ field: 'originCity', message: 'originCity is required' });
    if (!hasOriginState) errors.push({ field: 'originState', message: 'originState is required' });
    if (!hasDestinationCity) errors.push({ field: 'destinationCity', message: 'destinationCity is required' });
    if (!hasDestinationState) errors.push({ field: 'destinationState', message: 'destinationState is required' });
  }

  const hasRevenue = body.revenue !== undefined;
  const hasCarrierCost = body.carrierCost !== undefined;
  if (hasRevenue && !Number.isFinite(Number(body.revenue))) {
    errors.push({ field: 'revenue', message: 'revenue must be numeric' });
  }
  if (hasCarrierCost && !Number.isFinite(Number(body.carrierCost))) {
    errors.push({ field: 'carrierCost', message: 'carrierCost must be numeric' });
  }

  return errors;
}

async function logLoadAudit({ loadId, action, actor, before = null, after = null, metadata = {} }) {
  try {
    await AuditTrail.create({
      id: `at-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      entityType: 'load',
      entityId: loadId,
      action,
      actor: actor || 'system',
      before,
      after,
      metadata,
      createdAt: new Date(),
    });
  } catch {
    // Audit trails should not block operational writes.
  }
}

async function syncLoadToDatabase(load) {
  if (!load?.id) return load;
  const persisted = await Load.findOneAndUpdate(
    { id: load.id },
    { ...load, updatedAtDb: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return persisted ? normalizeStoredLoad(persisted) : normalizeStoredLoad(load);
}

async function ensureLoadInMemory(loadId) {
  const existing = loads.find((item) => item.id === loadId);
  if (existing) return existing;

  const fromDb = await Load.findOne({ id: loadId }).lean();
  if (!fromDb) return null;

  const normalized = normalizeStoredLoad(fromDb);
  loads.unshift(normalized);
  return normalized;
}

function createInitialStatusHistory(status) {
  return [{
    status: status || 'DRAFT',
    fromStatus: status || 'DRAFT',
    toStatus: status || 'DRAFT',
    timestamp: new Date().toISOString(),
    source: 'initial',
    reason: 'Load created',
  }];
}

function normalizeStoredLoad(rawLoad) {
  const normalizedStatus = normalizeLoadStatus(rawLoad?.status);
  const statusHistory = Array.isArray(rawLoad?.statusHistory) && rawLoad.statusHistory.length > 0
    ? rawLoad.statusHistory.map((entry) => ({
      ...entry,
      fromStatus: normalizeLoadStatus(entry.fromStatus || entry.status),
      toStatus: normalizeLoadStatus(entry.toStatus || entry.status),
      status: normalizeLoadStatus(entry.status || entry.toStatus || entry.fromStatus),
    }))
    : createInitialStatusHistory(normalizedStatus);

  return {
    ...rawLoad,
    status: normalizedStatus,
    statusHistory,
  };
}

function appendStatusHistory(load, toStatus, payload = {}, source = 'workflow-engine') {
  const fromStatus = normalizeLoadStatus(load.status);
  const nextStatus = normalizeLoadStatus(toStatus);
  if (fromStatus === nextStatus) return;

  const entry = createStatusHistoryEntry({
    fromStatus,
    toStatus: nextStatus,
    userId: payload.userId || 'system',
    reason: payload.reason || payload.transitionReason || '',
    source,
  });

  load.status = nextStatus;
  load.statusHistory = [entry, ...(Array.isArray(load.statusHistory) ? load.statusHistory : [])];
}

function transitionLoadToStatus(load, targetStatus, payload = {}, source = 'status-transition') {
  const fromStatus = normalizeLoadStatus(load.status);
  const toStatus = normalizeLoadStatus(targetStatus);

  if (fromStatus === toStatus) {
    return { ok: true, fromStatus, toStatus, path: [fromStatus] };
  }

  if (payload.overrideRolePermission) {
    appendStatusHistory(load, toStatus, payload, source);
    return { ok: true, fromStatus, toStatus, path: [fromStatus, toStatus] };
  }

  const path = findTransitionPath(fromStatus, toStatus);
  if (!path) {
    return {
      error: {
        code: 'ILLEGAL_STATUS_TRANSITION',
        message: `Illegal transition ${formatLoadStatusLabel(fromStatus)} -> ${formatLoadStatusLabel(toStatus)}.`,
        details: {
          fromStatus,
          toStatus,
          allowed: ALLOWED_STATUS_TRANSITIONS[fromStatus] || [],
        },
      },
    };
  }
  let loads = structuredClone(seedLoads);
  let loadTemplates = structuredClone(seedLoadTemplates);
  let eventsByLoad = structuredClone(seedEventsByLoad);
  let botActivityByLoad = structuredClone(seedBotActivityByLoad);

  for (let index = 1; index < path.length; index += 1) {
    appendStatusHistory(load, path[index], payload, source);
  }

  return { ok: true, fromStatus, toStatus, path };
}

function persistStore() {
  try {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }

    fs.writeFileSync(
      STORE_FILE,
      JSON.stringify(
        {
          loads,
          loadTemplates,
          eventsByLoad,
          botActivityByLoad,
          bidsByLoad,
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      ),
      'utf8'
    );
  } catch (err) {
    console.error('[loads] Failed to persist store:', err.message);
  }
}

function hydrateStore() {
  try {
    if (!fs.existsSync(STORE_FILE)) return;
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    if (!raw.trim()) return;

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.loads)) {
      loads = parsed.loads.map(normalizeStoredLoad);
    }
    if (Array.isArray(parsed?.loadTemplates)) {
      loadTemplates = parsed.loadTemplates;
    }
    if (parsed?.eventsByLoad && typeof parsed.eventsByLoad === 'object') {
      eventsByLoad = parsed.eventsByLoad;
    }
    if (parsed?.botActivityByLoad && typeof parsed.botActivityByLoad === 'object') {
      botActivityByLoad = parsed.botActivityByLoad;
    }
    if (parsed?.bidsByLoad && typeof parsed.bidsByLoad === 'object') {
      Object.assign(bidsByLoad, parsed.bidsByLoad);
    }
  } catch (err) {
    console.error('[loads] Failed to hydrate persisted store:', err.message);
  }
}

hydrateStore();
loads = loads.map(normalizeStoredLoad);

// Seed loads if the in-memory store is empty (mirrors frontend mock generation)
async function seedIfEmpty() {
  if (loads.length > 0) return;
  try {
    const dbCount = await Load.countDocuments({});
    if (dbCount > 0) {
      // Pull from MongoDB into memory
      const fromDb = await Load.find({}).lean();
      loads = fromDb.map(normalizeStoredLoad);
      console.log(`[loads] Hydrated ${loads.length} loads from MongoDB.`);
    } else {
      // Generate seed data
      loads = generateSeedLoads(240);
      console.log('[loads] Generated 240 seed loads.');
      // Bulk-insert into MongoDB for persistence
      try {
        await Load.insertMany(loads, { ordered: false });
        console.log('[loads] Seed loads written to MongoDB.');
      } catch (bulkErr) {
        console.warn('[loads] Bulk insert partial or failed:', bulkErr.message);
      }
    }
    persistStore();
  } catch (err) {
    // If MongoDB is unreachable, generate in-memory only
    if (loads.length === 0) {
      loads = generateSeedLoads(240);
      persistStore();
      console.log('[loads] Generated 240 seed loads (in-memory only, MongoDB unavailable).');
    }
  }
}
seedIfEmpty();

function appendEvent(loadId, type, message, actor = { id: 'U-system', name: 'System' }) {
  if (!eventsByLoad[loadId]) eventsByLoad[loadId] = [];
  eventsByLoad[loadId].unshift({
    id: `EV-${Date.now()}`,
    loadId,
    type,
    message,
    actor,
    createdAt: new Date().toISOString(),
  });
  persistStore();
}

function appendBotActivity(loadId, text, source = 'dispatch-bot-addon') {
  if (!botActivityByLoad[loadId]) botActivityByLoad[loadId] = [];
  const entry = {
    id: `BOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    loadId,
    text: String(text || '').trim(),
    createdAt: new Date().toISOString(),
    source,
  };
  botActivityByLoad[loadId].unshift(entry);
  botActivityByLoad[loadId] = botActivityByLoad[loadId].slice(0, 50);
  persistStore();
  return entry;
}


function normalizeTemplatePayload(payload = {}) {
  return {
    name: String(payload.name || '').trim(),
    source: payload.source || 'direct',
    customer: String(payload.customer || 'Not set').trim() || 'Not set',
    picks: Math.max(0, Number.parseInt(String(payload.picks || 0), 10) || 0),
    drops: Math.max(0, Number.parseInt(String(payload.drops || 0), 10) || 0),
    branch: String(payload.branch || 'Shared').trim() || 'Shared',
    defaults: {
      equipment: String(payload.defaults?.equipment || 'van'),
      miles: Number(payload.defaults?.miles || 0),
      revenue: Number(payload.defaults?.revenue || 0),
      carrierCost: Number(payload.defaults?.carrierCost || 0),
      origin: {
        city: String(payload.defaults?.origin?.city || ''),
        state: String(payload.defaults?.origin?.state || ''),
      },
      destination: {
        city: String(payload.defaults?.destination?.city || ''),
        state: String(payload.defaults?.destination?.state || ''),
      },
    },
  };
}

function buildLoadFromTemplate(template) {
  const now = new Date();
  const pickup = new Date(now.getTime() + (2 * 60 * 60 * 1000));
  const delivery = new Date(now.getTime() + (28 * 60 * 60 * 1000));
  const source = template?.source || template?.defaults?.source;
  const nextId = generateLoadId(source);
  const defaults = template?.defaults || {};
  const revenue = Number(defaults.revenue || 0);
  const carrierCost = Number(defaults.carrierCost || 0);

  return {
    id: nextId,
    status: 'DRAFT',
    customer: { id: null, name: template?.customer || 'Not set' },
    carrier: { id: null, name: 'Pending', assigned: false },
    origin: {
      city: defaults.origin?.city || 'Not set',
      state: defaults.origin?.state || '',
    },
    destination: {
      city: defaults.destination?.city || 'Not set',
      state: defaults.destination?.state || '',
    },
    equipment: defaults.equipment || 'van',
    miles: Number(defaults.miles || 0),
    revenue,
    carrierCost,
    margin: revenue - carrierCost,
    marginPct: revenue > 0 ? Number((((revenue - carrierCost) / revenue) * 100).toFixed(1)) : 0,
    targetMarginPct: 12,
    pickupAt: pickup.toISOString(),
    deliveryAt: delivery.toISOString(),
    dispatcher: { id: 'U-9', name: 'Alex Smith' },
    updatedAt: now.toISOString(),
    templateId: template?.id || null,
    templateName: template?.name || null,
    statusHistory: createInitialStatusHistory('DRAFT'),
  };
}

function applyCreateOverrides(load, payload = {}) {
  const next = { ...load};

  if (payload.customerName !== undefined) {
    next.customer = { id: null, name: String(payload.customerName || '').trim() || 'Not set' };
  }

  if (payload.carrierName !== undefined || payload.carrierId !== undefined || payload.carrierAssigned !== undefined) {
    const carrierName = String(payload.carrierName || '').trim();
    const carrierId = String(payload.carrierId || '').trim();
    const carrierAssigned = payload.carrierAssigned !== undefined
      ? Boolean(payload.carrierAssigned)
      : Boolean(carrierId || carrierName);

    next.carrier = {
      id: carrierId || null,
      name: carrierName || (carrierAssigned ? 'Assigned Carrier' : 'Pending'),
      assigned: carrierAssigned,
    };
  }

  if (payload.equipment !== undefined) {
    next.equipment = String(payload.equipment || '').trim() || next.equipment || 'van';
  }

  if (payload.miles !== undefined) next.miles = Math.max(0, toNumberOrFallback(payload.miles, Number(next.miles || 0)));
  if (payload.revenue !== undefined) next.revenue = Math.max(0, toNumberOrFallback(payload.revenue, Number(next.revenue || 0)));
  if (payload.carrierCost !== undefined) next.carrierCost = Math.max(0, toNumberOrFallback(payload.carrierCost, Number(next.carrierCost || 0)));

  if (payload.originCity !== undefined || payload.originState !== undefined || payload.origin !== undefined) {
    const origin = payload.origin && typeof payload.origin === 'object' ? payload.origin : {};
    next.origin = {
      ...(next.origin || { city: 'Not set', state: '' }),
      city: payload.originCity !== undefined ? String(payload.originCity || '').trim() || 'Not set' : (origin.city !== undefined ? String(origin.city || '').trim() || 'Not set' : (next.origin?.city || 'Not set')),
      state: payload.originState !== undefined ? String(payload.originState || '').trim().toUpperCase() : (origin.state !== undefined ? String(origin.state || '').trim().toUpperCase() : (next.origin?.state || '')),
    };
  }

  if (payload.destinationCity !== undefined || payload.destinationState !== undefined || payload.destination !== undefined) {
    const destination = payload.destination && typeof payload.destination === 'object' ? payload.destination : {};
    next.destination = {
      ...(next.destination || { city: 'Not set', state: '' }),
      city: payload.destinationCity !== undefined ? String(payload.destinationCity || '').trim() || 'Not set' : (destination.city !== undefined ? String(destination.city || '').trim() || 'Not set' : (next.destination?.city || 'Not set')),
      state: payload.destinationState !== undefined ? String(payload.destinationState || '').trim().toUpperCase() : (destination.state !== undefined ? String(destination.state || '').trim().toUpperCase() : (next.destination?.state || '')),
    };
  }

  if (payload.pickupAt !== undefined) {
    next.pickupAt = toIsoOrFallback(payload.pickupAt, next.pickupAt || new Date().toISOString());
  }

  if (payload.deliveryAt !== undefined) {
    next.deliveryAt = toIsoOrFallback(payload.deliveryAt, next.deliveryAt || new Date(Date.now() + 24 * 3600 * 1000).toISOString());
  }

  next.updatedAt = new Date().toISOString();
  return withComputed(next);
}

function resolveCreatedLoadMileage(load, payload = {}) {
  const providedMiles = Number(payload?.miles);
  const laneKey = buildMileageLaneKey(load.origin, load.destination, load.equipment);

  if (Number.isFinite(providedMiles) && providedMiles > 0) {
    return {
      ...load,
      miles: Math.max(1, Math.round(providedMiles)),
      mileage: {
        miles: Math.max(1, Math.round(providedMiles)),
        method: 'route-based',
        confidence: 1,
        laneKey,
        resolvedAt: new Date().toISOString(),
      },
    };
  }

  const resolved = estimateMileage(load.origin, load.destination, load.equipment);
  return {
    ...load,
    miles: Math.max(1, Number(resolved.miles || 0)),
    mileage: {
      miles: Math.max(1, Number(resolved.miles || 0)),
      method: resolved.method,
      confidence: Number(resolved.confidence || 0),
      laneKey: resolved.laneKey || laneKey,
      resolvedAt: new Date().toISOString(),
    },
  };
}

function withComputed(load) {
  const revenue = Number(load.revenue || 0);
  const carrierCost = Number(load.carrierCost || 0);
  const margin = revenue - carrierCost;
  const marginPct = revenue > 0 ? Number(((margin / revenue) * 100).toFixed(1)) : 0;
  return { ...load, revenue, carrierCost, margin, marginPct };
}

function toNumberOrFallback(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toIsoOrFallback(value, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toISOString();
}

function getTabFiltered(items, tab) {
  const normalizedTab = String(tab || '').toLowerCase();
  if (normalizedTab === 'my') return items.filter((l) => l.dispatcher?.id === 'U-9');
  if (normalizedTab === 'uncovered') return items.filter((l) => !l.carrier?.assigned || normalizeLoadStatus(l.status) === 'TENDERED');
  if (normalizedTab === 'delivered') {
    return items.filter((l) => ['DELIVERED', 'POD_RECEIVED', 'INVOICED', 'READY_TO_PAY', 'PAID'].includes(normalizeLoadStatus(l.status)));
  }
  if (normalizedTab === 'void') return items.filter((l) => normalizeLoadStatus(l.status) === 'CANCELLED');
  if (normalizedTab === 'at_risk') {
    return items.filter((l) => {
      const risk = riskByLoad[l.id];
      return normalizeLoadStatus(l.status) === 'EXCEPTION'
        || Number(l.marginPct) < Number(l.targetMarginPct || 12)
        || (risk?.warnings || []).length > 0;
    });
  }
  return items;
}

function matchesText(load, q) {
  const text = String(q || '').trim().toLowerCase();
  if (!text) return true;
  return [
    load.id,
    load.customer?.name,
    load.carrier?.name,
    load.origin?.city,
    load.destination?.city,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(text));
}

function isSoftDeleted(load) {
  return Boolean(load?.deletedAt) || Boolean(load?.archived) || String(load?.status || '').toLowerCase() === 'deleted';
}

router.get('/', async (req, res) => {
  try {
    const {
      tab = 'all',
      q = '',
      status,
      equipment,
      dispatcherId,
      includeDeleted = 'false',
      sort = '-updatedAt',
      page = '1',
      pageSize = '25',
    } = req.query;

    const includeDeletedLoads = String(includeDeleted || '').toLowerCase() === 'true';
    const requestedStatus = status ? normalizeLoadStatus(status) : '';

    // ── Use in-memory store (mirrors frontend mock list behaviour) ──
    let items = loads.map(withComputed);

    // Soft-delete / cancelled filter
    if (!includeDeletedLoads && requestedStatus !== 'CANCELLED') {
      items = items.filter((l) => !isSoftDeleted(l));
    }

    // Status filter
    if (requestedStatus) {
      items = items.filter((l) => normalizeLoadStatus(l.status) === requestedStatus);
    }

    // Equipment filter
    if (equipment) {
      items = items.filter((l) => l.equipment === equipment);
    }

    // Dispatcher filter
    if (dispatcherId) {
      items = items.filter((l) => l.dispatcher?.id === dispatcherId);
    }

    // Tab filter
    items = getTabFiltered(items, tab);

    // Text search (case-insensitive)
    if (q) {
      items = items.filter((l) => matchesText(l, q));
    }

    // Build facets from the full filtered set (before pagination)
    const facets = {
      status: {
        DRAFT: items.filter((l) => normalizeLoadStatus(l.status) === 'DRAFT').length,
        PRE_DISPATCH: items.filter((l) => normalizeLoadStatus(l.status) === 'PRE_DISPATCH').length,
        IN_TRANSIT: items.filter((l) => normalizeLoadStatus(l.status) === 'IN_TRANSIT').length,
        DELIVERED: items.filter((l) => normalizeLoadStatus(l.status) === 'DELIVERED').length,
        EXCEPTION: items.filter((l) => normalizeLoadStatus(l.status) === 'EXCEPTION').length,
        CANCELLED: items.filter((l) => normalizeLoadStatus(l.status) === 'CANCELLED' || Boolean(l.deletedAt)).length,
      },
      equipment: {
        van: items.filter((l) => l.equipment === 'van').length,
        reefer: items.filter((l) => l.equipment === 'reefer').length,
        flatbed: items.filter((l) => l.equipment === 'flatbed').length,
      },
    };

    // Sorting
    const sortKeyRaw = String(sort || '-updatedAt');
    const descending = sortKeyRaw.startsWith('-');
    const sortKey = descending ? sortKeyRaw.slice(1) : sortKeyRaw;
    items.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') return descending ? bv - av : av - bv;
      return descending ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });

    // Pagination
    const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
    const parsedPageSize = Math.min(500, Math.max(1, Number.parseInt(String(pageSize), 10) || 25));
    const total = items.length;
    const start = (parsedPage - 1) * parsedPageSize;
    const paged = items.slice(start, start + parsedPageSize);

    res.json({
      items: paged,
      page: parsedPage,
      pageSize: parsedPageSize,
      total,
      facets,
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'LOADS_FETCH_ERROR', message: err.message } });
  }
});

router.get('/:loadId', async (req, res) => {
  try {
    // Try in-memory first, then MongoDB
    let load = loads.find((l) => l.id === req.params.loadId);
    if (!load) {
      const fromDb = await Load.findOne({ id: req.params.loadId }).lean();
      if (fromDb) {
        load = normalizeStoredLoad(fromDb);
        loads.unshift(load);
      }
    }
    if (!load) {
      return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
    }

    const computed = withComputed(load);
    const laneAverageMarginPct = 15.4;
    const marginDeltaPct = Number(((computed.marginPct || 0) - laneAverageMarginPct).toFixed(1));
    const normalizedStatus = normalizeLoadStatus(computed.status);

    return res.json({
      load: {
        ...computed,
        status: normalizedStatus,
        statusHistory: Array.isArray(computed.statusHistory) ? computed.statusHistory : [],
      },
      laneAverageMarginPct,
      marginDeltaPct,
      controls: deriveControlsForStatus(normalizedStatus),
      loadStatusHistory: Array.isArray(computed.statusHistory) ? computed.statusHistory : [],
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'LOAD_FETCH_ERROR', message: err.message } });
  }
});

router.post('/estimate-mileage', (req, res) => {
  const payload = req.body || {};
  const origin = payload.origin ?? payload.originLocation ?? payload.originText;
  const destination = payload.destination ?? payload.destinationLocation ?? payload.destinationText;
  const equipmentType = payload.equipmentType ?? payload.equipment;

  const estimate = estimateMileage(origin, destination, equipmentType);
  return res.json({
    miles: estimate.miles,
    method: estimate.method,
    confidence: estimate.confidence,
    laneKey: estimate.laneKey,
  });
});

router.get('/:loadId/risk-signals', (req, res) => {
  const risk = riskByLoad[req.params.loadId];
  if (!risk) {
    return res.status(404).json({ error: { code: 'RISK_NOT_FOUND', message: 'Risk signals not found' } });
  }
  return res.json({ risk });
});

router.get('/:loadId/events', async (req, res) => {
  const timelineEvents = eventsByLoad[req.params.loadId] || [];
  const load = await ensureLoadInMemory(req.params.loadId);
  const statusEvents = Array.isArray(load?.statusHistory)
    ? load.statusHistory.map((entry) => ({
      id: entry.id,
      loadId: req.params.loadId,
      type: 'status_transition',
      message: `${formatLoadStatusLabel(entry.fromStatus)} -> ${formatLoadStatusLabel(entry.toStatus)}`,
      actor: { id: entry.userId, name: entry.userId },
      createdAt: entry.createdAt,
      source: entry.source,
    }))
    : [];

  const items = [...statusEvents, ...timelineEvents]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  return res.json({ items, nextCursor: null });
});

router.get('/:loadId/change-history', async (req, res) => {
  try {
    const items = await AuditTrail.find({ entityType: 'load', entityId: req.params.loadId })
      .sort({ createdAt: -1 })
      .limit(250)
      .lean();
    return res.json({ items, total: items.length });
  } catch (err) {
    return res.status(500).json({ error: { code: 'LOAD_CHANGE_HISTORY_ERROR', message: err.message } });
  }
});

router.get('/:loadId/bot-activity', (req, res) => {
  const load = loads.find((item) => item.id === req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const items = botActivityByLoad[req.params.loadId] || [];
  return res.json({ items });
});

router.post('/:loadId/bot-activity', (req, res) => {
  const load = loads.find((item) => item.id === req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const text = String(req.body?.text || '').trim();
  if (!text) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'text is required' } });
  }

  const source = String(req.body?.source || 'dispatch-bot-addon');
  const item = appendBotActivity(req.params.loadId, text, source);
  return res.status(201).json({ item });
});

router.get('/templates/list', (_req, res) => {
  return res.json({ items: loadTemplates });
});

router.post('/templates', (req, res) => {
  const normalized = normalizeTemplatePayload(req.body || {});
  if (!normalized.name) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Template name is required' } });
  }

  const prefix = normalized.source === 'auction' ? 'atpl' : 'tpl';
  const template = {
    id: `${prefix}-${Date.now()}`,
    ...normalized,
  };

  loadTemplates.unshift(template);
  persistStore();
  return res.status(201).json({ template });
});

router.put('/templates/:templateId', (req, res) => {
  const index = loadTemplates.findIndex((template) => template.id === req.params.templateId);
  if (index < 0) {
    return res.status(404).json({ error: { code: 'TEMPLATE_NOT_FOUND', message: 'Template not found' } });
  }

  const normalized = normalizeTemplatePayload({
    ...loadTemplates[index],
    ...(req.body || {}),
    defaults: {
      ...(loadTemplates[index].defaults || {}),
      ...((req.body || {}).defaults || {}),
    },
  });

  loadTemplates[index] = {
    id: loadTemplates[index].id,
    ...normalized,
  };

  persistStore();
  return res.json({ template: loadTemplates[index] });
});

router.delete('/templates/:templateId', (req, res) => {
  const index = loadTemplates.findIndex((template) => template.id === req.params.templateId);
  if (index < 0) {
    return res.status(404).json({ error: { code: 'TEMPLATE_NOT_FOUND', message: 'Template not found' } });
  }

  const [removed] = loadTemplates.splice(index, 1);
  persistStore();
  return res.json({ template: removed, ok: true });
});

router.post('/create', async (req, res) => {
  const payload = req.body || {};
  const validationErrors = validateLoadPayload(payload, { partial: false });
  if (validationErrors.length > 0) {
    return res.status(400).json(buildValidationError(validationErrors));
  }

  const templateId = String(req.body?.templateId || '').trim();
  const template = templateId
    ? loadTemplates.find((row) => row.id === templateId)
    : {
      id: null,
      name: 'Manual Load',
      customer: 'Not set',
      defaults: {
        equipment: req.body?.equipment || 'van',
        miles: req.body?.miles || 0,
        revenue: req.body?.revenue || 0,
        carrierCost: req.body?.carrierCost || 0,
        origin: req.body?.origin || { city: 'Not set', state: '' },
        destination: req.body?.destination || { city: 'Not set', state: '' },
      },
    };

  if (templateId && !template) {
    return res.status(404).json({ error: { code: 'TEMPLATE_NOT_FOUND', message: 'Template not found' } });
  }

  const load = applyCreateOverrides(buildLoadFromTemplate(template), payload);
  const resolvedLoad = resolveCreatedLoadMileage(load, payload);
  const normalizedLoad = normalizeStoredLoad(withComputed(resolvedLoad));

  const persisted = await syncLoadToDatabase(normalizedLoad);
  loads.unshift(persisted);
  appendEvent(persisted.id, 'load_created', templateId ? `Load created from template ${template?.name}` : 'Manual load created');
  await logLoadAudit({
    loadId: persisted.id,
    action: 'load.created',
    actor: getActor(payload, req),
    before: null,
    after: persisted,
    metadata: { templateId: templateId || null },
  });

  return res.status(201).json({ load: persisted });
});

router.post('/create-batch', async (req, res) => {
  const countRaw = Number.parseInt(String(req.body?.count || 0), 10);
  const count = Math.min(50, Math.max(1, Number.isFinite(countRaw) ? countRaw : 0));
  if (!count || count < 1) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'count must be between 1 and 50' } });
  }

  const templateId = String(req.body?.templateId || '').trim();
  const template = templateId
    ? loadTemplates.find((row) => row.id === templateId)
    : {
      id: null,
      name: 'Manual Load',
      customer: 'Not set',
      defaults: {
        equipment: req.body?.equipment || 'van',
        miles: req.body?.miles || 0,
        revenue: req.body?.revenue || 0,
        carrierCost: req.body?.carrierCost || 0,
        origin: req.body?.origin || { city: req.body?.originCity || 'Not set', state: req.body?.originState || '' },
        destination: req.body?.destination || { city: req.body?.destinationCity || 'Not set', state: req.body?.destinationState || '' },
      },
    };

  if (templateId && !template) {
    return res.status(404).json({ error: { code: 'TEMPLATE_NOT_FOUND', message: 'Template not found' } });
  }

  const created = [];
  for (let index = 0; index < count; index += 1) {
    const baseLoad = buildLoadFromTemplate(template);
    const shiftedPickup = new Date(Date.now() + ((index + 1) * 60 * 60 * 1000)).toISOString();
    const shiftedDelivery = new Date(Date.now() + ((index + 25) * 60 * 60 * 1000)).toISOString();
    const load = applyCreateOverrides(baseLoad, {
      ...(req.body || {}),
      pickupAt: req.body?.pickupAt || shiftedPickup,
      deliveryAt: req.body?.deliveryAt || shiftedDelivery,
    });

    const validationErrors = validateLoadPayload(load, { partial: false });
    if (validationErrors.length > 0) {
      return res.status(400).json(buildValidationError(validationErrors));
    }

    const resolvedLoad = resolveCreatedLoadMileage(load, req.body || {});
    const normalizedLoad = normalizeStoredLoad(withComputed(resolvedLoad));

    const persisted = await syncLoadToDatabase(normalizedLoad);
    loads.unshift(persisted);
    created.push(persisted);
    appendEvent(normalizedLoad.id, 'load_created', count > 1
      ? `Load created in batch (${index + 1}/${count})`
      : (templateId ? `Load created from template ${template?.name}` : 'Manual load created'));
    await logLoadAudit({
      loadId: persisted.id,
      action: 'load.created_batch',
      actor: getActor(req.body || {}, req),
      before: null,
      after: persisted,
      metadata: { templateId: templateId || null, batchIndex: index + 1, batchCount: count },
    });
  }

  persistStore();
  return res.status(201).json({ count: created.length, loads: created });
});

router.put('/:loadId', async (req, res) => {
  const payload = req.body || {};
  const load = await ensureLoadInMemory(req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);
  const before = structuredClone(normalizedLoad);
  const validationErrors = validateLoadPayload(payload, { partial: true });
  if (validationErrors.length > 0) {
    return res.status(400).json(buildValidationError(validationErrors));
  }

  if (
    payload.customerName !== undefined
    && String(payload.customerName || '').trim().length === 0
  ) {
    return res.status(400).json(buildValidationError([{ field: 'customerName', message: 'customerName cannot be blank' }]));
  }
  if (payload.status) {
    const fromStatus = normalizeLoadStatus(normalizedLoad.status);
    const targetStatus = normalizeLoadStatus(payload.status);
    if (!canTransitionStatus(fromStatus, targetStatus, { overrideRolePermission: payload.overrideRolePermission })) {
      return res.status(422).json({
        error: {
          code: 'ILLEGAL_STATUS_TRANSITION',
          message: `Illegal transition ${formatLoadStatusLabel(fromStatus)} -> ${formatLoadStatusLabel(targetStatus)}.`,
          details: {
            fromStatus,
            toStatus: targetStatus,
          },
        },
      });
    }
    appendStatusHistory(normalizedLoad, targetStatus, payload, payload.source || 'manual-update');
  }

  if (payload.customerName !== undefined) {
    const customerName = String(payload.customerName || '').trim();
    normalizedLoad.customer = {
      ...(normalizedLoad.customer || { id: null }),
      name: customerName || '—',
    };
  }

  if (payload.carrierName !== undefined || payload.carrierId !== undefined || payload.carrierAssigned !== undefined) {
    const existingCarrier = normalizedLoad.carrier || { id: null, name: '—', assigned: false };
    const carrierName = payload.carrierName !== undefined ? String(payload.carrierName || '').trim() : existingCarrier.name;
    const carrierId = payload.carrierId !== undefined ? String(payload.carrierId || '').trim() : existingCarrier.id;
    const carrierAssigned = payload.carrierAssigned !== undefined
      ? Boolean(payload.carrierAssigned)
      : Boolean(carrierId || carrierName);

    normalizedLoad.carrier = {
      id: carrierId || null,
      name: carrierName || '—',
      assigned: carrierAssigned,
    };
  }

  if (payload.dispatcherName !== undefined || payload.dispatcherId !== undefined) {
    const existingDispatcher = normalizedLoad.dispatcher || { id: 'U-9', name: 'Dispatcher' };
    normalizedLoad.dispatcher = {
      id: payload.dispatcherId !== undefined ? String(payload.dispatcherId || '').trim() || existingDispatcher.id : existingDispatcher.id,
      name: payload.dispatcherName !== undefined ? String(payload.dispatcherName || '').trim() || existingDispatcher.name : existingDispatcher.name,
    };
  }

  if (payload.equipment !== undefined) {
    normalizedLoad.equipment = String(payload.equipment || '').trim() || normalizedLoad.equipment || 'van';
  }

  if (payload.miles !== undefined) {
    normalizedLoad.miles = Math.max(0, toNumberOrFallback(payload.miles, Number(normalizedLoad.miles || 0)));
  }

  if (payload.revenue !== undefined) {
    normalizedLoad.revenue = Math.max(0, toNumberOrFallback(payload.revenue, Number(normalizedLoad.revenue || 0)));
  }

  if (payload.carrierCost !== undefined) {
    normalizedLoad.carrierCost = Math.max(0, toNumberOrFallback(payload.carrierCost, Number(normalizedLoad.carrierCost || 0)));
  }

  if (payload.originCity !== undefined || payload.originState !== undefined) {
    normalizedLoad.origin = {
      ...(normalizedLoad.origin || { city: '—', state: '' }),
      city: payload.originCity !== undefined ? String(payload.originCity || '').trim() || '—' : (normalizedLoad.origin?.city || '—'),
      state: payload.originState !== undefined ? String(payload.originState || '').trim().toUpperCase() : (normalizedLoad.origin?.state || ''),
    };
  }

  if (payload.destinationCity !== undefined || payload.destinationState !== undefined) {
    normalizedLoad.destination = {
      ...(normalizedLoad.destination || { city: '—', state: '' }),
      city: payload.destinationCity !== undefined ? String(payload.destinationCity || '').trim() || '—' : (normalizedLoad.destination?.city || '—'),
      state: payload.destinationState !== undefined ? String(payload.destinationState || '').trim().toUpperCase() : (normalizedLoad.destination?.state || ''),
    };
  }

  if (payload.pickupAt !== undefined) {
    normalizedLoad.pickupAt = toIsoOrFallback(payload.pickupAt, normalizedLoad.pickupAt || new Date().toISOString());
  }

  if (payload.deliveryAt !== undefined) {
    normalizedLoad.deliveryAt = toIsoOrFallback(payload.deliveryAt, normalizedLoad.deliveryAt || new Date().toISOString());
  }

  normalizedLoad.updatedAt = new Date().toISOString();
  const computed = withComputed(normalizedLoad);
  Object.assign(load, normalizeStoredLoad(computed));

  const persisted = await syncLoadToDatabase(load);
  Object.assign(load, persisted);

  appendEvent(load.id, 'load_updated', 'Load fields updated from command center');
  await logLoadAudit({
    loadId: load.id,
    action: 'load.updated',
    actor: getActor(payload, req),
    before,
    after: persisted,
    metadata: { source: payload.source || 'manual-update' },
  });
  persistStore();

  return res.json({
    load: {
      ...persisted,
      status: normalizeLoadStatus(persisted.status),
      statusHistory: Array.isArray(persisted.statusHistory) ? persisted.statusHistory : createInitialStatusHistory(persisted.status),
    },
  });
});

router.delete('/:loadId', async (req, res) => {
  const load = await ensureLoadInMemory(req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);
  const before = structuredClone(normalizedLoad);
  const alreadyDeleted = isSoftDeleted(normalizedLoad);

  appendStatusHistory(normalizedLoad, 'CANCELLED', { reason: 'Load archived', userId: 'system' }, 'load-delete');
  normalizedLoad.deletedAt = normalizedLoad.deletedAt || new Date().toISOString();
  normalizedLoad.archived = true;
  normalizedLoad.updatedAt = new Date().toISOString();

  if (normalizedLoad.carrier) {
    normalizedLoad.carrier = {
      ...normalizedLoad.carrier,
      assigned: false,
    };
  }

  Object.assign(load, normalizeStoredLoad(withComputed(normalizedLoad)));
  const persisted = await syncLoadToDatabase(load);
  Object.assign(load, persisted);

  appendEvent(load.id, 'load_deleted', alreadyDeleted ? 'Load delete requested again' : 'Load soft-deleted and archived');
  await logLoadAudit({
    loadId: load.id,
    action: 'load.archived',
    actor: getActor(req.body || {}, req),
    before,
    after: persisted,
    metadata: { alreadyDeleted },
  });

  persistStore();
  return res.json({ ok: true, load: withComputed(load), archived: true });
});

router.post('/:loadId/dispatch', async (req, res) => {
  const load = await ensureLoadInMemory(req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);
  const before = structuredClone(normalizedLoad);

  const carrierId = String(req.body?.carrierId || '').trim();
  if (!carrierId) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'carrierId is required',
      },
    });
  }

  const computed = withComputed(normalizedLoad);
  const minMarginPct = Number(normalizedLoad.targetMarginPct || 12);
  if (computed.marginPct < minMarginPct) {
    return res.status(422).json({
      error: {
        code: 'MARGIN_BELOW_THRESHOLD',
        message: `Margin ${computed.marginPct}% is below required ${minMarginPct}%`,
        details: { required: minMarginPct, actual: computed.marginPct },
      },
    });
  }

  normalizedLoad.carrier = { id: carrierId, name: req.body?.carrierName || 'Assigned Carrier', assigned: true };
  const transitionResult = transitionLoadToStatus(normalizedLoad, 'DISPATCHED', req.body || {}, 'dispatch');
  if (transitionResult?.error) {
    return res.status(422).json({ error: transitionResult.error });
  }
  normalizedLoad.updatedAt = new Date().toISOString();

  Object.assign(load, normalizeStoredLoad(withComputed(normalizedLoad)));
  const persisted = await syncLoadToDatabase(load);
  Object.assign(load, persisted);

  appendEvent(load.id, 'load_dispatched', `Load dispatched to carrier ${load.carrier.name}`);
  await logLoadAudit({
    loadId: load.id,
    action: 'load.dispatched',
    actor: getActor(req.body || {}, req),
    before,
    after: persisted,
    metadata: { carrierId, carrierName: persisted?.carrier?.name || '' },
  });
  persistStore();

  return res.json({
    load: withComputed(load),
    dispatch: {
      status: 'dispatched',
      dispatchedAt: new Date().toISOString(),
    },
  });
});

router.post('/:loadId/reassign', async (req, res) => {
  const load = await ensureLoadInMemory(req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);
  const before = structuredClone(normalizedLoad);

  const carrierId = String(req.body?.carrierId || '').trim();
  if (!carrierId) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'carrierId is required' } });
  }

  normalizedLoad.carrier = { id: carrierId, name: req.body?.carrierName || 'Reassigned Carrier', assigned: true };
  if (normalizeLoadStatus(normalizedLoad.status) === 'TENDERED') {
    appendStatusHistory(normalizedLoad, 'CARRIER_ASSIGNED', req.body || {}, 'carrier-reassign');
  }
  normalizedLoad.updatedAt = new Date().toISOString();
  Object.assign(load, normalizeStoredLoad(withComputed(normalizedLoad)));
  const persisted = await syncLoadToDatabase(load);
  Object.assign(load, persisted);
  appendEvent(load.id, 'carrier_reassigned', `Carrier reassigned to ${load.carrier.name}`);
  await logLoadAudit({
    loadId: load.id,
    action: 'load.carrier_reassigned',
    actor: getActor(req.body || {}, req),
    before,
    after: persisted,
    metadata: { carrierId, carrierName: persisted?.carrier?.name || '' },
  });
  persistStore();

  return res.json({ load: withComputed(persisted) });
});

router.post('/:loadId/send-to-bid-network', async (req, res) => {
  const load = await ensureLoadInMemory(req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);
  const before = structuredClone(normalizedLoad);
  const transitionResult = transitionLoadToStatus(normalizedLoad, 'TENDERED', req.body || {}, 'send-to-bid-network');
  if (transitionResult?.error) {
    return res.status(422).json({ error: transitionResult.error });
  }
  normalizedLoad.updatedAt = new Date().toISOString();
  Object.assign(load, normalizeStoredLoad(withComputed(normalizedLoad)));
  const persisted = await syncLoadToDatabase(load);
  Object.assign(load, persisted);

  const requestId = `BN-${Date.now()}`;
  appendEvent(load.id, 'sent_to_bid_network', `Sent to ${req.body?.network || 'internal'} bid network`);
  await logLoadAudit({
    loadId: load.id,
    action: 'load.sent_to_bid_network',
    actor: getActor(req.body || {}, req),
    before,
    after: persisted,
    metadata: { network: req.body?.network || 'internal', requestId },
  });
  persistStore();

  return res.status(202).json({ requestId, status: 'queued' });
});

// ─── Carrier Bid Tracking ───────────────────────────────────────────────────

const bidsByLoad = {};

router.get('/:loadId/bids', async (req, res) => {
  const loadId = req.params.loadId;
  const bids = bidsByLoad[loadId] || [];
  return res.json({ items: bids });
});

router.post('/:loadId/bids', async (req, res) => {
  const load = await ensureLoadInMemory(req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const body = req.body || {};
  const carrierName = String(body.carrierName || '').trim();
  const amount = Number(body.amount);
  if (!carrierName) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'carrierName is required' } });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'amount must be a positive number' } });
  }

  const bid = {
    id: `BID-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    loadId: load.id,
    carrierName,
    carrierId: String(body.carrierId || '').trim() || null,
    mcNumber: String(body.mcNumber || '').trim() || null,
    amount,
    transitDays: Number.isFinite(Number(body.transitDays)) ? Number(body.transitDays) : null,
    equipment: String(body.equipment || '').trim() || null,
    notes: String(body.notes || '').trim() || '',
    bidderRole: String(body.bidderRole || 'carrier_rep').trim(),
    bidderName: String(body.bidderName || '').trim() || getActor(body, req),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!bidsByLoad[load.id]) bidsByLoad[load.id] = [];
  bidsByLoad[load.id].unshift(bid);

  appendEvent(load.id, 'carrier_bid_placed', `Carrier bid $${amount.toLocaleString()} by ${carrierName} (${bid.bidderRole})`);
  persistStore();

  return res.status(201).json({ bid });
});

router.put('/:loadId/bids/:bidId/accept', async (req, res) => {
  const load = await ensureLoadInMemory(req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const bids = bidsByLoad[load.id] || [];
  const bid = bids.find(b => b.id === req.params.bidId);
  if (!bid) {
    return res.status(404).json({ error: { code: 'BID_NOT_FOUND', message: 'Bid not found' } });
  }

  // Mark this bid accepted, all others declined
  for (const b of bids) {
    if (b.id === bid.id) {
      b.status = 'accepted';
      b.updatedAt = new Date().toISOString();
    } else if (b.status === 'pending') {
      b.status = 'declined';
      b.updatedAt = new Date().toISOString();
    }
  }

  // Assign carrier to load
  const normalizedLoad = normalizeStoredLoad(load);
  normalizedLoad.carrier = {
    id: bid.carrierId || bid.carrierName,
    name: bid.carrierName,
    assigned: true,
  };
  normalizedLoad.carrierCost = bid.amount;
  normalizedLoad.updatedAt = new Date().toISOString();
  Object.assign(load, normalizeStoredLoad(withComputed(normalizedLoad)));
  const persisted = await syncLoadToDatabase(load);
  Object.assign(load, persisted);

  appendEvent(load.id, 'carrier_bid_accepted', `Accepted bid $${bid.amount.toLocaleString()} from ${bid.carrierName}`);
  persistStore();

  return res.json({ bid, load: withComputed(persisted) });
});

router.put('/:loadId/bids/:bidId/decline', async (req, res) => {
  const loadId = req.params.loadId;
  const bids = bidsByLoad[loadId] || [];
  const bid = bids.find(b => b.id === req.params.bidId);
  if (!bid) {
    return res.status(404).json({ error: { code: 'BID_NOT_FOUND', message: 'Bid not found' } });
  }
  bid.status = 'declined';
  bid.updatedAt = new Date().toISOString();

  appendEvent(loadId, 'carrier_bid_declined', `Declined bid $${bid.amount.toLocaleString()} from ${bid.carrierName}`);
  persistStore();

  return res.json({ bid });
});

router.post('/:loadId/mark-delivered', async (req, res) => {
  const load = await ensureLoadInMemory(req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);
  const before = structuredClone(normalizedLoad);
  const transitionResult = transitionLoadToStatus(normalizedLoad, 'DELIVERED', req.body || {}, 'mark-delivered');
  if (transitionResult?.error) {
    return res.status(422).json({ error: transitionResult.error });
  }

  normalizedLoad.deliveryAt = req.body?.deliveredAt || new Date().toISOString();
  normalizedLoad.updatedAt = new Date().toISOString();
  Object.assign(load, normalizeStoredLoad(withComputed(normalizedLoad)));
  const persisted = await syncLoadToDatabase(load);
  Object.assign(load, persisted);

  appendEvent(load.id, 'load_delivered', 'Load marked as delivered');
  await logLoadAudit({
    loadId: load.id,
    action: 'load.marked_delivered',
    actor: getActor(req.body || {}, req),
    before,
    after: persisted,
    metadata: { deliveredAt: normalizedLoad.deliveryAt },
  });
  persistStore();

  return res.json({ load: withComputed(persisted) });
});

router.post('/:loadId/void', async (req, res) => {
  const load = await ensureLoadInMemory(req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);
  const before = structuredClone(normalizedLoad);
  const transitionResult = transitionLoadToStatus(normalizedLoad, 'CANCELLED', req.body || {}, 'void-load');
  if (transitionResult?.error) {
    return res.status(422).json({ error: transitionResult.error });
  }

  normalizedLoad.carrier = { id: null, name: 'Pending', assigned: false };
  normalizedLoad.updatedAt = new Date().toISOString();
  Object.assign(load, normalizeStoredLoad(withComputed(normalizedLoad)));
  const persisted = await syncLoadToDatabase(load);
  Object.assign(load, persisted);

  appendEvent(load.id, 'load_voided', req.body?.reason ? `Load voided: ${req.body.reason}` : 'Load voided');
  await logLoadAudit({
    loadId: load.id,
    action: 'load.voided',
    actor: getActor(req.body || {}, req),
    before,
    after: persisted,
    metadata: { reason: req.body?.reason || '' },
  });
  persistStore();

  return res.json({ load: withComputed(persisted) });
});

router.post('/:loadId/restore', async (req, res) => {
  const load = await ensureLoadInMemory(req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);
  const before = structuredClone(normalizedLoad);

  if (!isSoftDeleted(normalizedLoad)) {
    return res.json({ load: withComputed(normalizedLoad), restored: false, message: 'Load is not archived' });
  }

  appendStatusHistory(normalizedLoad, 'DRAFT', req.body || {}, 'restore-load');
  delete normalizedLoad.deletedAt;
  delete normalizedLoad.archived;
  normalizedLoad.updatedAt = new Date().toISOString();
  Object.assign(load, normalizeStoredLoad(withComputed(normalizedLoad)));
  const persisted = await syncLoadToDatabase(load);
  Object.assign(load, persisted);

  appendEvent(load.id, 'load_restored', 'Load restored from archived status');
  await logLoadAudit({
    loadId: load.id,
    action: 'load.restored',
    actor: getActor(req.body || {}, req),
    before,
    after: persisted,
    metadata: {},
  });
  persistStore();

  return res.json({ load: withComputed(persisted), restored: true });
});

// Helper to generate a new load ID
function generateLoadId(source, loadType) {
  const prefix = source === 'auction' ? 'AL' : (loadType === 'ancillary' || source === 'ancillary') ? 'AX' : 'L';
  return prefix + '-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
}

// CREATE a new load
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) {
      data.id = generateLoadId(data.source, data.loadType);
    }
    const load = new Load(data);
    await load.save();
    res.status(201).json({ load });
  } catch (err) {
    res.status(500).json({ error: { code: 'LOAD_CREATE_ERROR', message: err.message } });
  }
});

// UPDATE a load
router.put('/:loadId', async (req, res) => {
  try {
    const updated = await Load.findOneAndUpdate(
      { id: req.params.loadId },
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
    }
    res.json({ load: updated });
  } catch (err) {
    res.status(500).json({ error: { code: 'LOAD_UPDATE_ERROR', message: err.message } });
  }
});

// DELETE a load (soft delete)
router.delete('/:loadId', async (req, res) => {
  try {
    const deleted = await Load.findOneAndUpdate(
      { id: req.params.loadId },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!deleted) {
      return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
    }
    res.json({ load: deleted });
  } catch (err) {
    res.status(500).json({ error: { code: 'LOAD_DELETE_ERROR', message: err.message } });
  }
});

export default router;
