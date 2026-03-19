import { getAccessToken } from '../utils/authToken';

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

let mockStore = [];

async function safeFetch(path, options) {
  try {
    const token = getAccessToken();
    const res = await fetch(apiUrl(path), {
      ...(options || {}),
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export async function getLocation(id) {
  if (!id) return { error: 'Location id is required' };
  if (shouldUseMockLocations()) {
    const found = mockStore.find((loc) => loc.id === id);
    return found || { error: 'Not found' };
  }
  return safeFetch(`/api/locations/${encodeURIComponent(id)}`);
}

export async function updateLocation(id, payload = {}) {
  if (!id) return { error: 'Location id is required' };
  if (shouldUseMockLocations()) {
    const idx = mockStore.findIndex((loc) => loc.id === id);
    if (idx === -1) return { error: 'Not found' };
    mockStore[idx] = { ...mockStore[idx], ...payload, updatedAt: new Date().toISOString() };
    return mockStore[idx];
  }
  return safeFetch(`/api/locations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
