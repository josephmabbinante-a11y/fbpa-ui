import { mockLocations } from '../mock/mockLocations';

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

let forceMockFromNetwork = false;

function shouldUseMockLocations() {
  // Only use mock locations if mock mode is enabled
  return isMockMode() || forceMockFromNetwork;
}

function buildMockLocations() {
  if (!isMockMode()) return [];
  return mockLocations.slice(0, 24).map((entry, index) => {
    const n = index + 1;
    return {
      id: `loc-${n}`,
      name: `${entry.city} Hub ${n}`,
      address: `${100 + n} ${entry.city} Commerce Dr, ${entry.city}, ${entry.state} ${entry.zip}`,
      locationTypes: n % 3 === 0 ? 'Pickup, Delivery' : n % 2 === 0 ? 'Delivery' : 'Pickup',
      locationCodes: `LOC-${String(1000 + n)}`,
      savingsRate: n % 4 === 0 ? 'No' : `${(2 + (n % 6)).toFixed(1)}%`,
      primaryContact: 'Primary Contact',
      primaryPhone: n % 5 === 0 ? '' : `+1 7${(10 + n).toString().padStart(2, '0')}-55${(20 + n).toString().padStart(2, '0')}-${(1200 + n).toString().slice(-4)}`,
      branch: n % 2 === 0 ? 'Shared' : 'Main',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

let mockStore = buildMockLocations();

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
      };
    }

    forceMockFromNetwork = false;
    return payload;
  } catch (err) {
    forceMockFromNetwork = true;
    return { error: err.message || String(err), networkOffline: true };
  }
}

export async function listLocations(filters = {}) {
  if (shouldUseMockLocations()) {
    const q = String(filters.q || '').trim().toLowerCase();
    const items = q
      ? mockStore.filter((item) =>
        [item.name, item.address, item.locationTypes, item.locationCodes, item.primaryContact, item.primaryPhone, item.branch]
          .some((value) => String(value || '').toLowerCase().includes(q))
      )
      : mockStore;
    return { items };
  }

  const q = String(filters.q || '').trim();
  const query = q ? `?q=${encodeURIComponent(q)}` : '';
  const result = await safeFetch(`/api/locations${query}`);
  if (result?.networkOffline) return listLocations(filters);
  return result;
}

export async function createLocation(payload = {}) {
  if (shouldUseMockLocations()) {
    const name = String(payload.name || '').trim();
    const address = String(payload.address || '').trim();
    if (!name) return { error: 'name is required' };
    if (!address) return { error: 'address is required' };

    const now = new Date().toISOString();
    const location = {
      id: `loc-${Date.now()}`,
      name,
      address,
      locationTypes: String(payload.locationTypes || 'Pickup').trim() || 'Pickup',
      locationCodes: String(payload.locationCodes || '').trim() || `LOC-${1000 + mockStore.length + 1}`,
      savingsRate: String(payload.savingsRate || 'No').trim() || 'No',
      primaryContact: String(payload.primaryContact || 'Primary Contact').trim() || 'Primary Contact',
      primaryPhone: String(payload.primaryPhone || '').trim(),
      branch: String(payload.branch || 'Shared').trim() || 'Shared',
      createdAt: now,
      updatedAt: now,
    };

    mockStore = [location, ...mockStore];
    return { location };
  }

  const result = await safeFetch('/api/locations', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
  if (result?.networkOffline) return createLocation(payload);
  return result;
}
