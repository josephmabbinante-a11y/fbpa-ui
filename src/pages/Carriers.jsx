import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme, themes } from '../contexts/ThemeContext';
import { getCarriers, importCarrierFromSafer, purgeCarriers, searchCarrierSafer } from '../api/client';

function toMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function toReadableKey(key) {
  return String(key || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (value) => value.toUpperCase());
}

function formatDate(value, fallback = '—') {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toLocaleDateString();
}

function getComplianceState(carrier) {
  const insuranceDate = carrier.insuranceExpiry ? new Date(carrier.insuranceExpiry) : null;
  const insuranceExpired = insuranceDate && !Number.isNaN(insuranceDate.getTime())
    ? insuranceDate.getTime() < Date.now()
    : false;

  if (!carrier.mcNumber || !carrier.taxId || insuranceExpired) {
    return 'issues';
  }

  return 'compliant';
}

function getStatusLabel(carrier) {
  if (carrier.status) return carrier.status;
  return getComplianceState(carrier) === 'issues' ? 'Alert' : 'Active';
}

function readPercentMetric(carrier, keys, fallback = null) {
  for (const key of keys) {
    const raw = carrier?.[key];
    if (raw === null || raw === undefined || raw === '') continue;

    const parsed = Number.parseFloat(String(raw).replace('%', '').trim());
    if (!Number.isFinite(parsed)) continue;

    if (parsed >= 0 && parsed <= 1) {
      return parsed * 100;
    }
    return parsed;
  }

  return fallback;
}

