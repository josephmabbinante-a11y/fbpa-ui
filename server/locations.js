import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const STORE_DIR = path.join(process.cwd(), 'server', 'data');
const STORE_FILE = path.join(STORE_DIR, 'locations-store.json');

const seedLocations = [
  {
    id: 'loc-1001',
    name: 'Phoenix Hub 1',
    address: '101 Phoenix Commerce Dr, Phoenix, AZ 85001',
    locationTypes: 'Pickup',
    locationCodes: 'LOC-1001',
    savingsRate: '4.0%',
    primaryContact: 'Primary Contact',
    primaryPhone: '+1 712-5521-1201',
    branch: 'Shared',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'loc-1002',
    name: 'Dallas Hub 2',
    address: '102 Dallas Commerce Dr, Dallas, TX 75201',
    locationTypes: 'Delivery',
    locationCodes: 'LOC-1002',
    savingsRate: 'No',
    primaryContact: 'Primary Contact',
    primaryPhone: '+1 713-5522-1202',
    branch: 'Main',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'loc-1003',
    name: 'Atlanta Hub 3',
    address: '103 Atlanta Commerce Dr, Atlanta, GA 30301',
    locationTypes: 'Pickup, Delivery',
    locationCodes: 'LOC-1003',
    savingsRate: '5.0%',
    primaryContact: 'Primary Contact',
    primaryPhone: '+1 714-5523-1203',
    branch: 'Shared',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let locations = [...seedLocations];

function persistStore() {
  try {
    if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
    fs.writeFileSync(
      STORE_FILE,
      JSON.stringify({ items: locations, updatedAt: new Date().toISOString() }, null, 2),
      'utf8'
    );
  } catch (err) {
    console.error('[locations] Failed to persist store:', err.message);
  }
}

function hydrateStore() {
  try {
    if (!fs.existsSync(STORE_FILE)) return;
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    if (!raw.trim()) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.items)) {
      locations = parsed.items;
    }
  } catch (err) {
    console.error('[locations] Failed to hydrate store:', err.message);
  }
}

hydrateStore();

function normalizeLocation(payload = {}, previous = {}) {
  const name = String(payload.name ?? previous.name ?? '').trim();
  const address = String(payload.address ?? previous.address ?? '').trim();
  const locationTypes = String(payload.locationTypes ?? previous.locationTypes ?? 'Pickup').trim() || 'Pickup';
  const locationCodes = String(payload.locationCodes ?? previous.locationCodes ?? '').trim();
  const savingsRate = String(payload.savingsRate ?? previous.savingsRate ?? 'No').trim() || 'No';
  const primaryContact = String(payload.primaryContact ?? previous.primaryContact ?? 'Primary Contact').trim() || 'Primary Contact';
  const primaryPhone = String(payload.primaryPhone ?? previous.primaryPhone ?? '').trim();
  const branch = String(payload.branch ?? previous.branch ?? 'Shared').trim() || 'Shared';

  return {
    name,
    address,
    locationTypes,
    locationCodes,
    savingsRate,
    primaryContact,
    primaryPhone,
    branch,
  };
}

router.get('/', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();

  let items = [...locations];
  if (q) {
    items = items.filter((item) =>
      [
        item.name,
        item.address,
        item.locationTypes,
        item.locationCodes,
        item.primaryContact,
        item.primaryPhone,
        item.branch,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }

  items.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  return res.json({ items });
});

router.post('/', (req, res) => {
  const normalized = normalizeLocation(req.body || {});
  if (!normalized.name) return res.status(400).json({ error: 'name is required' });
  if (!normalized.address) return res.status(400).json({ error: 'address is required' });

  const now = new Date().toISOString();
  const location = {
    id: `loc-${Date.now()}`,
    ...normalized,
    locationCodes: normalized.locationCodes || `LOC-${1000 + locations.length + 1}`,
    createdAt: now,
    updatedAt: now,
  };

  locations.unshift(location);
  persistStore();
  return res.status(201).json({ location });
});

router.patch('/:locationId', (req, res) => {
  const idx = locations.findIndex((item) => item.id === req.params.locationId);
  if (idx < 0) return res.status(404).json({ error: 'Location not found' });

  const normalized = normalizeLocation(req.body || {}, locations[idx]);
  if (!normalized.name) return res.status(400).json({ error: 'name is required' });
  if (!normalized.address) return res.status(400).json({ error: 'address is required' });

  locations[idx] = {
    ...locations[idx],
    ...normalized,
    updatedAt: new Date().toISOString(),
  };

  persistStore();
  return res.json({ location: locations[idx] });
});

router.delete('/:locationId', (req, res) => {
  const idx = locations.findIndex((item) => item.id === req.params.locationId);
  if (idx < 0) return res.status(404).json({ error: 'Location not found' });

  const [removed] = locations.splice(idx, 1);
  persistStore();
  return res.json({ removed });
});

export default router;
