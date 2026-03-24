import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getCarriers, getExceptions } from '../api/client';

const DEMO_FRAUD_ALERTS = [
  {
    id: 'FA-001',
    type: 'Double Brokering',
    carrier: 'FastHaul LLC',
    mc: 'MC-884721',
    riskScore: 88,
    signals: ['Load reposted on DAT within 2hr', 'Dispatcher ID mismatch', 'Unusual booking geography'],
    status: 'Critical',
    date: '2026-03-10',
  },
  {
    id: 'FA-002',
    type: 'Identity Fraud',
    carrier: 'Premier Transport Inc',
    mc: 'MC-991043',
    riskScore: 74,
    signals: ['MC issued 12 days ago', 'Phone number mismatch with FMCSA', 'Same EIN as flagged carrier'],
    status: 'High',
    date: '2026-03-09',
  },
  {
    id: 'FA-003',
    type: 'Payment Fraud',
    carrier: 'Blue Ridge Freight',
    mc: 'MC-774509',
    riskScore: 67,
    signals: ['ACH change request post-booking', 'New factoring company (< 30 days)', 'Invoice reuse detected'],
    status: 'High',
    date: '2026-03-09',
  },
  {
    id: 'FA-004',
    type: 'Rate Manipulation',
    carrier: 'Apex Logistics',
    mc: 'MC-662318',
    riskScore: 52,
    signals: ['Rate override without authorization', 'Agent flagged 3x this month', 'Load assigned outside normal region'],
    status: 'Moderate',
    date: '2026-03-08',
  },
  {
    id: 'FA-005',
    type: 'Carrier Impersonation',
    carrier: 'SunState Carriers',
    mc: 'MC-553290',
    riskScore: 81,
    signals: ['Name similar to known carrier', 'Different USDOT address', 'Booking velocity spike (+340%)'],
    status: 'Critical',
    date: '2026-03-08',
  },
];

const FRAUD_SCHEMES = [
  {
    name: 'Double Brokering',
    icon: '🔄',
    description: 'Carrier re-brokers load without authorization, pocketing the margin.',
    signals: ['Load reposted on load boards', 'Dispatcher identity mismatches', 'Unusual booking geography'],
    count: 12,
    trend: 'up',
  },
  {
    name: 'Carrier Identity Fraud',
    icon: '🪪',
    description: 'Fraudsters impersonate legitimate carriers to book and steal loads.',
    signals: ['Newly issued MC numbers', 'Phone/address mismatches', 'Cloned DOT information'],
    count: 7,
    trend: 'up',
  },
  {
    name: 'Payment Fraud',
    icon: '💳',
    description: 'Manipulation of banking details or invoice data to redirect payments.',
    signals: ['ACH change post-booking', 'Factoring company swaps', 'Invoice reuse or manipulation'],
    count: 9,
    trend: 'flat',
  },
  {
    name: 'Internal Fraud',
    icon: '🏢',
    description: 'Internal users manipulate rates, payments, or dispatch activity for personal gain.',
    signals: ['Unauthorized rate overrides', 'Suspicious payment adjustments', 'After-hours dispatch activity'],
    count: 4,
    trend: 'down',
  },
];

const STATUS_COLOR = {
  Critical: { bg: '#ef444418', text: '#ef4444' },
  High: { bg: '#f9731618', text: '#f97316' },
  Moderate: { bg: '#f59e0b18', text: '#f59e0b' },
  Low: { bg: '#10b98118', text: '#10b981' },
};

function RiskBadge({ score }) {
  const color = score >= 76 ? '#ef4444' : score >= 51 ? '#f97316' : score >= 21 ? '#f59e0b' : '#10b981';
  const label = score >= 76 ? 'Critical' : score >= 51 ? 'High' : score >= 21 ? 'Moderate' : 'Low';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 99,
      backgroundColor: color + '22',
      color,
      fontWeight: 700,
      fontSize: 11,
    }}>
      {score} · {label}
    </span>
  );
}

