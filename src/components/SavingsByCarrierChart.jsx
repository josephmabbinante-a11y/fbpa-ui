import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme, themes } from '../contexts/ThemeContext';

/**
 * Horizontal bar chart showing savings by carrier
 * Replaces the Top Carriers table with visual representation
 * Clickable for navigation
 */
export default function SavingsByCarrierChart({ data, onClick }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [isHovered, setIsHovered] = useState(false);

  const [lastValidData, setLastValidData] = useState([]);
  const chartData = useMemo(() => {
    const arr = (data || [])
      .map((item, index) => {
        const rawSavings = Number(item?.savings ?? item?.total ?? item?.value ?? 0);
        const rawCount = Number(item?.invoiceCount ?? item?.count ?? 0);
        return {
          carrier: item?.carrier || item?.lane || `Item ${index + 1}`,
          savings: Number.isFinite(rawSavings) ? rawSavings : 0,
          invoiceCount: Number.isFinite(rawCount) ? rawCount : 0,
        };
      })
      .filter((item) => item.savings > 0);
    if (arr.length) setLastValidData(arr);
    return arr;
  }, [data]);
  const chartDataToUse = chartData.length ? chartData : lastValidData;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        height: 360,
        backgroundColor: isHovered ? t.bgAlt : t.surface,
        border: `1px solid ${isHovered ? t.accent : t.border}`,
        borderRadius: '4px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
        transform: onClick && isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: onClick && isHovered ? `0 4px 12px ${t.accent}20` : 'none',
      }}
    >
      <h3
        style={{
          fontSize: '13px',
          fontWeight: '600',
          margin: '0 0 12px 0',
          color: t.text,
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
        }}
      >
        Savings by Carrier
        {onClick && <span style={{ fontSize: '11px', marginLeft: '8px', opacity: 0.6 }}>- Click for details</span>}
      </h3>

      <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="100%" debounce={60}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
              <XAxis
                type="number"
                tick={{ fill: t.textSecondary, fontSize: 11 }}
                tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(1)}k`}
              />
              <YAxis
                dataKey="carrier"
                type="category"
                tick={{ fill: t.textSecondary, fontSize: 11 }}
                width={95}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: t.bgAlt,
                  border: `1px solid ${t.border}`,
                  borderRadius: '4px',
                  color: t.text,
                  fontSize: '12px',
                }}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '100%', display: 'grid', placeItems: 'center', border: `1px dashed ${t.border}`, borderRadius: 4, color: t.textSecondary, fontSize: 12 }}>
            No carrier savings data available
          </div>
        )}
      </div>

      {/* Summary stats below chart */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: `1px solid ${t.borderLight}`,
          fontSize: '12px',
          color: t.textSecondary,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
        }}
      >
        {chartData.map((item) => (
          <div key={item.carrier}>
            <div style={{ color: t.text, fontWeight: '600' }}>{item.carrier}</div>
            <div>{item.invoiceCount} invoices</div>
          </div>
        ))}
      </div>
    </div>
  );
}
