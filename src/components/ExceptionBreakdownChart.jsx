import { useState, memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme, themes } from '../contexts/ThemeContext';

/**
 * Exception breakdown chart showing distribution by type/status
 * Uses a donut chart for compact visualization
 * Clickable to navigate to Exceptions page
 */
const ExceptionBreakdownChart = memo(({ data, onClick }) => {
  const { theme } = useTheme();
  const t = themes[theme];
  const [isHovered, setIsHovered] = useState(false);

  if (!data || data.length === 0) return null;

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
        backgroundColor: isHovered ? t.bgAlt : t.surface,
        border: `1px solid ${isHovered ? '#ef4444' : t.border}`,
        borderRadius: '4px',
        padding: '16px',
        marginBottom: 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        transform: onClick && isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: onClick && isHovered ? '0 4px 12px #ef444420' : 'none',
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
        Exception Distribution
        {onClick && <span style={{ fontSize: '11px', marginLeft: '8px', opacity: 0.6 }}>→ Click to view all</span>}
      </h3>

      <div style={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: t.bgAlt,
              border: `1px solid ${t.border}`,
              borderRadius: '4px',
              color: t.text,
              fontSize: '12px',
            }}
            formatter={(value) => `${value} items`}
          />
        </PieChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: `1px solid ${t.borderLight}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8,
          fontSize: 12,
          color: t.textSecondary,
        }}
      >
        {data.map((entry) => (
          <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: entry.fill,
                display: 'inline-block',
              }}
            />
            <span style={{ color: t.text }}>{entry.name}</span>
            <span style={{ marginLeft: 'auto' }}>{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ExceptionBreakdownChart;
