const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_URL = import.meta.env.PROD
  ? ''
  : (RAW_API_URL ? RAW_API_URL.replace(/\/+$/, '') : '');

const laneMileageCache = new Map();

function apiUrl(path) {
  return `${API_URL}${path}`;
}

function normalizeEquipmentType(value) {
  const token = String(value || '').trim().toLowerCase().replaceAll('_', ' ');
  if (!token || token === 'dry van') return 'van';
  return token;
}

function extractZip(location) {
  if (!location) return '';
  if (typeof location === 'string') {
    return location.match(/\b(\d{5})\b/)?.[1] || '';
  }
  const text = [location.zip, location.zipCode, location.postalCode, location.address, location.city, location.label]
    .filter(Boolean)
    .map((value) => String(value))
    .join(' ');
  return text.match(/\b(\d{5})\b/)?.[1] || '';
}

function locationKey(location) {
  if (!location) return 'unknown';
  if (typeof location === 'string') return location.trim().toLowerCase() || 'unknown';
  const city = String(location.city || '').trim().toLowerCase();
  const state = String(location.state || '').trim().toLowerCase();
  const label = String(location.label || '').trim().toLowerCase();
  if (city || state) return `${city}|${state}`;
  if (label) return label;
  return 'unknown';
}

function laneKey(origin, destination, equipmentType) {
  const originPart = extractZip(origin) || locationKey(origin);
  const destinationPart = extractZip(destination) || locationKey(destination);
  return `${originPart}-${destinationPart}-${normalizeEquipmentType(equipmentType)}`;
}

function fallbackEstimateMileage(origin, destination) {
  const laneMap = {
    'Los Angeles, CA|Dallas, TX': 1435,
    'Los Angeles, CA|Houston, TX': 1547,
    'Los Angeles, CA|Miami, FL': 2734,
    'Chicago, IL|Dallas, TX': 945,
    'Chicago, IL|Houston, TX': 1082,
    'Chicago, IL|Miami, FL': 1378,
    'Atlanta, GA|Dallas, TX': 781,
    'Atlanta, GA|Houston, TX': 793,
    'Atlanta, GA|Miami, FL': 663,
  };

  return {
    miles: laneMap[`${origin}|${destination}`] || 900,
    method: 'estimated',
    confidence: 0.45,
  };
}

export async function estimateMileage(origin, destination, equipmentType = 'van') {
  const key = laneKey(origin, destination, equipmentType);
  const cached = laneMileageCache.get(key);
  if (cached) return { ...cached };

  try {
    const response = await fetch(apiUrl('/api/loads/estimate-mileage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, equipmentType }),
    });

    if (response.ok) {
      const payload = await response.json();
      const resolved = {
        miles: Math.max(1, Number(payload?.miles || 0) || 0),
        method: String(payload?.method || 'estimated'),
        confidence: Number(payload?.confidence || 0) || 0,
      };
      if (resolved.miles > 0) {
        laneMileageCache.set(key, resolved);
        return { ...resolved };
      }
    }
  } catch {
  }

  const fallback = fallbackEstimateMileage(origin, destination);
  laneMileageCache.set(key, fallback);
  return { ...fallback };
}
