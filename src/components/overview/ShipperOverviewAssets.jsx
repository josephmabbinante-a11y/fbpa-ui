import CollapsibleSection from '../CollapsibleSection';
import ExceptionBreakdownChart from '../ExceptionBreakdownChart';
import KPIWithTrend from '../KPIWithTrend';
import SavingsByCarrierChart from '../SavingsByCarrierChart';
import { useTheme, themes } from '../../contexts/ThemeContext';

const DEFAULT_VISIBILITY = {
  showTotalInvoices: true,
  showExceptions: true,
  showTotalSavings: true,
  showPending: true,
  showExceptionDistribution: true,
  showSavingsByCarrier: true,
  showRecentActivity: true,
};

function formatActivityAmount(activity) {
  if (Number.isFinite(Number(activity?.amount))) {
    return `$${Number(activity.amount).toLocaleString()}`;
  }
  return activity?.count ?? '-';
}

export default function ShipperOverviewAssets({
  data,
  visibility,
  onOpenInvoices,
  onOpenExceptions,
  onOpenReports,
}) {
  const { theme } = useTheme();
  const t = themes[theme];
  const prefs = { ...DEFAULT_VISIBILITY, ...(visibility || {}) };

  if (!data) return null;

  return (
    <>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 24 }}>
        {prefs.showTotalInvoices && (
          <KPIWithTrend
            label="Total Invoices"
            value={data.summary?.totalInvoices || 0}
            delta={5}
            trendData={data.trends?.invoiceTrend}
            trendColor="#0066cc"
            onClick={onOpenInvoices}
          />
        )}
        {prefs.showExceptions && (
          <KPIWithTrend
            label="Exceptions"
            value={data.summary?.totalExceptions || 0}
            delta={-2}
            trendData={data.trends?.exceptionTrend}
            trendColor="#ef4444"
            onClick={onOpenExceptions}
          />
        )}
        {prefs.showTotalSavings && (
          <KPIWithTrend
            label="Total Savings"
            value={data.summary?.totalSavings || 0}
            format="currency"
            delta={12}
            trendData={data.trends?.savingsTrend}
            trendColor="#10b981"
            onClick={onOpenReports}
          />
        )}
        {prefs.showPending && (
          <KPIWithTrend
            label="Pending"
            value={data.summary?.pendingReview || 0}
            delta={0}
            trendData={data.trends?.pendingTrend}
            trendColor="#f59e0b"
          />
        )}
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: 24 }}>
        {prefs.showExceptionDistribution && data.exceptionBreakdown && (
          <div style={{ minWidth: 0, width: '100%' }}>
            <ExceptionBreakdownChart data={data.exceptionBreakdown} onClick={onOpenExceptions} />
          </div>
        )}
        {prefs.showSavingsByCarrier && data.savingsByCarrier && (
          <div style={{ minWidth: 0, width: '100%' }}>
            <SavingsByCarrierChart data={data.savingsByCarrier} onClick={onOpenReports} />
          </div>
        )}
      </div>

      {prefs.showRecentActivity && (
        <CollapsibleSection title="Recent Activity" defaultOpen={true}>
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
              {(data.recentActivity || []).slice(0, 5).map((activity) => (
                <tr key={activity.id}>
                  <td style={{ padding: 8 }}>{activity.type}</td>
                  <td style={{ padding: 8 }}>{activity.invoiceNumber || activity.fileName}</td>
                  <td style={{ padding: 8 }}>{formatActivityAmount(activity)}</td>
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
  );
}
