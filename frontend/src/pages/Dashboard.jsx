import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/client';
import dashboardEnhanced from '../mock/dashboardEnhanced';
import { useTheme, themes } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';
import KPIWithTrend from '../components/KPIWithTrend';
import CollapsibleSection from '../components/CollapsibleSection';
import ExceptionBreakdownChart from '../components/ExceptionBreakdownChart';
import SavingsByCarrierChart from '../components/SavingsByCarrierChart';
import { useApi } from '../hooks/useApi';
import mockShipments from '../mock/shipments';
import { listLoads } from '../api/loadsClient';

const DASH_PREFS_KEY = 'dashboardPrefs';
const DASH_VARIANT_KEY = 'dashboardVariant';

const DEFAULT_DASHBOARD_PREFS = {
  showTotalInvoices: true,
  showExceptions: true,
  showTotalSavings: true,
  showPending: true,
  showExceptionDistribution: true,
  showSavingsByCarrier: true,
  showRecentActivity: true,
};

const EMPTY_DASHBOARD_DATA = {
  summary: {},
  trends: {},
  exceptionBreakdown: [],
  savingsByCarrier: [],
  recentActivity: [],
};

function readDashboardPrefs() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DASH_PREFS_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return DEFAULT_DASHBOARD_PREFS;

    const normalized = { ...DEFAULT_DASHBOARD_PREFS };
    Object.keys(DEFAULT_DASHBOARD_PREFS).forEach((key) => {
      if (typeof parsed[key] === 'boolean') {
        normalized[key] = parsed[key];
      }
    });

    return normalized;
  } catch {
    return DEFAULT_DASHBOARD_PREFS;
  }
}

function readDashboardVariant() {
  try {
    const stored = localStorage.getItem(DASH_VARIANT_KEY);
    if (stored === 'shipper' || stored === 'carrier' || stored === 'broker') {
      return stored;
    }
  } catch {
    // ignore storage errors
  }

  return 'shipper';
}

function hasUsableSeries(series) {
  return (
    Array.isArray(series) &&
    series.length > 0 &&
    series.some((point) =>
      Object.entries(point || {}).some(([key, value]) => {
        if (key === 'day' || key === 'date' || key === 'month' || key === 'period' || key === 'label') return false;
        return Number.isFinite(Number(value));
      })
    )
  );
}

function hasUsableBreakdown(items) {
  return Array.isArray(items) && items.length > 0 && items.some((item) => Number(item?.value ?? item?.count ?? item?.total ?? 0) > 0);
}

function hasUsableSavings(items) {
  return Array.isArray(items) && items.length > 0 && items.some((item) => Number(item?.savings ?? item?.total ?? item?.value ?? 0) > 0);
}

const toCurrency = (value) => `$${Number(value || 0).toLocaleString()}`;

function mapLoadToRow(load) {
  const revenue = Number(load?.revenue || 0);
  const carrierCost = Number(load?.carrierCost || 0);
  const margin = revenue - carrierCost;
  return {
    id: load?.id || `L-${Date.now()}`,
    customer: typeof load?.customer === 'object' ? (load.customer?.name || '—') : (load?.customer || '—'),
    carrier: typeof load?.carrier === 'object' ? (load.carrier?.name || 'Pending') : (load?.carrier || 'Pending'),
    origin: typeof load?.origin === 'object'
      ? `${load.origin?.city || '—'}${load.origin?.state ? `, ${load.origin.state}` : ''}`
      : (load?.origin || '—'),
    destination: typeof load?.destination === 'object'
      ? `${load.destination?.city || '—'}${load.destination?.state ? `, ${load.destination.state}` : ''}`
      : (load?.destination || '—'),
    status: String(load?.status || 'open').replaceAll('_', ' '),
    revenue: toCurrency(revenue),
    cost: toCurrency(carrierCost),
    margin: toCurrency(margin),
    dueDate: load?.deliveryAt ? new Date(load.deliveryAt).toLocaleString() : (load?.dueDate || '—'),
    raw: load,
  };
}

