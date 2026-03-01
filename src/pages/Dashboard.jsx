import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/client';
import dashboardEnhanced from '../mock/dashboardEnhanced';
import { useTheme, themes } from '../contexts/ThemeContext';
import KPIWithTrend from '../components/KPIWithTrend';
import CollapsibleSection from '../components/CollapsibleSection';
import ExceptionBreakdownChart from '../components/ExceptionBreakdownChart';
import SavingsByCarrierChart from '../components/SavingsByCarrierChart';
import { useApi } from '../hooks/useApi';

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

function mergeDashboardData(incoming) {
  if (!incoming || typeof incoming !== 'object') return dashboardEnhanced;

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
    savingsByCarrier: hasUsableSavings(incoming.savingsByCarrier)
      ? incoming.savingsByCarrier
      : dashboardEnhanced.savingsByCarrier,
    recentActivity: Array.isArray(incoming.recentActivity) && incoming.recentActivity.length > 0
      ? incoming.recentActivity
      : dashboardEnhanced.recentActivity,
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = themes[theme];

  const { data: rawData, loading, error } = useApi(getDashboard, dashboardEnhanced);
  const data = useMemo(() => mergeDashboardData(rawData), [rawData]);

  const [dashboardPrefs] = useState(() => readDashboardPrefs());
  const [variant, setVariant] = useState(() => readDashboardVariant());

  useEffect(() => {
    try {
      localStorage.setItem(DASH_VARIANT_KEY, variant);
    } catch {
      // ignore storage errors
    }
  }, [variant]);

  return (
    <div style={{ padding: 24, minHeight: '100vh', backgroundColor: t.bg, color: t.text }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Operational Command Center</h1>
        <select
          value={variant}
          onChange={(event) => setVariant(event.target.value)}
          style={{
            fontSize: 14,
            padding: '6px 10px',
            borderRadius: 6,
            border: `1px solid ${t.border}`,
            background: t.surface,
            color: t.text,
          }}
        >
          <option value="shipper">Shipper</option>
          <option value="carrier">Carrier</option>
          <option value="broker">Broker</option>
        </select>
      </div>

      {error ? (
        <div style={{ marginBottom: 12, fontSize: 12, color: t.warning }}>Using fallback dashboard data: {error}</div>
      ) : null}

      <CollapsibleSection title="Key Performance Indicators" defaultOpen>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {variant === 'shipper' && dashboardPrefs.showTotalInvoices ? (
            <KPIWithTrend
              label="Total Invoices"
              value={data.summary?.totalInvoices || 0}
              delta={5}
              trendData={data.trends?.invoiceTrend}
              trendColor="#0066cc"
              onClick={() => navigate('/invoices')}
            />
          ) : null}
          {variant === 'shipper' && dashboardPrefs.showExceptions ? (
            <KPIWithTrend
              label="Exceptions"
              value={data.summary?.totalExceptions || 0}
              delta={-2}
              trendData={data.trends?.exceptionTrend}
              trendColor="#ef4444"
              onClick={() => navigate('/exceptions')}
            />
          ) : null}
          {variant === 'shipper' && dashboardPrefs.showTotalSavings ? (
            <KPIWithTrend
              label="Total Savings"
              value={data.summary?.totalSavings || 0}
              format="currency"
              delta={12}
              trendData={data.trends?.savingsTrend}
              trendColor="#10b981"
              onClick={() => navigate('/reports')}
            />
          ) : null}
          {variant === 'shipper' && dashboardPrefs.showPending ? (
            <KPIWithTrend
              label="Pending"
              value={data.summary?.pendingReview || 0}
              delta={0}
              trendData={data.trends?.pendingTrend}
              trendColor="#f59e0b"
            />
          ) : null}
          {variant === 'carrier' ? (
            <>
              <KPIWithTrend label="On-Time %" value={data.summary?.onTime || 0} delta={2} trendData={data.trends?.onTimeTrend} trendColor="#10b981" />
              <KPIWithTrend label="Claims %" value={data.summary?.claimsRate || 0} delta={-1} trendData={data.trends?.claimsTrend} trendColor="#ef4444" />
              <KPIWithTrend label="Volume" value={data.summary?.totalInvoices || 0} delta={3} trendData={data.trends?.invoiceTrend} trendColor="#0066cc" />
            </>
          ) : null}
          {variant === 'broker' ? (
            <>
              <KPIWithTrend label="Margin %" value={data.summary?.margin || 0} delta={1} trendData={data.trends?.marginTrend} trendColor="#10b981" />
              <KPIWithTrend label="Loads" value={data.summary?.loads || 0} delta={4} trendData={data.trends?.loadsTrend} trendColor="#0066cc" />
              <KPIWithTrend label="Revenue" value={data.summary?.revenue || 0} format="currency" delta={7} trendData={data.trends?.revenueTrend} trendColor="#f59e0b" />
            </>
          ) : null}
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

      <CollapsibleSection title="Recent Activity" defaultOpen={dashboardPrefs.showRecentActivity}>
        {loading ? (
          <div style={{ fontSize: 13, color: t.textSecondary }}>Loading dashboard...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8 }}>Type</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Invoice/File</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Amount</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentActivity || []).map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: 8 }}>{item.type}</td>
                  <td style={{ padding: 8 }}>{item.invoiceNumber || item.fileName || '-'}</td>
                  <td style={{ padding: 8 }}>{typeof item.amount === 'number' ? `$${item.amount.toLocaleString()}` : item.count || '-'}</td>
                  <td style={{ padding: 8 }}>{item.status}</td>
                  <td style={{ padding: 8 }}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CollapsibleSection>
    </div>
  );
}
