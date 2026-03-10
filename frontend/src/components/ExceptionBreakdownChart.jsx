import { memo, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme, themes } from '../contexts/ThemeContext';

const FALLBACK_PALETTE = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0099cc'];

const ExceptionBreakdownChart = memo(function ExceptionBreakdownChart({ data, onClick }) {
  const { theme } = useTheme();
  const t = theme || {};
  const [isHovered, setIsHovered] = useState(false);

  const normalizedData = useMemo(
    () =>
      (Array.isArray(data) ? data : [])
        .map((entry, index) => {
          const raw = Number(entry?.value ?? entry?.count ?? entry?.total ?? 0);
          return {
            name: entry?.name || entry?.reason || entry?.status || `Item ${index + 1}`,
            value: Number.isFinite(raw) ? raw : 0,
            fill: entry?.fill || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length],
          };
        })
        .filter((entry) => entry.value > 0),
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
        display: 'flex',
        flexDirection: 'column',
        background: `radial-gradient(120px 90px at 15% 12%, rgba(var(--glow), 0.18), transparent 70%), radial-gradient(140px 100px at 84% 80%, rgba(var(--glow), 0.12), transparent 72%), ${isHovered ? t.bgAlt : t.surface}`,
        border: `1px solid ${isHovered ? '#ef4444' : t.border}`,
        borderRadius: 4,
        padding: 16,
        boxSizing: 'border-box',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px 0', color: t.text, textTransform: 'uppercase' }}>
        Exception Distribution
      </h3>

      <div style={{ flex: 1 }}>
        {normalizedData.length ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10} debounce={60}>
            <PieChart>
              <Pie
                data={normalizedData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={false}
              >
                {normalizedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: t.bgAlt,
                  border: `1px solid ${t.border}`,
                  borderRadius: 4,
                  color: t.text,
                  fontSize: 12,
                }}
                formatter={(value) => `${value} items`}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '100%', display: 'grid', placeItems: 'center', border: `1px dashed ${t.border}`, borderRadius: 4, color: t.textSecondary, fontSize: 12 }}>
            No exception data available
          </div>
        )}
      </div>
    </div>
  );
});

export default ExceptionBreakdownChart;
