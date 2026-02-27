import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';
import KPIWithTrend from '../components/KPIWithTrend';
import CollapsibleSection from '../components/CollapsibleSection';
import SavingsByCarrierChart from '../components/SavingsByCarrierChart';
import ExceptionBreakdownChart from '../components/ExceptionBreakdownChart';
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

  useEffect(() => {
    let mounted = true;

    // Always use mock data as default
    setData(dashboardEnhanced);
    setLoading(false);

    // Optionally, allow API override if needed
    // const loadDashboard = async () => {
    //   setLoading(true);
    //   setError(null);
    //   const res = await getDashboard();
    //   if (!mounted) return;
    //   if (res && !res.error && res.data && Object.keys(res.data).length > 0) {
    //     setData(mergeDashboardData(res));
    //   } else {
    //     if (res?.error) setError(res.error);
    //   }
    //   setLoading(false);
    // };
    // loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const handleVariantChange = (event) => {
    const nextVariant = event.target.value;
    setVariant(nextVariant);
    try {
      localStorage.setItem(DASH_VARIANT_KEY, nextVariant);
    } catch {
      // localStorage may be blocked.
    }
  };

  // TODO: Implement Dashboard JSX here
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Dashboard</h1>
          <select
            value={variant}
            onChange={handleVariantChange}
            style={{ fontSize: 15, padding: '4px 10px', borderRadius: 6, border: `1px solid ${t.borderLight}`, background: t.bgAlt, color: t.text }}
          >
            {['shipper', 'carrier', 'broker'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
          </select>
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
      {!loading && !data && (
        <div style={{ padding: '8px 12px', backgroundColor: t.bgAlt, border: `1px solid ${t.warning}`, borderRadius: 4, fontSize: '13px', color: t.warning, marginBottom: 24 }}>
          No dashboard data available.
        </div>
      )}
      {data && (
        <>
          {/* KPIs with Trends */}
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 24 }}>
            {variant === 'shipper' && dashboardPrefs.showTotalInvoices && (
              <KPIWithTrend 
                label="Total Invoices" 
                value={data.summary?.totalInvoices || 0} 
                delta={5}
                trendData={data.trends?.invoiceTrend}
                trendColor="#0066cc"
                onClick={() => navigate('/invoices')}
              />
            )}
            {variant === 'shipper' && dashboardPrefs.showExceptions && (
              <KPIWithTrend 
                label="Exceptions" 
                value={data.summary?.totalExceptions || 0} 
                delta={-2}
                trendData={data.trends?.exceptionTrend}
                trendColor="#ef4444"
                onClick={() => navigate('/exceptions')}
              />
            )}
            {variant === 'shipper' && dashboardPrefs.showTotalSavings && (
              <KPIWithTrend 
                label="Total Savings" 
                value={data.summary?.totalSavings || 0} 
                format="currency" 
                delta={12}
                trendData={data.trends?.savingsTrend}
                trendColor="#10b981"
                onClick={() => navigate('/reports')}
              />
            )}
            {variant === 'shipper' && dashboardPrefs.showPending && (
              <KPIWithTrend 
                label="Pending" 
                value={data.summary?.pendingReview || 0} 
                delta={0}
                trendData={data.trends?.pendingTrend}
                trendColor="#f59e0b"
              />
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

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: 24 }}>
            {variant !== 'carrier' && dashboardPrefs.showExceptionDistribution && data.exceptionBreakdown && (
              <div style={{ minWidth: 0, width: '100%' }}>
                <ExceptionBreakdownChart data={data.exceptionBreakdown} onClick={() => navigate('/exceptions')} />
              </div>
            )}
            {variant === 'carrier' && (
              <div style={{ minWidth: 0, width: '100%' }}>
                <ExceptionBreakdownChart data={data.claimsBreakdown || data.exceptionBreakdown} onClick={() => navigate('/exceptions')} />
              </div>
            )}
            {variant !== 'carrier' && dashboardPrefs.showSavingsByCarrier && data.savingsByCarrier && (
              <div style={{ minWidth: 0, width: '100%' }}>
                <SavingsByCarrierChart data={data.savingsByCarrier} onClick={() => navigate('/reports')} />
              </div>
            )}
            {variant === 'carrier' && (
              <div style={{ minWidth: 0, width: '100%' }}>
                <SavingsByCarrierChart data={data.volumeByLane || data.savingsByCarrier} onClick={() => navigate('/reports')} />
              </div>
            )}
          </div>

          {dashboardPrefs.showRecentActivity && (
            <CollapsibleSection title={variant === 'broker' ? 'Recent Loads' : 'Recent Activity'} defaultOpen={true}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8 }}>Type</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>{variant === 'broker' ? 'Load/File' : 'Invoice/File'}</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>{variant === 'broker' ? 'Margin' : 'Amount'}</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivity?.slice(0, 5).map((activity) => (
                    <tr key={activity.id}>
                      <td style={{ padding: 8 }}>{activity.type}</td>
                      <td style={{ padding: 8 }}>{activity.invoiceNumber || activity.fileName}</td>
                      <td style={{ padding: 8 }}>
                        {variant === 'broker'
                          ? (activity.margin ? `${activity.margin}%` : activity.amount ? `$${activity.amount.toLocaleString()}` : activity.count)
                          : (activity.amount ? `$${activity.amount.toLocaleString()}` : activity.count)}
                      </td>
                      <td style={{ padding: 8 }}>{activity.status}</td>
                      <td style={{ padding: 8, fontSize: '12px', color: t.textSecondary }}>
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CollapsibleSection>
          )}
        </>
      )}
    </div>
  );
}
// Demo mode: Uncomment to use mock data
// useEffect(() => { setData(dashboardEnhanced); setLoading(false); }, []);
