import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useTheme, themes } from '../contexts/ThemeContext';

/**
 * Lightweight sparkline chart for KPI trend visualization
 * Displays a simple area chart below KPI cards
 */
export default function SparklineChart({ data, color = '#0066cc', height = 40 }) {
  const { theme } = useTheme();
  const t = themes[theme];

  if (!data || data.length === 0) return null;

  return (
    <div
      style={{
        width: '100%',
        height: height,
        marginTop: 8,
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#grad-${color})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
