import {
  createStatusHistoryEntry,
  canTransitionStatus,
  deriveControlsForStatus,
  formatLoadStatusLabel,
  normalizeLoadStatus,
} from '../utils/loadLifecycle';
import { emitWorkflowEvent } from '../utils/workflowAutomationEngine';

const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_URL = import.meta.env.PROD
  ? ''
  : (RAW_API_URL ? RAW_API_URL.replace(/\/+$/, '') : '');

function apiUrl(path) {
  return `${API_URL}${path}`;
}

function isMockMode() {
  // Only enable mock mode if VITE_MOCK_MODE or demoMode is true
  return import.meta.env.VITE_MOCK_MODE === 'true' ||
    (typeof window !== 'undefined' && localStorage.getItem('demoMode') === 'true');
}

let forceMockLoadsFromNetwork = false;

function shouldUseMockLoads() {
  // Only use mock loads if mock mode is enabled
  return isMockMode() || forceMockLoadsFromNetwork;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick(items) {
  return items[randomInt(0, Math.max(0, items.length - 1))];
}

function buildLifecycleMetrics(load) {
  const revenue = Number(load?.revenue || 0);
  const carrierCost = Number(load?.carrierCost || 0);
  return {
    margin: revenue - carrierCost,
    volatility: Number(load?.laneVolatilityScore || 0),
    capacity_heat: Number(load?.capacityHeatIndex || 0),
    eta_delta_minutes: Number(load?.etaDeltaMinutes || 0),
  };
}

function createInitialStatusHistory(status) {
  return [
    createStatusHistoryEntry({
      fromStatus: status,
      toStatus: status,
      userId: 'system',
      reason: 'Load initialized',
      source: 'load-bootstrap',
    }),
  ];
}

function createRandomizedMockLoads(count = 240) {
  const cityPool = [
    { city: 'Los Angeles', state: 'CA' },
    { city: 'San Diego', state: 'CA' },
    { city: 'Phoenix', state: 'AZ' },
    { city: 'Denver', state: 'CO' },
    { city: 'Dallas', state: 'TX' },
    { city: 'Houston', state: 'TX' },
    { city: 'San Antonio', state: 'TX' },
    { city: 'Chicago', state: 'IL' },
    { city: 'Atlanta', state: 'GA' },
    { city: 'Miami', state: 'FL' },
    { city: 'Orlando', state: 'FL' },
    { city: 'Nashville', state: 'TN' },
    { city: 'Charlotte', state: 'NC' },
    { city: 'Newark', state: 'NJ' },
    { city: 'Columbus', state: 'OH' },
    { city: 'Kansas City', state: 'MO' },
    { city: 'Seattle', state: 'WA' },
    { city: 'Portland', state: 'OR' },
  ];

  const customers = [
    { id: 'C-44', name: 'Amazon' },
    { id: 'C-52', name: 'Target' },
    { id: 'C-60', name: 'Walmart' },
    { id: 'C-77', name: 'Costco' },
    { id: 'C-88', name: 'Home Depot' },
    { id: 'C-91', name: 'Kroger' },
    { id: 'C-102', name: 'Publix' },
  ];

  const carrierPool = [
    { id: 'CR-18', name: 'Prime Logistics' },
    { id: 'CR-21', name: 'Velocity Van' },
    { id: 'CR-31', name: 'Summit Freight' },
    { id: 'CR-37', name: 'Titan Carriers' },
    { id: 'CR-40', name: 'BlueRoute Transport' },
    { id: 'CR-48', name: 'Swiftline Trucking' },
  ];

  const dispatchers = [
    { id: 'U-9', name: 'Alex Smith' },
    { id: 'U-10', name: 'Jamie Lee' },
    { id: 'U-12', name: 'Mia Clark' },
    { id: 'U-14', name: 'Jordan Patel' },
  ];

  const equipmentTypes = ['van', 'reefer', 'flatbed', 'power_only'];
  const statusPool = ['DRAFT', 'TENDERED', 'PRE_DISPATCH', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION'];
  const statusWeights = [18, 20, 18, 24, 14, 6];

  const weightedStatusPick = () => {
    const roll = randomInt(1, statusWeights.reduce((sum, value) => sum + value, 0));
    let cursor = 0;
    for (let i = 0; i < statusPool.length; i += 1) {
      cursor += statusWeights[i];
      if (roll <= cursor) return statusPool[i];
    }
    return 'DRAFT';
  };

  const now = Date.now();
  const generated = [];

  for (let index = 0; index < count; index += 1) {
    const origin = randomPick(cityPool);
    let destination = randomPick(cityPool);
    while (destination.city === origin.city && destination.state === origin.state) {
      destination = randomPick(cityPool);
    }

    const equipment = randomPick(equipmentTypes);
    const status = normalizeLoadStatus(weightedStatusPick());

    const miles = randomInt(180, 2650);
    const baselineRpm = equipment === 'reefer'
      ? 2.78
      : equipment === 'flatbed'
        ? 2.52
        : equipment === 'power_only'
          ? 2.08
          : 2.34;
    const demandVolatility = (Math.random() * 0.55) - 0.2;
    const revenue = Math.round(miles * (baselineRpm + demandVolatility));

    const assignedCarrier = ['DRAFT', 'QUOTED', 'RATE_LOCKED', 'BOOKED', 'TENDERED'].includes(status) ? null : randomPick(carrierPool);
    const carrierCostFactor = status === 'EXCEPTION'
      ? (0.94 + (Math.random() * 0.07))
      : (0.72 + (Math.random() * 0.2));
    const carrierCost = assignedCarrier ? Math.round(revenue * carrierCostFactor) : 0;

    const margin = revenue - carrierCost;
    const marginPct = revenue > 0 ? Number(((margin / revenue) * 100).toFixed(1)) : 0;

    const pickupOffsetHours = randomInt(-36, 96);
    const tripDurationHours = Math.max(8, Math.round((miles / 48) + randomInt(2, 14)));
    const pickupAt = new Date(now + (pickupOffsetHours * 60 * 60 * 1000));
    const deliveryAt = new Date(pickupAt.getTime() + (tripDurationHours * 60 * 60 * 1000));
    const updatedAt = new Date(pickupAt.getTime() - (randomInt(1, 30) * 60 * 60 * 1000));

    generated.push({
      id: `L-${String(300000 + index + 1)}`,
      status,
      customer: randomPick(customers),
      carrier: assignedCarrier
        ? { id: assignedCarrier.id, name: assignedCarrier.name, assigned: true }
        : { id: null, name: 'Pending', assigned: false },
      miles,
      revenue,
      carrierCost,
      margin,
      marginPct,
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

  return generated;
}

const mockLoads = createRandomizedMockLoads();
const mockLoadTemplates = [];

async function safeFetch(path, options) {
  try {
    const res = await fetch(apiUrl(path), {
      ...(options || {}),
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        error: payload?.error?.message || payload?.error || `Request failed with ${res.status}`,
        status: res.status,
        details: payload?.error?.details || null,
      };
    }

    forceMockLoadsFromNetwork = false;

    return payload;
  } catch (err) {
    forceMockLoadsFromNetwork = true;
    return {
      error: err.message || String(err),
      networkOffline: true,
    };
  }
}

function toQueryString(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

function normalizeStatusHistoryEntries(statusHistory = []) {
  if (!Array.isArray(statusHistory)) return [];
  return statusHistory.map((entry) => ({
    ...entry,
    fromStatus: normalizeLoadStatus(entry.fromStatus || entry.status),
    toStatus: normalizeLoadStatus(entry.toStatus || entry.status),
    status: normalizeLoadStatus(entry.status || entry.toStatus || entry.fromStatus),
  }));
}

function normalizeApiLoad(load) {
  if (!load || typeof load !== 'object') return load;
  const status = normalizeLoadStatus(load.status);
  return {
    ...load,
    status,
    statusHistory: normalizeStatusHistoryEntries(load.statusHistory),
    invoiceLocked: load.invoiceLocked ?? status === 'EXCEPTION',
  };
}

function normalizeApiListResponse(response = {}) {
  const items = Array.isArray(response.items) ? response.items.map(normalizeApiLoad) : [];
  const facets = response?.facets || {};
  const statusFacets = facets.status || {};

  const fallbackStatusFacets = {
    DRAFT: items.filter((i) => normalizeLoadStatus(i.status) === 'DRAFT').length,
    PRE_DISPATCH: items.filter((i) => normalizeLoadStatus(i.status) === 'PRE_DISPATCH').length,
    IN_TRANSIT: items.filter((i) => normalizeLoadStatus(i.status) === 'IN_TRANSIT').length,
    DELIVERED: items.filter((i) => normalizeLoadStatus(i.status) === 'DELIVERED').length,
    EXCEPTION: items.filter((i) => normalizeLoadStatus(i.status) === 'EXCEPTION').length,
    CANCELLED: items.filter((i) => normalizeLoadStatus(i.status) === 'CANCELLED' || Boolean(i.deletedAt)).length,
  };

  return {
    ...response,
    items,
    facets: {
      ...facets,
      status: {
        DRAFT: Number(statusFacets.DRAFT ?? statusFacets.open ?? fallbackStatusFacets.DRAFT),
        PRE_DISPATCH: Number(statusFacets.PRE_DISPATCH ?? statusFacets.uncovered ?? fallbackStatusFacets.PRE_DISPATCH),
        IN_TRANSIT: Number(statusFacets.IN_TRANSIT ?? statusFacets.in_transit ?? fallbackStatusFacets.IN_TRANSIT),
        DELIVERED: Number(statusFacets.DELIVERED ?? statusFacets.delivered ?? fallbackStatusFacets.DELIVERED),
        EXCEPTION: Number(statusFacets.EXCEPTION ?? statusFacets.at_risk ?? fallbackStatusFacets.EXCEPTION),
        CANCELLED: Number(statusFacets.CANCELLED ?? statusFacets.void ?? statusFacets.deleted ?? fallbackStatusFacets.CANCELLED),
      },
    },
  };
}

function normalizeApiDetailResponse(response = {}) {
  const load = normalizeApiLoad(response.load);
  const normalizedStatus = normalizeLoadStatus(load?.status);
  return {
    ...response,
    load,
    controls: response.controls || deriveControlsForStatus(normalizedStatus),
    loadStatusHistory: normalizeStatusHistoryEntries(response.loadStatusHistory || load?.statusHistory || []),
  };
}

function normalizeLoadEnvelope(response = {}) {
  if (response?.load) {
    return {
      ...response,
      load: normalizeApiLoad(response.load),
    };
  }
  if (Array.isArray(response?.loads)) {
    return {
      ...response,
      loads: response.loads.map(normalizeApiLoad),
    };
  }
  return response;
}

function getMockList(filters = {}) {
  const q = String(filters.q || '').toLowerCase();
  const requestedStatus = normalizeLoadStatus(filters.status || '');
  const includeDeleted = String(filters.includeDeleted || '').toLowerCase() === 'true';
  let items = [...mockLoads];

  if (!includeDeleted && requestedStatus !== 'CANCELLED') {
    items = items.filter((i) => normalizeLoadStatus(i.status) !== 'CANCELLED' && !i.deletedAt);
  }

  if (filters.status) items = items.filter((i) => normalizeLoadStatus(i.status) === requestedStatus);
  if (filters.equipment) items = items.filter((i) => i.equipment === filters.equipment);

  if (filters.tab === 'uncovered') items = items.filter((i) => !i.carrier?.assigned || normalizeLoadStatus(i.status) === 'TENDERED');
  if (filters.tab === 'my') items = items.filter((i) => i.dispatcher?.id === 'U-9');
  if (filters.tab === 'delivered') items = items.filter((i) => normalizeLoadStatus(i.status) === 'DELIVERED');

  if (q) {
    items = items.filter((i) => [i.id, i.customer?.name, i.carrier?.name].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));
  }

  const sort = String(filters.sort || '-updatedAt');
  const descending = sort.startsWith('-');
  const key = descending ? sort.slice(1) : sort;
  items.sort((a, b) => {
    const av = a[key] ?? '';
    const bv = b[key] ?? '';
    if (typeof av === 'number' && typeof bv === 'number') return descending ? bv - av : av - bv;
    return descending
      ? String(bv).localeCompare(String(av))
      : String(av).localeCompare(String(bv));
  });

  const page = Math.max(1, Number.parseInt(String(filters.page || '1'), 10) || 1);
  const pageSize = Math.min(500, Math.max(1, Number.parseInt(String(filters.pageSize || '25'), 10) || 25));
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return {
    items: paged,
    page,
    pageSize,
    total: items.length,
    facets: {
      status: {
        DRAFT: items.filter((i) => normalizeLoadStatus(i.status) === 'DRAFT').length,
        PRE_DISPATCH: items.filter((i) => normalizeLoadStatus(i.status) === 'PRE_DISPATCH').length,
        IN_TRANSIT: items.filter((i) => normalizeLoadStatus(i.status) === 'IN_TRANSIT').length,
        DELIVERED: items.filter((i) => normalizeLoadStatus(i.status) === 'DELIVERED').length,
        EXCEPTION: items.filter((i) => normalizeLoadStatus(i.status) === 'EXCEPTION').length,
        CANCELLED: items.filter((i) => normalizeLoadStatus(i.status) === 'CANCELLED' || Boolean(i.deletedAt)).length,
      },
      equipment: {
        van: items.filter((i) => i.equipment === 'van').length,
        reefer: items.filter((i) => i.equipment === 'reefer').length,
        flatbed: items.filter((i) => i.equipment === 'flatbed').length,
      },
    },
  };
}

function toIsoOrFallback(value, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toISOString();
}

function appendStatusHistory(load, nextStatus, payload = {}, source = 'workflow-engine') {
  const fromStatus = normalizeLoadStatus(load.status);
  const toStatus = normalizeLoadStatus(nextStatus);
  if (fromStatus === toStatus) return;

  const nextEntry = createStatusHistoryEntry({
    fromStatus,
    toStatus,
    userId: payload.userId || 'system',
    reason: payload.reason || payload.transitionReason || '',
    source,
  });

  load.statusHistory = [nextEntry, ...(Array.isArray(load.statusHistory) ? load.statusHistory : [])];

  emitWorkflowEvent({
    type: 'status_transition',
    load,
    previousStatus: fromStatus,
    nextStatus: toStatus,
    userId: payload.userId || 'system',
    metrics: buildLifecycleMetrics(load),
  });
}

function applyMockLoadPatch(load, payload = {}) {
  const next = { ...load };

  const currentStatus = normalizeLoadStatus(next.status);
  let targetStatus = currentStatus;

  if (payload.status !== undefined) {
    targetStatus = normalizeLoadStatus(payload.status);
    if (!canTransitionStatus(currentStatus, targetStatus, { overrideRolePermission: payload.overrideRolePermission })) {
      return {
        error: `Illegal transition ${formatLoadStatusLabel(currentStatus)} -> ${formatLoadStatusLabel(targetStatus)}. Override role permission required.`,
      };
    }
  }

  next.status = targetStatus;
  if (payload.customerName !== undefined) {
    next.customer = { ...(next.customer || { id: null }), name: String(payload.customerName || '').trim() || '—' };
  }
  if (payload.carrierName !== undefined || payload.carrierId !== undefined || payload.carrierAssigned !== undefined) {
    const currentCarrier = next.carrier || { id: null, name: '—', assigned: false };
    const carrierName = payload.carrierName !== undefined ? String(payload.carrierName || '').trim() : currentCarrier.name;
    const carrierId = payload.carrierId !== undefined ? String(payload.carrierId || '').trim() : currentCarrier.id;
    next.carrier = {
      id: carrierId || null,
      name: carrierName || '—',
      assigned: payload.carrierAssigned !== undefined ? Boolean(payload.carrierAssigned) : Boolean(carrierId || carrierName),
    };
  }
  if (payload.dispatcherName !== undefined || payload.dispatcherId !== undefined) {
    const currentDispatcher = next.dispatcher || { id: 'U-9', name: 'Alex Smith' };
    next.dispatcher = {
      id: payload.dispatcherId !== undefined ? String(payload.dispatcherId || '').trim() || currentDispatcher.id : currentDispatcher.id,
      name: payload.dispatcherName !== undefined ? String(payload.dispatcherName || '').trim() || currentDispatcher.name : currentDispatcher.name,
    };
  }
  if (payload.equipment !== undefined) next.equipment = String(payload.equipment || '').trim() || next.equipment;
  if (payload.miles !== undefined) next.miles = Math.max(0, Number(payload.miles) || 0);
  if (payload.revenue !== undefined) next.revenue = Math.max(0, Number(payload.revenue) || 0);
  if (payload.carrierCost !== undefined) next.carrierCost = Math.max(0, Number(payload.carrierCost) || 0);

  if (payload.originCity !== undefined || payload.originState !== undefined) {
    next.origin = {
      ...(next.origin || { city: '—', state: '' }),
      city: payload.originCity !== undefined ? String(payload.originCity || '').trim() || '—' : (next.origin?.city || '—'),
      state: payload.originState !== undefined ? String(payload.originState || '').trim().toUpperCase() : (next.origin?.state || ''),
    };
  }
  if (payload.destinationCity !== undefined || payload.destinationState !== undefined) {
    next.destination = {
      ...(next.destination || { city: '—', state: '' }),
      city: payload.destinationCity !== undefined ? String(payload.destinationCity || '').trim() || '—' : (next.destination?.city || '—'),
      state: payload.destinationState !== undefined ? String(payload.destinationState || '').trim().toUpperCase() : (next.destination?.state || ''),
    };
  }
  if (payload.pickupAt !== undefined) next.pickupAt = toIsoOrFallback(payload.pickupAt, next.pickupAt || new Date().toISOString());
  if (payload.deliveryAt !== undefined) next.deliveryAt = toIsoOrFallback(payload.deliveryAt, next.deliveryAt || new Date().toISOString());

  const revenue = Number(next.revenue || 0);
  const carrierCost = Number(next.carrierCost || 0);
  const margin = revenue - carrierCost;
  next.margin = margin;
  next.marginPct = revenue > 0 ? Number(((margin / revenue) * 100).toFixed(1)) : 0;
  next.updatedAt = new Date().toISOString();
  next.invoiceLocked = normalizeLoadStatus(next.status) === 'EXCEPTION';
  if (normalizeLoadStatus(next.status) !== 'EXCEPTION' && payload.exceptionReason === undefined) {
    next.exceptionReason = '';
  }
  if (payload.exceptionReason !== undefined) {
    next.exceptionReason = String(payload.exceptionReason || '').trim();
  }

  appendStatusHistory(next, targetStatus, payload, payload.source || 'status-patch');

  return { load: next };
}

function findMockLoadIndex(loadId) {
  return mockLoads.findIndex((item) => item.id === loadId);
}

function applyMockStatusTransition(loadId, nextStatus, payload = {}, source = 'status-transition') {
  const index = findMockLoadIndex(loadId);
  if (index < 0) return { error: 'Load not found' };

  const existing = mockLoads[index];
  const normalizedCurrent = normalizeLoadStatus(existing.status);
  const normalizedNext = normalizeLoadStatus(nextStatus);

  if (!canTransitionStatus(normalizedCurrent, normalizedNext, { overrideRolePermission: payload.overrideRolePermission })) {
    return {
      error: `Illegal transition ${formatLoadStatusLabel(normalizedCurrent)} -> ${formatLoadStatusLabel(normalizedNext)}. Override role permission required.`,
    };
  }

  const mergedPayload = {
    ...payload,
    status: normalizedNext,
    source,
  };

  const patched = applyMockLoadPatch(existing, mergedPayload);
  if (patched?.error) return patched;

  mockLoads[index] = patched.load;
  return {
    ok: true,
    load: mockLoads[index],
    updatedAt: mockLoads[index].updatedAt,
  };
}

export async function listLoads(filters = {}) {
  if (shouldUseMockLoads()) return getMockList(filters);
  const result = await safeFetch(`/api/loads${toQueryString(filters)}`);
  if (result?.networkOffline) return getMockList(filters);
  if (result?.error) return result;
  return normalizeApiListResponse(result);
}

export async function listLoadTemplates() {
  if (shouldUseMockLoads()) {
    return { items: [...mockLoadTemplates] };
  }
  const result = await safeFetch('/api/loads/templates/list');
  if (result?.networkOffline) return { items: [...mockLoadTemplates] };
  return result;
}

export async function createLoadTemplate(payload) {
  if (shouldUseMockLoads()) {
    const template = {
      id: `tpl-${Date.now()}`,
      name: String(payload?.name || '').trim(),
      customer: String(payload?.customer || 'Not set'),
      picks: Number.isFinite(Number(payload?.picks)) ? Number(payload.picks) : 1,
      drops: Number.isFinite(Number(payload?.drops)) ? Number(payload.drops) : 1,
      branch: String(payload?.branch || 'Shared'),
      defaults: payload?.defaults && typeof payload.defaults === 'object' ? payload.defaults : {},
    };
    if (!template.name) return { error: 'Template name is required' };
    mockLoadTemplates.unshift(template);
    return {
      template,
    };
  }

  return safeFetch('/api/loads/templates', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function updateLoadTemplate(templateId, payload) {
  if (!templateId) return { error: 'templateId is required' };
  if (shouldUseMockLoads()) {
    const index = mockLoadTemplates.findIndex((template) => template.id === templateId);
    if (index < 0) return { error: 'Template not found' };
    const nextTemplate = {
      ...mockLoadTemplates[index],
      ...(payload || {}),
      defaults: {
        ...(mockLoadTemplates[index].defaults || {}),
        ...((payload || {}).defaults || {}),
      },
    };
    mockLoadTemplates[index] = nextTemplate;
    return {
      template: nextTemplate,
    };
  }

  return safeFetch(`/api/loads/templates/${encodeURIComponent(templateId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload || {}),
  });
}

export async function deleteLoadTemplate(templateId) {
  if (!templateId) return { error: 'templateId is required' };
  if (shouldUseMockLoads()) {
    const index = mockLoadTemplates.findIndex((template) => template.id === templateId);
    if (index < 0) return { error: 'Template not found' };
    const [removed] = mockLoadTemplates.splice(index, 1);
    return { ok: true, template: removed };
  }

  return safeFetch(`/api/loads/templates/${encodeURIComponent(templateId)}`, {
    method: 'DELETE',
  });
}

export async function createLoad(payload) {
  if (shouldUseMockLoads()) {
    const status = normalizeLoadStatus(payload?.status || 'DRAFT');
    const created = {
      id: `L-${Date.now()}`,
      status,
      customer: { id: payload?.customerId || '', name: payload?.customerName || 'Customer' },
      carrier: { id: payload?.carrierId || null, name: payload?.carrierName || 'Pending', assigned: Boolean(payload?.carrierId) },
      miles: Number(payload?.miles || 0),
      revenue: Number(payload?.revenue || 0),
      carrierCost: Number(payload?.carrierCost || 0),
      margin: Number(payload?.revenue || 0) - Number(payload?.carrierCost || 0),
      marginPct: 0,
      equipment: payload?.equipment || 'van',
      dispatcher: { id: 'U-9', name: 'Alex Smith' },
      pickupAt: payload?.pickupAt || new Date().toISOString(),
      deliveryAt: payload?.deliveryAt || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      statusHistory: createInitialStatusHistory(status),
      invoiceLocked: status === 'EXCEPTION',
      exceptionReason: status === 'EXCEPTION' ? String(payload?.exceptionReason || 'Exception opened on load creation.') : '',
    };
    created.marginPct = created.revenue ? Number(((created.margin / created.revenue) * 100).toFixed(1)) : 0;
    mockLoads.unshift(created);
    return { load: created };
  }

  const result = await safeFetch('/api/loads/create', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
  return normalizeLoadEnvelope(result);
}

export async function createLoadsBatch(payload = {}) {
  const count = Math.min(50, Math.max(1, Number.parseInt(String(payload?.count || 0), 10) || 1));

  if (shouldUseMockLoads()) {
    const created = [];
    for (let index = 0; index < count; index += 1) {
      const now = Date.now();
      const shiftedPickup = new Date(now + ((index + 1) * 60 * 60 * 1000)).toISOString();
      const shiftedDelivery = new Date(now + ((index + 25) * 60 * 60 * 1000)).toISOString();
      const result = await createLoad({
        ...payload,
        pickupAt: payload.pickupAt || shiftedPickup,
        deliveryAt: payload.deliveryAt || shiftedDelivery,
      });
      if (result?.load) {
        created.push(result.load);
      }
    }

    return { count: created.length, loads: created };
  }

  const result = await safeFetch('/api/loads/create-batch', {
    method: 'POST',
    body: JSON.stringify({ ...(payload || {}), count }),
  });

  if (result?.networkOffline) {
    return createLoadsBatch({ ...(payload || {}), count });
  }

  return normalizeLoadEnvelope(result);
}

export async function updateLoad(loadId, payload = {}) {
  if (!loadId) return { error: 'loadId is required' };

  if (shouldUseMockLoads()) {
    const index = findMockLoadIndex(loadId);
    if (index < 0) return { error: 'Load not found' };
    const patched = applyMockLoadPatch(mockLoads[index], payload);
    if (patched?.error) return patched;
    mockLoads[index] = patched.load;
    return { load: mockLoads[index] };
  }

  const result = await safeFetch(`/api/loads/${encodeURIComponent(loadId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload || {}),
  });

  if (result?.networkOffline) {
    const index = findMockLoadIndex(loadId);
    if (index < 0) return { error: 'Load not found' };
    const patched = applyMockLoadPatch(mockLoads[index], payload);
    if (patched?.error) return patched;
    mockLoads[index] = patched.load;
    return { load: mockLoads[index], source: 'offline-fallback' };
  }

  return normalizeLoadEnvelope(result);
}

export async function getLoadDetail(loadId) {
  if (!loadId) return { error: 'loadId is required' };
  if (shouldUseMockLoads()) {
    const load = mockLoads.find((item) => item.id === loadId);
    if (!load) return { error: 'Load not found' };
    const normalizedStatus = normalizeLoadStatus(load.status);
    return {
      load: { ...load, status: normalizedStatus },
      laneAverageMarginPct: 15.4,
      marginDeltaPct: Number((load.marginPct - 15.4).toFixed(1)),
      controls: deriveControlsForStatus(normalizedStatus),
      loadStatusHistory: Array.isArray(load.statusHistory) ? load.statusHistory : [],
    };
  }
  const result = await safeFetch(`/api/loads/${encodeURIComponent(loadId)}`);
  if (result?.error) return result;
  return normalizeApiDetailResponse(result);
}

export async function getLoadRiskSignals(loadId) {
  if (!loadId) return { error: 'loadId is required' };
  if (shouldUseMockLoads()) {
    return {
      risk: {
        loadId,
        laneVolatilityScore: 61,
        capacityHeatIndex: 51,
        complianceStatus: 'valid',
        pickupCountdownMinutes: 930,
        warnings: ['margin_below_lane_avg'],
      },
    };
  }
  return safeFetch(`/api/loads/${encodeURIComponent(loadId)}/risk-signals`);
}

export async function getLoadEvents(loadId) {
  if (!loadId) return { error: 'loadId is required' };
  if (shouldUseMockLoads()) {
    const load = mockLoads.find((item) => item.id === loadId);
    const statusEvents = Array.isArray(load?.statusHistory)
      ? load.statusHistory.map((entry) => ({
        id: entry.id,
        loadId,
        type: 'status_transition',
        message: `${formatLoadStatusLabel(entry.fromStatus)} → ${formatLoadStatusLabel(entry.toStatus)}`,
        actor: { id: entry.userId, name: entry.userId },
        createdAt: entry.createdAt,
      }))
      : [];

    return {
      items: statusEvents,
      nextCursor: null,
    };
  }
  return safeFetch(`/api/loads/${encodeURIComponent(loadId)}/events`);
}

export async function getLoadBotActivity(loadId) {
  if (!loadId) return { error: 'loadId is required' };
  if (shouldUseMockLoads()) {
    return {
      items: [
        {
          id: `BOT-${Date.now()}`,
          loadId,
          text: 'Dispatch Bot mock activity initialized.',
          createdAt: new Date().toISOString(),
          source: 'mock',
        },
      ],
    };
  }
  return safeFetch(`/api/loads/${encodeURIComponent(loadId)}/bot-activity`);
}

export async function addLoadBotActivity(loadId, payload) {
  if (!loadId) return { error: 'loadId is required' };
  if (shouldUseMockLoads()) {
    return {
      item: {
        id: `BOT-${Date.now()}`,
        loadId,
        text: String(payload?.text || '').trim(),
        createdAt: new Date().toISOString(),
        source: payload?.source || 'mock',
      },
    };
  }
  return safeFetch(`/api/loads/${encodeURIComponent(loadId)}/bot-activity`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function dispatchLoad(loadId, payload) {
  if (shouldUseMockLoads()) {
    return applyMockStatusTransition(loadId, 'DISPATCHED', payload || {}, 'dispatch');
  }
  const result = await safeFetch(`/api/loads/${encodeURIComponent(loadId)}/dispatch`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
  return normalizeLoadEnvelope(result);
}

export async function reassignLoad(loadId, payload) {
  if (shouldUseMockLoads()) {
    return updateLoad(loadId, { ...(payload || {}), source: 'reassign' });
  }
  const result = await safeFetch(`/api/loads/${encodeURIComponent(loadId)}/reassign`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
  return normalizeLoadEnvelope(result);
}

export async function sendToBidNetwork(loadId, payload) {
  if (shouldUseMockLoads()) {
    return applyMockStatusTransition(loadId, 'TENDERED', payload || {}, 'send-to-bid-network');
  }
  return safeFetch(`/api/loads/${encodeURIComponent(loadId)}/send-to-bid-network`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function markLoadDelivered(loadId, payload) {
  if (shouldUseMockLoads()) {
    return applyMockStatusTransition(loadId, 'DELIVERED', payload || {}, 'mark-delivered');
  }
  const result = await safeFetch(`/api/loads/${encodeURIComponent(loadId)}/mark-delivered`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
  return normalizeLoadEnvelope(result);
}

export async function voidLoad(loadId, payload) {
  if (!loadId) return { error: 'loadId is required' };

  if (shouldUseMockLoads()) {
    const result = applyMockStatusTransition(loadId, 'CANCELLED', {
      carrierName: 'Pending',
      carrierId: '',
      carrierAssigned: false,
      ...(payload || {}),
      reason: payload?.reason || 'Voided from Load Command Center',
    }, 'void-load');
    return result?.error ? result : { load: result.load };
  }

  const result = await safeFetch(`/api/loads/${encodeURIComponent(loadId)}/void`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
  return normalizeLoadEnvelope(result);
}

export async function deleteLoad(loadId) {
  if (!loadId) return { error: 'loadId is required' };

  if (shouldUseMockLoads()) {
    const index = findMockLoadIndex(loadId);
    if (index < 0) return { error: 'Load not found' };
    const existing = mockLoads[index];
    mockLoads[index] = {
      ...existing,
      status: 'CANCELLED',
      deletedAt: existing.deletedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      carrier: {
        ...(existing.carrier || {}),
        assigned: false,
      },
    };
    appendStatusHistory(mockLoads[index], 'CANCELLED', { reason: 'Load archived' }, 'delete-load');
    return { ok: true, archived: true, load: mockLoads[index] };
  }

  const result = await safeFetch(`/api/loads/${encodeURIComponent(loadId)}`, {
    method: 'DELETE',
  });
  return normalizeLoadEnvelope(result);
}

export async function restoreLoad(loadId) {
  if (!loadId) return { error: 'loadId is required' };

  if (shouldUseMockLoads()) {
    const index = findMockLoadIndex(loadId);
    if (index < 0) return { error: 'Load not found' };
    const previous = mockLoads[index];
    mockLoads[index] = {
      ...previous,
      status: 'DRAFT',
      deletedAt: undefined,
      updatedAt: new Date().toISOString(),
    };
    appendStatusHistory(mockLoads[index], 'DRAFT', { reason: 'Load restored from archive' }, 'restore-load');
    return { ok: true, restored: true, load: mockLoads[index] };
  }

  const result = await safeFetch(`/api/loads/${encodeURIComponent(loadId)}/restore`, {
    method: 'POST',
  });
  return normalizeLoadEnvelope(result);
}
