/**
 * Google Maps Geocoding + Distance Matrix service.
 *
 * Uses the server-side GOOGLE_MAPS_API_KEY env var so the key is never
 * exposed to the browser.  Falls back to the existing haversine estimator
 * when no key is configured or the API call fails.
 */

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const DISTANCE_MATRIX_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';
const TIMEZONE_URL = 'https://maps.googleapis.com/maps/api/timezone/json';

// ── In-memory caches ────────────────────────────────────────────────
const geocodeCache = new Map();
const distanceCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

function getApiKey() {
  return (
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    ''
  );
}

export function isGeocodingAvailable() {
  return !!getApiKey();
}

// ── Geocode: address → { lat, lng, formattedAddress } ───────────────

function geocodeCacheKey(address) {
  return String(address || '').trim().toLowerCase();
}

export async function geocodeAddress(address) {
  const key = getApiKey();
  if (!key) return null;

  const normalised = String(address || '').trim();
  if (!normalised) return null;

  const cacheKey = geocodeCacheKey(normalised);
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.value;

  const url = new URL(GEOCODE_URL);
  url.searchParams.set('address', normalised);
  url.searchParams.set('key', key);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) return null;

    const result = data.results[0];
    const loc = result.geometry?.location;
    if (!loc) return null;

    const comps = result.address_components || [];
    const get = (type) =>
      comps.find((c) => c.types.includes(type))?.long_name || '';
    const getShort = (type) =>
      comps.find((c) => c.types.includes(type))?.short_name || '';

    const value = {
      lat: loc.lat,
      lng: loc.lng,
      formattedAddress: result.formatted_address || normalised,
      city:
        get('locality') ||
        get('sublocality_level_1') ||
        get('administrative_area_level_2') ||
        '',
      state: getShort('administrative_area_level_1'),
      zip: get('postal_code'),
      county: get('administrative_area_level_2'),
      country: getShort('country'),
    };

    geocodeCache.set(cacheKey, { value, ts: Date.now() });
    return value;
  } catch {
    return null;
  }
}

// ── Reverse Geocode: lat/lng → address detail ─────────────────────

export async function reverseGeocode(lat, lng) {
  const key = getApiKey();
  if (!key) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.value;

  const url = new URL(GEOCODE_URL);
  url.searchParams.set('latlng', `${lat},${lng}`);
  url.searchParams.set('key', key);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) return null;

    const result = data.results[0];
    const comps = result.address_components || [];
    const get = (type) =>
      comps.find((c) => c.types.includes(type))?.long_name || '';
    const getShort = (type) =>
      comps.find((c) => c.types.includes(type))?.short_name || '';

    const value = {
      lat,
      lng,
      formattedAddress: result.formatted_address || '',
      city:
        get('locality') ||
        get('sublocality_level_1') ||
        get('administrative_area_level_2') ||
        '',
      state: getShort('administrative_area_level_1'),
      zip: get('postal_code'),
      country: getShort('country'),
    };

    geocodeCache.set(cacheKey, { value, ts: Date.now() });
    return value;
  } catch {
    return null;
  }
}

// ── Distance Matrix: driving distance in miles ────────────────────

function distanceCacheKey(originText, destText) {
  return `${String(originText).trim().toLowerCase()}|${String(destText).trim().toLowerCase()}`;
}

/**
 * Compute real driving distance in miles between two place descriptions.
 *
 * @param {string} originText   — "City, State" / full address / "lat,lng"
 * @param {string} destText     — same
 * @returns {{ miles: number, durationMinutes: number, method: string, confidence: number } | null}
 */
export async function drivingDistance(originText, destText) {
  const key = getApiKey();
  if (!key) return null;

  const origin = String(originText || '').trim();
  const dest = String(destText || '').trim();
  if (!origin || !dest) return null;

  const cKey = distanceCacheKey(origin, dest);
  const cached = distanceCache.get(cKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.value;

  const url = new URL(DISTANCE_MATRIX_URL);
  url.searchParams.set('origins', origin);
  url.searchParams.set('destinations', dest);
  url.searchParams.set('units', 'imperial');
  url.searchParams.set('key', key);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json();
    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') return null;

    const meters = element.distance?.value;
    const seconds = element.duration?.value;
    if (!Number.isFinite(meters)) return null;

    const value = {
      miles: Math.round(meters / 1609.344),
      durationMinutes: Number.isFinite(seconds) ? Math.round(seconds / 60) : null,
      method: 'google-distance-matrix',
      confidence: 0.99,
    };

    distanceCache.set(cKey, { value, ts: Date.now() });
    return value;
  } catch {
    return null;
  }
}

// ── Timezone lookup: lat/lng → IANA timezone ────────────────────────

const timezoneCache = new Map();

export async function lookupTimezone(lat, lng) {
  const key = getApiKey();
  if (!key) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const cacheKey = `tz:${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = timezoneCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.value;

  const url = new URL(TIMEZONE_URL);
  url.searchParams.set('location', `${lat},${lng}`);
  url.searchParams.set('timestamp', Math.floor(Date.now() / 1000).toString());
  url.searchParams.set('key', key);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 'OK' || !data.timeZoneId) return null;

    const value = data.timeZoneId;
    timezoneCache.set(cacheKey, { value, ts: Date.now() });
    return value;
  } catch {
    return null;
  }
}

// ── Freight region derivation from state code ─────────────────────

const FREIGHT_REGIONS = {
  Northeast: ['CT', 'DE', 'MA', 'MD', 'ME', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT', 'DC'],
  Southeast: ['AL', 'FL', 'GA', 'KY', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'],
  Midwest: ['IA', 'IL', 'IN', 'KS', 'MI', 'MN', 'MO', 'ND', 'NE', 'OH', 'SD', 'WI'],
  Southwest: ['AZ', 'NM', 'OK', 'TX'],
  West: ['CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY', 'AK'],
  // Canadian regions
  'Eastern Canada': ['ON', 'QC', 'NB', 'NS', 'PE', 'NL'],
  'Western Canada': ['AB', 'BC', 'MB', 'SK', 'NT', 'NU', 'YT'],
};

export function deriveFreightRegion(stateCode) {
  const s = String(stateCode || '').trim().toUpperCase();
  for (const [region, states] of Object.entries(FREIGHT_REGIONS)) {
    if (states.includes(s)) return region;
  }
  return '';
}