function mergeDashboardData(incoming, demoMode = false) {
  const fallback = demoMode ? dashboardEnhanced : EMPTY_DASHBOARD_DATA;
  if (!incoming || typeof incoming !== 'object') return fallback;

  const fallbackTrends = fallback.trends || {};
  const incomingTrends = incoming.trends || {};
  const mergedTrends = {};

  Object.keys(fallbackTrends).forEach((key) => {
    const nextSeries = incomingTrends[key];
    mergedTrends[key] = hasUsableSeries(nextSeries) ? nextSeries : fallbackTrends[key];
  });

  return {
    ...fallback,
    ...incoming,
    summary: { ...fallback.summary, ...(incoming.summary || {}) },
    trends: mergedTrends,
    exceptionBreakdown: hasUsableBreakdown(incoming.exceptionBreakdown)
      ? incoming.exceptionBreakdown
      : fallback.exceptionBreakdown,
    claimsBreakdown: hasUsableBreakdown(incoming.claimsBreakdown)
      ? incoming.claimsBreakdown
      : fallback.exceptionBreakdown,
    savingsByCarrier: hasUsableSavings(incoming.savingsByCarrier)
      ? incoming.savingsByCarrier
      : fallback.savingsByCarrier,
    volumeByLane: hasUsableSavings(incoming.volumeByLane)
      ? incoming.volumeByLane
      : fallback.savingsByCarrier,
    recentActivity: incoming.recentActivity?.length ? incoming.recentActivity : fallback.recentActivity,
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { settings } = useTheme();
  const { demoMode } = useDemo();
  const resolvedMode = settings?.modePreference === 'dark' ? 'dark'
    : settings?.modePreference === 'light' ? 'light'
    : (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const t = themes[`${settings?.palette ?? 'opscale-blue'}-${resolvedMode}`]
    ?? themes['opscale-blue-dark']
    ?? {};

  const { data: rawData, loading, error } = useApi(getDashboard, demoMode ? dashboardEnhanced : null, [demoMode]);
  const data = useMemo(
    () => mergeDashboardData(rawData, demoMode),
    [demoMode, rawData]
  );

  const [dashboardPrefs] = useState(() => readDashboardPrefs());
  const [variant, setVariant] = useState(() => readDashboardVariant());
  const [todayShipments, setTodayShipments] = useState(() => Array.isArray(mockShipments) ? mockShipments.map(mapLoadToRow) : []);
  const [shipmentsSource, setShipmentsSource] = useState('fallback');
  const [shipmentsUpdatedAt, setShipmentsUpdatedAt] = useState(null);

  useEffect(() => {
    let mounted = true;

    const isToday = (value) => {
      const date = new Date(value || '');
      if (Number.isNaN(date.getTime())) return false;
      const now = new Date();
      return date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
    };

    const refreshShipments = async () => {
      const result = await listLoads({ tab: 'all', page: 1, pageSize: 100, sort: '-updatedAt' });

      if (!mounted) return;

      if (result?.error || !Array.isArray(result?.items)) {
        setShipmentsSource('fallback');
        setShipmentsUpdatedAt(new Date());
        if (!Array.isArray(todayShipments) || todayShipments.length === 0) {
          setTodayShipments(Array.isArray(mockShipments) ? mockShipments.map(mapLoadToRow) : []);
        }
        return;
      }

      const items = result.items;
      const todaysItems = items.filter((item) => isToday(item.pickupAt || item.updatedAt));
      const rows = (todaysItems.length > 0 ? todaysItems : items)
        .slice(0, 25)
        .map(mapLoadToRow);

      setTodayShipments(rows);
      setShipmentsSource('api');
      setShipmentsUpdatedAt(new Date());
    };

    refreshShipments();
    const timer = window.setInterval(refreshShipments, 15000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DASH_VARIANT_KEY, variant);
    } catch {
      // ignore storage errors
    }
  }, [variant]);

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: t.bg || t.surface }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: `2px solid ${t.border}`, paddingBottom: 12 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: t.text, letterSpacing: 0.2 }}>Operational Command Center</h1>
        <select value={variant} onChange={e => setVariant(e.target.value)} style={{ fontSize: 15, padding: '4px 10px', borderRadius: 6, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, marginLeft: 24 }}>
          <option value="shipper">Shipper</option>
          <option value="carrier">Carrier</option>
          <option value="broker">Broker</option>
        </select>
      </header>

      {error ? (
        <div style={{ marginBottom: 12, fontSize: 12, color: t.warning }}>
          {demoMode ? `Using fallback dashboard data: ${error}` : `Unable to load dashboard: ${error}`}
        </div>
      ) : null}

      <CollapsibleSection title="Key Performance Indicators" defaultOpen>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {variant === 'shipper' && dashboardPrefs.showTotalInvoices && (
            <KPIWithTrend label="Total Invoices" value={data.summary?.totalInvoices || 0} delta={5} trendData={data.trends?.invoiceTrend} trendColor="#0066cc" onClick={() => navigate('/invoices')} />
          )}
          {variant === 'shipper' && dashboardPrefs.showExceptions && (
            <KPIWithTrend label="Exceptions" value={data.summary?.totalExceptions || 0} delta={-2} trendData={data.trends?.exceptionTrend} trendColor="#ef4444" onClick={() => navigate('/exceptions')} />
          )}
          {variant === 'shipper' && dashboardPrefs.showTotalSavings && (
            <KPIWithTrend label="Total Savings" value={data.summary?.totalSavings || 0} format="currency" delta={12} trendData={data.trends?.savingsTrend} trendColor="#10b981" onClick={() => navigate('/reports')} />
          )}
          {variant === 'shipper' && dashboardPrefs.showPending && (
            <KPIWithTrend label="Pending" value={data.summary?.pendingReview || 0} delta={0} trendData={data.trends?.pendingTrend} trendColor="#f59e0b" />
          )}
          {variant === 'carrier' && (
            <>
              <KPIWithTrend label="On-Time %" value={data.summary?.onTime || 0} delta={2} trendData={data.trends?.onTimeTrend} trendColor="#10b981" />
              <KPIWithTrend label="Claims %" value={data.summary?.claimsRate || 0} delta={-1} trendData={data.trends?.claimsTrend} trendColor="#ef4444" />
              <KPIWithTrend label="Volume" value={data.summary?.totalInvoices || 0} delta={3} trendData={data.trends?.invoiceTrend} trendColor="#0066cc" />
            </>
          )}
          {variant === 'broker' && (
            <>
              <KPIWithTrend label="Margin %" value={data.summary?.margin || 0} delta={1} trendData={data.trends?.marginTrend} trendColor="#10b981" />
              <KPIWithTrend label="Loads" value={data.summary?.loads || 0} delta={4} trendData={data.trends?.loadsTrend} trendColor="#0066cc" />
              <KPIWithTrend label="Revenue" value={data.summary?.revenue || 0} format="currency" delta={7} trendData={data.trends?.revenueTrend} trendColor="#f59e0b" />
            </>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Shipment Analytics & Distribution" defaultOpen>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {dashboardPrefs.showExceptionDistribution ? (
            <ExceptionBreakdownChart data={data.exceptionBreakdown} onClick={() => navigate('/exceptions')} />
          ) : null}
          {dashboardPrefs.showSavingsByCarrier ? (
            <SavingsByCarrierChart data={data.savingsByCarrier} onClick={() => navigate('/reports')} />
          ) : null}
        </div>
      </CollapsibleSection>

      {/* Operational Table: Shipments */}
      <CollapsibleSection title="Today's Shipments Overview" defaultOpen>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <button style={{ marginRight: 8, padding: '6px 14px', borderRadius: 6, border: `1px solid ${t.accent}`, background: t.bgAlt, color: t.accent, fontWeight: 600, cursor: 'pointer' }} onClick={() => alert('Export to Excel coming soon!')}>Export to Excel</button>
            <button style={{ marginRight: 8, padding: '6px 14px', borderRadius: 6, border: `1px solid ${t.accent}`, background: t.bgAlt, color: t.accent, fontWeight: 600, cursor: 'pointer' }} onClick={() => alert('Filter fields coming soon!')}>Filter Fields</button>
            <button style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${t.accent}`, background: t.bgAlt, color: t.accent, fontWeight: 600, cursor: 'pointer' }} onClick={() => alert('Advanced search coming soon!')}>Show Advanced</button>
          </div>
          <div style={{ display: 'grid', justifyItems: 'end', gap: 6 }}>
            <div style={{ fontSize: 12, color: t.textSecondary }}>
              Source: {shipmentsSource === 'api' ? 'Live API' : 'Fallback data'}{shipmentsUpdatedAt ? ` • Updated ${shipmentsUpdatedAt.toLocaleTimeString()}` : ''}
            </div>
            <button
              style={{ padding: '8px 18px', background: t.positive, color: t.surfaceStrong || t.text, border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
              onClick={() => navigate('/loadcenter', { state: { source: 'dashboard', action: 'create-shipment' } })}
            >
              Add New Shipment
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Customer</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Carrier</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Origin</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Destination</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Revenue</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Cost</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Margin</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {(todayShipments || []).map((ship) => (
                <tr
                  key={ship.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/loadcenter', {
                    state: {
                      source: 'dashboard',
                      action: 'open-shipment',
                      shipmentId: ship.id,
                      shipment: ship.raw || ship,
                    },
                  })}
                >
                  <td style={{ padding: '8px 12px' }}><strong>{ship.id}</strong></td>
                  <td style={{ padding: '8px 12px' }}>{ship.customer}</td>
                  <td style={{ padding: '8px 12px' }}>{ship.carrier}</td>
                  <td style={{ padding: '8px 12px' }}>{ship.origin}</td>
                  <td style={{ padding: '8px 12px' }}>{ship.destination}</td>
                  <td style={{ padding: '8px 12px' }}>{ship.status}</td>
                  <td style={{ padding: '8px 12px' }}>{ship.revenue}</td>
                  <td style={{ padding: '8px 12px' }}>{ship.cost}</td>
                  <td style={{ padding: '8px 12px' }}><strong>{ship.margin}</strong></td>
                  <td style={{ padding: '8px 12px' }}>{ship.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>

      {/* Financial & Statistical Reports */}
      <CollapsibleSection title="Operational & Financial Reports" defaultOpen>
        <div style={{ fontSize: 14, color: t.textSecondary, marginBottom: 12 }}>
          Access detailed analytics and exportable reports for finance, KPIs, and operational metrics.
        </div>
        <button style={{ padding: '10px 18px', background: t.accent, color: t.surfaceStrong || t.text, border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: 'pointer' }} onClick={() => navigate('/reports')}>
          View Full Reports
        </button>
      </CollapsibleSection>

      {/* Debug State */}
      <div style={{ marginTop: 32 }}>
        <details style={{ fontSize: 12, color: t.textSecondary }}>
          <summary>[DEBUG] Dashboard state (click to expand)</summary>
          <pre>loading: {JSON.stringify(loading)}{"\n"}error: {JSON.stringify(error)}{"\n"}data: {JSON.stringify(data, null, 2)}</pre>
        </details>
      </div>
    </div>
  );
}
