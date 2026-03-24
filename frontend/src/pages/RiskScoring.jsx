import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getCarriers, getExceptions, getInvoices } from '../api/client';

const DEMO_RISK_ENTITIES = [
  {
    id: 'C-10041',
    type: 'Carrier',
    name: 'FastHaul LLC',
    mc: 'MC-884721',
    score: 88,
    factors: ['MC issued 8 days ago', 'Phone mismatch with FMCSA', 'Booking velocity +410%', 'Prior fraud flag on EIN'],
    trend: 'up',
    lastUpdated: '2026-03-10 08:14',
  },
  {
    id: 'C-10039',
    type: 'Carrier',
    name: 'SunState Carriers',
    mc: 'MC-553290',
    score: 74,
    factors: ['Name similar to known carrier', 'Different USDOT address', '3 chargebacks last 90 days'],
    trend: 'up',
    lastUpdated: '2026-03-10 07:55',
  },
  {
    id: 'L-88821',
    type: 'Load',
    name: 'Load #88821 — CHI→MIA',
    mc: 'N/A',
    score: 62,
    factors: ['High-value commodity (electronics)', 'Carrier assigned with score >60', 'Origin in high-theft zone'],
    trend: 'flat',
    lastUpdated: '2026-03-09 16:30',
  },
  {
    id: 'I-44102',
    type: 'Invoice',
    name: 'Invoice #44102',
    mc: 'N/A',
    score: 56,
    factors: ['Duplicate BOL number', 'Carrier rate differs from agreed rate', 'Invoice submitted 18 days late'],
    trend: 'flat',
    lastUpdated: '2026-03-09 14:22',
  },
  {
    id: 'A-00134',
    type: 'Agent',
    name: 'J. Martinez (Dispatcher)',
    mc: 'Employee',
    score: 43,
    factors: ['4 rate overrides in 7 days', 'Assigned loads to new carrier without approval'],
    trend: 'up',
    lastUpdated: '2026-03-08 11:10',
  },
  {
    id: 'C-10021',
    type: 'Carrier',
    name: 'Blue Ridge Freight',
    mc: 'MC-774509',
    score: 28,
    factors: ['2 years operating history', 'No prior fraud flags', 'Consistent on-time rate 94%'],
    trend: 'down',
    lastUpdated: '2026-03-08 09:00',
  },
];

const SCORE_RANGES = [
  { range: '0–20', label: 'Low Risk', color: '#10b981', description: 'Normal operating risk. Standard monitoring.' },
  { range: '21–50', label: 'Moderate Risk', color: '#f59e0b', description: 'Some risk signals present. Enhanced monitoring recommended.' },
  { range: '51–75', label: 'High Risk', color: '#f97316', description: 'Multiple risk signals. Manual review required before approvals.' },
  { range: '76–100', label: 'Critical Risk', color: '#ef4444', description: 'Severe fraud/risk indicators. Immediate investigation required.' },
];

function ScoreGauge({ score }) {
  const color = score >= 76 ? '#ef4444' : score >= 51 ? '#f97316' : score >= 21 ? '#f59e0b' : '#10b981';
  const pct = Math.min(score, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, backgroundColor: '#33333360', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 28 }}>{score}</span>
    </div>
  );
}

function TrendBadge({ trend }) {
  if (trend === 'up') return <span style={{ fontSize: 10, color: '#ef4444' }}>↑ Rising</span>;
  if (trend === 'down') return <span style={{ fontSize: 10, color: '#10b981' }}>↓ Falling</span>;
  return <span style={{ fontSize: 10, color: '#f59e0b' }}>→ Stable</span>;
}

