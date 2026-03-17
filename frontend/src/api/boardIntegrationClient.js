import { apiUrl } from './apiUrl';

async function safeFetch(path, options = {}) {
  try {
    const res = await fetch(apiUrl(path), {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { error: data?.error || `Request failed (${res.status})` };
    return data || {};
  } catch (err) {
    return { error: err?.message || 'Network error' };
  }
}

function isMockMode() {
  return (
    import.meta.env.VITE_MOCK_MODE === 'true' ||
    (typeof window !== 'undefined' && localStorage.getItem('demoMode') === 'true')
  );
}

// ─── Mock data for demo mode ────────────────────────────────────────────────

const MOCK_EXTERNAL_LOADS = [
  {
    id: 'DAT-881204',
    source: 'dat',
    origin: { city: 'Nashville', state: 'TN' },
    destination: { city: 'Charlotte', state: 'NC' },
    miles: 410,
    equipment: 'Dry Van',
    weight: '38,000 lbs',
    rate: '$1,230',
    postedAt: '2026-03-18T09:22:00Z',
    status: 'Open',
    commodity: 'Consumer Goods',
    contact: 'DAT Broker #4412',
  },
  {
    id: 'DAT-881210',
    source: 'dat',
    origin: { city: 'Memphis', state: 'TN' },
    destination: { city: 'Miami', state: 'FL' },
    miles: 880,
    equipment: 'Reefer',
    weight: '41,000 lbs',
    rate: '$2,640',
    postedAt: '2026-03-18T08:15:00Z',
    status: 'Open',
    commodity: 'Frozen Foods',
    contact: 'DAT Broker #7801',
  },
  {
    id: 'TS-440291',
    source: 'truckstop',
    origin: { city: 'Indianapolis', state: 'IN' },
    destination: { city: 'Dallas', state: 'TX' },
    miles: 870,
    equipment: 'Flatbed',
    weight: '44,000 lbs',
    rate: '$2,180',
    postedAt: '2026-03-18T10:05:00Z',
    status: 'Open',
    commodity: 'Steel Beams',
    contact: 'TS Broker #1155',
  },
  {
    id: 'TS-440305',
    source: 'truckstop',
    origin: { city: 'Chicago', state: 'IL' },
    destination: { city: 'Denver', state: 'CO' },
    miles: 1004,
    equipment: 'Dry Van',
    weight: '36,500 lbs',
    rate: '$1,910',
    postedAt: '2026-03-18T07:40:00Z',
    status: 'Open',
    commodity: 'Auto Parts',
    contact: 'TS Broker #2290',
  },
  {
    id: 'SAIA-0052',
    source: 'saia',
    origin: { city: 'Atlanta', state: 'GA' },
    destination: { city: 'Jacksonville', state: 'FL' },
    miles: 345,
    equipment: 'Dry Van',
    weight: '28,000 lbs',
    rate: '$820',
    postedAt: '2026-03-18T11:30:00Z',
    status: 'Open',
    commodity: 'LTL Freight',
    contact: 'Saia Circuit',
  },
];

const MOCK_BOARD_CONNECTIONS = [
  { id: 'dat', name: 'DAT Power', status: 'connected', lastSync: '2026-03-18T11:00:00Z', loadCount: 2 },
  { id: 'truckstop', name: 'Truckstop Pro', status: 'connected', lastSync: '2026-03-18T10:55:00Z', loadCount: 2 },
  { id: 'saia', name: 'Saia LTL Auction', status: 'connected', lastSync: '2026-03-18T11:30:00Z', loadCount: 1 },
];

// ─── Public API ─────────────────────────────────────────────────────────────

export async function searchExternalBoards({ origin, destination, equipment, sources } = {}) {
  if (isMockMode()) {
    let results = [...MOCK_EXTERNAL_LOADS];
    if (sources?.length) results = results.filter((l) => sources.includes(l.source));
    if (equipment) results = results.filter((l) => l.equipment.toLowerCase().includes(equipment.toLowerCase()));
    if (origin) {
      const o = origin.toLowerCase();
      results = results.filter((l) => `${l.origin.city}, ${l.origin.state}`.toLowerCase().includes(o));
    }
    if (destination) {
      const d = destination.toLowerCase();
      results = results.filter((l) => `${l.destination.city}, ${l.destination.state}`.toLowerCase().includes(d));
    }
    return { items: results };
  }
  return safeFetch('/freight-exchange/search', {
    method: 'POST',
    body: JSON.stringify({ origin, destination, equipment, sources }),
  });
}

export async function postToBoards(loadId, { boards, auctionConfig }) {
  if (isMockMode()) {
    return {
      ok: true,
      postedTo: boards || ['internal'],
      auctionId: `AUC-${Date.now().toString(36).toUpperCase()}`,
      message: `Load ${loadId} posted to ${(boards || ['internal']).join(', ')}`,
    };
  }
  return safeFetch(`/freight-exchange/${encodeURIComponent(loadId)}/post`, {
    method: 'POST',
    body: JSON.stringify({ boards, auctionConfig }),
  });
}

export async function placeBid(loadId, { amount, source }) {
  if (isMockMode()) {
    return {
      ok: true,
      bidId: `BID-${Date.now().toString(36).toUpperCase()}`,
      loadId,
      amount,
      source,
      message: `Bid of $${amount} placed on ${loadId}`,
    };
  }
  return safeFetch(`/freight-exchange/${encodeURIComponent(loadId)}/bid`, {
    method: 'POST',
    body: JSON.stringify({ amount, source }),
  });
}

export async function getBoardConnections() {
  if (isMockMode()) {
    return { items: MOCK_BOARD_CONNECTIONS };
  }
  return safeFetch('/freight-exchange/connections');
}

export async function updateBoardConnection(boardId, config) {
  if (isMockMode()) {
    return { ok: true, boardId, status: 'connected' };
  }
  return safeFetch(`/freight-exchange/connections/${encodeURIComponent(boardId)}`, {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}

export async function testBoardConnection(boardId) {
  if (isMockMode()) {
    return { ok: true, boardId, latencyMs: Math.floor(Math.random() * 200) + 50 };
  }
  return safeFetch(`/freight-exchange/connections/${encodeURIComponent(boardId)}/test`, {
    method: 'POST',
  });
}

// ─── Internal Carrier Bid Tracking ──────────────────────────────────────────

export async function getLoadBids(loadId) {
  if (isMockMode()) {
    return { items: [] };
  }
  return safeFetch(`/api/loads/${encodeURIComponent(loadId)}/bids`);
}

export async function placeCarrierBid(loadId, bidData) {
  if (isMockMode()) {
    return {
      bid: {
        id: `BID-${Date.now().toString(36).toUpperCase()}`,
        loadId,
        ...bidData,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    };
  }
  return safeFetch(`/api/loads/${encodeURIComponent(loadId)}/bids`, {
    method: 'POST',
    body: JSON.stringify(bidData),
  });
}

export async function acceptBid(loadId, bidId) {
  if (isMockMode()) {
    return { bid: { id: bidId, status: 'accepted' } };
  }
  return safeFetch(`/api/loads/${encodeURIComponent(loadId)}/bids/${encodeURIComponent(bidId)}/accept`, {
    method: 'PUT',
  });
}

export async function declineBid(loadId, bidId) {
  if (isMockMode()) {
    return { bid: { id: bidId, status: 'declined' } };
  }
  return safeFetch(`/api/loads/${encodeURIComponent(loadId)}/bids/${encodeURIComponent(bidId)}/decline`, {
    method: 'PUT',
  });
}
