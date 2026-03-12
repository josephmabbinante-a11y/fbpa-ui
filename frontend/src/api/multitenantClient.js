/* global localStorage */

const MT_API_BASE = import.meta.env.VITE_MT_API_URL
  ? import.meta.env.VITE_MT_API_URL.replace(/\/+$/, '')
  : 'http://localhost:4001';

function getMtToken() {
  try {
    return localStorage.getItem('mt_accessToken') || null;
  } catch {
    return null;
  }
}

function setMtToken(token) {
  try {
    localStorage.setItem('mt_accessToken', token);
  } catch { /* ignore */ }
}

function clearMtToken() {
  try {
    localStorage.removeItem('mt_accessToken');
  } catch { /* ignore */ }
}

function getMtImpersonatedTenantId() {
  try {
    return localStorage.getItem('mt_impersonatedTenantId') || null;
  } catch {
    return null;
  }
}

function setMtImpersonatedTenantId(tenantId) {
  try {
    localStorage.setItem('mt_impersonatedTenantId', tenantId);
  } catch { /* ignore */ }
}

function clearMtImpersonatedTenantId() {
  try {
    localStorage.removeItem('mt_impersonatedTenantId');
  } catch { /* ignore */ }
}

async function mtFetch(path, options = {}) {
  const token = getMtToken();
  const impersonateTenantId = getMtImpersonatedTenantId();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(impersonateTenantId ? { 'x-impersonate-tenant': impersonateTenantId } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${MT_API_BASE}${path}`, { ...options, headers });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: payload?.error || payload?.message || `Request failed with status ${res.status}`, status: res.status };
    }
    return payload;
  } catch (err) {
    return { error: err.message || String(err), networkOffline: true };
  }
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function mtLogin(email, password) {
  const result = await mtFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (result.accessToken) {
    setMtToken(result.accessToken);
  }
  return result;
}

export function mtLogout() {
  clearMtToken();
}

export function getMtAccessToken() {
  return getMtToken();
}

// ── Tenants ─────────────────────────────────────────────────────────────────

export async function mtListTenants() {
  return mtFetch('/tenants');
}

export async function mtGetTenant(id) {
  return mtFetch(`/tenants/${encodeURIComponent(id)}`);
}

export async function mtCreateTenant(name) {
  return mtFetch('/tenants', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function mtUpdateTenantStatus(id, status) {
  return mtFetch(`/tenants/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function mtListUsers() {
  return mtFetch('/users');
}

export async function mtCreateUser({ email, password, role }) {
  return mtFetch('/users', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function mtGetSettings() {
  return mtFetch('/settings');
}

export async function mtUpdateSettings(data) {
  return mtFetch('/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ── Features ─────────────────────────────────────────────────────────────────

export async function mtGetFeatures(tenantId) {
  return mtFetch(`/admin/tenant/${encodeURIComponent(tenantId)}/features`);
}

export async function mtSetFeature(tenantId, featureName, enabled) {
  return mtFetch(`/admin/tenant/${encodeURIComponent(tenantId)}/feature`, {
    method: 'PATCH',
    body: JSON.stringify({ featureName, enabled }),
  });
}

// ── Loads ────────────────────────────────────────────────────────────────────

export async function mtListLoads(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  const qs = params.toString();
  return mtFetch(`/loads${qs ? `?${qs}` : ''}`);
}

export async function mtCreateLoad(data) {
  return mtFetch('/loads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Carriers ──────────────────────────────────────────────────────────────────

export async function mtListCarriers() {
  return mtFetch('/carriers');
}

// ── Impersonation (SUPER_ADMIN only) ─────────────────────────────────────────

export async function mtImpersonateTenant(tenantId) {
  const result = await mtFetch('/auth/impersonate', {
    method: 'POST',
    body: JSON.stringify({ tenantId }),
  });
  if (!result.error) {
    setMtImpersonatedTenantId(tenantId);
  }
  return result;
}

export function mtStopImpersonation() {
  clearMtImpersonatedTenantId();
}

export { getMtImpersonatedTenantId, setMtToken, clearMtToken };
