/**
 * ID Generation Utilities
 *
 * Naming conventions:
 *   Customer:  CUS-XXXXXX   (10 chars total — prefix + 6-char alphanumeric sequence)
 *   Location:  XXX-YY##     (5–8 chars — city mnemonic + type code + sequence)
 *   Carrier:   CR-XXXXXX    (9 chars total — prefix + 6-char alphanumeric sequence)
 *   Load:      L-######     (up to 8 chars — prefix + 6-digit zero-padded number)
 *
 * Design rules (from industry best practices):
 *   - Fixed-length IDs for UI alignment and database sorting
 *   - Alphanumeric only (A-Z, 0-9), hyphens as separators
 *   - Avoids O/0 and I/1 ambiguity in the random portion
 *   - No special characters that break CSV/URL
 *   - Scalable to 10+ years of growth
 */

// Safe alphabet — excludes O, I, L to prevent confusion with 0, 1
const SAFE_ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const SAFE_ALPHANUM = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generate a random string from a safe character set.
 * @param {number} length
 * @param {string} charset
 * @returns {string}
 */
function randomChars(length, charset = SAFE_ALPHANUM) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

// ── City mnemonic mapping for common US cities ──
const CITY_MNEMONICS = {
  'new york': 'NYC', 'los angeles': 'LAX', 'chicago': 'CHI', 'houston': 'HOU',
  'phoenix': 'PHX', 'philadelphia': 'PHL', 'san antonio': 'SAT', 'san diego': 'SDG',
  'dallas': 'DAL', 'san jose': 'SJC', 'austin': 'AUS', 'jacksonville': 'JAX',
  'fort worth': 'FTW', 'columbus': 'CMH', 'charlotte': 'CLT', 'indianapolis': 'IND',
  'san francisco': 'SFO', 'seattle': 'SEA', 'denver': 'DEN', 'nashville': 'BNA',
  'oklahoma city': 'OKC', 'el paso': 'ELP', 'washington': 'DCA', 'boston': 'BOS',
  'portland': 'PDX', 'las vegas': 'LAS', 'memphis': 'MEM', 'louisville': 'SDF',
  'baltimore': 'BWI', 'milwaukee': 'MKE', 'albuquerque': 'ABQ', 'tucson': 'TUS',
  'fresno': 'FAT', 'sacramento': 'SMF', 'mesa': 'MSA', 'kansas city': 'MCI',
  'atlanta': 'ATL', 'omaha': 'OMA', 'colorado springs': 'COS', 'raleigh': 'RDU',
  'long beach': 'LGB', 'virginia beach': 'VAB', 'miami': 'MIA', 'oakland': 'OAK',
  'minneapolis': 'MSP', 'tulsa': 'TUL', 'tampa': 'TPA', 'arlington': 'ARL',
  'new orleans': 'MSY', 'cleveland': 'CLE', 'honolulu': 'HNL', 'anaheim': 'ANH',
  'cincinnati': 'CVG', 'pittsburgh': 'PIT', 'detroit': 'DTW', 'st louis': 'STL',
  'salt lake city': 'SLC', 'orlando': 'MCO',
};

// Facility type abbreviations
const FACILITY_TYPE_CODES = {
  'warehouse': 'WH',
  'terminal': 'TM',
  'customer': 'CU',
  'cross dock': 'XD',
  'distribution center': 'DC',
  'other': 'OT',
};

/**
 * Derive a 3-letter city mnemonic from city name.
 * Uses known mapping first, falls back to first 3 consonants or chars.
 */
function cityMnemonic(city) {
  if (!city) return 'UNK';
  const key = city.toLowerCase().trim();
  if (CITY_MNEMONICS[key]) return CITY_MNEMONICS[key];
  // Fallback: first 3 uppercase letters (skip short words)
  const clean = key.replace(/[^a-z]/g, '');
  return (clean.slice(0, 3) || 'UNK').toUpperCase();
}

/**
 * Derive a short alpha prefix from a customer name.
 * Takes up to 4 uppercase alpha characters, padded with 'X' if needed.
 * @param {string} name
 * @returns {string} e.g. "ACME", "WALM", "XYZX"
 */
