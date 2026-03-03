import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const STARTING_CREDITS = Number(process.env.TRACKER_START_CREDITS || 10000);
let remainingCredits = Number.isFinite(STARTING_CREDITS) ? STARTING_CREDITS : 10000;

const STORE_DIR = path.join(process.cwd(), 'server', 'data');
const STORE_FILE = path.join(STORE_DIR, 'tracker-store.json');

const trackerEvents = [];
const positionsByPhone = new Map();
let loadTrackingById = {};

const BASE_ROUTE = [
  { x: 8, y: 78 },
  { x: 14, y: 74 },
  { x: 21, y: 71 },
  { x: 27, y: 66 },
  { x: 33, y: 63 },
  { x: 39, y: 60 },
  { x: 46, y: 57 },
  { x: 52, y: 54 },
  { x: 59, y: 50 },
  { x: 65, y: 46 },
  { x: 71, y: 42 },
  { x: 77, y: 37 },
  { x: 84, y: 31 },
  { x: 90, y: 25 },
  { x: 96, y: 18 },
];

function normalizePhone(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

function nowIso() {
  return new Date().toISOString();
}

function interpolateRoute(points, stepsPerSegment = 4) {
  const route = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    for (let step = 0; step < stepsPerSegment; step += 1) {
      const t = step / stepsPerSegment;
      route.push({
        x: Number((start.x + ((end.x - start.x) * t)).toFixed(2)),
        y: Number((start.y + ((end.y - start.y) * t)).toFixed(2)),
      });
    }
  }
  route.push(points[points.length - 1]);
  return route;
}

function persistStore() {
  try {
    if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
    fs.writeFileSync(
      STORE_FILE,
      JSON.stringify({
        remainingCredits,
        trackerEvents,
        positionsByPhone: Object.fromEntries(positionsByPhone.entries()),
        loadTrackingById,
        updatedAt: nowIso(),
      }, null, 2),
      'utf8'
    );
  } catch (err) {
    console.error('[tracker] Failed to persist store:', err.message);
  }
}

function hydrateStore() {
  try {
    if (!fs.existsSync(STORE_FILE)) return;
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    if (!raw.trim()) return;
    const parsed = JSON.parse(raw);

    if (Number.isFinite(Number(parsed?.remainingCredits))) {
      remainingCredits = Number(parsed.remainingCredits);
    }

    if (Array.isArray(parsed?.trackerEvents)) {
      trackerEvents.splice(0, trackerEvents.length, ...parsed.trackerEvents);
    }

    if (parsed?.positionsByPhone && typeof parsed.positionsByPhone === 'object') {
      Object.entries(parsed.positionsByPhone).forEach(([phone, rows]) => {
        if (Array.isArray(rows)) positionsByPhone.set(phone, rows);
      });
    }

    if (parsed?.loadTrackingById && typeof parsed.loadTrackingById === 'object') {
      loadTrackingById = parsed.loadTrackingById;
    }
  } catch (err) {
    console.error('[tracker] Failed to hydrate store:', err.message);
  }
}

hydrateStore();

function generatePosition(phone) {
  const seed = Number(phone.slice(-4) || 0);
  const lat = 30 + ((seed % 700) / 100);
  const lng = -120 + ((seed % 1200) / 100);
  return {
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
    timestamp: nowIso(),
  };
}

function pushEvent(event) {
  trackerEvents.push(event);
  if (trackerEvents.length > 300) {
    trackerEvents.shift();
  }
  persistStore();
}

function normalizeLoadId(value) {
  return String(value || '').trim();
}

function upsertLoadTracking(loadId, patch = {}) {
  const route = interpolateRoute(BASE_ROUTE, 4);
  const current = loadTrackingById[loadId] || {
    loadId,
    driverName: '',
    driverPhone: '',
    outgoingMessage: '',
    oneTimePing: false,
    pingInterval: 15,
    active: false,
    route,
    routeIndex: 0,
    breadcrumbs: [route[0]],
    events: [],
    updatedAt: nowIso(),
    createdAt: nowIso(),
  };

  const next = {
    ...current,
    ...patch,
    route,
    updatedAt: nowIso(),
  };

  if (!Array.isArray(next.breadcrumbs) || next.breadcrumbs.length === 0) {
    next.breadcrumbs = [route[0]];
  }
  if (!Array.isArray(next.events)) {
    next.events = [];
  }

  loadTrackingById[loadId] = next;
  persistStore();
  return next;
}

