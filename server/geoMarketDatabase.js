export const GEO_DATABASE_VERSION = 'us48_zip3_regions_v1';

export const CONTINENTAL_STATES = [
  { code: 'AL', name: 'Alabama', region: 'Southeast', defaultZip3: '352' },
  { code: 'AZ', name: 'Arizona', region: 'Southwest', defaultZip3: '850' },
  { code: 'AR', name: 'Arkansas', region: 'South Central', defaultZip3: '722' },
  { code: 'CA', name: 'California', region: 'West', defaultZip3: '900' },
  { code: 'CO', name: 'Colorado', region: 'Mountain', defaultZip3: '802' },
  { code: 'CT', name: 'Connecticut', region: 'Northeast', defaultZip3: '061' },
  { code: 'DE', name: 'Delaware', region: 'Mid-Atlantic', defaultZip3: '198' },
  { code: 'FL', name: 'Florida', region: 'Southeast', defaultZip3: '331' },
  { code: 'GA', name: 'Georgia', region: 'Southeast', defaultZip3: '303' },
  { code: 'ID', name: 'Idaho', region: 'Mountain', defaultZip3: '837' },
  { code: 'IL', name: 'Illinois', region: 'Midwest', defaultZip3: '606' },
  { code: 'IN', name: 'Indiana', region: 'Midwest', defaultZip3: '462' },
  { code: 'IA', name: 'Iowa', region: 'Midwest', defaultZip3: '503' },
  { code: 'KS', name: 'Kansas', region: 'Plains', defaultZip3: '661' },
  { code: 'KY', name: 'Kentucky', region: 'Southeast', defaultZip3: '402' },
  { code: 'LA', name: 'Louisiana', region: 'South Central', defaultZip3: '701' },
  { code: 'ME', name: 'Maine', region: 'Northeast', defaultZip3: '041' },
  { code: 'MD', name: 'Maryland', region: 'Mid-Atlantic', defaultZip3: '212' },
  { code: 'MA', name: 'Massachusetts', region: 'Northeast', defaultZip3: '021' },
  { code: 'MI', name: 'Michigan', region: 'Midwest', defaultZip3: '482' },
  { code: 'MN', name: 'Minnesota', region: 'Midwest', defaultZip3: '554' },
  { code: 'MS', name: 'Mississippi', region: 'Southeast', defaultZip3: '392' },
  { code: 'MO', name: 'Missouri', region: 'Midwest', defaultZip3: '631' },
  { code: 'MT', name: 'Montana', region: 'Mountain', defaultZip3: '591' },
  { code: 'NE', name: 'Nebraska', region: 'Plains', defaultZip3: '681' },
  { code: 'NV', name: 'Nevada', region: 'West', defaultZip3: '891' },
  { code: 'NH', name: 'New Hampshire', region: 'Northeast', defaultZip3: '031' },
  { code: 'NJ', name: 'New Jersey', region: 'Mid-Atlantic', defaultZip3: '071' },
  { code: 'NM', name: 'New Mexico', region: 'Southwest', defaultZip3: '871' },
  { code: 'NY', name: 'New York', region: 'Northeast', defaultZip3: '100' },
  { code: 'NC', name: 'North Carolina', region: 'Southeast', defaultZip3: '282' },
  { code: 'ND', name: 'North Dakota', region: 'Plains', defaultZip3: '581' },
  { code: 'OH', name: 'Ohio', region: 'Midwest', defaultZip3: '441' },
  { code: 'OK', name: 'Oklahoma', region: 'South Central', defaultZip3: '731' },
  { code: 'OR', name: 'Oregon', region: 'West', defaultZip3: '972' },
  { code: 'PA', name: 'Pennsylvania', region: 'Northeast', defaultZip3: '191' },
  { code: 'RI', name: 'Rhode Island', region: 'Northeast', defaultZip3: '029' },
  { code: 'SC', name: 'South Carolina', region: 'Southeast', defaultZip3: '292' },
  { code: 'SD', name: 'South Dakota', region: 'Plains', defaultZip3: '571' },
  { code: 'TN', name: 'Tennessee', region: 'Southeast', defaultZip3: '372' },
  { code: 'TX', name: 'Texas', region: 'South Central', defaultZip3: '752' },
  { code: 'UT', name: 'Utah', region: 'Mountain', defaultZip3: '841' },
  { code: 'VT', name: 'Vermont', region: 'Northeast', defaultZip3: '054' },
  { code: 'VA', name: 'Virginia', region: 'Mid-Atlantic', defaultZip3: '232' },
  { code: 'WA', name: 'Washington', region: 'West', defaultZip3: '981' },
  { code: 'WV', name: 'West Virginia', region: 'Mid-Atlantic', defaultZip3: '253' },
  { code: 'WI', name: 'Wisconsin', region: 'Midwest', defaultZip3: '532' },
  { code: 'WY', name: 'Wyoming', region: 'Mountain', defaultZip3: '820' },
];

export const ZIP3_REGION_BANDS = [
  { start: 0, end: 99, region: 'Northeast' },
  { start: 100, end: 199, region: 'Northeast' },
  { start: 200, end: 299, region: 'Mid-Atlantic' },
  { start: 300, end: 399, region: 'Southeast' },
  { start: 400, end: 499, region: 'Midwest' },
  { start: 500, end: 599, region: 'Midwest' },
  { start: 600, end: 699, region: 'South Central' },
  { start: 700, end: 799, region: 'South Central' },
  { start: 800, end: 899, region: 'Mountain' },
  { start: 900, end: 999, region: 'West' },
];

export function resolveMarketRegionByZip3(zip3) {
  const numeric = Number.parseInt(String(zip3 || '').replace(/\D/g, '').slice(0, 3), 10);
  if (!Number.isFinite(numeric)) return null;
  const band = ZIP3_REGION_BANDS.find((entry) => numeric >= entry.start && numeric <= entry.end);
  return band?.region || null;
}

export function resolveStateByCode(stateCode) {
  const normalized = String(stateCode || '').trim().toUpperCase();
  return CONTINENTAL_STATES.find((state) => state.code === normalized) || null;
}

export function getGeoCoverageSummary() {
  return {
    geo_database_version: GEO_DATABASE_VERSION,
    states_count: CONTINENTAL_STATES.length,
    zip3_coverage: 1000,
    market_regions: [...new Set(ZIP3_REGION_BANDS.map((entry) => entry.region))],
  };
}
