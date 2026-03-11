import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getReports } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';
import mockReports from '../mock/reports';
import TrendLineChart from '../components/TrendLineChart';
import AuditDrillDown from '../components/AuditDrillDown';
import CategoryDrilldown from '../components/CategoryDrilldown';
import { useApi } from '../hooks/useApi';

const formatCurrency = (value) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const palette = ['#10b981', '#f59e0b', '#ef4444', '#0066cc', '#6b7280'];

const EMPTY_REPORTS = {
  monthlySummary: [],
  exceptionBreakdown: [],
  statusDistribution: [],
  topSavingsCarriers: [],
  savingsTrend: [],
  exceptionTrend: [],
  categoryDrilldown: [],
  auditMetrics: {
    freightBillAudit: [],
    paymentRecovery: [],
    auditFindings: [],
    paymentProcessing: [],
  },
};

const isNonEmptyArray = (value) => Array.isArray(value) && value.length > 0;

function mergeReportsData(base, incoming) {
  if (!incoming || typeof incoming !== 'object') return base;

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

export default function ReportDetail() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { demoMode } = useDemo();
  const t = theme || {};
  const { data: rawData } = useApi(getReports, demoMode ? mockReports : null, [demoMode]);
  const data = useMemo(() => mergeReportsData(demoMode ? mockReports : EMPTY_REPORTS, rawData), [demoMode, rawData]);

  const reportMap = useMemo(
    () => ({
      monthly: {
        title: 'Monthly Summary',
        description: 'Invoice volume, exceptions, and savings by month.',
      },
      status: {
        title: 'Status Distribution',
        description: 'Current processing status mix across audited invoices.',
      },
      exceptions: {
        title: 'Exception Breakdown',
        description: 'Primary reasons driving exceptions and review load.',
      },
      carriers: {
        title: 'Top Carriers',
        description: 'Savings by carrier and recovery impact.',
      },
      trends: {
        title: 'Trend Analysis',
        description: 'Weekly savings and exception volume trends.',
      },
      audit: {
        title: 'Audit Metrics',
        description: 'Detailed Opscale Audit IQ insights and processing metrics.',
      },
      categories: {
        title: 'Category Drilldowns',
        description: 'Root causes, customer impact, and recovery by category.',
      },
    }),
    []
  );

  const report = reportMap[reportId];

  if (!report) {
    return (
      <div style={{ padding: '24px 32px', color: t.text }}>
        <button
          type="button"
          onClick={() => navigate('/reports')}
          style={{
            backgroundColor: t.bgAlt,
            border: `1px solid ${t.border}`,
            color: t.text,
            borderRadius: 6,
            padding: '8px 12px',
            marginBottom: 16,
            cursor: 'pointer',
          }}
        >
          Back to Reports
        </button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Report not found</div>
      </div>
    );
  }

  const containerStyle = {
    padding: '24px 32px',
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
  };

  const cardStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  };

  const thStyle = {
    padding: '8px 12px',
    textAlign: 'left',
    fontWeight: 600,
    backgroundColor: t.bgAlt,
    borderBottom: `1px solid ${t.border}`,
    color: t.textSecondary,
    fontSize: 11,
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
      <button
        type="button"
        onClick={() => navigate('/reports')}
        style={{
          backgroundColor: t.bgAlt,
          border: `1px solid ${t.border}`,
          color: t.text,
          borderRadius: 6,
          padding: '8px 12px',
          marginBottom: 16,
          cursor: 'pointer',
        }}
      >
        Back to Reports
      </button>

      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{report.title}</div>
      <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 20 }}>{report.description}</div>

      {reportId === 'monthly' && (
        <>
          <div style={cardStyle}>
            <table style={{...tableStyle, fontSize: '1rem'}}>
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
                    <td style={tdStyle}>{row.exceptions.toLocaleString()}</td>
                    <td style={{ ...tdStyle, color: t.positive, fontWeight: 600 }}>{formatCurrency(row.savings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={cardStyle}>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                <LineChart data={data.monthlySummary} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
                  <XAxis dataKey="month" stroke={t.textSecondary} fontSize={11} />
                  <YAxis stroke={t.textSecondary} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: t.bgAlt,
                      border: `1px solid ${t.border}`,
                      borderRadius: 4,
                      color: t.text,
                      fontSize: 12,
                    }}
                    formatter={(value, name) => (name === 'savings' ? formatCurrency(value) : value)}
                  />
                  <Line type="monotone" dataKey="invoices" stroke={t.accent} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="exceptions" stroke={t.warning} strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="savings" stroke={t.positive} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {reportId === 'status' && (
        <>
          <div style={cardStyle}>
            <table style={{...tableStyle, fontSize: '1rem'}}>
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
          <div style={cardStyle}>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                <PieChart>
                  <Pie data={data.statusDistribution} dataKey="count" nameKey="status" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {data.statusDistribution.map((entry, index) => (
                      <Cell key={`status-${entry.status}`} fill={palette[index % palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: t.bgAlt,
                      border: `1px solid ${t.border}`,
                      borderRadius: 4,
                      color: t.text,
                      fontSize: 12,
                    }}
                    formatter={(value) => `${value} invoices`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {reportId === 'exceptions' && (
        <>
          <div style={cardStyle}>
            <table style={{...tableStyle, fontSize: '1rem'}}>
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
          </div>
          <div style={cardStyle}>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                <BarChart data={data.exceptionBreakdown} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
                  <XAxis dataKey="reason" stroke={t.textSecondary} fontSize={10} />
                  <YAxis stroke={t.textSecondary} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: t.bgAlt,
                      border: `1px solid ${t.border}`,
                      borderRadius: 4,
                      color: t.text,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill={t.warning} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {reportId === 'carriers' && (
        <>
          <div style={cardStyle}>
            <table style={{...tableStyle, fontSize: '1rem'}}>
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
                    <td style={{ ...tdStyle, color: t.positive, fontWeight: 600 }}>{formatCurrency(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={cardStyle}>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                <BarChart data={data.topSavingsCarriers} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
                  <XAxis dataKey="carrier" stroke={t.textSecondary} fontSize={10} />
                  <YAxis stroke={t.textSecondary} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: t.bgAlt,
                      border: `1px solid ${t.border}`,
                      borderRadius: 4,
                      color: t.text,
                      fontSize: 12,
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Bar dataKey="total" fill={t.positive} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {reportId === 'trends' && (
        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <TrendLineChart
              data={data.savingsTrend}
              dataKey="savings"
              title="Savings Trend"
              color={t.positive}
              yAxisLabel="Savings ($)"
            />
            <TrendLineChart
              data={data.exceptionTrend}
              dataKey="exceptions"
              title="Exception Trend"
              color={t.negative}
              yAxisLabel="Count"
            />
          </div>
        </div>
      )}

      {reportId === 'audit' && (
        <div style={cardStyle}>
          <AuditDrillDown auditMetrics={data.auditMetrics} />
        </div>
      )}

      {reportId === 'categories' && (
        <div style={cardStyle}>
          <CategoryDrilldown data={data.categoryDrilldown} />
        </div>
      )}
    </div>
  );
}
