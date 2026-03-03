import { useMemo, useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';
import GPSBreadcrumbTracker from '../components/GPSBreadcrumbTracker';
import { formatLoadStatusLabel, normalizeLoadStatus } from '../utils/loadLifecycle';

function money(amount) {
  return `$${Number(amount || 0).toLocaleString()}`;
}

export default function Shipments() {
  const { theme } = useTheme();
  const t = theme;

  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');

  const panelStyle = {
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`,
    boxShadow: '0 10px 24px rgba(0,0,0,0.14)',
  };

  const inputStyle = {
    minHeight: 36,
    borderRadius: 8,
    border: `1px solid ${t.border}`,
    background: t.bgAlt,
    color: t.text,
    padding: '8px 10px',
    fontSize: 12,
  };

  const buttonStyle = {
    ...inputStyle,
    cursor: 'pointer',
    fontWeight: 700,
    borderColor: t.accent,
  };

  const statusBadgeStyle = (status) => {
    const normalizedStatus = normalizeLoadStatus(status);
    let bg;
    let fg;
    if (normalizedStatus === 'DELIVERED') {
      bg = `${t.positive}30`;
      fg = t.positive;
    } else if (normalizedStatus === 'IN_TRANSIT') {
      bg = `${t.accent}30`;
      fg = t.accent;
    } else if (normalizedStatus === 'EXCEPTION') {
      bg = `${t.error}30`;
      fg = t.error;
    } else {
      bg = `${t.warning}30`;
      fg = t.warning;
    }

    return {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: 999,
      background: bg,
      color: fg,
      fontSize: 11,
      fontWeight: 600,
      border: `1px solid ${t.border}`,
    };
  };

  const shipments = [
    {
      id: 'SHP-001',
      customer: 'Acme Corp',
      carrier: 'TransCo',
      origin: 'Los Angeles, CA',
      destination: 'Dallas, TX',
      status: 'IN_TRANSIT',
      revenue: '$2,450',
      cost: '$1,800',
      margin: '$650 (26.5%)',
      dueDate: '2026-02-15',
    },
    {
      id: 'SHP-002',
      customer: 'Global Trade',
      carrier: 'FastHaul',
      origin: 'Chicago, IL',
      destination: 'Miami, FL',
      status: 'DELIVERED',
      revenue: '$1,820',
      cost: '$1,200',
      margin: '$620 (34.1%)',
      dueDate: '2026-02-10',
    },
    {
      id: 'SHP-003',
      customer: 'Swift Logistics',
      carrier: 'RedLine',
      origin: 'Atlanta, GA',
      destination: 'Toronto, ON',
      status: 'BOOKED',
      revenue: 3100,
      cost: 2100,
      dueDate: '2026-02-20',
    },
  ];

  const normalizedRows = useMemo(() => shipments.map((item) => {
    const revenue = Number(String(item.revenue).replace(/[^\d.-]/g, '') || 0);
    const cost = Number(String(item.cost).replace(/[^\d.-]/g, '') || 0);
    const marginValue = revenue - cost;
    const marginPct = revenue > 0 ? (marginValue / revenue) * 100 : 0;

    return {
      ...item,
      status: normalizeLoadStatus(item.status),
      revenue,
      cost,
      marginValue,
      marginPct,
    };
  }), [shipments]);

  const filteredRows = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();
    return normalizedRows.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;

      return [
        item.id,
        item.customer,
        item.carrier,
        item.origin,
        item.destination,
      ].some((value) => String(value || '').toLowerCase().includes(q));
    });
  }, [normalizedRows, query, statusFilter]);

  const summary = useMemo(() => {
    const revenue = filteredRows.reduce((sum, item) => sum + item.revenue, 0);
    const cost = filteredRows.reduce((sum, item) => sum + item.cost, 0);
    const margin = revenue - cost;
    return {
      count: filteredRows.length,
      revenue,
      cost,
      margin,
    };
  }, [filteredRows]);

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, flexWrap: 'wrap', minHeight: -52, padding: '0 4px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>Shipments</h1>
          <div style={{ fontSize: 12, color: t.textSecondary }}>Core workflow engine with status, routing, and margin visibility.</div>
        </div>
        <button style={buttonStyle}>
          + New Shipment
        </button>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        {[
          ['Visible Loads', summary.count],
          ['Revenue', money(summary.revenue)],
          ['Cost', money(summary.cost)],
          ['Margin', money(summary.margin)],
        ].map(([label, value]) => (
          <div key={label} style={{ ...panelStyle, padding: 12 }}>
            <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </section>

      <section style={{ ...panelStyle, padding: 12, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select style={{ ...inputStyle, minWidth: 150 }} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All Statuses</option>
            <option value="BOOKED">Booked</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="EXCEPTION">Exception</option>
          </select>
          <input
            type="text"
            placeholder="Search load, customer, carrier, lane"
            style={{ ...inputStyle, minWidth: 260, flex: 1 }}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div style={{ fontSize: 12, color: t.textSecondary }}>{filteredRows.length} shipments</div>
        </div>

        <div style={{ marginBottom: 4 }}>
          <GPSBreadcrumbTracker />
        </div>

        <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 980, borderCollapse: 'collapse', fontSize: '1rem' }}>
            <thead>
              <tr style={{ background: t.bgAlt }}>
                {['Load #', 'Customer', 'Carrier', 'Origin', 'Destination', 'Status', 'Revenue', 'Cost', 'Margin', 'Due Date'].map((head) => (
                  <th key={head} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: t.textSecondary, borderBottom: `1px solid ${t.border}` }}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((ship) => (
                <tr key={ship.id} style={{ background: 'transparent' }}>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, fontWeight: 700 }}>{ship.id}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>{ship.customer}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>{ship.carrier}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>{ship.origin}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>{ship.destination}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}><span style={statusBadgeStyle(ship.status)}>{formatLoadStatusLabel(ship.status)}</span></td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>{money(ship.revenue)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>{money(ship.cost)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, fontWeight: 700 }}>
                    {money(ship.marginValue)} ({ship.marginPct.toFixed(1)}%)
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}` }}>{ship.dueDate}</td>
                </tr>
              ))}
              {!filteredRows.length && (
                <tr>
                  <td colSpan={10} style={{ padding: '14px 12px', color: t.textSecondary }}>No shipments match this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
