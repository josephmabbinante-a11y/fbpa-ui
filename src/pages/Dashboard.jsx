import { useEffect, useState } from 'react';
const defaultDashboardPrefs = {
  showTotalInvoices: true,
  showExceptions: true,
  showTotalSavings: true,
  showPending: true,
  showExceptionDistribution: true,
  showSavingsByCarrier: true,
  showRecentActivity: true,
};
const DASH_PREFS_KEY = 'dashboardPrefs';
const DASH_VARIANTS = [
  { key: 'shipper', label: 'Shipper', description: 'Shipper-focused metrics and analytics.' },
  { key: 'carrier', label: 'Carrier', description: 'Carrier performance and compliance.' },
  { key: 'broker', label: 'Broker', description: 'Brokerage and margin analytics.' },
];
const DASH_VARIANT_KEY = 'dashboardVariant';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/client';
import dashboardEnhanced from '../mock/dashboardEnhanced';
import { useTheme, themes } from '../contexts/ThemeContext';
import KPIWithTrend from '../components/KPIWithTrend';
import CollapsibleSection from '../components/CollapsibleSection';
import ExceptionBreakdownChart from '../components/ExceptionBreakdownChart';
import SavingsByCarrierChart from '../components/SavingsByCarrierChart';

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = themes[theme];
  const [data, setData] = useState(dashboardEnhanced);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardPrefs, setDashboardPrefs] = useState(defaultDashboardPrefs);
  const [variant, setVariant] = useState(() => {
    try {
      return localStorage.getItem(DASH_VARIANT_KEY) || 'shipper';
    } catch {
      return 'shipper';
    }
  });

  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem(DASH_PREFS_KEY));
      if (prefs) setDashboardPrefs(prefs);
    } catch {}
  }, []);

  function handleVariantChange(e) {
    setVariant(e.target.value);
    try { localStorage.setItem(DASH_VARIANT_KEY, e.target.value); } catch {}
  }

  useEffect(() => {
    let mounted = true;
    getDashboard()
      .then((res) => {
        if (!mounted) return;
        if (res && !res.error && res.summary) setData(res);
        else setError(res && res.error ? res.error : null);
      })
      .catch((err) => mounted && setError(err.message || String(err)))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  const containerStyle = {
    padding: '24px 32px',
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
  };

  const headerStyle = {
    marginBottom: 24,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  };

  const kpiGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12,
    marginBottom: 32,
  };

  const chartGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: 20,
    marginBottom: 24,
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  };

  const thStyle = {
    padding: '8px 12px',
    textAlign: 'left',
    fontWeight: '600',
    backgroundColor: t.surface,
    borderBottom: `1px solid ${t.border}`,
    color: t.textSecondary,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  };

  const tdStyle = {
    padding: '8px 12px',
    borderBottom: `1px solid ${t.borderLight}`,
    color: t.text,
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <h1 style={titleStyle}>Dashboard</h1>
          <select value={variant} onChange={handleVariantChange} style={{ fontSize: 15, padding: '4px 10px', borderRadius: 6, border: `1px solid ${t.borderLight}`, background: t.bgAlt, color: t.text }}>
            {DASH_VARIANTS.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 2, marginBottom: 2 }}>
          {DASH_VARIANTS.find(v => v.key === variant)?.description}
        </div>
        {loading && <span style={{ fontSize: '12px', color: t.textSecondary }}>Loading...</span>}
      </div>

      {error && (
        <div style={{ padding: '8px 12px', backgroundColor: t.bgAlt, border: `1px solid ${t.warning}`, borderRadius: 4, fontSize: '13px', color: t.warning, marginBottom: 24 }}>
          Backend error, using mock data: {error}
        </div>
      )}

      {data && (
        <>
          {/* KPIs with Trends */}
          <div style={kpiGridStyle}>
            {/* Shipper: All KPIs, Carrier: On-Time, Claims, Volume, Broker: Margin, Loads, Revenue */}
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

          <div style={chartGridStyle}>
            {/* Exception Distribution Chart (Shipper, Broker) or Claims (Carrier) */}
            {variant !== 'carrier' && dashboardPrefs.showExceptionDistribution && data.exceptionBreakdown && (
              <div style={{ minWidth: 0 }}>
                <ExceptionBreakdownChart data={data.exceptionBreakdown} onClick={() => navigate('/exceptions')} />
              </div>
            )}
            {variant === 'carrier' && (
              <div style={{ minWidth: 0 }}>
                {/* Could use a Claims chart or On-Time trend for carriers */}
                <ExceptionBreakdownChart data={data.claimsBreakdown || data.exceptionBreakdown} onClick={() => navigate('/exceptions')} />
              </div>
            )}

            {/* Savings by Carrier Chart (Shipper, Broker) or Volume by Lane (Carrier) */}
            {variant !== 'carrier' && dashboardPrefs.showSavingsByCarrier && data.savingsByCarrier && (
              <div style={{ minWidth: 0 }}>
                <SavingsByCarrierChart data={data.savingsByCarrier} onClick={() => navigate('/reports')} />
              </div>
            )}
            {variant === 'carrier' && (
              <div style={{ minWidth: 0 }}>
                {/* Could use a Volume by Lane chart for carriers */}
                <SavingsByCarrierChart data={data.volumeByLane || data.savingsByCarrier} onClick={() => navigate('/reports')} />
              </div>
            )}
          </div>

          {/* Summary Tables */}
          {dashboardPrefs.showRecentActivity && (
            <CollapsibleSection title={variant === 'broker' ? 'Recent Loads' : 'Recent Activity'} defaultOpen={true}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>{variant === 'broker' ? 'Load/File' : 'Invoice/File'}</th>
                    <th style={thStyle}>{variant === 'broker' ? 'Margin' : 'Amount'}</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivity?.slice(0, 5).map((activity) => (
                    <tr key={activity.id}>
                      <td style={tdStyle}>{activity.type}</td>
                      <td style={tdStyle}>{activity.invoiceNumber || activity.fileName}</td>
                      <td style={tdStyle}>
                        {variant === 'broker'
                          ? (activity.margin ? `${activity.margin}%` : activity.amount ? `$${activity.amount.toLocaleString()}` : activity.count)
                          : (activity.amount ? `$${activity.amount.toLocaleString()}` : activity.count)}
                      </td>
                      <td style={tdStyle}>{activity.status}</td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: t.textSecondary }}>
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