export default function Carriers() {
  const { theme } = useTheme();
  const t = themes[theme];
  const navigate = useNavigate();
  const location = useLocation();

  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [selectedId, setSelectedId] = useState('');
  const [saferMode, setSaferMode] = useState('dot');
  const [saferQuery, setSaferQuery] = useState('');
  const [saferLoading, setSaferLoading] = useState(false);
  const [saferResult, setSaferResult] = useState(null);
  const [saferMessage, setSaferMessage] = useState('');
  const [rowContextMenu, setRowContextMenu] = useState(null);
  const [purging, setPurging] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [listMode, setListMode] = useState('top');
  const [topCount, setTopCount] = useState(10);

  const CARRIER_UI_LIMIT = 2000;
  const CARRIER_RENDER_LIMIT = 1000;

  useEffect(() => {
    if (!location?.state?.message) return;
    setSaferMessage(String(location.state.message));
    navigate(location.pathname, { replace: true, state: {} });
  }, [location, navigate]);

  const inputStyle = {
    minHeight: 36,
    borderRadius: 8,
    border: `1px solid ${t.border}`,
    background: t.bgAlt,
    color: t.text,
    padding: '8px 10px',
    fontSize: 12,
  };

  const panelStyle = {
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`,
    boxShadow: '0 10px 24px rgba(0,0,0,0.14)',
  };

  const loadCarriers = async () => {
    setLoading(true);
    setError('');
    const result = await getCarriers({ limit: CARRIER_UI_LIMIT });

    if (result?.error) {
      setCarriers([]);
      setError(result.error);
      setLoading(false);
      return;
    }

    const rows = Array.isArray(result?.carriers) ? result.carriers : Array.isArray(result) ? result : [];
    setCarriers(rows);
    setVisibleCount(rows.length);
    setTotalCount(Number(result?.total || rows.length));
    setSelectedId((prev) => prev || rows[0]?.id || rows[0]?.mcNumber || '');
    setLoading(false);
  };

  const runSaferSearch = async () => {
    const cleanedQuery = String(saferQuery || '').trim();
    if (!cleanedQuery) {
      setSaferMessage('Enter a DOT or MC number first.');
      return;
    }

    setSaferLoading(true);
    setSaferMessage('');
    setSaferResult(null);

    const result = await searchCarrierSafer(
      saferMode === 'dot'
        ? { dotNumber: cleanedQuery }
        : { mcNumber: cleanedQuery }
    );

    setSaferLoading(false);
    if (result?.error) {
      setSaferMessage(result.error);
      return;
    }

    setSaferResult(result);
    setSaferMessage('SAFER snapshot loaded. Review and import into your carrier base.');
  };

  const runSaferImport = async () => {
    const snapshot = saferResult?.snapshot;
    if (!snapshot) {
      setSaferMessage('Search SAFER first, then import.');
      return;
    }

    setSaferLoading(true);
    setSaferMessage('');
    const result = await importCarrierFromSafer({
      dotNumber: snapshot.dotNumber,
      mcNumber: snapshot.mcNumber,
    });
    setSaferLoading(false);

    if (result?.error) {
      setSaferMessage(result.error);
      return;
    }

    setSaferMessage(result.created
      ? `Carrier ${result.carrier?.name || ''} imported from SAFER.`
      : `Carrier ${result.carrier?.name || ''} updated from SAFER.`);

    await loadCarriers();
    const nextSelected = result?.carrier?.id || result?.carrier?.mcNumber;
    if (nextSelected) setSelectedId(nextSelected);
  };

  useEffect(() => {
    loadCarriers();
  }, []);

  const filteredCarriers = useMemo(() => {
    const q = query.trim().toLowerCase();

    return carriers.filter((carrier) => {
      const statusLabel = String(getStatusLabel(carrier)).toLowerCase();
      const complianceState = getComplianceState(carrier);

      if (statusFilter !== 'all' && statusLabel !== statusFilter) return false;
      if (complianceFilter !== 'all' && complianceState !== complianceFilter) return false;

      if (!q) return true;
      return [carrier.name, carrier.mcNumber, carrier.taxId, carrier.email, carrier.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [carriers, query, statusFilter, complianceFilter]);

  const renderedCarriers = useMemo(
    () => filteredCarriers.slice(0, CARRIER_RENDER_LIMIT),
    [filteredCarriers]
  );

  const rankedFilteredCarriers = useMemo(() => {
    if (!filteredCarriers.length) return [];

    return filteredCarriers
      .map((carrier) => {
        const onTimePickup = readPercentMetric(carrier, [
          'onTimePickup',
          'pickupOnTime',
          'pickupOnTimeRate',
          'onTimePickupRate',
          'pickupRate',
        ], 92);

        const onTimeDelivery = readPercentMetric(carrier, [
          'onTimeDelivery',
          'deliveryOnTime',
          'deliveryOnTimeRate',
          'onTimeDeliveryRate',
          'onTime',
        ], 92);

        const serviceFailureRate = readPercentMetric(carrier, [
          'serviceFailureRate',
          'failureRate',
          'serviceFailurePct',
          'serviceFailures',
          'claimsRate',
        ], getComplianceState(carrier) === 'issues' ? 8 : 2);

        const safePickup = Math.max(0, Math.min(100, Number(onTimePickup || 0)));
        const safeDelivery = Math.max(0, Math.min(100, Number(onTimeDelivery || 0)));
        const safeFailure = Math.max(0, Number(serviceFailureRate || 0));
        const failureScore = Math.max(0, Math.min(100, 100 - safeFailure));

        const compositeScore = (safePickup * 0.4) + (safeDelivery * 0.4) + (failureScore * 0.2);

        return {
          carrier,
          onTimePickup: safePickup,
          onTimeDelivery: safeDelivery,
          serviceFailureRate: safeFailure,
          compositeScore,
        };
      })
      .sort((left, right) => {
        const scoreDiff = right.compositeScore - left.compositeScore;
        if (scoreDiff !== 0) return scoreDiff;

        const spendDiff = Number(right.carrier?.totalSpend || 0) - Number(left.carrier?.totalSpend || 0);
        if (spendDiff !== 0) return spendDiff;

        const invoiceDiff = Number(right.carrier?.invoiceCount || 0) - Number(left.carrier?.invoiceCount || 0);
        if (invoiceDiff !== 0) return invoiceDiff;

        return String(left.carrier?.name || '').localeCompare(String(right.carrier?.name || ''));
      });
  }, [filteredCarriers]);

  const topPerformer = useMemo(() => rankedFilteredCarriers[0] || null, [rankedFilteredCarriers]);

  const displayedCarriers = useMemo(() => {
    if (listMode === 'top') {
      return rankedFilteredCarriers
        .slice(0, Math.max(1, Number(topCount || 10)))
        .map((entry) => entry.carrier);
    }

    return renderedCarriers;
  }, [listMode, topCount, rankedFilteredCarriers, renderedCarriers]);

  const selectedCarrier = useMemo(() => {
    const source = listMode === 'top' ? displayedCarriers : filteredCarriers;
    return source.find((carrier) => (carrier.id || carrier.mcNumber) === selectedId)
      || source[0]
      || null;
  }, [listMode, displayedCarriers, filteredCarriers, selectedId]);

  const selectedCarrierSections = useMemo(() => {
    if (!selectedCarrier) return [];

    const onTimePickup = readPercentMetric(selectedCarrier, [
      'onTimePickup',
      'pickupOnTime',
      'pickupOnTimeRate',
      'onTimePickupRate',
      'pickupRate',
    ], null);

    const onTimeDelivery = readPercentMetric(selectedCarrier, [
      'onTimeDelivery',
      'deliveryOnTime',
      'deliveryOnTimeRate',
      'onTimeDeliveryRate',
      'onTime',
    ], null);

    const serviceFailureRate = readPercentMetric(selectedCarrier, [
      'serviceFailureRate',
      'failureRate',
      'serviceFailurePct',
      'serviceFailures',
      'claimsRate',
    ], null);

    const knownKeys = new Set([
      'id', 'name', 'nameLower', 'mcNumber', 'mcNumberNormalized', 'dotNumber', 'taxId', 'email', 'phone',
      'paymentTerms', 'insuranceExpiry', 'status', 'totalSpend', 'openAP', 'invoiceCount', 'createdAt', 'updatedAt',
      'onTimePickup', 'pickupOnTime', 'pickupOnTimeRate', 'onTimePickupRate', 'pickupRate',
      'onTimeDelivery', 'deliveryOnTime', 'deliveryOnTimeRate', 'onTimeDeliveryRate', 'onTime',
      'serviceFailureRate', 'failureRate', 'serviceFailurePct', 'serviceFailures', 'claimsRate',
    ]);

    const extraRows = Object.entries(selectedCarrier)
      .filter(([key, value]) => !knownKeys.has(key) && value !== null && value !== undefined && value !== '' && typeof value !== 'object')
      .slice(0, 8)
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          return { label: toReadableKey(key), value: value ? 'Yes' : 'No' };
        }

        if (typeof value === 'number') {
          return { label: toReadableKey(key), value: Number(value).toLocaleString() };
        }

        return { label: toReadableKey(key), value: String(value) };
      });

    const sections = [
      {
        title: 'Identity',
        rows: [
          { label: 'MC #', value: selectedCarrier.mcNumber || '—' },
          { label: 'DOT #', value: selectedCarrier.dotNumber || '—' },
          { label: 'Tax ID', value: selectedCarrier.taxId || 'Missing' },
          { label: 'Status', value: getStatusLabel(selectedCarrier) },
        ],
      },
      {
        title: 'Contact',
        rows: [
          { label: 'Email', value: selectedCarrier.email || '—' },
          { label: 'Phone', value: selectedCarrier.phone || '—' },
          { label: 'Payment Terms', value: selectedCarrier.paymentTerms || 'Not set' },
          { label: 'Insurance Expiry', value: formatDate(selectedCarrier.insuranceExpiry, 'Not set') },
        ],
      },
      {
        title: 'Financial',
        rows: [
          { label: 'Total Spend', value: toMoney(selectedCarrier.totalSpend) },
          { label: 'Open AP', value: toMoney(selectedCarrier.openAP) },
          { label: 'Invoices', value: Number(selectedCarrier.invoiceCount || 0).toLocaleString() },
        ],
      },
      {
        title: 'Service',
        rows: [
          { label: 'On-Time Pickup', value: onTimePickup == null ? '—' : `${Number(onTimePickup).toFixed(1)}%` },
          { label: 'On-Time Delivery', value: onTimeDelivery == null ? '—' : `${Number(onTimeDelivery).toFixed(1)}%` },
          { label: 'Service Failure Rate', value: serviceFailureRate == null ? '—' : `${Number(serviceFailureRate).toFixed(1)}%` },
        ],
      },
      ...(extraRows.length ? [{ title: 'Additional Details', rows: extraRows }] : []),
    ];

    return sections;
  }, [selectedCarrier]);

  const complianceAlerts = useMemo(
    () => carriers
      .filter((carrier) => getComplianceState(carrier) === 'issues')
      .slice(0, 5),
    [carriers]
  );

  const openCarrierProfile = (carrier) => {
    const carrierKey = String(carrier?.id || carrier?.mcNumber || carrier?.name || '').trim();
    if (!carrierKey) return;
    navigate(`/carriers/profile/${encodeURIComponent(carrierKey)}`);
  };

  const openCarrierContextMenu = (carrier, x, y) => {
    if (!carrier) return;
    const menuWidth = 220;
    const menuHeight = 132;
    const viewportWidth = window.innerWidth || 1280;
    const viewportHeight = window.innerHeight || 720;

    const clampedX = Math.max(8, Math.min(x, viewportWidth - menuWidth - 8));
    const clampedY = Math.max(8, Math.min(y, viewportHeight - menuHeight - 8));

    setRowContextMenu({ carrier, x: clampedX, y: clampedY });
  };

  const runPurgeCarriers = async () => {
    const confirmed = window.confirm('Purge all loaded carriers? This removes every carrier record in the current environment.');
    if (!confirmed) return;

    setPurging(true);
    setError('');
    const result = await purgeCarriers();
    setPurging(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setSaferMessage(result?.message || 'Carrier list purged.');
    setSelectedId('');
    setRowContextMenu(null);
    await loadCarriers();
  };

  useEffect(() => {
    if (!rowContextMenu) return undefined;

    const handlePointerDown = (event) => {
      if (event.target?.closest?.('[data-carrier-context-menu="true"]')) return;
      setRowContextMenu(null);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setRowContextMenu(null);
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [rowContextMenu]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>Carriers</h1>
          <div style={{ fontSize: 12, color: t.textSecondary }}>Carrier command center with compliance and AP insights.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => navigate('/carriers/new')} style={{ ...inputStyle, cursor: 'pointer', fontWeight: 700, borderColor: t.accent2 }}>Add Carrier</button>
          <button
            type="button"
            onClick={() => navigate('/carriers/import')}
            style={{
              ...inputStyle,
              cursor: 'pointer',
              fontWeight: 700,
              borderColor: t.accent,
            }}
          >
            Bulk Import
          </button>
          <button type="button" onClick={loadCarriers} style={{ ...inputStyle, cursor: 'pointer', fontWeight: 700 }}>Refresh</button>
          <button
            type="button"
            onClick={runPurgeCarriers}
            disabled={purging}
            style={{
              ...inputStyle,
              cursor: purging ? 'wait' : 'pointer',
              fontWeight: 700,
              borderColor: t.error,
              opacity: purging ? 0.7 : 1,
            }}
          >
            {purging ? 'Purging…' : 'Purge List'}
          </button>
          <button type="button" onClick={() => navigate('/finance/ap')} style={{ ...inputStyle, cursor: 'pointer', fontWeight: 700 }}>Open AP</button>
        </div>
      </header>

      <section style={{ ...panelStyle, padding: 12, display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 11, color: t.textSecondary }}>Top Performing Carrier</div>
        {topPerformer?.carrier ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{topPerformer.carrier.name || 'Unnamed Carrier'}</div>
              <button
                type="button"
                onClick={() => openCarrierProfile(topPerformer.carrier)}
                style={{ ...inputStyle, minHeight: 30, cursor: 'pointer', fontWeight: 700 }}
              >
                Open Profile
              </button>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: t.textSecondary }}>
              <span>MC: {topPerformer.carrier.mcNumber || '—'}</span>
              <span>Status: {getStatusLabel(topPerformer.carrier)}</span>
              <span>On-Time Pickup: {topPerformer.onTimePickup.toFixed(1)}%</span>
              <span>On-Time Delivery: {topPerformer.onTimeDelivery.toFixed(1)}%</span>
              <span>Service Failure Rate: {topPerformer.serviceFailureRate.toFixed(1)}%</span>
              <span>Score: {topPerformer.compositeScore.toFixed(1)}</span>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: t.textSecondary }}>No carrier data available.</div>
        )}
      </section>

      <section style={{ ...panelStyle, padding: 12, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>FMCSA SAFER Search</div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>Lookup by USDOT or MC and import directly into carrier base.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setSaferMode('dot')}
              style={{
                ...inputStyle,
                minHeight: 34,
                cursor: 'pointer',
                borderColor: saferMode === 'dot' ? t.accent : t.border,
                color: saferMode === 'dot' ? t.text : t.textSecondary,
              }}
            >
              USDOT
            </button>
            <button
              type="button"
              onClick={() => setSaferMode('mc')}
              style={{
                ...inputStyle,
                minHeight: 34,
                cursor: 'pointer',
                borderColor: saferMode === 'mc' ? t.accent : t.border,
                color: saferMode === 'mc' ? t.text : t.textSecondary,
              }}
            >
              MC
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={saferQuery}
            onChange={(event) => setSaferQuery(event.target.value)}
            placeholder={saferMode === 'dot' ? 'Enter USDOT number' : 'Enter MC number'}
            style={{ ...inputStyle, minWidth: 280, flex: 1 }}
          />
          <button
            type="button"
            onClick={runSaferSearch}
            disabled={saferLoading}
            style={{ ...inputStyle, cursor: 'pointer', fontWeight: 700 }}
          >
            {saferLoading ? 'Searching...' : 'Search SAFER'}
          </button>
          <button
            type="button"
            onClick={runSaferImport}
            disabled={saferLoading || !saferResult?.snapshot}
            style={{
              ...inputStyle,
              cursor: saferLoading || !saferResult?.snapshot ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              borderColor: t.accent,
            }}
          >
            Import to Carrier Base
          </button>
        </div>

        {saferMessage && (
          <div style={{ fontSize: 12, color: saferMessage.toLowerCase().includes('error') ? t.error : t.textSecondary }}>
            {saferMessage}
          </div>
        )}

        {saferResult?.snapshot && (
          <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.bgAlt, padding: 10, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{saferResult.snapshot.legalName || 'Carrier'}</div>
              {saferResult?.sourceUrl && (
                <a href={saferResult.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: t.accent }}>
                  View on SAFER
                </a>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: 12 }}>
              <div><strong>USDOT:</strong> {saferResult.snapshot.dotNumber || '—'}</div>
              <div><strong>MC:</strong> {saferResult.snapshot.mcNumber || '—'}</div>
              <div><strong>Status:</strong> {saferResult.snapshot.operatingStatus || saferResult.snapshot.mappedStatus || '—'}</div>
              <div><strong>Phone:</strong> {saferResult.snapshot.phone || '—'}</div>
              <div><strong>Entity:</strong> {saferResult.snapshot.entityType || '—'}</div>
              <div><strong>MCS-150:</strong> {saferResult.snapshot.mcs150Date || '—'}</div>
            </div>
            {(saferResult.snapshot.physicalAddress || saferResult.snapshot.mailingAddress) && (
              <div style={{ fontSize: 12, color: t.textSecondary }}>
                <div><strong>Physical:</strong> {saferResult.snapshot.physicalAddress || '—'}</div>
                <div><strong>Mailing:</strong> {saferResult.snapshot.mailingAddress || '—'}</div>
              </div>
            )}
          </div>
        )}
      </section>

      <section style={{ ...panelStyle, padding: 12, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search carrier, MC, tax ID, email, phone"
            style={{ ...inputStyle, minWidth: 260, flex: 1 }}
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={inputStyle}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="alert">Alert</option>
          </select>
          <select value={complianceFilter} onChange={(event) => setComplianceFilter(event.target.value)} style={inputStyle}>
            <option value="all">All Compliance</option>
            <option value="compliant">Compliant</option>
            <option value="issues">Issues</option>
          </select>
          <select value={listMode} onChange={(event) => setListMode(event.target.value)} style={inputStyle}>
            <option value="top">Top Performers</option>
            <option value="filtered">Filtered List</option>
          </select>
          {listMode === 'top' && (
            <select value={String(topCount)} onChange={(event) => setTopCount(Number(event.target.value) || 10)} style={inputStyle}>
              <option value="10">Top 10</option>
              <option value="25">Top 25</option>
              <option value="50">Top 50</option>
            </select>
          )}
        </div>

        {loading && <div style={{ color: t.textSecondary, fontSize: 12 }}>Loading carriers...</div>}
        {error && <div style={{ color: t.error, fontSize: 12 }}>Failed to load carriers: {error}</div>}
        {totalCount > visibleCount && (
          <div style={{ color: t.error, fontSize: 12 }}>
            Showing first {visibleCount.toLocaleString()} of {totalCount.toLocaleString()} carriers for performance. Narrow filters or export/report for full set.
          </div>
        )}
        {listMode === 'filtered' && filteredCarriers.length > renderedCarriers.length && (
          <div style={{ color: t.warning, fontSize: 12 }}>
            Displaying first {renderedCarriers.length.toLocaleString()} filtered carriers. Refine filters to view additional rows.
          </div>
        )}
        {listMode === 'top' && filteredCarriers.length > 0 && (
          <div style={{ color: t.textSecondary, fontSize: 12 }}>
            Showing top {Math.min(Number(topCount || 10), filteredCarriers.length).toLocaleString()} performing carriers from {filteredCarriers.length.toLocaleString()} matched rows.
          </div>
        )}
        <div style={{ fontSize: 11, color: t.textSecondary, marginTop: -2 }}>
          Right-click a row to open profile.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 320px)', gap: 10 }}>
          <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: t.bgAlt, color: t.textSecondary }}>
                  <th style={{ padding: 10, textAlign: 'left' }}>Carrier</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>MC #</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Tax ID</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Spend</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Open AP</th>
                  <th style={{ padding: 10, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedCarriers.map((carrier) => {
                  const key = carrier.id || carrier.mcNumber;
                  const status = getStatusLabel(carrier);
                  const isAlert = String(status).toLowerCase() === 'alert';
                  const isSelected = (selectedCarrier?.id || selectedCarrier?.mcNumber) === key;

                  return (
                    <tr
                      key={key}
                      onClick={() => setSelectedId(key)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        setSelectedId(key);
                        openCarrierContextMenu(carrier, event.clientX, event.clientY);
                      }}
                      title="Right-click for carrier shortcuts"
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(var(--glow), 0.12)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>
                        <div style={{ fontWeight: 700 }}>{carrier.name || 'Unnamed Carrier'}</div>
                        <div style={{ fontSize: 11, color: t.textSecondary }}>{carrier.phone || 'No phone'} {carrier.email ? `• ${carrier.email}` : ''}</div>
                      </td>
                      <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{carrier.mcNumber || '—'}</td>
                      <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{carrier.taxId || 'Missing'}</td>
                      <td style={{ padding: 10, borderTop: `1px solid ${t.border}`, textAlign: 'right' }}>{toMoney(carrier.totalSpend)}</td>
                      <td style={{ padding: 10, borderTop: `1px solid ${t.border}`, textAlign: 'right' }}>{toMoney(carrier.openAP)}</td>
                      <td style={{ padding: 10, borderTop: `1px solid ${t.border}`, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          borderRadius: 999,
                          border: `1px solid ${isAlert ? t.error : t.success}`,
                          color: isAlert ? t.error : t.success,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                        }}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {displayedCarriers.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 14, textAlign: 'center', color: t.textSecondary, borderTop: `1px solid ${t.border}` }}>
                      {filteredCarriers.length === 0 ? 'No carriers match current filters.' : 'No carriers available for this view.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <aside style={{ ...panelStyle, padding: 12, display: 'grid', gap: 10, alignContent: 'start' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Carrier Detail</div>
            {!selectedCarrier ? (
              <div style={{ fontSize: 12, color: t.textSecondary }}>Select a carrier to view detail.</div>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedCarrier.name || 'Unnamed Carrier'}</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {selectedCarrierSections.map((section) => (
                    <div key={section.title} style={{ border: `1px solid ${t.border}`, borderRadius: 8, padding: 8, background: t.bgAlt }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: t.textSecondary, marginBottom: 6 }}>{section.title}</div>
                      <div style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                        {section.rows.map((row) => (
                          <div key={`${section.title}-${row.label}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <strong style={{ color: t.textSecondary }}>{row.label}</strong>
                            <span style={{ textAlign: 'right' }}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => navigate('/finance/ap')}
                    style={{ ...inputStyle, cursor: 'pointer', fontWeight: 700 }}
                  >
                    View AP Exposure
                  </button>
                </div>
              </>
            )}

            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.textSecondary, marginBottom: 8 }}>Compliance Alerts</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {complianceAlerts.length === 0 && <div style={{ fontSize: 12, color: t.textSecondary }}>No active alerts.</div>}
                {complianceAlerts.map((carrier) => (
                  <button
                    key={carrier.id || carrier.mcNumber || carrier.name}
                    type="button"
                    onClick={() => setSelectedId(carrier.id || carrier.mcNumber)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: `1px solid ${t.error}`,
                      borderRadius: 8,
                      background: 'transparent',
                      color: t.text,
                      padding: '7px 9px',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    {carrier.name || 'Unnamed'} • {(!carrier.mcNumber || !carrier.taxId) ? 'Missing docs' : 'Insurance expired'}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {rowContextMenu?.carrier && (
        <div
          role="menu"
          data-carrier-context-menu="true"
          style={{
            position: 'fixed',
            top: rowContextMenu.y,
            left: rowContextMenu.x,
            zIndex: 1200,
            minWidth: 220,
            borderRadius: 10,
            border: `1px solid ${t.border}`,
            background: t.surface,
            boxShadow: '0 14px 30px rgba(0,0,0,0.3)',
            padding: 8,
            display: 'grid',
            gap: 6,
          }}
        >
          <button
            type="button"
            onClick={() => {
              openCarrierProfile(rowContextMenu.carrier);
              setRowContextMenu(null);
            }}
            style={{ ...inputStyle, minHeight: 34, textAlign: 'left', cursor: 'pointer', fontWeight: 700 }}
          >
            Open Carrier Profile
          </button>
          <button
            type="button"
            onClick={() => {
              navigate('/finance/ap');
              setRowContextMenu(null);
            }}
            style={{ ...inputStyle, minHeight: 34, textAlign: 'left', cursor: 'pointer', fontWeight: 700 }}
          >
            Open AP Exposure
          </button>
        </div>
      )}
    </div>
  );
}
