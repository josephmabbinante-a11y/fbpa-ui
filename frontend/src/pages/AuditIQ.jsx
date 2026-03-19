
import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import AuditDrillDown from '../components/AuditDrillDown';
import { getReports, getExceptions } from '../api/client';

function SeverityBadge({ severity }) {
  const colors = {
    High: { bg: '#ef444418', text: '#ef4444' },
    Medium: { bg: '#f59e0b18', text: '#f59e0b' },
    Low: { bg: '#3b82f618', text: '#3b82f6' },
  };
  const c = colors[severity] || colors.Low;
  return (
    <span style={{ padding: '2px 8px', borderRadius: 99, backgroundColor: c.bg, color: c.text, fontSize: 11, fontWeight: 600 }}>
      {severity}
    </span>
  );
}

export default function AuditIQ() {
  const { theme } = useTheme();
  const t = theme;

  const [activeTab, setActiveTab] = useState('overview');
  const [auditMetrics, setAuditMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getReports(),
      getExceptions(),
    ])
      .then(([reports, exceptions]) => {
        setAuditMetrics(reports?.auditMetrics || null);
        // Ensure exceptions is always an array
        let excArr = Array.isArray(exceptions) ? exceptions : [];
        setAlerts(
          excArr.map((ex) => ({
            id: ex._id || ex.id || '',
            type: ex.reason || ex.type || 'Exception',
            entity: ex.invoiceNumber ? `Invoice #${ex.invoiceNumber}${ex.carrier ? ' — ' + ex.carrier : ''}` : (ex.entity || ''),
            severity: ex.severity || (ex.level === 'high' ? 'High' : ex.level === 'medium' ? 'Medium' : 'Low'),
            time: ex.timestamp ? new Date(ex.timestamp).toLocaleString() : '',
            status: ex.status || '',
          }))
        );
      })
      .catch((err) => setError(err.message || 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const containerStyle = {
    padding: 24,
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
  };

  const cardStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: 20,
  };

  const tabStyle = (active) => ({
    padding: '8px 18px',
    borderRadius: 4,
    border: `1px solid ${active ? t.accent : t.border}`,
    backgroundColor: active ? t.accent : 'transparent',
    color: active ? '#fff' : t.text,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
  });

  const thStyle = {
    backgroundColor: t.bgAlt,
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    color: t.textSecondary,
    borderBottom: `1px solid ${t.border}`,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const tdStyle = {
    padding: '12px 14px',
    fontSize: 12,
    borderBottom: `1px solid ${t.border}`,
    verticalAlign: 'middle',
  };

  const totalRecovery = auditMetrics?.paymentRecovery?.reduce((s, i) => s + (i.amount || 0), 0) || 0;
  const totalFindings = auditMetrics?.auditFindings?.reduce((s, i) => s + (i.count || 0), 0) || 0;

  if (loading) {
    return <div style={containerStyle}>Loading...</div>;
  }
  if (error) {
    return <div style={containerStyle}>Error: {error}</div>;
  }

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>🔍 Audit IQ Engine</div>
        <div style={{ fontSize: 14, color: t.textSecondary }}>
          Continuous operational monitoring • Invoice auditing • Fraud signal detection • Payment recovery
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button style={tabStyle(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>Overview</button>
        <button style={tabStyle(activeTab === 'alerts')} onClick={() => setActiveTab('alerts')}>Live Alerts</button>
        <button style={tabStyle(activeTab === 'detail')} onClick={() => setActiveTab('detail')}>Detailed Metrics</button>
      </div>

      {activeTab === 'overview' && auditMetrics && (
        <>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Bills Audited', value: auditMetrics.freightBillAudit?.[0]?.value ?? 0, color: '#3b82f6', sub: '' },
              { label: 'Total Recovery', value: `$${(totalRecovery / 1000).toFixed(1)}K`, color: '#10b981', sub: 'this month' },
              { label: 'Findings Detected', value: totalFindings, color: '#f59e0b', sub: 'across all categories' },
              { label: 'Processing Rate', value: auditMetrics.paymentProcessing?.[0]?.percentage ? `${auditMetrics.paymentProcessing[0].percentage}%` : 'N/A', color: '#10b981', sub: 'invoices processed' },
            ].map(kpi => (
              <div key={kpi.label} style={cardStyle}>
                <div style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{kpi.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color, marginBottom: 4 }}>{kpi.value}</div>
                <div style={{ fontSize: 11, color: t.textSecondary }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Monitored Entities */}
          <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>🔭 What Audit IQ Monitors</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
            {/* This section can be further backend-driven if needed */}
            {[
              { icon: '📦', name: 'Loads', count: 0, detail: 'Rate accuracy, assignment validity, route compliance' },
              { icon: '🏷️', name: 'Auction Loads (AL-)', count: 0, detail: 'AL- prefixed loads from Post & Auction — bid rate validation, auction rate-to-market comparison' },
              { icon: '🧾', name: 'Invoices', count: 0, detail: 'Duplicates, overcharges, unauthorized accessorials' },
              { icon: '🚛', name: 'Carrier Activity', count: 0, detail: 'Booking velocity, document re-use, identity signals' },
              { icon: '📋', name: 'Dispatch Activity', count: 0, detail: 'Override patterns, off-hours activity, anomalies' },
              { icon: '💳', name: 'Payment Activity', count: 0, detail: 'ACH changes, factoring swaps, duplicate payments' },
              { icon: '👤', name: 'User Behavior', count: 0, detail: 'Internal rate manipulation, unauthorized approvals' },
            ].map(item => (
              <div key={item.name} style={{ ...cardStyle, padding: 14 }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>{item.count.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 11, color: t.textSecondary, lineHeight: 1.5 }}>{item.detail}</div>
              </div>
            ))}
          </div>

          {/* Detectable Issues */}
          <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>🚨 Detectable Issues</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {/* This section can be further backend-driven if needed */}
            {[
              { issue: 'Duplicate Invoices', description: 'Same invoice submitted multiple times across carriers or time periods.', severity: 'High' },
              { issue: 'Reused POD/BOL Documents', description: 'Proof-of-delivery or bill of lading documents reused across different loads.', severity: 'High' },
              { issue: 'Rate Manipulation', description: 'Load rates overridden beyond authorized thresholds by dispatchers or agents.', severity: 'High' },
              { issue: 'Auction Rate Deviation (AL-)', description: 'Auction load (AL- prefix) awarded bid rate deviates significantly from market or internal rate benchmarks.', severity: 'High' },
              { issue: 'Payment Discrepancies', description: 'Invoice amount differs from agreed contract or quoted rate.', severity: 'Medium' },
              { issue: 'Unauthorized Carrier Approvals', description: 'Carriers approved without proper vetting or risk review.', severity: 'High' },
              { issue: 'Operational Anomalies', description: 'Unusual patterns in load assignments, bookings, or payment timing.', severity: 'Low' },
            ].map(issue => (
              <div key={issue.issue} style={{ ...cardStyle, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{issue.issue}</div>
                  <SeverityBadge severity={issue.severity} />
                </div>
                <div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.5 }}>{issue.description}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'alerts' && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>🔴 Live Audit Alerts</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Alert ID</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Entity</th>
                <th style={thStyle}>Severity</th>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(alert => (
                <tr key={alert.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = t.bgAlt} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 11 }}>{alert.id}</span></td>
                  <td style={tdStyle}><strong>{alert.type}</strong></td>
                  <td style={{ ...tdStyle, maxWidth: 240 }}>{alert.entity}</td>
                  <td style={tdStyle}><SeverityBadge severity={alert.severity} /></td>
                  <td style={{ ...tdStyle, color: t.textSecondary, fontSize: 11 }}>{alert.time}</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 99,
                      backgroundColor: t.bgAlt,
                      border: `1px solid ${t.border}`,
                    }}>
                      {alert.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'detail' && auditMetrics && (
        <AuditDrillDown auditMetrics={auditMetrics} />
      )}
    </div>
  );
}
