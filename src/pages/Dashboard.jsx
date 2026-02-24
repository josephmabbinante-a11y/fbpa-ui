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
import KPIWithTrend from '../components/KPIWithTrend';
import CollapsibleSection from '../components/CollapsibleSection';
import ExceptionBreakdownChart from '../components/ExceptionBreakdownChart';
import SavingsByCarrierChart from '../components/SavingsByCarrierChart';
import { InlineAlert, PageHeader } from '../components/ui/Primitives';

export default function Dashboard() {
  const navigate = useNavigate();
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

  return (
    <div className="ui-page">
      <PageHeader
        title="Dashboard"
        description={DASH_VARIANTS.find((v) => v.key === variant)?.description}
        loading={loading}
        right={(
          <select value={variant} onChange={handleVariantChange} className="ui-select" style={{ width: 180 }}>
            {DASH_VARIANTS.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
          </select>
        )}
      />

      {error && (
        <InlineAlert>
          Backend error, using mock data: {error}
        </InlineAlert>
      )}

      {data && (
        <>
          {/* KPIs with Trends */}
          <div className="ui-grid-auto">
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

          <div className="ui-grid-wide">
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
          {dashboardPrefs.showRecentActivity && data.recentActivity && (
            <CollapsibleSection title={variant === 'broker' ? 'Recent Loads' : 'Recent Activity'} defaultOpen={true}>
              <div className="ui-table-wrap">
                <table className="ui-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>{variant === 'broker' ? 'Load/File' : 'Invoice/File'}</th>
                    <th>{variant === 'broker' ? 'Margin' : 'Amount'}</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivity?.slice(0, 5).map((activity) => (
                    <tr key={activity.id}>
                      <td>{activity.type}</td>
                      <td>{activity.invoiceNumber || activity.fileName}</td>
                      <td>
                        {variant === 'broker'
                          ? (activity.margin ? `${activity.margin}%` : activity.amount ? `$${activity.amount.toLocaleString()}` : activity.count)
                          : (activity.amount ? `$${activity.amount.toLocaleString()}` : activity.count)}
                      </td>
                      <td>{activity.status}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </CollapsibleSection>
          )}
        </>
      )}
    </div>
  );
}
