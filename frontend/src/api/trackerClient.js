const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_URL = import.meta.env.PROD
  ? ''
  : (RAW_API_URL ? RAW_API_URL.replace(/\/+$/, '') : '');

function apiUrl(path) {
  return `${API_URL}${path}`;
}

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
        error: payload?.error || `Request failed with ${res.status}`,
        status: res.status,
      };
    }

    return payload;
  } catch (err) {
    return {
      error: err.message || String(err),
      networkOffline: true,
    };
  }
}

export async function getLoadTracker(loadId) {
  if (!loadId) return { error: 'loadId is required' };
  return safeFetch(`/api/tracker/loads/${encodeURIComponent(loadId)}`);
}

export async function listTrackedLoads(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', String(filters.q));
  if (filters.includeInactive !== undefined) params.set('includeInactive', String(filters.includeInactive));
  const query = params.toString();
  return safeFetch(`/api/tracker/loads${query ? `?${query}` : ''}`);
}

export async function startLoadTracker(loadId, payload = {}) {
  if (!loadId) return { error: 'loadId is required' };
  return safeFetch(`/api/tracker/loads/${encodeURIComponent(loadId)}/start`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function pingLoadTracker(loadId) {
  if (!loadId) return { error: 'loadId is required' };
  return safeFetch(`/api/tracker/loads/${encodeURIComponent(loadId)}/ping`, {
    method: 'POST',
  });
}

export async function stopLoadTracker(loadId) {
  if (!loadId) return { error: 'loadId is required' };
  return safeFetch(`/api/tracker/loads/${encodeURIComponent(loadId)}/stop`, {
    method: 'POST',
  });
}

export async function resetLoadTracker(loadId) {
  if (!loadId) return { error: 'loadId is required' };
  return safeFetch(`/api/tracker/loads/${encodeURIComponent(loadId)}/reset`, {
    method: 'POST',
  });
}
