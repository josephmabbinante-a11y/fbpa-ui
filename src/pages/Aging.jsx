import { useMemo, useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function Aging() {
  const { theme } = useTheme();
  const t = theme;
  const [activeBucket, setActiveBucket] = useState('0-30 Days');
  const [chartCollapsed, setChartCollapsed] = useState(false);

  const containerStyle = {
    padding: 24,
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
  };

  const headerStyle = {
    marginBottom: 32,
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

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 32,
  };

  const agingBoxStyle = (color, isActive) => ({
    backgroundColor: hexToRgba(color, 0.1),
    border: `2px solid ${isActive ? color : t.border}`,
    borderRadius: 8,
    padding: 20,
    cursor: 'pointer',
    boxShadow: isActive ? `0 0 0 2px ${hexToRgba(color, 0.25)}` : 'none',
    transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
    transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
  });

  const agingLabelStyle = {
    fontSize: 12,
    color: t.textSecondary,
    marginBottom: 8,
  };

  const agingValueStyle = (color) => ({
    fontSize: 32,
    fontWeight: 700,
    color: color,
    marginBottom: 4,
  });

  const agingPercentStyle = {
    fontSize: 13,
    color: t.textSecondary,
  };

  const chartStyle = {
    height: 300,
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: 20,
    marginBottom: 32,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
    width: '100%',
    maxHeight: chartCollapsed ? 0 : 300,
    overflow: 'hidden',
    transition: 'max-height 320ms ease, opacity 320ms ease',
    opacity: chartCollapsed ? 0 : 1,
  };

  const barStyle = (height, color, isActive) => ({
    flex: '1 1 0',
    height: `${height}%`,
    backgroundColor: color,
    borderRadius: 4,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 8,
    minWidth: 140,
    maxWidth: 260,
    minHeight: 40,
    cursor: 'pointer',
    opacity: isActive ? 1 : 0.7,
    transform: isActive ? 'translateY(-6px)' : 'translateY(0)',
    boxShadow: isActive ? '0 12px 20px rgba(0,0,0,0.25)' : 'none',
    transition: 'opacity 160ms ease, transform 160ms ease, box-shadow 160ms ease',
  });

  const barLabelStyle = {
    fontSize: 12,
    fontWeight: 600,
    marginTop: 8,
    textAlign: 'center',
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

  const agingData = [
    { bucket: '0-30 Days', amount: '$28,450', percentage: 45, color: '#10b981', count: 12 },
    { bucket: '31-60 Days', amount: '$18,200', percentage: 29, color: '#f59e0b', count: 8 },
    { bucket: '61-90 Days', amount: '$10,350', percentage: 16, color: '#ef4444', count: 4 },
    { bucket: '90+ Days', amount: '$8,900', percentage: 10, color: '#7c3aed', count: 3 },
  ];

  const breakdownData = {
    '0-30 Days': [
      { label: 'Top customers', value: 'Acme Corp, Nova Freight, Skyline' },
      { label: 'Avg days outstanding', value: '15 days' },
      { label: 'Expected to clear', value: '78% within 14 days' },
      { label: 'Largest invoices', value: '$6.2k, $4.8k, $3.9k' },
    ],
    '31-60 Days': [
      { label: 'Top customers', value: 'Global Trade, IronRail, Apex' },
      { label: 'Avg days outstanding', value: '45 days' },
      { label: 'Disputes open', value: '2 invoices flagged' },
      { label: 'Largest invoices', value: '$5.1k, $4.4k, $3.2k' },
    ],
    '61-90 Days': [
      { label: 'Top customers', value: 'Swift Logistics, Horizon' },
      { label: 'Avg days outstanding', value: '75 days' },
      { label: 'Collections stage', value: '2nd outreach' },
      { label: 'Largest invoices', value: '$3.8k, $2.9k' },
    ],
    '90+ Days': [
      { label: 'Top customers', value: 'Delta Line, Atlas' },
      { label: 'Avg days outstanding', value: '120 days' },
      { label: 'Collections stage', value: 'Escalation' },
      { label: 'Largest invoices', value: '$3.4k, $2.7k' },
    ],
  };

  const bucketRows = {
    '0-30 Days': [
      { customer: 'Acme Corp', amount: '$4,850', days: 12, status: 'On track' },
      { customer: 'Nova Freight', amount: '$3,920', days: 18, status: 'On track' },
      { customer: 'Skyline', amount: '$3,100', days: 22, status: 'Pending' },
    ],
    '31-60 Days': [
      { customer: 'Global Trade', amount: '$5,100', days: 41, status: 'Follow-up' },
      { customer: 'IronRail', amount: '$4,420', days: 47, status: 'Promise to pay' },
      { customer: 'Apex', amount: '$3,210', days: 55, status: 'Dispute' },
    ],
    '61-90 Days': [
      { customer: 'Swift Logistics', amount: '$3,850', days: 72, status: '2nd outreach' },
      { customer: 'Horizon', amount: '$2,940', days: 83, status: 'Pending' },
    ],
    '90+ Days': [
      { customer: 'Delta Line', amount: '$3,420', days: 122, status: 'Escalated' },
      { customer: 'Atlas', amount: '$2,710', days: 136, status: 'Escalated' },
    ],
  };

  const totalAmount = 65900;
  const maxPercentage = Math.max(...agingData.map((item) => item.percentage));
  const activeData = useMemo(
    () => agingData.find((item) => item.bucket === activeBucket),
    [activeBucket],
  );

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>📊 Aging Report</div>
        <div style={subtitleStyle}>AR aging analysis • Exposure tracking • Collection strategy</div>
      </div>

      <div style={gridStyle}>
        {agingData.map((item) => (
          <div
            key={item.bucket}
            style={agingBoxStyle(item.color, activeBucket === item.bucket)}
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveBucket(item.bucket);
              setChartCollapsed(true);
            }}
            onKeyDown={(event) => event.key === 'Enter' && setActiveBucket(item.bucket)}
          >
            <div style={agingLabelStyle}>{item.bucket}</div>
            <div style={agingValueStyle(item.color)}>{item.amount}</div>
            <div style={agingPercentStyle}>{item.percentage}% of total ({item.count} invoices)</div>
          </div>
        ))}
      </div>

      <div style={chartStyle}>
        {agingData.map((item) => (
          <div
            key={item.bucket}
            style={barStyle((item.percentage / maxPercentage) * 100, item.color, activeBucket === item.bucket)}
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveBucket(item.bucket);
              setChartCollapsed(true);
            }}
            onKeyDown={(event) => event.key === 'Enter' && setActiveBucket(item.bucket)}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              {item.percentage}%
            </span>
            <div style={barLabelStyle}>{item.bucket}</div>
          </div>
        ))}
      </div>

      {chartCollapsed && (
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => setChartCollapsed(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: t.accent,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 160ms ease',
            }}
            onMouseEnter={(e) => e.target.style.opacity = 0.9}
            onMouseLeave={(e) => e.target.style.opacity = 1}
          >
            ↓ Show Chart
          </button>
        </div>
      )}

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          Breakdown: {activeData?.bucket}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {(breakdownData[activeBucket] || []).map((item) => (
            <div key={item.label} style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Detailed analytics</div>
        <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Invoice Amount</th>
                <th style={thStyle}>Days Outstanding</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(bucketRows[activeBucket] || []).map((row) => (
                <tr key={`${row.customer}-${row.amount}`}>
                  <td style={tdStyle}><strong>{row.customer}</strong></td>
                  <td style={tdStyle}>{row.amount}</td>
                  <td style={tdStyle}>{row.days}</td>
                  <td style={tdStyle}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>Total AR</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: t.accent }}>${(totalAmount / 1000).toFixed(1)}k</div>
          </div>
          <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>At Risk (60+)</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>${((10350 + 8900) / 1000).toFixed(1)}k</div>
          </div>
          <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>Critical (90+)</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed' }}>${(8900 / 1000).toFixed(1)}k</div>
          </div>
          <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>Current (0-30)</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>${(28450 / 1000).toFixed(1)}k</div>
          </div>
        </div>
      </div>

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Aging Bucket</th>
              <th style={thStyle}>Total Amount</th>
              <th style={thStyle}>% of Total AR</th>
              <th style={thStyle}>Invoice Count</th>
              <th style={thStyle}>Days Outstanding (Avg)</th>
            </tr>
          </thead>
          <tbody>
            {agingData.map((item) => (
              <tr key={item.bucket}>
                <td style={tdStyle}><strong>{item.bucket}</strong></td>
                <td style={tdStyle}>{item.amount}</td>
                <td style={tdStyle}>{item.percentage}%</td>
                <td style={tdStyle}>{item.count}</td>
                <td style={tdStyle}>
                  {item.bucket === '0-30 Days' && '15'}
                  {item.bucket === '31-60 Days' && '45'}
                  {item.bucket === '61-90 Days' && '75'}
                  {item.bucket === '90+ Days' && '120'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
