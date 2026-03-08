export const SAIA_ACCESSORIAL_CODE_MAP = {
  LIFTGATE: 'LFT',
  RESIDENTIAL: 'RES',
  LIMITED_ACCESS: 'LTD',
  INSIDE_DELIVERY: 'INS',
  APPOINTMENT: 'APT',
};

const SERVICE_TYPE_MAP = {
  standard: 'STD',
  guaranteed: 'GTD',
};

function normalizeToken(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_');
}

export function mapAccessorialCodes(accessorials = []) {
  if (!Array.isArray(accessorials)) return [];
  return accessorials
    .map((code) => SAIA_ACCESSORIAL_CODE_MAP[normalizeToken(code)])
    .filter(Boolean);
}

export function mapServiceType(serviceType) {
  const normalized = String(serviceType || 'standard').trim().toLowerCase();
  return SERVICE_TYPE_MAP[normalized] || SERVICE_TYPE_MAP.standard;
}

export function toPositiveNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function toMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}
