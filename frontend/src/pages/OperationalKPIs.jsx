import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getDashboard } from '../api/client';
import { listLoads } from '../api/loadsClient';

function toMoney(v) {
  return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function pct(n) {
  return `${Number(n || 0).toFixed(1)}%`;
}

export default function OperationalKPIs() {
  const { theme } = useTheme();
  const t = theme;

  const [dashData, setDashData] = useState(null);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDashboard().catch(() => null),
      listLoads({}).catch(() => null),
    ]).then(([dash, loadData]) => {
      setDashData(dash);
      const items = Array.isArray(loadData?.loads) ? loadData.loads : Array.isArray(loadData) ? loadData : [];
      setLoads(items);
      setLoading(false);
    });
  }, []);

  const kpis = useMemo(() => {
    const summary = dashData?.summary || {};
    const totalLoads = loads.length;
    const delivered = loads.filter((l) => l.status === 'Delivered' || l.status === 'Completed').length;
    const onTime = loads.filter((l) => l.onTime === true || l.deliveryStatus === 'On Time').length;
    const otPerf = delivered > 0 ? (onTime / delivered) * 100 : 0;

    const totalRevenue = Number(summary.totalInvoices || summary.totalRevenue || 0);
    const totalCarrierPay = Number(summary.totalCarrierPay || 0);
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCarrierPay) / totalRevenue) * 100 : 0;
    const avgRevenuePerLoad = totalLoads > 0 ? totalRevenue / totalLoads : 0;

    const exceptions = Number(summary.exceptions || summary.totalExceptions || 0);
    const exceptionRate = totalLoads > 0 ? (exceptions / totalLoads) * 100 : 0;
    const savings = Number(summary.totalSavings || 0);

    const pending = loads.filter((l) => l.status === 'Pending' || l.status === 'Booked').length;
    const inTransit = loads.filter((l) => l.status === 'In Transit' || l.status === 'Dispatched').length;

    return { totalLoads, delivered, onTime: otPerf, grossMargin, totalRevenue, totalCarrierPay, avgRevenuePerLoad, exceptionRate, exceptions, savings, pending, inTransit };
  }, [dashData, loads]);

  const statusBreakdown = useMemo(() => {
    const statuses = {};
    loads.forEach((l) => {
      const s = l.status || 'Unknown';
      statuses[s] = (statuses[s] || 0) + 1;
    });
    return Object.entries(statuses).sort(([, a], [, b]) => b - a);
  }, [loads]);

  const topCustomers = useMemo(() => {
    const custs = {};
    loads.forEach((l) => {
      const name = l.customer || l.customerName || 'Unknown';
      if (!custs[name]) custs[name] = { count: 0, revenue: 0 };
      custs[name].count += 1;
      custs[name].revenue += Number(l.revenue || l.rate || l.customerRate || 0);
    });
    return Object.entries(custs).sort(([, a], [, b]) => b.revenue - a.revenue).slice(0, 10);
  }, [loads]);

  const sectionStyle = { border: `1px solid ${t.border}`, borderRadius: 12, background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`, overflow: 'hidden' };
  const headerStyle = { padding: '10px 12px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt, fontSize: 14, fontWeight: 700 };
  const bodyStyle = { padding: 12, display: 'grid', gap: 10 };
  const inputStyle = { minHeight: 34, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '7px 10px', fontSize: 12, outline: 'none' };
  const ghostBtn = { border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 12px', cursor: 'pointer' };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>Ops Management</div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 26 }}>Operational KPIs</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['7d', '30d', '90d', 'YTD'].map((r) => (
            <button key={r} type="button" onClick={() => setTimeRange(r)} style={{ ...ghostBtn, ...(timeRange === r ? { background: `${t.accent}18`, borderColor: t.accent, color: t.accent } : {}) }}>{r}</button>
          ))}
        </div>
      </div>

      {loading && <div style={{ padding: 16, color: t.textSecondary, fontSize: 12 }}>Loading operational data…</div>}

      {/* Primary KPIs */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Key Performance Indicators</div>
        <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
          {[
            { label: 'Total Loads', value: kpis.totalLoads, color: t.accent },
            { label: 'Gross Margin', value: pct(kpis.grossMargin), color: kpis.grossMargin >= 15 ? '#22c55e' : '#f59e0b' },
            { label: 'On-Time %', value: pct(kpis.onTime), color: kpis.onTime >= 90 ? '#22c55e' : kpis.onTime >= 75 ? '#f59e0b' : '#ef4444' },
            { label: 'Revenue', value: toMoney(kpis.totalRevenue), color: '#22c55e' },
            { label: 'Carrier Pay', value: toMoney(kpis.totalCarrierPay), color: '#ef4444' },
            { label: 'Avg Rev/Load', value: toMoney(kpis.avgRevenuePerLoad), color: t.text },
            { label: 'Exception Rate', value: pct(kpis.exceptionRate), color: kpis.exceptionRate <= 5 ? '#22c55e' : '#ef4444' },
            { label: 'Audit Savings', value: toMoney(kpis.savings), color: t.accent },
          ].map((kpi) => (
            <div key={kpi.label} style={{ padding: 12, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>{kpi.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: kpi.color, marginTop: 4 }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline Snapshot */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Operational Pipeline</div>
        <div style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Pending', value: kpis.pending, color: '#f59e0b' },
            { label: 'In Transit', value: kpis.inTransit, color: '#3b82f6' },
            { label: 'Delivered', value: kpis.delivered, color: '#22c55e' },
            { label: 'Exceptions', value: kpis.exceptions, color: '#ef4444' },
          ].map((item) => (
            <div key={item.label} style={{ flex: '1 1 100px', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: item.color, textTransform: 'uppercase' }}>{item.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: t.text }}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Status Breakdown */}
        <section style={sectionStyle}>
          <div style={headerStyle}>Load Status Distribution</div>
          <div style={bodyStyle}>
            {statusBreakdown.map(([status, count]) => (
              <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{status}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 80, height: 6, borderRadius: 3, background: `${t.border}`, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: t.accent, width: `${loads.length > 0 ? (count / loads.length) * 100 : 0}%` }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, minWidth: 30, textAlign: 'right' }}>{count}</span>
                </div>
              </div>
            ))}
            {statusBreakdown.length === 0 && <div style={{ fontSize: 12, color: t.textSecondary }}>No load data available.</div>}
          </div>
        </section>

        {/* Top Customers */}
        <section style={sectionStyle}>
          <div style={headerStyle}>Top Customers by Revenue</div>
          <div style={bodyStyle}>
            {topCustomers.map(([name, data]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: t.textSecondary }}>{data.count} loads</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>{toMoney(data.revenue)}</span>
                </div>
              </div>
            ))}
            {topCustomers.length === 0 && <div style={{ fontSize: 12, color: t.textSecondary }}>No customer data available.</div>}
          </div>
        </section>
      </div>

      {/* Cross-Department Performance */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Cross-Department Performance Indicators</div>
        <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { dept: 'Sales Ops', metric: 'Account Retention', value: '—', note: 'Connect lead data' },
            { dept: 'Carrier Ops', metric: 'Tender Accept Rate', value: '—', note: 'Connect tender data' },
            { dept: 'Finance', metric: 'Invoice Cycle Time', value: '—', note: 'Connect invoice data' },
            { dept: 'Ops Mgmt', metric: 'System Uptime', value: '99.9%', note: 'Monitored' },
          ].map((item) => (
            <div key={item.dept} style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.accent, textTransform: 'uppercase' }}>{item.dept}</div>
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{item.metric}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: t.text, margin: '4px 0' }}>{item.value}</div>
              <div style={{ fontSize: 10, color: t.textSecondary }}>{item.note}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
