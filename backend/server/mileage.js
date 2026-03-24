import { drivingDistance, geocodeAddress, isGeocodingAvailable } from './geocoding.js';

const cityCoordinates = {
  'los angeles|ca': { lat: 34.0522, lng: -118.2437 },
  'san diego|ca': { lat: 32.7157, lng: -117.1611 },
  'san francisco|ca': { lat: 37.7749, lng: -122.4194 },
  'phoenix|az': { lat: 33.4484, lng: -112.0740 },
  'denver|co': { lat: 39.7392, lng: -104.9903 },
  'dallas|tx': { lat: 32.7767, lng: -96.7970 },
  'houston|tx': { lat: 29.7604, lng: -95.3698 },
  'san antonio|tx': { lat: 29.4241, lng: -98.4936 },
  'chicago|il': { lat: 41.8781, lng: -87.6298 },
  'atlanta|ga': { lat: 33.7490, lng: -84.3880 },
  'miami|fl': { lat: 25.7617, lng: -80.1918 },
  'orlando|fl': { lat: 28.5383, lng: -81.3792 },
  'nashville|tn': { lat: 36.1627, lng: -86.7816 },
  'charlotte|nc': { lat: 35.2271, lng: -80.8431 },
  'newark|nj': { lat: 40.7357, lng: -74.1724 },
  'columbus|oh': { lat: 39.9612, lng: -82.9988 },
  'kansas city|mo': { lat: 39.0997, lng: -94.5786 },
  'seattle|wa': { lat: 47.6062, lng: -122.3321 },
  'portland|or': { lat: 45.5152, lng: -122.6784 },
};

const stateCentroids = {
  AL: { lat: 32.8067, lng: -86.7911 }, AZ: { lat: 34.0489, lng: -111.0937 }, AR: { lat: 35.2010, lng: -91.8318 },
  CA: { lat: 36.7783, lng: -119.4179 }, CO: { lat: 39.5501, lng: -105.7821 }, CT: { lat: 41.6032, lng: -73.0877 },
  DE: { lat: 38.9108, lng: -75.5277 }, FL: { lat: 27.6648, lng: -81.5158 }, GA: { lat: 32.1574, lng: -82.9071 },
  IA: { lat: 41.8780, lng: -93.0977 }, ID: { lat: 44.0682, lng: -114.7420 }, IL: { lat: 40.6331, lng: -89.3985 },
  IN: { lat: 40.2672, lng: -86.1349 }, KS: { lat: 39.0119, lng: -98.4842 }, KY: { lat: 37.8393, lng: -84.2700 },
  LA: { lat: 30.9843, lng: -91.9623 }, MA: { lat: 42.4072, lng: -71.3824 }, MD: { lat: 39.0458, lng: -76.6413 },
  ME: { lat: 45.2538, lng: -69.4455 }, MI: { lat: 44.3148, lng: -85.6024 }, MN: { lat: 46.7296, lng: -94.6859 },
  MO: { lat: 37.9643, lng: -91.8318 }, MS: { lat: 32.3547, lng: -89.3985 }, MT: { lat: 46.8797, lng: -110.3626 },
  NC: { lat: 35.7596, lng: -79.0193 }, ND: { lat: 47.5515, lng: -101.0020 }, NE: { lat: 41.4925, lng: -99.9018 },
  NH: { lat: 43.1939, lng: -71.5724 }, NJ: { lat: 40.0583, lng: -74.4057 }, NM: { lat: 34.5199, lng: -105.8701 },
  NV: { lat: 38.8026, lng: -116.4194 }, NY: { lat: 43.2994, lng: -74.2179 }, OH: { lat: 40.4173, lng: -82.9071 },
  OK: { lat: 35.4676, lng: -97.5164 }, OR: { lat: 43.8041, lng: -120.5542 }, PA: { lat: 41.2033, lng: -77.1945 },
  RI: { lat: 41.5801, lng: -71.4774 }, SC: { lat: 33.8361, lng: -81.1637 }, SD: { lat: 43.9695, lng: -99.9018 },
  TN: { lat: 35.5175, lng: -86.5804 }, TX: { lat: 31.9686, lng: -99.9018 }, UT: { lat: 39.3210, lng: -111.0937 },
  VA: { lat: 37.4316, lng: -78.6569 }, VT: { lat: 44.5588, lng: -72.5778 }, WA: { lat: 47.7511, lng: -120.7401 },
  WI: { lat: 43.7844, lng: -88.7879 }, WV: { lat: 38.5976, lng: -80.4549 }, WY: { lat: 43.0759, lng: -107.2903 },
};

