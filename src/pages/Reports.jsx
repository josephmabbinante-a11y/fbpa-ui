import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReports } from '../api/client';
import mockReports from '../mock/reports';
import { useTheme, themes } from '../contexts/ThemeContext';
import TrendLineChart from '../components/TrendLineChart';
import CollapsibleSection from '../components/CollapsibleSection';
import AuditDrillDown from '../components/AuditDrillDown';
import CategoryDrilldown from '../components/CategoryDrilldown';

export default function Reports() {
  const { theme } = useTheme();
  const t = themes[theme];
  const navigate = useNavigate();
  const [data, setData] = useState(mockReports);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    getReports()
      .then((res) => {
        if (!mounted) return;
        if (res && !res.error && res.monthlySummary) setData(res);
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

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    marginBottom: 24,
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

  const currencyStyle = {
    ...tdStyle,
    color: t.positive,
    fontWeight: '500',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 32,
    marginBottom: 32,
  };

  const trendContainerStyle = {
    marginTop: 32,
    paddingTop: 24,
    borderTop: `1px solid ${t.border}`,
  };

  const reportCards = [
    { id: 'monthly', title: 'Monthly Summary', description: 'Invoice volume, exceptions, and savings by month.' },
    { id: 'status', title: 'Status Distribution', description: 'Processing status mix across audited invoices.' },
    { id: 'exceptions', title: 'Exception Breakdown', description: 'Primary reasons driving exceptions.' },
    { id: 'carriers', title: 'Top Carriers', description: 'Savings by carrier and recovery impact.' },
    { id: 'trends', title: 'Trend Analysis', description: 'Weekly savings and exception volume trends.' },
    { id: 'audit', title: 'Audit Metrics', description: 'Detailed Opscale Audit IQ insights.' },
    { id: 'categories', title: 'Category Drilldowns', description: 'Root causes, customer impact, and recovery.' },
  ];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Reports</h1>
        {loading && <span style={{ fontSize: '12px', color: t.textSecondary }}>Loading...</span>}
      </div>

      {error && (
        <div style={{ padding: '8px 12px', backgroundColor: t.bgAlt, border: `1px solid ${t.warning}`, borderRadius: 4, fontSize: '13px', color: t.warning, marginBottom: 24 }}>
          Backend error, using mock data: {error}
        </div>
      )}

      {data && (
        <>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: t.textSecondary, marginBottom: 12, letterSpacing: '0.3px' }}>
              Report Library
            </h3>
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
                    borderRadius: 6,
                    padding: 12,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: t.text }}>{card.title}</div>
                  <div style={{ fontSize: 12, color: t.textSecondary }}>{card.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Tables in Grid */}
          <div style={gridStyle}>
            {/* Left Column */}
            <div>
              <h3
                style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: t.textSecondary, marginBottom: 12, letterSpacing: '0.3px', cursor: 'pointer' }}
                onClick={() => navigate('/reports/monthly')}
              >
                Monthly Summary
              </h3>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Month</th>
                    <th style={thStyle}>Invoices</th>
                    <th style={thStyle}>Exceptions</th>
                    <th style={thStyle}>Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthlySummary.map((row) => (
                    <tr key={row.month}>
                      <td style={tdStyle}>{row.month}</td>
                      <td style={tdStyle}>{row.invoices.toLocaleString()}</td>
                      <td style={tdStyle}>{row.exceptions}</td>
                      <td style={currencyStyle}>
                        ${row.savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3
                style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: t.textSecondary, marginBottom: 12, letterSpacing: '0.3px', marginTop: 24, cursor: 'pointer' }}
                onClick={() => navigate('/reports/status')}
              >
                Status Distribution
              </h3>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Count</th>
                    <th style={thStyle}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.statusDistribution.map((row) => (
                    <tr key={row.status}>
                      <td style={tdStyle}>{row.status}</td>
                      <td style={tdStyle}>{row.count.toLocaleString()}</td>
                      <td style={{ ...tdStyle, color: t.textSecondary }}>{row.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right Column */}
            <div>
              <h3
                style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: t.textSecondary, marginBottom: 12, letterSpacing: '0.3px', cursor: 'pointer' }}
                onClick={() => navigate('/reports/exceptions')}
              >
                Exception Breakdown
              </h3>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Reason</th>
                    <th style={thStyle}>Count</th>
                    <th style={thStyle}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.exceptionBreakdown.map((row) => (
                    <tr key={row.reason}>
                      <td style={tdStyle}>{row.reason}</td>
                      <td style={tdStyle}>{row.count}</td>
                      <td style={{ ...tdStyle, color: t.textSecondary }}>{row.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3
                style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', color: t.textSecondary, marginBottom: 12, letterSpacing: '0.3px', marginTop: 24, cursor: 'pointer' }}
                onClick={() => navigate('/reports/carriers')}
              >
                Top Carriers
              </h3>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Carrier</th>
                    <th style={thStyle}>Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topSavingsCarriers.map((row) => (
                    <tr key={row.carrier}>
                      <td style={tdStyle}>{row.carrier}</td>
                      <td style={currencyStyle}>
                        ${row.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trends Section */}
          <CollapsibleSection title="Trend Analysis" defaultOpen={false}>
            <div style={{ marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => navigate('/reports/trends')}
                style={{
                  backgroundColor: t.bgAlt,
                  border: `1px solid ${t.border}`,
                  color: t.textSecondary,
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                View Trend Drilldown
              </button>
            </div>
            <div style={gridStyle}>
              <div>
                <TrendLineChart
                  data={data.savingsTrend}
                  dataKey="savings"
                  title="Savings Trend"
                  color={t.positive}
                  yAxisLabel="Savings ($)"
                />
              </div>
              <div>
                <TrendLineChart
                  data={data.exceptionTrend}
                  dataKey="exceptions"
                  title="Exception Trend"
                  color={t.negative}
                  yAxisLabel="Count"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* Audit Drill-Down Section */}
          {data.auditMetrics && (
            <div>
              <div style={{ marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => navigate('/reports/audit')}
                  style={{
                    backgroundColor: t.bgAlt,
                    border: `1px solid ${t.border}`,
                    color: t.textSecondary,
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  View Audit Drilldown
                </button>
              </div>
              <AuditDrillDown auditMetrics={data.auditMetrics} />
            </div>
          )}

          {/* Category Drilldown Section */}
          {data.categoryDrilldown && (
            <CollapsibleSection title="Category Drilldowns" defaultOpen={true}>
              <div style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => navigate('/reports/categories')}
                  style={{
                    backgroundColor: t.bgAlt,
                    border: `1px solid ${t.border}`,
                    color: t.textSecondary,
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  View Category Drilldown
                </button>
              </div>
              <CategoryDrilldown data={data.categoryDrilldown} />
            </CollapsibleSection>
          )}
        </>
      )}
    </div>
  );
}
