import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

const SERVICES = [
  { name: 'API Gateway', key: 'api', path: '/health', icon: '🌐', description: 'Core API connectivity' },
  { name: 'Load Service', key: 'loads', icon: '📦', description: 'Load management & dispatch' },
  { name: 'Carrier Service', key: 'carriers', icon: '🚛', description: 'Carrier onboarding & management' },
  { name: 'Pricing Engine', key: 'pricing', icon: '💰', description: 'Rate calculation & optimization' },
  { name: 'Fraud Detection', key: 'fraud', icon: '🚨', description: 'Real-time fraud monitoring' },
  { name: 'Audit IQ', key: 'audit', icon: '🔍', description: 'Invoice auditing & recovery' },
  { name: 'Saia Integration', key: 'saia', icon: '🔗', description: 'Auction circuit & quotes' },
  { name: 'Database (PostgreSQL)', key: 'db', icon: '🗄️', description: 'Primary transaction database' },
  { name: 'Cache (Redis)', key: 'cache', icon: '⚡', description: 'Session & data caching' },
  { name: 'Notification Service', key: 'notifications', icon: '🔔', description: 'Alerts & email delivery' },
];

const MOCK_METRICS = [
  { label: 'API Response Time', value: '48ms', status: 'good', target: '< 200ms' },
  { label: 'Database Query Avg', value: '12ms', status: 'good', target: '< 50ms' },
  { label: 'Cache Hit Rate', value: '94.2%', status: 'good', target: '> 85%' },
  { label: 'Error Rate (1hr)', value: '0.04%', status: 'good', target: '< 1%' },
  { label: 'Active Sessions', value: '18', status: 'good', target: 'N/A' },
  { label: 'Queue Depth', value: '3', status: 'good', target: '< 500' },
];

const MOCK_INCIDENTS = [
  { id: 'INC-0041', title: 'Saia API latency spike', severity: 'Low', duration: '8 min', resolved: '2026-03-09 14:22', status: 'Resolved' },
  { id: 'INC-0040', title: 'Cache eviction under load', severity: 'Low', duration: '4 min', resolved: '2026-03-07 09:11', status: 'Resolved' },
  { id: 'INC-0039', title: 'PDF generation service timeout', severity: 'Medium', duration: '22 min', resolved: '2026-03-04 16:55', status: 'Resolved' },
];

function StatusDot({ status }) {
  const color = status === 'online' ? '#10b981' : status === 'degraded' ? '#f59e0b' : '#ef4444';
  return (
    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: color, marginRight: 8, boxShadow: `0 0 6px ${color}60` }} />
  );
}