const laneMileageCache = new Map();

function normalizeEquipmentType(value) {
  const token = String(value || '').trim().toLowerCase().replaceAll('_', ' ');
  if (!token || token === 'dry van') return 'van';
  return token;
}

function normalizeLocationText(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function readLocationField(location, key) {
  if (!location || typeof location !== 'object') return '';
  return String(location[key] || '').trim();
}

function extractZip(location) {
  if (!location) return '';
  const fromObject = [
    readLocationField(location, 'zip'),
    readLocationField(location, 'zipCode'),
    readLocationField(location, 'postalCode'),
    readLocationField(location, 'address'),
    readLocationField(location, 'city'),
    readLocationField(location, 'label'),
  ].join(' ');
  const fromString = typeof location === 'string' ? location : '';
  const match = `${fromObject} ${fromString}`.match(/\b(\d{5})\b/);
  return match?.[1] || '';
}

function toLocationKey(location) {
  if (!location) return 'unknown';
  if (typeof location === 'string') return normalizeLocationText(location) || 'unknown';
  const city = normalizeLocationText(readLocationField(location, 'city'));
  const state = normalizeLocationText(readLocationField(location, 'state'));
  const label = normalizeLocationText(readLocationField(location, 'label'));
  if (city || state) return `${city}|${state}`;
  if (label) return label;
  return 'unknown';
}

function hashText(text) {
  let hash = 0;
  const normalized = String(text || 'unknown');
  for (let index = 0; index < normalized.length; index += 1) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pointFromZip(zip) {
  if (!zip) return null;
  const zip3 = Number.parseInt(String(zip).slice(0, 3), 10);
  if (!Number.isFinite(zip3)) return null;
  const lat = 25 + ((999 - zip3) / 999) * 24;
  const lng = -124 + (zip3 / 999) * 57;
  return { lat, lng, source: 'zip', confidence: 0.64 };
}

function pointFromLocation(location) {
  if (!location) return { lat: 39, lng: -95, source: 'fallback', confidence: 0.35 };

  const lat = Number(typeof location === 'object' ? location.lat ?? location.latitude : NaN);
  const lng = Number(typeof location === 'object' ? location.lng ?? location.lon ?? location.longitude : NaN);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng, source: 'lat_lng', confidence: 0.95 };
  }

  const zip = extractZip(location);
  const zipPoint = pointFromZip(zip);
  if (zipPoint) return zipPoint;

  const city = normalizeLocationText(typeof location === 'object' ? readLocationField(location, 'city') : String(location).split(',')[0]);
  const stateFromObject = normalizeLocationText(typeof location === 'object' ? readLocationField(location, 'state') : '');
  const stateFromString = normalizeLocationText(String(location).toUpperCase().match(/,\s*([A-Z]{2})\b/)?.[1] || '');
  const state = (stateFromObject || stateFromString).toUpperCase();

  const cityStateKey = `${city}|${state.toLowerCase()}`;
  if (cityCoordinates[cityStateKey]) {
    return { ...cityCoordinates[cityStateKey], source: 'city_state', confidence: 0.84 };
  }

  if (state && stateCentroids[state]) {
    return { ...stateCentroids[state], source: 'state', confidence: 0.72 };
  }

  const textKey = toLocationKey(location);
  const hash = hashText(textKey);
  const fallbackLat = 27 + ((hash % 1700) / 1700) * 20;
  const fallbackLng = -121 + ((hash % 2900) / 2900) * 50;
  return { lat: fallbackLat, lng: fallbackLng, source: 'fallback', confidence: 0.4 };
}

function toRadians(value) {
  return value * (Math.PI / 180);
}

