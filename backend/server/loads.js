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
import { Load } from './models.js';
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
  } catch (err) {
    console.error('[loads] Failed to hydrate persisted store:', err.message);
  }
}

hydrateStore();
loads = loads.map(normalizeStoredLoad);

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
  const nextId = generateLoadId();
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
      pageSize = '50',
    } = req.query;

    const includeDeletedLoads = String(includeDeleted || '').toLowerCase() === 'true';
    const requestedStatus = status ? normalizeLoadStatus(status) : '';

    // Build MongoDB query
    const query = {};
    if (!includeDeletedLoads && requestedStatus !== 'CANCELLED') {
      query.deletedAt = { $exists: false };
    }
    if (status) {
      query.status = requestedStatus;
    }
    if (equipment) {
      query.equipment = equipment;
    }
    if (dispatcherId) {
      query['dispatcher.id'] = dispatcherId;
    }
    if (q) {
      query.$or = [
        { 'customer.name': { $regex: q, $options: 'i' } },
        { 'carrier.name': { $regex: q, $options: 'i' } },
        { 'origin.city': { $regex: q, $options: 'i' } },
        { 'destination.city': { $regex: q, $options: 'i' } },
      ];
    }

    const sortKeyRaw = String(sort || '-updatedAt');
    const descending = sortKeyRaw.startsWith('-');
    const sortKey = descending ? sortKeyRaw.slice(1) : sortKeyRaw;
    const sortObj = {};
    sortObj[sortKey] = descending ? -1 : 1;

    const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
    const parsedPageSize = Math.min(100, Math.max(1, Number.parseInt(String(pageSize), 10) || 50));

    const total = await Load.countDocuments(query);
    const items = await Load.find(query)
      .sort(sortObj)
      .skip((parsedPage - 1) * parsedPageSize)
      .limit(parsedPageSize)
      .lean();

    // Compute facets
    const allItems = await Load.find(query).lean();
    const facets = {
      status: {
        DRAFT: allItems.filter((i) => normalizeLoadStatus(i.status) === 'DRAFT').length,
        PRE_DISPATCH: allItems.filter((i) => normalizeLoadStatus(i.status) === 'PRE_DISPATCH').length,
        IN_TRANSIT: allItems.filter((i) => normalizeLoadStatus(i.status) === 'IN_TRANSIT').length,
        DELIVERED: allItems.filter((i) => normalizeLoadStatus(i.status) === 'DELIVERED').length,
        EXCEPTION: allItems.filter((i) => normalizeLoadStatus(i.status) === 'EXCEPTION').length,
        CANCELLED: allItems.filter((i) => normalizeLoadStatus(i.status) === 'CANCELLED' || Boolean(i.deletedAt)).length,
      },
      equipment: {
        van: allItems.filter((i) => i.equipment === 'van').length,
        reefer: allItems.filter((i) => i.equipment === 'reefer').length,
        flatbed: allItems.filter((i) => i.equipment === 'flatbed').length,
      },
    };

    res.json({
      items,
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
    const load = await Load.findOne({ id: req.params.loadId }).lean();
    if (!load) {
      return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
    }

    // You may want to add computed fields here as in the original code
    const laneAverageMarginPct = 15.4;
    const marginDeltaPct = Number((load.marginPct - laneAverageMarginPct).toFixed(1));
    const normalizedStatus = normalizeLoadStatus(load.status);

    return res.json({
      load: {
        ...load,
        status: normalizedStatus,
        statusHistory: Array.isArray(load.statusHistory) ? load.statusHistory : [],
      },
      laneAverageMarginPct,
      marginDeltaPct,
      controls: deriveControlsForStatus(normalizedStatus),
      loadStatusHistory: Array.isArray(load.statusHistory) ? load.statusHistory : [],
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

router.get('/:loadId/events', (req, res) => {
  const timelineEvents = eventsByLoad[req.params.loadId] || [];
  const load = loads.find((item) => item.id === req.params.loadId);
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

  const template = {
    id: `tpl-${Date.now()}`,
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

router.post('/create', (req, res) => {
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

  const load = applyCreateOverrides(buildLoadFromTemplate(template), req.body || {});
  const resolvedLoad = resolveCreatedLoadMileage(load, req.body || {});
  const normalizedLoad = normalizeStoredLoad(withComputed(resolvedLoad));

  loads.unshift(normalizedLoad);
  appendEvent(normalizedLoad.id, 'load_created', templateId ? `Load created from template ${template?.name}` : 'Manual load created');

  return res.status(201).json({ load: normalizedLoad });
});

router.post('/create-batch', (req, res) => {
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
    const resolvedLoad = resolveCreatedLoadMileage(load, req.body || {});
    const normalizedLoad = normalizeStoredLoad(withComputed(resolvedLoad));

    loads.unshift(normalizedLoad);
    created.push(normalizedLoad);
    appendEvent(normalizedLoad.id, 'load_created', count > 1
      ? `Load created in batch (${index + 1}/${count})`
      : (templateId ? `Load created from template ${template?.name}` : 'Manual load created'));
  }

  persistStore();
  return res.status(201).json({ count: created.length, loads: created });
});

router.put('/:loadId', (req, res) => {
  const load = loads.find((item) => item.id === req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);

  const payload = req.body || {};
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

  appendEvent(load.id, 'load_updated', 'Load fields updated from command center');
  persistStore();

  return res.json({
    load: {
      ...computed,
      status: normalizeLoadStatus(computed.status),
      statusHistory: Array.isArray(computed.statusHistory) ? computed.statusHistory : createInitialStatusHistory(computed.status),
    },
  });
});

router.delete('/:loadId', (req, res) => {
  const load = loads.find((item) => item.id === req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);
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

  appendEvent(load.id, 'load_deleted', alreadyDeleted ? 'Load delete requested again' : 'Load soft-deleted and archived');

  persistStore();
  return res.json({ ok: true, load: withComputed(load), archived: true });
});

router.post('/:loadId/dispatch', (req, res) => {
  const load = loads.find((item) => item.id === req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);

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

  appendEvent(load.id, 'load_dispatched', `Load dispatched to carrier ${load.carrier.name}`);
  persistStore();

  return res.json({
    load: withComputed(load),
    dispatch: {
      status: 'dispatched',
      dispatchedAt: new Date().toISOString(),
    },
  });
});

router.post('/:loadId/reassign', (req, res) => {
  const load = loads.find((item) => item.id === req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);

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
  appendEvent(load.id, 'carrier_reassigned', `Carrier reassigned to ${load.carrier.name}`);
  persistStore();

  return res.json({ load: withComputed(load) });
});

router.post('/:loadId/send-to-bid-network', (req, res) => {
  const load = loads.find((item) => item.id === req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);
  const transitionResult = transitionLoadToStatus(normalizedLoad, 'TENDERED', req.body || {}, 'send-to-bid-network');
  if (transitionResult?.error) {
    return res.status(422).json({ error: transitionResult.error });
  }
  normalizedLoad.updatedAt = new Date().toISOString();
  Object.assign(load, normalizeStoredLoad(withComputed(normalizedLoad)));

  const requestId = `BN-${Date.now()}`;
  appendEvent(load.id, 'sent_to_bid_network', `Sent to ${req.body?.network || 'internal'} bid network`);
  persistStore();

  return res.status(202).json({ requestId, status: 'queued' });
});

router.post('/:loadId/mark-delivered', (req, res) => {
  const load = loads.find((item) => item.id === req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);
  const transitionResult = transitionLoadToStatus(normalizedLoad, 'DELIVERED', req.body || {}, 'mark-delivered');
  if (transitionResult?.error) {
    return res.status(422).json({ error: transitionResult.error });
  }

  normalizedLoad.deliveryAt = req.body?.deliveredAt || new Date().toISOString();
  normalizedLoad.updatedAt = new Date().toISOString();
  Object.assign(load, normalizeStoredLoad(withComputed(normalizedLoad)));

  appendEvent(load.id, 'load_delivered', 'Load marked as delivered');
  persistStore();

  return res.json({ load: withComputed(load) });
});

router.post('/:loadId/void', (req, res) => {
  const load = loads.find((item) => item.id === req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);
  const transitionResult = transitionLoadToStatus(normalizedLoad, 'CANCELLED', req.body || {}, 'void-load');
  if (transitionResult?.error) {
    return res.status(422).json({ error: transitionResult.error });
  }

  normalizedLoad.carrier = { id: null, name: 'Pending', assigned: false };
  normalizedLoad.updatedAt = new Date().toISOString();
  Object.assign(load, normalizeStoredLoad(withComputed(normalizedLoad)));

  appendEvent(load.id, 'load_voided', req.body?.reason ? `Load voided: ${req.body.reason}` : 'Load voided');
  persistStore();

  return res.json({ load: withComputed(load) });
});

router.post('/:loadId/restore', (req, res) => {
  const load = loads.find((item) => item.id === req.params.loadId);
  if (!load) {
    return res.status(404).json({ error: { code: 'LOAD_NOT_FOUND', message: 'Load not found' } });
  }

  const normalizedLoad = normalizeStoredLoad(load);

  if (!isSoftDeleted(normalizedLoad)) {
    return res.json({ load: withComputed(normalizedLoad), restored: false, message: 'Load is not archived' });
  }

  appendStatusHistory(normalizedLoad, 'DRAFT', req.body || {}, 'restore-load');
  delete normalizedLoad.deletedAt;
  delete normalizedLoad.archived;
  normalizedLoad.updatedAt = new Date().toISOString();
  Object.assign(load, normalizeStoredLoad(withComputed(normalizedLoad)));

  appendEvent(load.id, 'load_restored', 'Load restored from archived status');
  persistStore();

  return res.json({ load: withComputed(load), restored: true });
});

// Helper to generate a new load ID
function generateLoadId() {
  return 'L-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
}

// CREATE a new load
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) {
      data.id = generateLoadId();
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
