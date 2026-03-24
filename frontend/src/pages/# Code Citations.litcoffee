# Code Citations

## License: unknown
https://github.com/Thiti-Dev/scraping-gateways/blob/7751be04cb07fee411a694657099b67c36b2258a/src/controllers/cores.ts

```
Now I have all the context I need. Let me provide the complete implementation.

---

Here are all the files to create and modify. Since I'm in read-only mode, I'll provide each as a code block.

## 1. NEW FILE: `frontend/src/api/boardIntegrationClient.js`

```js
// frontend/src/api/boardIntegrationClient.js
import { apiUrl } from './apiUrl';

async function safeFetch(path, options = {}) {
  try {
    const res = await fetch(apiUrl(path), {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { error: data?.error || `Request failed (${res.status})` };
    return data || {};
  } catch (err) {
    return { error: err?.message || 'Network error' };
  }
}

const BOARD_CONFIGS_KEY = 'fbpa-board-connections-v1';

function isMockMode() {
  return (
    import.meta.env.VITE_MOCK_MODE === 'true' ||
    (typeof window !== 'undefined' && localStorage.getItem('demoMode') === 'true')
  );
}

// ─── Mock data for demo mode ────────────────────────────────────────────────

const MOCK_EXTERNAL_LOADS = [
  {
    id: 'DAT-881204',
    source: 'dat',
    origin: { city: 'Nashville', state: 'TN' },
    destination: { city: 'Charlotte', state: 'NC' },
    miles: 410,
    equipment: 'Dry Van',
    weight: '38,000 lbs',
    rate: '$1,230',
    postedAt: '2026-03-18T09:22:00Z',
    status: 'Open',
    commodity: 'Consumer Goods',
    contact: 'DAT Broker #4412',
  },
  {
    id: 'DAT-881210',
    source: 'dat',
    origin: { city: 'Memphis', state: 'TN' },
    destination: { city: 'Miami', state: 'FL' },
    miles: 880,
    equipment: 'Reefer',
    weight: '41,000 lbs',
    rate: '$2,640',
    postedAt: '2026-03-18T08:15:00Z',
    status: 'Open',
    commodity: 'Frozen Foods',
    contact: 'DAT Broker #7801',
  },
  {
    id: 'TS-440291',
    source: 'truckstop',
    origin: { city: 'Indianapolis', state: 'IN' },
    destination: { city: 'Dallas', state: 'TX' },
    miles: 870,
    equipment: 'Flatbed',
    weight: '44,000 lbs',
    rate: '$2,180',
    postedAt: '2026-03-18T10:05:00Z',
    status: 'Open',
    commodity: 'Steel Beams',
    contact: 'TS Broker #1155',
  },
  {
    id: 'TS-440305',
    source: 'truckstop',
    origin: { city: 'Chicago', state: 'IL' },
    destination: { city: 'Denver', state: 'CO' },
    miles: 1004,
    equipment: 'Dry Van',
    weight: '36,500 lbs',
    rate: '$1,910',
    postedAt: '2026-03-18T07:40:00Z',
    status: 'Open',
    commodity: 'Auto Parts',
    contact: 'TS Broker #2290',
  },
  {
    id: 'SAIA-0052',
    source: 'saia',
    origin: { city: 'Atlanta', state: 'GA' },
    destination: { city: 'Jacksonville', state: 'FL' },
    miles: 345,
    equipment: 'Dry Van',
    weight: '28,000 lbs',
    rate: '$820',
    postedAt: '2026-03-18T11:30:00Z',
    status: 'Open',
    commodity: 'LTL Freight',
    contact: 'Saia Circuit',
  },
];

const MOCK_BOARD_CONNECTIONS = [
  { id: 'dat', name: 'DAT Power', status: 'connected', lastSync: '2026-03-18T11:00:00Z', loadCount: 2 },
  { id: 'truckstop', name: 'Truckstop Pro', status: 'connected', lastSync: '2026-03-18T10:55:00Z', loadCount: 2 },
  { id: 'saia', name: 'Saia LTL Auction', status: 'connected', lastSync: '2026-03-18T11:30:00Z', loadCount: 1 },
];

// ─── Public API ─────────────────────────────────────────────────────────────

export async function searchEx
```


## License: unknown
https://github.com/Thiti-Dev/scraping-gateways/blob/7751be04cb07fee411a694657099b67c36b2258a/src/controllers/cores.ts

```
Now I have all the context I need. Let me provide the complete implementation.

---

Here are all the files to create and modify. Since I'm in read-only mode, I'll provide each as a code block.

## 1. NEW FILE: `frontend/src/api/boardIntegrationClient.js`

```js
// frontend/src/api/boardIntegrationClient.js
import { apiUrl } from './apiUrl';

async function safeFetch(path, options = {}) {
  try {
    const res = await fetch(apiUrl(path), {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { error: data?.error || `Request failed (${res.status})` };
    return data || {};
  } catch (err) {
    return { error: err?.message || 'Network error' };
  }
}

const BOARD_CONFIGS_KEY = 'fbpa-board-connections-v1';

function isMockMode() {
  return (
    import.meta.env.VITE_MOCK_MODE === 'true' ||
    (typeof window !== 'undefined' && localStorage.getItem('demoMode') === 'true')
  );
}

// ─── Mock data for demo mode ────────────────────────────────────────────────

const MOCK_EXTERNAL_LOADS = [
  {
    id: 'DAT-881204',
    source: 'dat',
    origin: { city: 'Nashville', state: 'TN' },
    destination: { city: 'Charlotte', state: 'NC' },
    miles: 410,
    equipment: 'Dry Van',
    weight: '38,000 lbs',
    rate: '$1,230',
    postedAt: '2026-03-18T09:22:00Z',
    status: 'Open',
    commodity: 'Consumer Goods',
    contact: 'DAT Broker #4412',
  },
  {
    id: 'DAT-881210',
    source: 'dat',
    origin: { city: 'Memphis', state: 'TN' },
    destination: { city: 'Miami', state: 'FL' },
    miles: 880,
    equipment: 'Reefer',
    weight: '41,000 lbs',
    rate: '$2,640',
    postedAt: '2026-03-18T08:15:00Z',
    status: 'Open',
    commodity: 'Frozen Foods',
    contact: 'DAT Broker #7801',
  },
  {
    id: 'TS-440291',
    source: 'truckstop',
    origin: { city: 'Indianapolis', state: 'IN' },
    destination: { city: 'Dallas', state: 'TX' },
    miles: 870,
    equipment: 'Flatbed',
    weight: '44,000 lbs',
    rate: '$2,180',
    postedAt: '2026-03-18T10:05:00Z',
    status: 'Open',
    commodity: 'Steel Beams',
    contact: 'TS Broker #1155',
  },
  {
    id: 'TS-440305',
    source: 'truckstop',
    origin: { city: 'Chicago', state: 'IL' },
    destination: { city: 'Denver', state: 'CO' },
    miles: 1004,
    equipment: 'Dry Van',
    weight: '36,500 lbs',
    rate: '$1,910',
    postedAt: '2026-03-18T07:40:00Z',
    status: 'Open',
    commodity: 'Auto Parts',
    contact: 'TS Broker #2290',
  },
  {
    id: 'SAIA-0052',
    source: 'saia',
    origin: { city: 'Atlanta', state: 'GA' },
    destination: { city: 'Jacksonville', state: 'FL' },
    miles: 345,
    equipment: 'Dry Van',
    weight: '28,000 lbs',
    rate: '$820',
    postedAt: '2026-03-18T11:30:00Z',
    status: 'Open',
    commodity: 'LTL Freight',
    contact: 'Saia Circuit',
  },
];

const MOCK_BOARD_CONNECTIONS = [
  { id: 'dat', name: 'DAT Power', status: 'connected', lastSync: '2026-03-18T11:00:00Z', loadCount: 2 },
  { id: 'truckstop', name: 'Truckstop Pro', status: 'connected', lastSync: '2026-03-18T10:55:00Z', loadCount: 2 },
  { id: 'saia', name: 'Saia LTL Auction', status: 'connected', lastSync: '2026-03-18T11:30:00Z', loadCount: 1 },
];

// ─── Public API ─────────────────────────────────────────────────────────────

export async function searchEx
```


## License: unknown
https://github.com/Thiti-Dev/scraping-gateways/blob/7751be04cb07fee411a694657099b67c36b2258a/src/controllers/cores.ts

```
Now I have all the context I need. Let me provide the complete implementation.

---

Here are all the files to create and modify. Since I'm in read-only mode, I'll provide each as a code block.

## 1. NEW FILE: `frontend/src/api/boardIntegrationClient.js`

```js
// frontend/src/api/boardIntegrationClient.js
import { apiUrl } from './apiUrl';

async function safeFetch(path, options = {}) {
  try {
    const res = await fetch(apiUrl(path), {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { error: data?.error || `Request failed (${res.status})` };
    return data || {};
  } catch (err) {
    return { error: err?.message || 'Network error' };
  }
}

const BOARD_CONFIGS_KEY = 'fbpa-board-connections-v1';

function isMockMode() {
  return (
    import.meta.env.VITE_MOCK_MODE === 'true' ||
    (typeof window !== 'undefined' && localStorage.getItem('demoMode') === 'true')
  );
}

// ─── Mock data for demo mode ────────────────────────────────────────────────

const MOCK_EXTERNAL_LOADS = [
  {
    id: 'DAT-881204',
    source: 'dat',
    origin: { city: 'Nashville', state: 'TN' },
    destination: { city: 'Charlotte', state: 'NC' },
    miles: 410,
    equipment: 'Dry Van',
    weight: '38,000 lbs',
    rate: '$1,230',
    postedAt: '2026-03-18T09:22:00Z',
    status: 'Open',
    commodity: 'Consumer Goods',
    contact: 'DAT Broker #4412',
  },
  {
    id: 'DAT-881210',
    source: 'dat',
    origin: { city: 'Memphis', state: 'TN' },
    destination: { city: 'Miami', state: 'FL' },
    miles: 880,
    equipment: 'Reefer',
    weight: '41,000 lbs',
    rate: '$2,640',
    postedAt: '2026-03-18T08:15:00Z',
    status: 'Open',
    commodity: 'Frozen Foods',
    contact: 'DAT Broker #7801',
  },
  {
    id: 'TS-440291',
    source: 'truckstop',
    origin: { city: 'Indianapolis', state: 'IN' },
    destination: { city: 'Dallas', state: 'TX' },
    miles: 870,
    equipment: 'Flatbed',
    weight: '44,000 lbs',
    rate: '$2,180',
    postedAt: '2026-03-18T10:05:00Z',
    status: 'Open',
    commodity: 'Steel Beams',
    contact: 'TS Broker #1155',
  },
  {
    id: 'TS-440305',
    source: 'truckstop',
    origin: { city: 'Chicago', state: 'IL' },
    destination: { city: 'Denver', state: 'CO' },
    miles: 1004,
    equipment: 'Dry Van',
    weight: '36,500 lbs',
    rate: '$1,910',
    postedAt: '2026-03-18T07:40:00Z',
    status: 'Open',
    commodity: 'Auto Parts',
    contact: 'TS Broker #2290',
  },
  {
    id: 'SAIA-0052',
    source: 'saia',
    origin: { city: 'Atlanta', state: 'GA' },
    destination: { city: 'Jacksonville', state: 'FL' },
    miles: 345,
    equipment: 'Dry Van',
    weight: '28,000 lbs',
    rate: '$820',
    postedAt: '2026-03-18T11:30:00Z',
    status: 'Open',
    commodity: 'LTL Freight',
    contact: 'Saia Circuit',
  },
];

const MOCK_BOARD_CONNECTIONS = [
  { id: 'dat', name: 'DAT Power', status: 'connected', lastSync: '2026-03-18T11:00:00Z', loadCount: 2 },
  { id: 'truckstop', name: 'Truckstop Pro', status: 'connected', lastSync: '2026-03-18T10:55:00Z', loadCount: 2 },
  { id: 'saia', name: 'Saia LTL Auction', status: 'connected', lastSync: '2026-03-18T11:30:00Z', loadCount: 1 },
];

// ─── Public API ─────────────────────────────────────────────────────────────

export async function searchEx
```