export default function FraudPrevention() {
  const { theme } = useTheme();
  const t = theme;
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filter, setFilter] = useState('All');
  const [liveAlerts, setLiveAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const alerts = [];
        const [carrierRes, exceptionRes] = await Promise.allSettled([getCarriers(), getExceptions()]);
        const carriers = carrierRes.status === 'fulfilled'
          ? (Array.isArray(carrierRes.value) ? carrierRes.value : Array.isArray(carrierRes.value?.carriers) ? carrierRes.value.carriers : [])
          : [];
        const exceptions = exceptionRes.status === 'fulfilled'
          ? (Array.isArray(exceptionRes.value) ? exceptionRes.value : [])
          : [];

        // Derive fraud signals from carriers
        carriers.forEach((c) => {
          const signals = [];
          const mc = c.mcNumber || '';
          const createdAt = c.createdAt ? new Date(c.createdAt) : null;
          const daysSinceCreated = createdAt ? Math.floor((Date.now() - createdAt.getTime()) / 86400000) : null;
          if (daysSinceCreated !== null && daysSinceCreated < 30) signals.push(`MC issued ${daysSinceCreated} days ago`);
          if (c.rating && c.rating < 2) signals.push('Low carrier rating');
          if (!c.insuranceExpiry) signals.push('Insurance expiry not on file');
          else if (new Date(c.insuranceExpiry) < new Date()) signals.push('Insurance expired');
          if (!c.dotNumber && !c.usdotNumber) signals.push('No DOT number on file');
          if (signals.length) {
            const score = Math.min(100, 30 + signals.length * 15);
            alerts.push({
              id: `FA-${(c.id || c._id || '').slice(-4).toUpperCase() || Math.random().toString(36).slice(2, 6)}`,
              type: daysSinceCreated !== null && daysSinceCreated < 30 ? 'New MC Verification' : 'Carrier Risk Flag',
              carrier: c.name || 'Unknown',
              mc: mc || 'N/A',
              riskScore: score,
              signals,
              status: score >= 76 ? 'Critical' : score >= 51 ? 'High' : score >= 21 ? 'Moderate' : 'Low',
              date: createdAt ? createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            });
          }
        });

        // Derive fraud signals from exceptions
        exceptions.forEach((ex) => {
          const signals = [];
          if (ex.severity === 'critical' || ex.severity === 'high') signals.push(`Exception severity: ${ex.severity}`);
          if (ex.type) signals.push(`Type: ${ex.type}`);
          if (ex.description) signals.push(ex.description.slice(0, 80));
          if (signals.length) {
            const score = ex.severity === 'critical' ? 85 : ex.severity === 'high' ? 65 : 40;
            alerts.push({
              id: `FX-${(ex.id || ex._id || '').slice(-4).toUpperCase() || Math.random().toString(36).slice(2, 6)}`,
              type: 'Exception Anomaly',
              carrier: ex.carrier || ex.carrierName || 'Unknown',
              mc: ex.mc || 'N/A',
              riskScore: score,
              signals,
              status: score >= 76 ? 'Critical' : score >= 51 ? 'High' : score >= 21 ? 'Moderate' : 'Low',
              date: ex.createdAt ? new Date(ex.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            });
          }
        });

        if (!cancelled && alerts.length) {
          alerts.sort((a, b) => b.riskScore - a.riskScore);
          setLiveAlerts(alerts);
        }
      } catch (_) { /* fallback to demo */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const FRAUD_ALERTS = liveAlerts || DEMO_FRAUD_ALERTS;

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
  };

  const filteredAlerts = filter === 'All'
    ? FRAUD_ALERTS
    : FRAUD_ALERTS.filter(a => a.status === filter);

  const criticalCount = FRAUD_ALERTS.filter(a => a.status === 'Critical').length;
  const highCount = FRAUD_ALERTS.filter(a => a.status === 'High').length;

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>🚨 Fraud Prevention Engine</div>
        <div style={{ fontSize: 14, color: t.textSecondary }}>
          Real-time freight fraud detection • Carrier identity monitoring • Payment protection • Internal controls
          {loading && <span style={{ marginLeft: 8 }}>Scanning…</span>}
          {!loading && liveAlerts && <span style={{ marginLeft: 8, color: '#10b981' }}>📡 Live — {liveAlerts.length} alerts from carrier &amp; exception data</span>}
          {!loading && !liveAlerts && <span style={{ marginLeft: 8, color: t.textSecondary }}>(Demo data — add carriers for live fraud scanning)</span>}
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Active Fraud Alerts', value: FRAUD_ALERTS.length, color: '#ef4444' },
          { label: 'Critical Risk', value: criticalCount, color: '#ef4444' },
          { label: 'High Risk', value: highCount, color: '#f97316' },
          { label: 'Blocked This Month', value: 23, color: '#10b981' },
        ].map(kpi => (
          <div key={kpi.label} style={cardStyle}>
            <div style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Alert Table */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>🚦 Active Fraud Alerts</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Critical', 'High', 'Moderate'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: `1px solid ${filter === f ? t.accent : t.border}`,
                    backgroundColor: filter === f ? t.accent : 'transparent',
                    color: filter === f ? '#fff' : t.text,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Carrier</th>
                  <th style={thStyle}>Risk Score</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map(alert => (
                  <tr
                    key={alert.id}
                    style={{ cursor: 'pointer', backgroundColor: selectedAlert?.id === alert.id ? t.bgAlt : 'transparent' }}
                    onClick={() => setSelectedAlert(alert)}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = t.bgAlt}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = selectedAlert?.id === alert.id ? t.bgAlt : 'transparent'}
                  >
                    <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 11 }}>{alert.id}</span></td>
                    <td style={tdStyle}><strong>{alert.type}</strong></td>
                    <td style={tdStyle}>{alert.carrier}<br /><span style={{ fontSize: 10, color: t.textSecondary }}>{alert.mc}</span></td>
                    <td style={tdStyle}><RiskBadge score={alert.riskScore} /></td>
                    <td style={tdStyle}>{alert.date}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedAlert(alert); }}
                        style={{ padding: '4px 10px', borderRadius: 4, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.text, cursor: 'pointer', fontSize: 11 }}
                      >
                        Investigate →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alert Detail Panel */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>🔍 Alert Detail</div>
          {selectedAlert ? (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{selectedAlert.type}</div>
                <div style={{ fontSize: 13, color: t.textSecondary }}>{selectedAlert.carrier}</div>
                <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 8 }}>{selectedAlert.mc}</div>
                <RiskBadge score={selectedAlert.riskScore} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detected Signals</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedAlert.signals.map((signal, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 10px', backgroundColor: '#ef444410', borderRadius: 4, border: '1px solid #ef444430', fontSize: 12 }}>
                      <span style={{ color: '#ef4444', marginTop: 1 }}>⚠</span>
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ flex: 1, padding: '8px 0', borderRadius: 4, border: 'none', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  Block Carrier
                </button>
                <button style={{ flex: 1, padding: '8px 0', borderRadius: 4, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.text, cursor: 'pointer', fontSize: 12 }}>
                  Flag & Review
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: t.textSecondary, textAlign: 'center', paddingTop: 40 }}>
              Select an alert to view details
            </div>
          )}
        </div>
      </div>

      {/* Fraud Schemes */}
      <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>🎭 Monitored Fraud Schemes</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {FRAUD_SCHEMES.map(scheme => (
          <div key={scheme.name} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{scheme.icon} {scheme.name}</div>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 99,
                backgroundColor: scheme.trend === 'up' ? '#ef444418' : scheme.trend === 'down' ? '#10b98118' : '#f59e0b18',
                color: scheme.trend === 'up' ? '#ef4444' : scheme.trend === 'down' ? '#10b981' : '#f59e0b',
              }}>
                {scheme.trend === 'up' ? '↑' : scheme.trend === 'down' ? '↓' : '→'} {scheme.count} alerts
              </span>
            </div>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 12, lineHeight: 1.5 }}>{scheme.description}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {scheme.signals.map((signal, i) => (
                <div key={i} style={{ fontSize: 11, color: t.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#3b82f6' }}>•</span> {signal}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
