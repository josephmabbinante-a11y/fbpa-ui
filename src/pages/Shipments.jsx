import { useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

export default function Shipments() {
  const { theme } = useTheme();
  const t = themes[theme];

  const containerStyle = {
    padding: 24,
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
  };

  const headerStyle = {
    marginBottom: 32,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle = {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
  };

  const subtitleStyle = {
    fontSize: 14,
    color: t.textSecondary,
  };

  const buttonStyle = {
    padding: '10px 16px',
    backgroundColor: t.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  };

  const filterBarStyle = {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  };

  const filterInputStyle = {
    padding: '8px 12px',
    borderRadius: 4,
    border: `1px solid ${t.border}`,
    backgroundColor: t.surface,
    color: t.text,
    fontSize: 12,
  };

  const tableWrapperStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    overflow: 'hidden',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle = {
    backgroundColor: t.bgAlt,
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: t.textSecondary,
    borderBottom: `1px solid ${t.border}`,
  };

  const tdStyle = {
    padding: '12px 16px',
    fontSize: 13,
    borderBottom: `1px solid ${t.border}`,
  };

  const statusBadgeStyle = (status) => {
    let bg, fg;
    if (status === 'Delivered') {
      bg = '#10b98150';
      fg = '#059669';
    } else if (status === 'In Transit') {
      bg = '#3b82f650';
      fg = '#2563eb';
    } else if (status === 'Booked') {
      bg = '#f59e0b50';
      fg = '#d97706';
    }
    return {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: 3,
      backgroundColor: bg,
      color: fg,
      fontSize: 11,
      fontWeight: 600,
    };
  };

  // Mock shipments data
  const shipments = [
    {
      id: 'SHP-001',
      customer: 'Acme Corp',
      carrier: 'TransCo',
      origin: 'Los Angeles, CA',
      destination: 'Dallas, TX',
      status: 'In Transit',
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
      status: 'Delivered',
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
      status: 'Booked',
      revenue: '$3,100',
      cost: '$2,100',
      margin: '$1,000 (32.3%)',
      dueDate: '2026-02-20',
    },
  ];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <div style={titleStyle}>📦 Shipments</div>
          <div style={subtitleStyle}>Core workflow engine • Timeline visibility • Document tracking</div>
        </div>
        <button style={buttonStyle} onMouseEnter={(e) => e.target.style.opacity = 0.9} onMouseLeave={(e) => e.target.style.opacity = 1}>
          + New Shipment
        </button>
      </div>

      <div style={filterBarStyle}>
        <select style={filterInputStyle} defaultValue="all">
          <option value="all">All Statuses</option>
          <option value="booked">Booked</option>
          <option value="transit">In Transit</option>
          <option value="delivered">Delivered</option>
        </select>
        <input type="text" placeholder="Search load #..." style={filterInputStyle} />
        <input type="text" placeholder="Filter by customer..." style={filterInputStyle} />
        <input type="text" placeholder="Filter by carrier..." style={filterInputStyle} />
      </div>

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Load #</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Carrier</th>
              <th style={thStyle}>Origin</th>
              <th style={thStyle}>Destination</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Revenue</th>
              <th style={thStyle}>Cost</th>
              <th style={thStyle}>Margin</th>
              <th style={thStyle}>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((ship) => (
              <tr key={ship.id} style={{ cursor: 'pointer' }} onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = t.bgAlt} onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}>
                <td style={tdStyle}><strong>{ship.id}</strong></td>
                <td style={tdStyle}>{ship.customer}</td>
                <td style={tdStyle}>{ship.carrier}</td>
                <td style={tdStyle}>{ship.origin}</td>
                <td style={tdStyle}>{ship.destination}</td>
                <td style={tdStyle}><div style={statusBadgeStyle(ship.status)}>{ship.status}</div></td>
                <td style={tdStyle}>{ship.revenue}</td>
                <td style={tdStyle}>{ship.cost}</td>
                <td style={tdStyle}><strong>{ship.margin}</strong></td>
                <td style={tdStyle}>{ship.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