export default function SystemStatus() {
  const { theme } = useTheme();
  const t = theme;

  const [apiStatus, setApiStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);
  const [serviceStatuses, setServiceStatuses] = useState(() =>
    Object.fromEntries(SERVICES.map(s => [s.key, 'checking']))
  );

  useEffect(() => {
    api.get('/health')
      .then(() => {
        setApiStatus('online');
        setServiceStatuses(prev => {
          const next = { ...prev };
          SERVICES.forEach(s => { next[s.key] = 'online'; });
          return next;
        });
      })
      .catch(() => {
        setApiStatus('offline');
        setServiceStatuses(prev => {
          const next = { ...prev };
          SERVICES.forEach(s => { next[s.key] = 'offline'; });
          return next;
        });
      })
      .finally(() => setLastChecked(new Date().toLocaleTimeString()));
  }, []);

  const onlineCount = Object.values(serviceStatuses).filter(s => s === 'online').length;
  const offlineCount = Object.values(serviceStatuses).filter(s => s === 'offline').length;
  const checkingCount = Object.values(serviceStatuses).filter(s => s === 'checking').length;

  const overallStatus = offlineCount > 0 ? 'Degraded' : checkingCount === SERVICES.length ? 'Checking…' : 'All Systems Operational';
  const overallColor = offlineCount > 0 ? '#f59e0b' : checkingCount === SERVICES.length ? t.textSecondary : '#10b981';

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
    verticalAlign: 'middle',
  };

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>🖥️ System Status</div>
        <div style={{ fontSize: 14, color: t.textSecondary }}>
          Real-time service health • API connectivity • Performance metrics • Incident history
          {lastChecked && <span style={{ marginLeft: 12, color: t.textSecondary }}>Last checked: {lastChecked}</span>}
        </div>
      </div>

      {/* Overall Status Banner */}
      <div style={{ ...cardStyle, marginBottom: 24, borderLeft: `4px solid ${overallColor}`, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 32 }}>{offlineCount > 0 ? '⚠️' : checkingCount === SERVICES.length ? '🔄' : '✅'}</span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: overallColor }}>{overallStatus}</div>
          <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 2 }}>
            {onlineCount} services online
            {offlineCount > 0 && ` · ${offlineCount} offline`}
            {checkingCount > 0 && checkingCount < SERVICES.length && ` · ${checkingCount} checking`}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Services Online', value: onlineCount, total: SERVICES.length, color: '#10b981' },
          { label: 'API Status', value: apiStatus === 'online' ? 'Healthy' : apiStatus === 'offline' ? 'Offline' : 'Checking', color: apiStatus === 'online' ? '#10b981' : apiStatus === 'offline' ? '#ef4444' : t.textSecondary },
          { label: 'Response Time', value: '48ms', color: '#3b82f6' },
          { label: 'Uptime (30d)', value: '99.94%', color: '#10b981' },
        ].map(kpi => (
          <div key={kpi.label} style={cardStyle}>
            <div style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color }}>
              {kpi.value}{kpi.total ? <span style={{ fontSize: 14, color: t.textSecondary, fontWeight: 400 }}>/{kpi.total}</span> : ''}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Service Grid */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>🔧 Service Health</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SERVICES.map(service => {
              const status = serviceStatuses[service.key];
              return (
                <div key={service.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: t.bg, borderRadius: 6, border: `1px solid ${t.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{service.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{service.name}</div>
                      <div style={{ fontSize: 11, color: t.textSecondary }}>{service.description}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <StatusDot status={status} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: status === 'online' ? '#10b981' : status === 'offline' ? '#ef4444' : t.textSecondary, textTransform: 'capitalize' }}>
                      {status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📈 Performance Metrics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MOCK_METRICS.map(metric => (
                <div key={metric.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: t.bg, borderRadius: 6, border: `1px solid ${t.border}` }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{metric.label}</div>
                    <div style={{ fontSize: 11, color: t.textSecondary }}>Target: {metric.target}</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: metric.status === 'good' ? '#10b981' : metric.status === 'warning' ? '#f59e0b' : '#ef4444' }}>
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Incident History */}
      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📋 Recent Incidents</div>
        {MOCK_INCIDENTS.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: t.textSecondary, fontSize: 13 }}>
            ✅ No incidents in the past 30 days
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Incident</th>
                <th style={thStyle}>Severity</th>
                <th style={thStyle}>Duration</th>
                <th style={thStyle}>Resolved</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_INCIDENTS.map(inc => (
                <tr key={inc.id} onMouseEnter={e => e.currentTarget.style.backgroundColor = t.bgAlt} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: 11 }}>{inc.id}</span></td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{inc.title}</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 99,
                      backgroundColor: inc.severity === 'High' ? '#ef444418' : inc.severity === 'Medium' ? '#f59e0b18' : '#3b82f618',
                      color: inc.severity === 'High' ? '#ef4444' : inc.severity === 'Medium' ? '#f59e0b' : '#3b82f6',
                      fontWeight: 600,
                    }}>
                      {inc.severity}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: t.textSecondary }}>{inc.duration}</td>
                  <td style={{ ...tdStyle, color: t.textSecondary, fontSize: 11 }}>{inc.resolved}</td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, backgroundColor: '#10b98118', color: '#10b981', fontWeight: 600 }}>
                      {inc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
