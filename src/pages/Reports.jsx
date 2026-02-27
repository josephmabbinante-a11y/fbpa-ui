import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReports } from '../api/client';
import mockReports from '../mock/reports';
import { useTheme, themes } from '../contexts/ThemeContext';
import TrendLineChart from '../components/TrendLineChart';
import AuditDrillDown from '../components/AuditDrillDown';
import CategoryDrilldown from '../components/CategoryDrilldown';

const reportCards = [
  { id: 'monthly', title: 'Monthly Summary', description: 'Invoice and savings summary by month' },
  { id: 'exceptions', title: 'Exception Breakdown', description: 'Exception categories and frequency' },
  { id: 'carriers', title: 'Top Savings Carriers', description: 'Highest savings by carrier' },
  { id: 'audit', title: 'Audit Drilldown', description: 'Freight bill audit metrics' },
];

const isNonEmptyArray = (value) => Array.isArray(value) && value.length > 0;

function mergeReportsData(base, incoming) {
  if (!incoming || typeof incoming !== 'object') {
    return base;
  }

  const next = {
    ...base,
    ...incoming,
    monthlySummary: isNonEmptyArray(incoming.monthlySummary) ? incoming.monthlySummary : base.monthlySummary,
    exceptionBreakdown: isNonEmptyArray(incoming.exceptionBreakdown) ? incoming.exceptionBreakdown : base.exceptionBreakdown,
    statusDistribution: isNonEmptyArray(incoming.statusDistribution) ? incoming.statusDistribution : base.statusDistribution,
    topSavingsCarriers: isNonEmptyArray(incoming.topSavingsCarriers) ? incoming.topSavingsCarriers : base.topSavingsCarriers,
    savingsTrend: isNonEmptyArray(incoming.savingsTrend) ? incoming.savingsTrend : base.savingsTrend,
    exceptionTrend: isNonEmptyArray(incoming.exceptionTrend) ? incoming.exceptionTrend : base.exceptionTrend,
    categoryDrilldown: isNonEmptyArray(incoming.categoryDrilldown) ? incoming.categoryDrilldown : base.categoryDrilldown,
  };

  const incomingAudit = incoming.auditMetrics && typeof incoming.auditMetrics === 'object' ? incoming.auditMetrics : null;
  const baseAudit = base.auditMetrics && typeof base.auditMetrics === 'object' ? base.auditMetrics : {};

  next.auditMetrics = incomingAudit
    ? {
        ...baseAudit,
        ...incomingAudit,
        freightBillAudit: isNonEmptyArray(incomingAudit.freightBillAudit)
          ? incomingAudit.freightBillAudit
          : baseAudit.freightBillAudit,
        paymentRecovery: isNonEmptyArray(incomingAudit.paymentRecovery)
          ? incomingAudit.paymentRecovery
          : baseAudit.paymentRecovery,
        auditFindings: isNonEmptyArray(incomingAudit.auditFindings)
          ? incomingAudit.auditFindings
          : baseAudit.auditFindings,
        paymentProcessing: isNonEmptyArray(incomingAudit.paymentProcessing)
          ? incomingAudit.paymentProcessing
          : baseAudit.paymentProcessing,
      }
    : baseAudit;

  return next;
}

export default function Reports() {
  const { theme } = useTheme();
  const t = themes[theme];
  const navigate = useNavigate();
  const [data, setData] = useState(mockReports);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    let mounted = true;
    getReports()
      .then((res) => {
        if (!mounted) return;
        if (res?.error) setError(res.error);
        if (res?.warning) setWarning(res.warning);
        setData((prev) => mergeReportsData(prev || mockReports, res));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || String(err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const monthlyRows = useMemo(() => data?.monthlySummary || [], [data]);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Reports</h1>
        {error ? <span style={{ fontSize: 12, color: t.warning }}>Using fallback data: {error}</span> : null}
      </div>
      {warning ? <div style={{ fontSize: 12, color: t.textSecondary }}>{warning}</div> : null}
      {loading ? (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: t.bgAlt,
            border: `1px solid ${t.accent}`,
            borderRadius: 6,
            fontSize: 13,
            color: t.accent,
          }}
        >
          Loading reports...
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {reportCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => navigate(`/reports/${card.id}`)}
            style={{
              textAlign: 'left',
              backgroundColor: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: 12,
              color: t.text,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{card.title}</div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>{card.description}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Monthly Summary</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Month</th>
                <th style={{ textAlign: 'left' }}>Invoices</th>
                <th style={{ textAlign: 'left' }}>Exceptions</th>
                <th style={{ textAlign: 'left' }}>Savings</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td>{Number(row.invoices || 0).toLocaleString()}</td>
                  <td>{Number(row.exceptions || 0).toLocaleString()}</td>
                  <td>${Number(row.savings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Top Savings Carriers</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Carrier</th>
                <th style={{ textAlign: 'left' }}>Total Savings</th>
              </tr>
            </thead>
            <tbody>
              {(data?.topSavingsCarriers || []).map((row) => (
                <tr key={row.carrier}>
                  <td>{row.carrier}</td>
                  <td>${Number(row.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <TrendLineChart
          data={data?.savingsTrend || []}
          dataKey="savings"
          title="Savings Trend"
          color="#10b981"
          yAxisLabel="Savings ($)"
        />
        <TrendLineChart
          data={data?.exceptionTrend || []}
          dataKey="exceptions"
          title="Exception Trend"
          color="#ef4444"
          yAxisLabel="Count"
        />
      </div>

      {data?.auditMetrics ? <AuditDrillDown auditMetrics={data.auditMetrics} /> : null}
      {data?.categoryDrilldown ? <CategoryDrilldown data={data.categoryDrilldown} /> : null}
    </div>
  );
}