export function deriveCustomerPrefix(name) {
  if (!name) return 'CUST';
  const alpha = name.replace(/[^A-Za-z]/g, '').toUpperCase();
  return (alpha.slice(0, 4) || 'CUST').padEnd(4, 'X');
}

/**
 * Generate a Customer Code: XXXX-NNN (name prefix + sequence).
 * @param {string} prefix - 4-char alpha prefix from deriveCustomerPrefix
 * @param {number} sequence - Next sequence number for this prefix
 * @returns {string} e.g. "ACME-001"
 */
export function generateCustomerCode(prefix, sequence) {
  const seq = String(sequence).padStart(3, '0');
  return `${prefix}-${seq}`;
}

/**
 * Generate a Customer ID: CUS-XXXXXX (legacy fallback)
 * @returns {string} e.g. "CUS-A4K7N2"
 */
export function generateCustomerId() {
  return `CUS-${randomChars(6)}`;
}

/**
 * Generate a Location Code: XXX-YY## (mnemonic format)
 * @param {string} city - City name
 * @param {string} facilityType - Facility type (Warehouse, Terminal, etc.)
 * @param {number} sequence - Optional sequence number (defaults to random 2-digit)
 * @returns {string} e.g. "CHI-WH04" or "DEN-DC01"
 */
export function generateLocationCode(city, facilityType, sequence) {
  const prefix = cityMnemonic(city);
  const typeCode = FACILITY_TYPE_CODES[(facilityType || 'other').toLowerCase()] || 'OT';
  const seq = sequence != null
    ? String(sequence).padStart(2, '0')
    : String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
  return `${prefix}-${typeCode}${seq}`;
}

/**
 * Generate a Location ID: LOC-XXXXXX
 * @returns {string} e.g. "LOC-B7K3M9"
 */
export function generateLocationId() {
  return `LOC-${randomChars(6)}`;
}

/**
 * Generate a Carrier ID from SCAC code, or fall back to CR-XXXXXX.
 * When a SCAC code is provided the carrier ID IS the SCAC code (e.g. "ODFL").
 * @param {string} [scacCode] - Optional SCAC code
 * @returns {string} e.g. "ODFL" or "CR-N4P8K2"
 */
export function generateCarrierId(scacCode) {
  const scac = normalizeScac(scacCode);
  if (scac) return scac;
  return `CR-${randomChars(6)}`;
}

/**
 * Generate a Load ID: L-######
 * @param {number} sequence - Numeric sequence
 * @returns {string} e.g. "L-300042"
 */
export function generateLoadId(sequence) {
  return `L-${String(sequence).padStart(6, '0')}`;
}

/**
 * Validate a SCAC code (Standard Carrier Alpha Code).
 * Must be 2–4 uppercase alpha characters.
 * @param {string} code
 * @returns {boolean}
 */
export function isValidScac(code) {
  if (!code || typeof code !== 'string') return false;
  return /^[A-Z]{2,4}$/.test(code.trim().toUpperCase());
}

/**
 * Normalize a SCAC code to uppercase, trimmed.
 * @param {string} code
 * @returns {string}
 */
export function normalizeScac(code) {
  if (!code || typeof code !== 'string') return '';
  return code.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
}

/**
 * Validate a location code format: AAA-AA## (3-alpha, hyphen, 2-alpha, 2-digit).
 * @param {string} code
 * @returns {boolean}
 */
export function isValidLocationCode(code) {
  if (!code || typeof code !== 'string') return false;
  return /^[A-Z]{2,4}-[A-Z]{2}\d{2}$/.test(code.trim().toUpperCase());
}

export default {
  generateCustomerId,
  deriveCustomerPrefix,
  generateCustomerCode,
  generateLocationCode,
  generateLocationId,
  generateCarrierId,
  generateLoadId,
  isValidScac,
  normalizeScac,
  isValidLocationCode,
  SAFE_ALPHA,
  SAFE_ALPHANUM,
};