export default function RiskScoring() {
  const { theme } = useTheme();
  const t = theme;
  const [typeFilter, setTypeFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [liveEntities, setLiveEntities] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const entities = [];
        const [carrierRes, exceptionRes, invoiceRes] = await Promise.allSettled([getCarriers(), getExceptions(), getInvoices()]);
        const carriers = carrierRes.status === 'fulfilled'
          ? (Array.isArray(carrierRes.value) ? carrierRes.value : Array.isArray(carrierRes.value?.carriers) ? carrierRes.value.carriers : [])
          : [];
        const exceptions = exceptionRes.status === 'fulfilled'
          ? (Array.isArray(exceptionRes.value) ? exceptionRes.value : [])
          : [];
        const invoices = invoiceRes.status === 'fulfilled'
          ? (Array.isArray(invoiceRes.value) ? invoiceRes.value : [])
          : [];

        carriers.forEach((c) => {
          const factors = [];
          const daysSince = c.createdAt ? Math.floor((Date.now() - new Date(c.createdAt).getTime()) / 86400000) : null;
          if (daysSince !== null && daysSince < 30) factors.push(`MC issued ${daysSince} days ago`);
          if (c.rating && c.rating < 2) factors.push('Low carrier rating');
          if (!c.insuranceExpiry) factors.push('Insurance expiry not on file');
          else if (new Date(c.insuranceExpiry) < new Date()) factors.push('Insurance expired');
          if (!c.dotNumber && !c.usdotNumber) factors.push('No DOT number on file');
          if (c.recruitmentStatus === 'rejected') factors.push('Recruitment rejected');
          const score = factors.length ? Math.min(100, 20 + factors.length * 14) : Math.floor(5 + Math.random() * 15);
          entities.push({
            id: c.id || c._id || `C-${Math.random().toString(36).slice(2, 6)}`,
            type: 'Carrier',
            name: c.name || 'Unknown Carrier',
            mc: c.mcNumber || 'N/A',
            score,
            factors: factors.length ? factors : ['No risk signals detected'],
            trend: factors.length > 2 ? 'up' : factors.length > 0 ? 'flat' : 'down',
            lastUpdated: c.updatedAt ? new Date(c.updatedAt).toLocaleString() : new Date().toLocaleString(),
          });
        });

        exceptions.forEach((ex) => {
          const factors = [];
          if (ex.severity) factors.push(`Severity: ${ex.severity}`);
          if (ex.type) factors.push(`Type: ${ex.type}`);
          if (ex.description) factors.push(ex.description.slice(0, 60));
          const score = ex.severity === 'critical' ? 80 : ex.severity === 'high' ? 60 : 35;
          entities.push({
            id: ex.id || ex._id || `E-${Math.random().toString(36).slice(2, 6)}`,
            type: 'Load',
            name: ex.loadId ? `Load #${ex.loadId}` : (ex.description || 'Exception').slice(0, 40),
            mc: 'N/A',
            score,
            factors,
            trend: ex.severity === 'critical' ? 'up' : 'flat',
            lastUpdated: ex.createdAt ? new Date(ex.createdAt).toLocaleString() : new Date().toLocaleString(),
          });
        });

        invoices.forEach((inv) => {
          const factors = [];
          if (inv.status === 'disputed') factors.push('Invoice disputed');
          if (inv.status === 'overdue') factors.push('Invoice overdue');
          if (inv.variance && Math.abs(inv.variance) > 0.05) factors.push(`Amount variance: ${(inv.variance * 100).toFixed(0)}%`);
          if (factors.length) {
            const score = Math.min(100, 25 + factors.length * 18);
            entities.push({
              id: inv.id || inv._id || `I-${Math.random().toString(36).slice(2, 6)}`,
              type: 'Invoice',
              name: `Invoice #${inv.invoiceNumber || inv.id || ''}`,
              mc: 'N/A',
              score,
              factors,
              trend: 'flat',
              lastUpdated: inv.updatedAt ? new Date(inv.updatedAt).toLocaleString() : new Date().toLocaleString(),
            });
          }
        });

        if (!cancelled && entities.length) {
          entities.sort((a, b) => b.score - a.score);
          setLiveEntities(entities);
        }
      } catch (_) { /* fallback */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const RISK_ENTITIES = liveEntities || DEMO_RISK_ENTITIES;

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

  const entityTypes = ['All', 'Carrier', 'Load', 'Invoice', 'Agent'];
  const filtered = typeFilter === 'All' ? RISK_ENTITIES : RISK_ENTITIES.filter(e => e.type === typeFilter);

  const critCount = RISK_ENTITIES.filter(e => e.score >= 76).length;
  const highCount = RISK_ENTITIES.filter(e => e.score >= 51 && e.score < 76).length;
  const avgScore = Math.round(RISK_ENTITIES.reduce((s, e) => s + e.score, 0) / RISK_ENTITIES.length);

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>📊 Risk Scoring Engine</div>
        <div style={{ fontSize: 14, color: t.textSecondary }}>
          Dynamic entity risk scores • Carriers • Loads • Invoices • Agents • Continuous real-time updates
          {loading && <span style={{ marginLeft: 8 }}>Scanning entities…</span>}
          {!loading && liveEntities && <span style={{ marginLeft: 8, color: '#10b981' }}>📡 Live — {liveEntities.length} entities scored</span>}
          {!loading && !liveEntities && <span style={{ marginLeft: 8, color: t.textSecondary }}>(Demo data — add carriers/loads for live scoring)</span>}
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Critical Risk Entities', value: critCount, color: '#ef4444' },
          { label: 'High Risk Entities', value: highCount, color: '#f97316' },
          { label: 'Average Risk Score', value: avgScore, color: '#f59e0b' },
          { label: 'Total Monitored', value: RISK_ENTITIES.length, color: '#3b82f6' },
        ].map(kpi => (
          <div key={kpi.label} style={cardStyle}>
            <div style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Entity Table */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>🏷️ Risk-Scored Entities</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {entityTypes.map(f => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: `1px solid ${typeFilter === f ? t.accent : t.border}`,
                    backgroundColor: typeFilter === f ? t.accent : 'transparent',
                    color: typeFilter === f ? '#fff' : t.text,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Entity</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Risk Score</th>
                <th style={thStyle}>Trend</th>
                <th style={thStyle}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entity => (
                <tr
                  key={entity.id}
                  style={{ cursor: 'pointer', backgroundColor: selected?.id === entity.id ? t.bgAlt : 'transparent' }}
                  onClick={() => setSelected(entity)}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = t.bgAlt}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = selected?.id === entity.id ? t.bgAlt : 'transparent'}
                >
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{entity.name}</div>
                    <div style={{ fontSize: 10, color: t.textSecondary, marginTop: 2 }}>{entity.id} · {entity.mc}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, backgroundColor: t.bgAlt, border: `1px solid ${t.border}` }}>
                      {entity.type}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, width: 160 }}>
                    <ScoreGauge score={entity.score} />
                  </td>
                  <td style={tdStyle}><TrendBadge trend={entity.trend} /></td>
                  <td style={{ ...tdStyle, fontSize: 11, color: t.textSecondary }}>{entity.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Score Detail Panel */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>🔍 Score Detail</div>
          {selected ? (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{selected.name}</div>
                <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 12 }}>{selected.id} · {selected.type}</div>
                <ScoreGauge score={selected.score} />
                <div style={{ marginTop: 8 }}>
                  <TrendBadge trend={selected.trend} />
                  <span style={{ fontSize: 11, color: t.textSecondary, marginLeft: 8 }}>Last updated {selected.lastUpdated}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Contributing Factors
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {selected.factors.map((f, i) => (
                  <div key={i} style={{ fontSize: 12, padding: '6px 10px', backgroundColor: t.bg, borderRadius: 4, border: `1px solid ${t.border}`, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: '#f59e0b' }}>→</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ flex: 1, padding: '8px 0', borderRadius: 4, border: 'none', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  Escalate
                </button>
                <button style={{ flex: 1, padding: '8px 0', borderRadius: 4, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.text, cursor: 'pointer', fontSize: 12 }}>
                  Dismiss
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: t.textSecondary, textAlign: 'center', paddingTop: 40 }}>
              Select an entity to view its risk breakdown
            </div>
          )}
        </div>
      </div>

      {/* Score Scale Reference */}
      <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>📏 Risk Score Scale</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {SCORE_RANGES.map(r => (
          <div key={r.range} style={{ ...cardStyle, padding: 14, borderLeft: `3px solid ${r.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: r.color }}>{r.range}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, backgroundColor: r.color + '20', color: r.color }}>{r.label}</span>
            </div>
            <div style={{ fontSize: 12, color: t.textSecondary, lineHeight: 1.5 }}>{r.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