function appendLoadEvent(loadId, text, type = 'tracking_event') {
  const tracking = upsertLoadTracking(loadId);
  const entry = {
    id: `trk-load-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    text: String(text || '').trim(),
    timestamp: nowIso(),
  };
  tracking.events = [entry, ...(tracking.events || [])].slice(0, 50);
  loadTrackingById[loadId] = tracking;
  persistStore();
  return entry;
}

function stepLoadBreadcrumb(loadId) {
  const tracking = upsertLoadTracking(loadId);
  const route = tracking.route || interpolateRoute(BASE_ROUTE, 4);
  const nextIndex = Math.min(route.length - 1, Number(tracking.routeIndex || 0) + 1);
  const point = route[nextIndex];
  tracking.routeIndex = nextIndex;
  tracking.breadcrumbs = [...(tracking.breadcrumbs || [route[0]]), point].slice(-200);

  const eventType = nextIndex % 8 === 0
    ? 'Driver accepted ping'
    : nextIndex % 11 === 0
      ? 'Status update received'
      : 'GPS breadcrumb captured';
  appendLoadEvent(loadId, `${eventType} at (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`, 'location_update');
  loadTrackingById[loadId] = tracking;
  persistStore();

  return {
    tracking,
    point,
    reachedEnd: nextIndex >= route.length - 1,
  };
}

router.get('/credits', (req, res) => {
  res.json({ remainingCredits });
});

router.get('/events', (req, res) => {
  const phone = normalizePhone(req.query.phone);
  const filtered = phone
    ? trackerEvents.filter((event) => event.phone === phone)
    : trackerEvents;
  res.json({ events: filtered.slice(-100).reverse() });
});

router.get('/positions', (req, res) => {
  const phone = normalizePhone(req.query.phone);
  if (!phone) {
    return res.json({ positions: [] });
  }
  res.json({ positions: positionsByPhone.get(phone) || [] });
});

router.post('/send', (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const driverName = String(req.body?.driverName || '').trim();
  const message = String(req.body?.message || '').trim();
  const loadRef = String(req.body?.loadRef || '').trim();

  if (!phone || !message) {
    return res.status(400).json({ error: 'phone and message are required' });
  }

  if (remainingCredits < 1) {
    return res.status(402).json({ error: 'No tracker credits remaining' });
  }

  remainingCredits -= 1;

  const sendEvent = {
    id: `trk-${Date.now()}`,
    type: 'message_sent',
    phone,
    driverName,
    loadRef,
    message,
    timestamp: nowIso(),
  };
  pushEvent(sendEvent);

  const position = generatePosition(phone);
  const existing = positionsByPhone.get(phone) || [];
  const nextPositions = [...existing, position].slice(-50);
  positionsByPhone.set(phone, nextPositions);

  pushEvent({
    id: `trk-pos-${Date.now()}`,
    type: 'location_update',
    phone,
    driverName,
    loadRef,
    message: `Location update received at (${position.lat}, ${position.lng})`,
    timestamp: position.timestamp,
  });

  if (loadRef) {
    const tracking = upsertLoadTracking(loadRef, {
      driverName,
      driverPhone: phone,
      outgoingMessage: message,
      active: true,
    });

    const simulatedPoint = {
      x: Number((8 + ((positionsByPhone.get(phone)?.length || 1) % 80)).toFixed(2)),
      y: Number((78 - ((positionsByPhone.get(phone)?.length || 1) % 60)).toFixed(2)),
      timestamp: nowIso(),
    };
    tracking.breadcrumbs = [...(tracking.breadcrumbs || []), simulatedPoint].slice(-200);
    appendLoadEvent(loadRef, `Message sent to driver and ping queued for ${phone}`, 'message_sent');
    loadTrackingById[loadRef] = tracking;
    persistStore();
  }

  res.json({
    success: true,
    remainingCredits,
    lastPosition: position,
  });
});

router.post('/credits/add', (req, res) => {
  const amount = Number(req.body?.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }
  remainingCredits += Math.floor(amount);
  persistStore();
  res.json({ remainingCredits });
});

router.get('/loads/:loadId', (req, res) => {
  const loadId = normalizeLoadId(req.params.loadId);
  if (!loadId) return res.status(400).json({ error: 'loadId is required' });
  const tracking = upsertLoadTracking(loadId);
  return res.json({ tracking });
});

router.get('/loads', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const includeInactive = String(req.query.includeInactive || 'true').toLowerCase() !== 'false';

  let items = Object.values(loadTrackingById || {}).map((tracking) => ({
    loadId: String(tracking.loadId || ''),
    driverName: String(tracking.driverName || ''),
    driverPhone: String(tracking.driverPhone || ''),
    active: Boolean(tracking.active),
    breadcrumbsCount: Array.isArray(tracking.breadcrumbs) ? tracking.breadcrumbs.length : 0,
    updatedAt: tracking.updatedAt || tracking.createdAt || nowIso(),
    createdAt: tracking.createdAt || tracking.updatedAt || nowIso(),
  }));

  if (!includeInactive) {
    items = items.filter((row) => row.active);
  }

  if (q) {
    items = items.filter((row) =>
      [row.loadId, row.driverName, row.driverPhone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }

  items.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return res.json({ items });
});

router.post('/loads/:loadId/start', (req, res) => {
  const loadId = normalizeLoadId(req.params.loadId);
  if (!loadId) return res.status(400).json({ error: 'loadId is required' });

  const route = interpolateRoute(BASE_ROUTE, 4);
  const tracking = upsertLoadTracking(loadId, {
    driverName: String(req.body?.driverName || '').trim(),
    driverPhone: normalizePhone(req.body?.driverPhone),
    outgoingMessage: String(req.body?.outgoingMessage || '').trim(),
    oneTimePing: Boolean(req.body?.oneTimePing),
    pingInterval: Math.max(1, Number.parseInt(String(req.body?.pingInterval || 15), 10) || 15),
    active: true,
    route,
    routeIndex: 0,
    breadcrumbs: [route[0]],
    events: [],
  });

  appendLoadEvent(
    loadId,
    `Tracking started for load ${loadId} (${tracking.oneTimePing ? 'one-time ping' : `${tracking.pingInterval} min intervals`})`,
    'tracking_started'
  );

  return res.json({ tracking: loadTrackingById[loadId] });
});

router.post('/loads/:loadId/ping', (req, res) => {
  const loadId = normalizeLoadId(req.params.loadId);
  if (!loadId) return res.status(400).json({ error: 'loadId is required' });

  const tracking = upsertLoadTracking(loadId);
  if (!tracking.active) {
    return res.status(409).json({ error: 'Tracking is not active for this load' });
  }

  const { tracking: nextTracking, point, reachedEnd } = stepLoadBreadcrumb(loadId);
  if (reachedEnd) {
    nextTracking.active = false;
    appendLoadEvent(loadId, `Load ${loadId} reached final breadcrumb point`, 'tracking_complete');
    loadTrackingById[loadId] = nextTracking;
    persistStore();
  }

  return res.json({ tracking: loadTrackingById[loadId], point });
});

router.post('/loads/:loadId/stop', (req, res) => {
  const loadId = normalizeLoadId(req.params.loadId);
  if (!loadId) return res.status(400).json({ error: 'loadId is required' });
  const tracking = upsertLoadTracking(loadId, { active: false });
  appendLoadEvent(loadId, `Tracking stopped for load ${loadId}`, 'tracking_stopped');
  return res.json({ tracking });
});

router.post('/loads/:loadId/reset', (req, res) => {
  const loadId = normalizeLoadId(req.params.loadId);
  if (!loadId) return res.status(400).json({ error: 'loadId is required' });
  const route = interpolateRoute(BASE_ROUTE, 4);
  const current = upsertLoadTracking(loadId, {
    route,
    routeIndex: 0,
    breadcrumbs: [route[0]],
    events: [],
    active: false,
  });
  appendLoadEvent(loadId, `Tracking reset for load ${loadId}`, 'tracking_reset');
  return res.json({ tracking: current });
});

router.get('/loads/:loadId/events', (req, res) => {
  const loadId = normalizeLoadId(req.params.loadId);
  if (!loadId) return res.status(400).json({ error: 'loadId is required' });
  const tracking = upsertLoadTracking(loadId);
  return res.json({ events: tracking.events || [] });
});

router.get('/loads/:loadId/breadcrumbs', (req, res) => {
  const loadId = normalizeLoadId(req.params.loadId);
  if (!loadId) return res.status(400).json({ error: 'loadId is required' });
  const tracking = upsertLoadTracking(loadId);
  return res.json({
    breadcrumbs: tracking.breadcrumbs || [],
    routeIndex: tracking.routeIndex || 0,
    active: Boolean(tracking.active),
  });
});

export default router;
