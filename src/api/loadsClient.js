const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_URL = import.meta.env.PROD
  ? ''
  : (RAW_API_URL ? RAW_API_URL.replace(/\/+$/, '') : '');

function apiUrl(path) {
  return `${API_URL}${path}`;
}

function isMockMode() {
  if (import.meta.env.VITE_MOCK_MODE === 'true') return true;
  try {
    return typeof window !== 'undefined' && localStorage.getItem('demoMode') === 'true';
  } catch {
    return false;
  }
}

const mockLoads = [
  {
    id: 'L-102938',
    status: 'in_transit',
    customer: { id: 'C-44', name: 'Amazon' },
    carrier: { id: 'CR-18', name: 'Prime Logistics', assigned: true },
    miles: 1280,
    revenue: 4200,
    carrierCost: 3600,
    margin: 600,
    marginPct: 14.3,
    equipment: 'van',
    dispatcher: { id: 'U-9', name: 'Alex Smith' },
    pickupAt: '2026-03-02T15:00:00Z',
    deliveryAt: '2026-03-04T03:00:00Z',
  },
  {
    id: 'L-204811',
    status: 'open',
    customer: { id: 'C-52', name: 'Target' },
    carrier: { id: null, name: 'Pending', assigned: false },
    miles: 980,
    revenue: 3850,
    carrierCost: 2900,
    margin: 950,
    marginPct: 24.7,
    equipment: 'reefer',
    dispatcher: { id: 'U-10', name: 'Jamie Lee' },
    pickupAt: '2026-03-02T11:00:00Z',
    deliveryAt: '2026-03-03T01:00:00Z',
  },
  {
    id: 'L-887201',
    status: 'uncovered',
    customer: { id: 'C-60', name: 'Walmart' },
    carrier: { id: null, name: '—', assigned: false },
    miles: 750,
    revenue: 3000,
    carrierCost: 0,
    margin: 3000,
    marginPct: 100,
    equipment: 'van',
    dispatcher: { id: 'U-9', name: 'Alex Smith' },
    pickupAt: '2026-03-01T23:00:00Z',
    deliveryAt: '2026-03-02T14:00:00Z',
  },
];

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

    return payload;
  } catch (err) {
    return { error: err.message || String(err) };
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

function getMockList(filters = {}) {
  const q = String(filters.q || '').toLowerCase();
  let items = [...mockLoads];

  if (filters.status) items = items.filter((i) => i.status === filters.status);
  if (filters.equipment) items = items.filter((i) => i.equipment === filters.equipment);

  if (filters.tab === 'uncovered') items = items.filter((i) => !i.carrier?.assigned);
  if (filters.tab === 'my') items = items.filter((i) => i.dispatcher?.id === 'U-9');
  if (filters.tab === 'delivered') items = items.filter((i) => i.status === 'delivered');

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
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(String(filters.pageSize || '25'), 10) || 25));
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return {
    items: paged,
    page,
    pageSize,
    total: items.length,
    facets: {
      status: {
        open: items.filter((i) => i.status === 'open').length,
        in_transit: items.filter((i) => i.status === 'in_transit').length,
        uncovered: items.filter((i) => i.status === 'uncovered').length,
        at_risk: items.filter((i) => i.marginPct < 12).length,
        delivered: items.filter((i) => i.status === 'delivered').length,
      },
      equipment: {
        van: items.filter((i) => i.equipment === 'van').length,
        reefer: items.filter((i) => i.equipment === 'reefer').length,
        flatbed: items.filter((i) => i.equipment === 'flatbed').length,
      },
    },
  };
}

export async function listLoads(filters = {}) {
  if (isMockMode()) return getMockList(filters);
  return safeFetch(`/api/loads${toQueryString(filters)}`);
}

export async function getLoadDetail(loadId) {
  if (!loadId) return { error: 'loadId is required' };
  if (isMockMode()) {
    const load = mockLoads.find((item) => item.id === loadId);
    if (!load) return { error: 'Load not found' };
    return {
      load,
      laneAverageMarginPct: 15.4,
      marginDeltaPct: Number((load.marginPct - 15.4).toFixed(1)),
      controls: { canDispatch: true, canReassign: true, canBidNetwork: true, canMarkDelivered: true },
    };
  }
  return safeFetch(`/api/loads/${encodeURIComponent(loadId)}`);
}

export async function getLoadRiskSignals(loadId) {
  if (!loadId) return { error: 'loadId is required' };
  if (isMockMode()) {
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
  if (isMockMode()) {
    return {
      items: [
        {
          id: 'EV-909',
          loadId,
          type: 'carrier_assigned',
          message: 'Carrier Prime Logistics assigned',
          actor: { id: 'U-9', name: 'Alex Smith' },
          createdAt: '2026-03-01T18:22:00Z',
        },
      ],
      nextCursor: null,
    };
  }
  return safeFetch(`/api/loads/${encodeURIComponent(loadId)}/events`);
}

export async function dispatchLoad(loadId, payload) {
  return safeFetch(`/api/loads/${encodeURIComponent(loadId)}/dispatch`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function reassignLoad(loadId, payload) {
  return safeFetch(`/api/loads/${encodeURIComponent(loadId)}/reassign`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function sendToBidNetwork(loadId, payload) {
  return safeFetch(`/api/loads/${encodeURIComponent(loadId)}/send-to-bid-network`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function markLoadDelivered(loadId, payload) {
  return safeFetch(`/api/loads/${encodeURIComponent(loadId)}/mark-delivered`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}
