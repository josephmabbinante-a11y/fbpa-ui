import React, { useEffect, useMemo, useRef, useState } from 'react';
import CollapsibleSection from './CollapsibleSection';
import { listLocations } from '../api/locationsClient';
import { mockLocations } from '../mock/mockLocations';

const TRUCKLOAD_ZIP_DATASET_URL = 'https://gist.github.com/Tucker-Eric/6a1a6b164726f21bb699623b06591389/raw/d87104248e4796f872412993a8b43d583c889176/us_zips.csv';
const MAX_ZIP_DATASET_ROWS = 30000;
const LIVE_ZIP_LOOKUP_BASE_URL = 'https://api.zippopotam.us/us/';

let zipDatasetCache = null;
let zipDatasetPromise = null;
const liveZipCache = new Map();
const liveZipPending = new Map();

function parseZipCsvDataset(csvText) {
  const lines = String(csvText || '').split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  const seen = new Set();
  const rows = [];

  for (let index = 1; index < lines.length && rows.length < MAX_ZIP_DATASET_ROWS; index += 1) {
    const line = lines[index];
    const [zipRaw, cityRaw, stateNameRaw, stateRaw] = line.split(',');
    const zip = String(zipRaw || '').trim();
    const city = String(cityRaw || '').trim();
    const stateName = String(stateNameRaw || '').trim();
    const state = String(stateRaw || '').trim().toUpperCase();

    if (!zip || !city || !state) continue;

    const key = `${city}|${state}|${zip}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({
      city,
      state,
      stateName,
      zip,
      normalized: `${city} ${state} ${stateName} ${zip}`.toLowerCase(),
    });
  }

  return rows;
}

async function loadTruckloadZipDataset() {
  if (Array.isArray(zipDatasetCache) && zipDatasetCache.length > 0) {
    return zipDatasetCache;
  }

  if (zipDatasetPromise) {
    return zipDatasetPromise;
  }

  zipDatasetPromise = fetch(TRUCKLOAD_ZIP_DATASET_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`ZIP dataset fetch failed (${response.status})`);
      return response.text();
    })
    .then((csvText) => {
      zipDatasetCache = parseZipCsvDataset(csvText);
      return zipDatasetCache;
    })
    .catch((err) => {
      console.warn('Truckload ZIP dataset unavailable:', err.message || err);
      return [];
    })
    .finally(() => {
      zipDatasetPromise = null;
    });

  return zipDatasetPromise;
}

function buildLocalFallbackLocations() {
  return (Array.isArray(mockLocations) ? mockLocations : []).map((entry) => ({
    city: String(entry.city || '').trim(),
    state: String(entry.state || '').trim().toUpperCase(),
    stateName: String(entry.stateName || '').trim(),
    zip: String(entry.zip || '').trim(),
    normalized: `${entry.city || ''} ${entry.state || ''} ${entry.stateName || ''} ${entry.zip || ''}`.toLowerCase(),
  })).filter((entry) => entry.city && entry.state);
}

async function fetchLiveZipLocation(zipCode) {
  const zip = String(zipCode || '').replace(/\D/g, '').slice(0, 5);
  if (!/^\d{5}$/.test(zip)) return null;

  if (liveZipCache.has(zip)) {
    return liveZipCache.get(zip);
  }

  if (liveZipPending.has(zip)) {
    return liveZipPending.get(zip);
  }

  const pending = fetch(`${LIVE_ZIP_LOOKUP_BASE_URL}${zip}`)
    .then(async (response) => {
      if (!response.ok) return null;
      const data = await response.json().catch(() => null);
      const place = Array.isArray(data?.places) ? data.places[0] : null;
      const city = String(place?.['place name'] || '').trim();
      const state = String(place?.['state abbreviation'] || '').trim().toUpperCase();
      const stateName = String(place?.state || '').trim();
      if (!city || !state) return null;

      const normalized = {
        city,
        state,
        stateName,
        zip,
        normalized: `${city} ${state} ${stateName} ${zip}`.toLowerCase(),
      };

      liveZipCache.set(zip, normalized);
      return normalized;
    })
    .catch(() => null)
    .finally(() => {
      liveZipPending.delete(zip);
    });

  liveZipPending.set(zip, pending);
  return pending;
}

const LoadInputs = ({
  origin,
  setOrigin,
  destination,
  setDestination,
  shipmentDetails,
  onShipmentChange,
  shipmentErrors,
  rpm,
  predictedSwing,
  equipmentType,
  setEquipmentType,
  onSwapLane,
  laneVolatilityIndex,
  capacityHeatScore,
  rejectionSpikeRisk,
  onPredictRate,
  predicting,
}) => {
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originFocused, setOriginFocused] = useState(false);
  const [destFocused, setDestFocused] = useState(false);
  const [searchableLocations, setSearchableLocations] = useState([]);
  const requestSeqRef = useRef(0);

  const MAX_LOCATION_SUGGESTIONS = 24;
  const localFallbackLocations = useMemo(() => buildLocalFallbackLocations(), []);

  const formatLocation = (loc) => `${loc.city}, ${loc.state} ${loc.zip}`;

  const normalizeLocations = useMemo(() => (items = []) => {
    const seen = new Set();

    return items
      .map((item) => {
        const rawAddress = String(item?.address || '');
        const addressMatch = rawAddress.match(/,\s*([^,]+),\s*([A-Za-z]{2})\s*(\d{5})\b/);
        const city = String(addressMatch?.[1] || item?.name || '').replace(/\s+Hub\s*\d+$/i, '').trim();
        const state = String(addressMatch?.[2] || '').trim().toUpperCase();
        const zip = String(addressMatch?.[3] || '').trim();

        if (!city) return null;

        const key = `${city}|${state}|${zip}`.toLowerCase();
        if (seen.has(key)) return null;
        seen.add(key);

        return {
          city,
          state,
          zip,
          normalized: `${city} ${state} ${zip}`.toLowerCase(),
        };
      })
      .filter(Boolean);
  }, []);

  useEffect(() => {
    let active = true;

    const hydrateDatabaseLocations = async () => {
      const result = await listLocations({ q: '' });
      if (!active) return;
      const next = normalizeLocations(Array.isArray(result?.items) ? result.items : []);
      if (next.length > 0) {
        setSearchableLocations(next);
        return;
      }

      const zipFallback = await loadTruckloadZipDataset();
      if (!active) return;
      if (Array.isArray(zipFallback) && zipFallback.length > 0) {
        setSearchableLocations(zipFallback);
        return;
      }

      if (localFallbackLocations.length > 0) {
        setSearchableLocations(localFallbackLocations);
      }
    };

    hydrateDatabaseLocations();

    return () => {
      active = false;
    };
  }, [normalizeLocations, localFallbackLocations]);

  const queryDatabaseLocations = async (query) => {
    const requestId = ++requestSeqRef.current;
    const result = await listLocations({ q: query || '' });
    if (requestId !== requestSeqRef.current) return;
    const next = normalizeLocations(Array.isArray(result?.items) ? result.items : []);
    if (next.length > 0) {
      setSearchableLocations(next);
      return;
    }

    const zipFallback = await loadTruckloadZipDataset();
    if (requestId !== requestSeqRef.current) return;
    if (!Array.isArray(zipFallback) || zipFallback.length === 0) {
      if (localFallbackLocations.length > 0) {
        const normalizedQuery = String(query || '').trim().toLowerCase();
        const fallbackFiltered = !normalizedQuery
          ? localFallbackLocations
          : localFallbackLocations.filter((loc) => loc.normalized.includes(normalizedQuery));
        setSearchableLocations(fallbackFiltered.slice(0, 2000));
      }
      return;
    }

    const normalizedQuery = String(query || '').trim().toLowerCase();
    if (!normalizedQuery) {
      setSearchableLocations(zipFallback.slice(0, 500));
      return;
    }

    const filtered = zipFallback.filter((loc) => loc.normalized.includes(normalizedQuery));
    if (filtered.length > 0) {
      setSearchableLocations(filtered.slice(0, 2000));
      return;
    }

    const zip = normalizedQuery.replace(/\D/g, '').slice(0, 5);
    if (/^\d{5}$/.test(zip)) {
      const liveZip = await fetchLiveZipLocation(zip);
      if (requestId !== requestSeqRef.current) return;
      if (liveZip) {
        setSearchableLocations([liveZip, ...localFallbackLocations].slice(0, 500));
      }
    }
  };

  const resolveAutoPopulate = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const q = raw.toLowerCase();

    const zipMatch = raw.match(/\b(\d{5})\b/);
    if (zipMatch?.[1]) {
      const byZip = searchableLocations.find((loc) => loc.zip === zipMatch[1]);
      if (byZip) return byZip;
    }

    if (/^\d{3}$/.test(raw)) {
      const byZip3 = searchableLocations.find((loc) => String(loc.zip).startsWith(raw));
      if (byZip3) return byZip3;
    }

    const stateCodeMatch = searchableLocations.find((loc) => loc.state.toLowerCase() === q);
    if (stateCodeMatch) return stateCodeMatch;

    const stateNameMatch = searchableLocations.find((loc) => String(loc.stateName || '').toLowerCase() === q);
    if (stateNameMatch) return stateNameMatch;

    const cityStateMatch = searchableLocations.find((loc) => `${loc.city}, ${loc.state}`.toLowerCase() === q);
    if (cityStateMatch) return cityStateMatch;

    const cityMatch = searchableLocations.find((loc) => loc.city.toLowerCase() === q);
    if (cityMatch) return cityMatch;

    return null;
  };

  const resolveAutoPopulateAsync = async (value) => {
    const localMatch = resolveAutoPopulate(value);
    if (localMatch) return localMatch;

    const zip = String(value || '').match(/\b(\d{5})\b/)?.[1] || String(value || '').trim();
    const normalizedZip = String(zip || '').replace(/\D/g, '').slice(0, 5);
    if (!/^\d{5}$/.test(normalizedZip)) return null;

    const liveZip = await fetchLiveZipLocation(normalizedZip);
    if (liveZip) {
      setSearchableLocations((prev) => {
        const existing = Array.isArray(prev) ? prev : [];
        const hasZip = existing.some((row) => String(row.zip || '') === normalizedZip);
        return hasZip ? existing : [liveZip, ...existing].slice(0, 1000);
      });
    }
    return liveZip;
  };

  const filterLocations = (query) => {
    if (!query) return searchableLocations;
    const q = query.toLowerCase();
    return searchableLocations
      .filter((loc) => loc.normalized.includes(q))
      .sort((a, b) => {
        const aStarts = a.normalized.startsWith(q) ? 1 : 0;
        const bStarts = b.normalized.startsWith(q) ? 1 : 0;
        return bStarts - aStarts;
      });
  };

  const originSuggestions = filterLocations(originQuery).slice(0, MAX_LOCATION_SUGGESTIONS);
  const destSuggestions = filterLocations(destQuery).slice(0, MAX_LOCATION_SUGGESTIONS);

  useEffect(() => {
    if (!originFocused) setOriginQuery('');
  }, [origin, originFocused]);

  useEffect(() => {
    if (!destFocused) setDestQuery('');
  }, [destination, destFocused]);

  useEffect(() => {
    if (!originFocused) return;
    const timer = window.setTimeout(() => {
      queryDatabaseLocations(originQuery || origin || '');
    }, 180);
    return () => window.clearTimeout(timer);
  }, [originFocused, originQuery, origin]);

  useEffect(() => {
    if (!destFocused) return;
    const timer = window.setTimeout(() => {
      queryDatabaseLocations(destQuery || destination || '');
    }, 180);
    return () => window.clearTimeout(timer);
  }, [destFocused, destQuery, destination]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CollapsibleSection title="Shipment Inputs" defaultOpen>
        <div style={{ marginBottom: 12 }}>
          <label>Origin / Destination</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={originQuery || origin}
                onChange={(e) => {
                  setOriginQuery(e.target.value);
                  setOrigin(e.target.value);
                  setOriginFocused(true);
                }}
                onFocus={() => setOriginFocused(true)}
                onBlur={async () => {
                  const candidate = originQuery || origin;
                  const matched = await resolveAutoPopulateAsync(candidate);
                  if (matched) {
                    const next = formatLocation(matched);
                    setOrigin(next);
                    setOriginQuery(next);
                  } else {
                    setOrigin(candidate);
                  }
                  setTimeout(() => setOriginFocused(false), 150);
                }}
                placeholder="Origin (city, state, zip)"
                style={{ width: '100%', padding: 6, borderRadius: 4, border: shipmentErrors?.origin ? '1.5px solid #e00' : '1px solid #ccc', background: shipmentErrors?.origin ? '#fff6f6' : undefined }}
                required
              />
              {originFocused && originSuggestions.length > 0 && (
                <ul style={{ position: 'absolute', zIndex: 10, background: '#fff', color: '#222', width: '100%', border: '1px solid #ccc', borderRadius: 4, marginTop: 2, maxHeight: 160, overflowY: 'auto', fontSize: 14 }}>
                  {originSuggestions.map((loc) => (
                    <li
                      key={loc.city + loc.state + loc.zip}
                      style={{ padding: 6, cursor: 'pointer' }}
                      onMouseDown={() => {
                        setOrigin(`${loc.city}, ${loc.state} ${loc.zip}`);
                        setOriginQuery(formatLocation(loc));
                        setOriginFocused(false);
                      }}
                    >
                      {loc.city}, {loc.state} {loc.zip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => onSwapLane?.()}
              title="Swap origin and destination"
              style={{
                alignSelf: 'stretch',
                minWidth: 44,
                borderRadius: 6,
                border: '1px solid #bbb',
                background: '#f8f8f8',
                color: '#333',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              ⇅
            </button>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={destQuery || destination}
                onChange={(e) => {
                  setDestQuery(e.target.value);
                  setDestination(e.target.value);
                  setDestFocused(true);
                }}
                onFocus={() => setDestFocused(true)}
                onBlur={async () => {
                  const candidate = destQuery || destination;
                  const matched = await resolveAutoPopulateAsync(candidate);
                  if (matched) {
                    const next = formatLocation(matched);
                    setDestination(next);
                    setDestQuery(next);
                  } else {
                    setDestination(candidate);
                  }
                  setTimeout(() => setDestFocused(false), 150);
                }}
                placeholder="Destination (city, state, zip)"
                style={{ width: '100%', padding: 6, borderRadius: 4, border: shipmentErrors?.destination ? '1.5px solid #e00' : '1px solid #ccc', background: shipmentErrors?.destination ? '#fff6f6' : undefined }}
                required
              />
              {destFocused && destSuggestions.length > 0 && (
                <ul style={{ position: 'absolute', zIndex: 10, background: '#fff', color: '#222', width: '100%', border: '1px solid #ccc', borderRadius: 4, marginTop: 2, maxHeight: 160, overflowY: 'auto', fontSize: 14 }}>
                  {destSuggestions.map((loc) => (
                    <li
                      key={loc.city + loc.state + loc.zip}
                      style={{ padding: 6, cursor: 'pointer' }}
                      onMouseDown={() => {
                        setDestination(`${loc.city}, ${loc.state} ${loc.zip}`);
                        setDestQuery(formatLocation(loc));
                        setDestFocused(false);
                      }}
                    >
                      {loc.city}, {loc.state} {loc.zip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Equipment</label>
            <select
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value)}
              style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
            >
              <option value="dry_van">Dry Van</option>
              <option value="reefer">Reefer</option>
              <option value="flatbed">Flatbed</option>
              <option value="power_only">Power Only</option>
            </select>

            <button
              type="button"
              onClick={() => onPredictRate?.()}
              disabled={Boolean(predicting)}
              style={{
                marginTop: 2,
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: 'var(--accent-600, #2563eb)',
                color: '#fff',
                padding: '8px 10px',
                cursor: predicting ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                opacity: predicting ? 0.72 : 1,
              }}
            >
              {predicting ? 'Predicting...' : 'Predict Rate'}
            </button>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Market Intelligence" defaultOpen={false}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13 }}>
            Market RPM Feed: <b>{Number(rpm || 0).toFixed(2)}</b>
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#aaa' }}>
          Predicted 48hr swing: <b>+${predictedSwing}</b>
        </div>
        <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 8, fontSize: 12, display: 'grid', gap: 6 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
            Rate Index Components (auto-calculated)
            <span
              title="Derived from historical tender rejections, OTR capacity signals, and lane velocity"
              style={{ marginLeft: 6, fontWeight: 700, cursor: 'help' }}
            >
              ⓘ
            </span>
          </div>
          <div>Lane Volatility Index: <b>{Number(laneVolatilityIndex || 0).toFixed(0)}%</b> (derived)</div>
          <div>Capacity Heat Score: <b>{Number(capacityHeatScore || 0).toFixed(0)}/100</b> (derived)</div>
          <div>Rejection Spike Risk: <b>{rejectionSpikeRisk || 'Moderate'}</b></div>
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default LoadInputs;
