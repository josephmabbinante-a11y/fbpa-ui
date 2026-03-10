const DEFAULT_TIMEOUT_MS = 7000;
const MIN_TIMEOUT_MS = 5000;
const MAX_TIMEOUT_MS = 8000;
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_OPEN_MS = 60000;
const MAX_RETRIES = 2;

const circuitState = {
  state: 'CLOSED',
  consecutiveFailures: 0,
  openedAt: null,
  lastError: '',
};

function now() {
  return Date.now();
}

function clampTimeout(timeoutMs) {
  const parsed = Number(timeoutMs || DEFAULT_TIMEOUT_MS);
  if (!Number.isFinite(parsed)) return DEFAULT_TIMEOUT_MS;
  return Math.max(MIN_TIMEOUT_MS, Math.min(MAX_TIMEOUT_MS, parsed));
}

function createError(message, status, details = {}) {
  const err = new Error(message);
  err.status = status;
  err.details = details;
  return err;
}

function getEndpoint() {
  return String(process.env.SAIA_RATE_QUOTE_URL || '').trim();
}

function getSubscriptionKey() {
  return String(process.env.SAIA_SUBSCRIPTION_KEY || '').trim();
}

function buildAuthHeader() {
  const username = String(process.env.SAIA_API_USERNAME || '').trim();
  const password = String(process.env.SAIA_API_PASSWORD || '').trim();
  if (!username || !password) return null;
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

function shouldRetry(errorOrStatus) {
  const status = Number(errorOrStatus?.status || errorOrStatus || 0);
  if (!status) return true;
  if (status === 400 || status === 401 || status === 403) return false;
  return status >= 500;
}

function recordFailure(message) {
  circuitState.consecutiveFailures += 1;
  circuitState.lastError = String(message || 'Unknown Saia error');
  if (circuitState.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
    circuitState.state = 'OPEN';
    circuitState.openedAt = now();
  }
}

function recordSuccess() {
  circuitState.state = 'CLOSED';
  circuitState.consecutiveFailures = 0;
  circuitState.openedAt = null;
  circuitState.lastError = '';
}

function assertCircuitReady() {
  if (circuitState.state !== 'OPEN') return;
  const elapsed = now() - Number(circuitState.openedAt || 0);
  if (elapsed >= CIRCUIT_OPEN_MS) {
    circuitState.state = 'HALF_OPEN';
    return;
  }
  throw createError('Saia circuit breaker is OPEN', 503, {
    code: 'CARRIER_CIRCUIT_OPEN',
    retryAfterMs: Math.max(0, CIRCUIT_OPEN_MS - elapsed),
  });
}

function mapCarrierError(status, fallbackMessage) {
  if (status === 401) return createError('Saia authentication failed (401)', 401, { code: 'SAIA_AUTH_INVALID' });
  if (status === 403) return createError('Saia subscription invalid or unauthorized (403)', 403, { code: 'SAIA_SUBSCRIPTION_INVALID' });
  if (status === 400) return createError('Saia payload validation failed (400)', 400, { code: 'SAIA_PAYLOAD_INVALID' });
  if (status >= 500) return createError('Saia carrier service unavailable (500)', 502, { code: 'SAIA_CARRIER_OUTAGE' });
  return createError(fallbackMessage || `Saia request failed with status ${status}`, status || 500, { code: 'SAIA_REQUEST_FAILED' });
}

export function getSaiaCircuitState() {
  return {
    state: circuitState.state,
    consecutiveFailures: circuitState.consecutiveFailures,
    openedAt: circuitState.openedAt,
    lastError: circuitState.lastError,
  };
}
export async function requestSaiaRateQuote(payload, options = {}) {
  assertCircuitReady();

  const endpoint = getEndpoint();
  const subscriptionKey = getSubscriptionKey();
  const timeoutMs = clampTimeout(process.env.SAIA_TIMEOUT_MS || options.timeoutMs);

  if (!endpoint) {
    throw createError('SAIA_RATE_QUOTE_URL is not configured', 500, { code: 'SAIA_ENDPOINT_MISSING' });
  }
  if (!subscriptionKey) {
    throw createError('SAIA_SUBSCRIPTION_KEY is not configured', 500, { code: 'SAIA_KEY_MISSING' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': subscriptionKey,
  };
  const authHeader = buildAuthHeader();
  if (authHeader) {
    headers.Authorization = authHeader;
  }

  let attempt = 0;
  let lastError = null;

  while (attempt <= MAX_RETRIES) {
    attempt += 1;
    const controller = new AbortController();
    const timeoutRef = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = now();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload || {}),
        signal: controller.signal,
      });
      const responseTimeMs = now() - startedAt;
      clearTimeout(timeoutRef);

      let responseBody = null;
      try {
        responseBody = await response.json();
      } catch {
        responseBody = null;
      }

      if (!response.ok) {
        const carrierError = mapCarrierError(response.status, responseBody?.message);
        carrierError.responseBody = responseBody;
        carrierError.responseTimeMs = responseTimeMs;
        throw carrierError;
      }

      recordSuccess();
      return {
        status: response.status,
        responseTimeMs,
        data: responseBody,
      };
    } catch (err) {
      clearTimeout(timeoutRef);
      const isTimeout = err?.name === 'AbortError';
      const normalizedError = isTimeout
        ? createError(`Saia request timed out after ${timeoutMs}ms`, 504, { code: 'SAIA_TIMEOUT' })
        : err;

      lastError = normalizedError;
      if (!shouldRetry(normalizedError) || attempt > MAX_RETRIES) {
        recordFailure(normalizedError.message);
        if (circuitState.state === 'HALF_OPEN') {
          circuitState.state = 'OPEN';
          circuitState.openedAt = now();
        }
        throw normalizedError;
      }
    }
  }

  recordFailure(lastError?.message || 'Saia request failed');
  throw lastError || createError('Unknown Saia error', 500, { code: 'SAIA_UNKNOWN' });
}