function haversineMiles(originPoint, destinationPoint) {
  const earthRadiusMiles = 3958.8;
  const lat1 = toRadians(originPoint.lat);
  const lat2 = toRadians(destinationPoint.lat);
  const deltaLat = lat2 - lat1;
  const deltaLng = toRadians(destinationPoint.lng - originPoint.lng);

  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

function roadFactorForMiles(miles, equipmentType) {
  const normalizedEquipment = normalizeEquipmentType(equipmentType);
  const base = miles < 150 ? 1.23 : miles < 400 ? 1.19 : 1.15;
  const equipmentFactor = normalizedEquipment === 'reefer'
    ? 0.015
    : normalizedEquipment === 'flatbed'
      ? 0.01
      : normalizedEquipment === 'power only'
        ? -0.005
        : 0;
  return base + equipmentFactor;
}

export function buildMileageLaneKey(origin, destination, equipmentType) {
  const normalizedEquipment = normalizeEquipmentType(equipmentType);
  const originZip = extractZip(origin);
  const destinationZip = extractZip(destination);
  const originKey = originZip || toLocationKey(origin);
  const destinationKey = destinationZip || toLocationKey(destination);
  return `${originKey}-${destinationKey}-${normalizedEquipment}`;
}

export function estimateMileage(origin, destination, equipmentType = 'van') {
  const laneKey = buildMileageLaneKey(origin, destination, equipmentType);
  const cached = laneMileageCache.get(laneKey);
  if (cached) {
    return { ...cached, laneKey };
  }

  const originPoint = pointFromLocation(origin);
  const destinationPoint = pointFromLocation(destination);
  const straightLineMiles = Math.max(0, haversineMiles(originPoint, destinationPoint));
  const factor = roadFactorForMiles(straightLineMiles, equipmentType);
  const miles = Math.max(25, Math.round(straightLineMiles * factor));
  const method = originPoint.source === 'lat_lng' && destinationPoint.source === 'lat_lng'
    ? 'route-based'
    : 'estimated';
  const confidence = Number(Math.max(0.35, Math.min(0.99, Math.min(originPoint.confidence, destinationPoint.confidence))).toFixed(2));

  const result = {
    miles,
    method,
    confidence,
    laneKey,
  };

  laneMileageCache.set(laneKey, result);
  return result;
}

/**
 * Async mileage estimation — tries Google Distance Matrix first, falls
 * back to the synchronous haversine estimator when the API is unavailable.
 */
export async function estimateMileageAsync(origin, destination, equipmentType = 'van') {
  const laneKey = buildMileageLaneKey(origin, destination, equipmentType);
  const cached = laneMileageCache.get(laneKey);
  if (cached) return { ...cached, laneKey };

  // Attempt Google Distance Matrix
  if (isGeocodingAvailable()) {
    const originText = toLocationLabel(origin);
    const destText = toLocationLabel(destination);
    const google = await drivingDistance(originText, destText);
    if (google && google.miles > 0) {
      const result = {
        miles: Math.max(25, google.miles),
        method: google.method,
        confidence: google.confidence,
        durationMinutes: google.durationMinutes,
        laneKey,
      };
      laneMileageCache.set(laneKey, result);
      return result;
    }
  }

  // Fallback to haversine
  return estimateMileage(origin, destination, equipmentType);
}

/**
 * Async geocode — resolves an address/city-state string to lat/lng.
 * Returns null when the API is unavailable.
 */
export async function geocodeLocationAddress(address) {
  if (!isGeocodingAvailable()) return null;
  return geocodeAddress(address);
}

/**
 * Build a human-readable location label for the Distance Matrix API.
 */
function toLocationLabel(location) {
  if (!location) return '';
  if (typeof location === 'string') return location;
  const city = readLocationField(location, 'city');
  const state = readLocationField(location, 'state');
  const zip = readLocationField(location, 'zip') || readLocationField(location, 'zipCode');
  const address = readLocationField(location, 'address');
  if (address && city && state) return `${address}, ${city}, ${state}${zip ? ` ${zip}` : ''}`;
  if (city && state) return `${city}, ${state}${zip ? ` ${zip}` : ''}`;
  if (readLocationField(location, 'label')) return readLocationField(location, 'label');
  return '';
}
