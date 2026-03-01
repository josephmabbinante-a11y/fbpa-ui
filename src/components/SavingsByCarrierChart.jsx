import { memo, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme, themes } from '../contexts/ThemeContext';

const SavingsByCarrierChart = memo(function SavingsByCarrierChart({ data, onClick }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [isHovered, setIsHovered] = useState(false);

  const chartData = useMemo(
    () =>
      (Array.isArray(data) ? data : [])
        .map((item, index) => {
          const rawSavings = Number(item?.savings ?? item?.total ?? item?.value ?? 0);
          const rawCount = Number(item?.invoiceCount ?? item?.count ?? 0);

          return {
            carrier: item?.carrier || item?.lane || `Item ${index + 1}`,
            savings: Number.isFinite(rawSavings) ? rawSavings : 0,
            invoiceCount: Number.isFinite(rawCount) ? rawCount : 0,
          };
        })
        .filter((item) => item.savings > 0),
    [data]
  );

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
        borderRadius: 4,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px 0', color: t.text, textTransform: 'uppercase' }}>
        Savings by Carrier
      </h3>

      <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="100%" debounce={60}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
              <XAxis type="number" tick={{ fill: t.textSecondary, fontSize: 11 }} tickFormatter={(value) => `$${(Number(value) / 1000).toFixed(1)}k`} />
              <YAxis dataKey="carrier" type="category" tick={{ fill: t.textSecondary, fontSize: 11 }} width={95} />
              <Bar dataKey="savings" fill={t.accent} radius={[4, 4, 0, 0]} minPointSize={2} maxBarSize={32} />
              <Tooltip
                contentStyle={{
                  backgroundColor: t.bgAlt,
                  border: `1px solid ${t.border}`,
                  borderRadius: 4,
                  color: t.text,
                  fontSize: 12,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '100%', display: 'grid', placeItems: 'center', border: `1px dashed ${t.border}`, borderRadius: 4, color: t.textSecondary, fontSize: 12 }}>
            No carrier savings data available
          </div>
        )}
      </div>
    </div>
  );
});

export default SavingsByCarrierChart;
