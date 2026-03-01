import { useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';
import logo from '../assets/opscale-logo.svg';

/**
 * Audit Drill-Down Section Component
 * Displays detailed Opscale Audit IQ freight bill payment and audit metrics
 */
export default function AuditDrillDown({ auditMetrics }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [expandedSection, setExpandedSection] = useState(null);

  if (!auditMetrics) return null;

  const freightBillAudit = Array.isArray(auditMetrics.freightBillAudit)
    ? auditMetrics.freightBillAudit
    : [];
  const paymentRecovery = Array.isArray(auditMetrics.paymentRecovery)
    ? auditMetrics.paymentRecovery
    : [];
  const auditFindings = Array.isArray(auditMetrics.auditFindings)
    ? auditMetrics.auditFindings
    : [];
  const paymentProcessing = Array.isArray(auditMetrics.paymentProcessing)
    ? auditMetrics.paymentProcessing
    : [];

  const totalBillsAudited = freightBillAudit[0]?.value ?? 0;
  const totalRecoveryAmount = paymentRecovery.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const totalFindings = auditFindings.reduce((sum, item) => sum + (item.count ?? 0), 0);
  const processingRate = paymentProcessing[0]?.percentage ?? 0;

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sectionStyle = (isOpen) => ({
    marginBottom: 16,
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 4,
    padding: 16,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    transform: isOpen ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: isOpen ? `0 4px 12px ${t.accent}20` : 'none',
  });

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 0 12px 0',
    borderBottom: `1px solid ${t.borderLight}`,
  };

  const titleStyle = {
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: t.text,
    letterSpacing: '0.3px',
  };

  const iconStyle = {
    fontSize: '16px',
    transition: 'transform 0.2s ease',
    transform: expandedSection === 'freight' ? 'rotate(180deg)' : 'rotate(0deg)',
  };

  const metricGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 12,
    marginTop: 12,
  };

  const metricCardStyle = {
    backgroundColor: t.bgAlt,
    border: `1px solid ${t.borderLight}`,
    borderRadius: 4,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    marginTop: 12,
  };

  const thStyle = {
    padding: '8px 12px',
    textAlign: 'left',
    fontWeight: '600',
    backgroundColor: t.bgAlt,
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
    <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${t.border}` }}>
      <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 24, color: t.text, display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={logo} alt="Opscale Audit IQ" style={{ height: 32, width: 'auto', display: 'block', flexShrink: 0 }} />
        <span style={{ display: 'inline-block' }}>🔍 Detailed Insights</span>
      </h2>

      {/* Freight Bill Audit Metrics */}
      <div
        style={sectionStyle(expandedSection === 'freight')}
        onClick={() => toggleSection('freight')}
      >
        <div style={headerStyle}>
          <div style={titleStyle}>📊 Freight Bill Audit Metrics</div>
          <span style={iconStyle}>▼</span>
        </div>
        {expandedSection === 'freight' && (
          <div style={metricGridStyle}>
            {freightBillAudit.map((metric) => (
              <div key={metric.metric} style={metricCardStyle}>
                <div style={{ fontSize: '11px', color: t.textSecondary, marginBottom: 4 }}>
                  {metric.metric}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: t.text, marginBottom: 4 }}>
                  {metric.value}
                </div>
                <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: String(metric.trend ?? '').startsWith('-') ? t.negative : t.positive }}>
                    {metric.trend ?? '—'}
                  </span>
                  <span style={{ color: t.textSecondary }}>{metric.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Recovery Breakdown */}
      <div
        style={sectionStyle(expandedSection === 'recovery')}
        onClick={() => toggleSection('recovery')}
      >
        <div style={headerStyle}>
          <div style={titleStyle}>💰 Payment Recovery Breakdown</div>
          <span style={{ ...iconStyle, transform: expandedSection === 'recovery' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>
        {expandedSection === 'recovery' && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Recovery Type</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Share</th>
              </tr>
            </thead>
            <tbody>
              {paymentRecovery.map((item) => (
                <tr key={item.type}>
                  <td style={tdStyle}>{item.type}</td>
                  <td style={{ ...tdStyle, color: t.positive, fontWeight: '500' }}>
                    ${(item.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={tdStyle}>{item.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Audit Findings by Category */}
      <div
        style={sectionStyle(expandedSection === 'findings')}
        onClick={() => toggleSection('findings')}
      >
        <div style={headerStyle}>
          <div style={titleStyle}>🔎 Audit Findings by Category</div>
          <span style={{ ...iconStyle, transform: expandedSection === 'findings' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>
        {expandedSection === 'findings' && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Count</th>
                <th style={thStyle}>Severity</th>
                <th style={thStyle}>Resolution</th>
              </tr>
            </thead>
            <tbody>
              {auditFindings.map((finding) => (
                <tr key={finding.category}>
                  <td style={tdStyle}>{finding.category}</td>
                  <td style={tdStyle}>{finding.count}</td>
                  <td
                    style={{
                      ...tdStyle,
                      color:
                        finding.severity === 'High'
                          ? t.negative
                          : finding.severity === 'Medium'
                          ? t.warning
                          : t.success,
                      fontWeight: '500',
                    }}
                  >
                    {finding.severity}
                  </td>
                  <td style={{ ...tdStyle, color: t.positive }}>{finding.resolution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Processing Status */}
      <div
        style={sectionStyle(expandedSection === 'payment')}
        onClick={() => toggleSection('payment')}
      >
        <div style={headerStyle}>
          <div style={titleStyle}>💳 Payment Processing Status</div>
          <span style={{ ...iconStyle, transform: expandedSection === 'payment' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>
        {expandedSection === 'payment' && (
          <div>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Invoices</th>
                  <th style={thStyle}>%</th>
                  <th style={thStyle}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {paymentProcessing.map((item) => (
                  <tr key={item.status}>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          marginRight: 8,
                          backgroundColor:
                            item.status === 'Processed'
                              ? t.success
                              : item.status === 'Pending Review'
                              ? t.warning
                              : t.error,
                        }}
                      />
                      {item.status}
                    </td>
                    <td style={tdStyle}>{(item.invoices ?? 0).toLocaleString()}</td>
                    <td style={tdStyle}>{item.percentage}%</td>
                    <td style={{ ...tdStyle, color: t.positive, fontWeight: '500' }}>
                      ${(item.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Status Progress Bars */}
            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
              {paymentProcessing.map((item) => (
                <div key={item.status}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: t.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    {item.status}: {item.percentage}%
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 8,
                      backgroundColor: t.bgAlt,
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${item.percentage}%`,
                        backgroundColor:
                          item.status === 'Processed'
                            ? t.success
                            : item.status === 'Pending Review'
                            ? t.warning
                            : t.error,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats Footer */}
      <div
        style={{
          marginTop: 16,
          padding: 16,
          backgroundColor: t.bgAlt,
          border: `1px solid ${t.border}`,
          borderRadius: 4,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: t.textSecondary, marginBottom: 4 }}>
            Total Bills Audited
          </div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: t.positive }}>
            {totalBillsAudited}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: t.textSecondary, marginBottom: 4 }}>
            Total Recovery Amount
          </div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: t.positive }}>
            ${totalRecoveryAmount
              .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: t.textSecondary, marginBottom: 4 }}>
            Total Findings
          </div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: t.text }}>
            {totalFindings}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: t.textSecondary, marginBottom: 4 }}>
            Processing Rate
          </div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: t.success }}>
            {processingRate}%
          </div>
        </div>
      </div>
    </div>
  );
}
