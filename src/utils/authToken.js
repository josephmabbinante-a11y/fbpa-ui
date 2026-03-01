const TOKEN_KEY = 'accessToken';
const INVALID_VALUES = new Set(['', 'null', 'undefined']);

let memoryToken = null;

function normalizeToken(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (INVALID_VALUES.has(trimmed)) return null;
  return trimmed;
}

export function getAccessToken() {
  try {
    const stored = normalizeToken(localStorage.getItem(TOKEN_KEY));
    if (stored) {
      memoryToken = stored;
      return stored;
    }
  } catch {
    // localStorage might be blocked.
  }

  try {
    const stored = normalizeToken(sessionStorage.getItem(TOKEN_KEY));
    if (stored) {
      memoryToken = stored;
      return stored;
    }
  } catch {
    // sessionStorage might be blocked.
  }

  return normalizeToken(memoryToken);
}

export function setAccessToken(token) {
  const normalized = normalizeToken(token);
  if (!normalized) return false;

  memoryToken = normalized;

  try {
    localStorage.setItem(TOKEN_KEY, normalized);
  } catch {
    // localStorage might be blocked.
  }

  try {
    sessionStorage.setItem(TOKEN_KEY, normalized);
  } catch {
    // sessionStorage might be blocked.
  }

  return true;
}

export function clearAccessToken() {
  memoryToken = null;

  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage might be blocked.
  }

  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // sessionStorage might be blocked.
  }
}

