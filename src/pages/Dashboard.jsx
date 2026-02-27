import { useEffect, useState } from 'react';
import { useDemo } from '../demo/DemoContext';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';
import dashboardEnhanced from '../mock/dashboardEnhanced';

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
    return 'shipper';
  } catch {
    return 'shipper';
  }
}

function mergeDashboardData(incoming) {
  if (!incoming || typeof incoming !== 'object') return dashboardEnhanced;
  const hasUsableSeries = (series) =>
    Array.isArray(series) &&
    series.length > 0 &&
    series.some((point) =>
      Object.entries(point || {}).some(([key, value]) => {
        if (key === 'day' || key === 'date' || key === 'month' || key === 'period' || key === 'label') return false;
        return Number.isFinite(Number(value));
      })
    );
  const hasUsableBreakdown = (items) =>
    Array.isArray(items) &&
    items.length > 0 &&
    items.some((item) => Number(item?.value ?? item?.count ?? item?.total ?? 0) > 0);
  const hasUsableSavings = (items) =>
    Array.isArray(items) &&
    items.length > 0 &&
    items.some((item) => Number(item?.savings ?? item?.total ?? item?.value ?? 0) > 0);
  const fallbackTrends = dashboardEnhanced.trends || {};
  const incomingTrends = incoming.trends || {};
  const mergedTrends = {};
  Object.keys(fallbackTrends).forEach((key) => {
    const nextSeries = incomingTrends[key];
    mergedTrends[key] = hasUsableSeries(nextSeries) ? nextSeries : fallbackTrends[key];
  });
  return {
    ...dashboardEnhanced,
    ...incoming,
    summary: { ...dashboardEnhanced.summary, ...(incoming.summary || {}) },
    trends: mergedTrends,
    exceptionBreakdown: hasUsableBreakdown(incoming.exceptionBreakdown)
      ? incoming.exceptionBreakdown
      : dashboardEnhanced.exceptionBreakdown,
    claimsBreakdown: hasUsableBreakdown(incoming.claimsBreakdown)
      ? incoming.claimsBreakdown
      : dashboardEnhanced.exceptionBreakdown,
    savingsByCarrier: hasUsableSavings(incoming.savingsByCarrier)
      ? incoming.savingsByCarrier
      : dashboardEnhanced.savingsByCarrier,
    volumeByLane: hasUsableSavings(incoming.volumeByLane)
      ? incoming.volumeByLane
      : dashboardEnhanced.savingsByCarrier,
    recentActivity: incoming.recentActivity?.length ? incoming.recentActivity : dashboardEnhanced.recentActivity,
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = themes[theme];
  const [data, setData] = useState(() => dashboardEnhanced);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardPrefs, setDashboardPrefs] = useState(() => readDashboardPrefs());
  const [variant, setVariant] = useState(() => readDashboardVariant());
  // Demo/mock mode
  const { demoMode } = typeof useDemo === 'function' ? useDemo() : { demoMode: false };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      // Debug log demoMode
      console.log('[Dashboard] demoMode:', demoMode);
      // Use mock mode if enabled
      if (demoMode) {
        console.log('[Dashboard] Using mock dashboardEnhanced');
        setData(dashboardEnhanced);
        setLoading(false);
        return;
      }
      try {
        const res = await getDashboard();
        console.log('[Dashboard] getDashboard result:', res);
        if (!mounted) return;
        if (res && !res.error && (res.data || Object.keys(res).length > 0)) {
          setData(mergeDashboardData(res.data || res));
        } else {
          setData(dashboardEnhanced);
          if (res?.error) setError(res.error);
        }
      } catch (err) {
        setData(dashboardEnhanced);
        setError(err.message || String(err));
        console.error('[Dashboard] Error loading dashboard:', err);
      }
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [demoMode]);

  const handleVariantChange = (event) => {
    const nextVariant = event.target.value;
    setVariant(nextVariant);
    try {
      localStorage.setItem(DASH_VARIANT_KEY, nextVariant);
    } catch {
      // localStorage may be blocked.
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Dashboard</h1>
        </div>
        <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 2, marginBottom: 2 }}>
          {/* Add variant description here if needed */}
        </div>
        {loading && <span style={{ fontSize: '12px', color: t.textSecondary }}>Loading...</span>}
      </div>

      {loading && (
        <div style={{ padding: '8px 12px', backgroundColor: t.bgAlt, border: `1px solid ${t.accent}`, borderRadius: 4, fontSize: '13px', color: t.accent, marginBottom: 24 }}>
          Loading dashboard data...
        </div>
      )}
      {error && !loading && (
        <div style={{ padding: '8px 12px', backgroundColor: t.bgAlt, border: `1px solid ${t.error}`, borderRadius: 4, fontSize: '13px', color: t.error, marginBottom: 24 }}>
          Error loading dashboard: {error}
        </div>
      )}
      {!loading && (!data || typeof data !== 'object' || Object.keys(data).length === 0) && (
        <div style={{ padding: '8px 12px', backgroundColor: t.bgAlt, border: `1px solid ${t.warning}`, borderRadius: 4, fontSize: '13px', color: t.warning, marginBottom: 24 }}>
          <b>Dashboard fallback:</b> No dashboard data available.<br />
          <pre style={{ fontSize: 12, color: t.textSecondary, marginTop: 8 }}>data: {JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      {data && typeof data === 'object' && Object.keys(data).length > 0 && (
        <div style={{ marginTop: 32 }}>
          <details style={{ fontSize: 12, color: t.textSecondary }}>
            <summary>[DEBUG] Dashboard state (click to expand)</summary>
            <pre>loading: {JSON.stringify(loading)}{"\n"}error: {JSON.stringify(error)}{"\n"}data: {JSON.stringify(data, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
