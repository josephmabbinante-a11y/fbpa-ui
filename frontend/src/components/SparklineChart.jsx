import { useId, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function SparklineChart({ data, color = '#0066cc', height = 40 }) {
  const gradientId = useId();

  const normalizedData = useMemo(
    () =>
      (Array.isArray(data) ? data : [])
        .map((point) => {
          const direct = Number(point?.value);
          if (Number.isFinite(direct)) return { value: direct };

          const fallback = Object.entries(point || {}).find(([key, value]) => {
            if (key === 'day' || key === 'date' || key === 'month' || key === 'period' || key === 'label') return false;
            return Number.isFinite(Number(value));
          });

          return { value: fallback ? Number(fallback[1]) : 0 };
        })
        .filter((point) => Number.isFinite(point.value)),
    [data]
  );

  if (!normalizedData.length) return null;

  return (
    <div
      style={{
        width: '100%',
        height: height,
        marginTop: 8,
      }}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10} debounce={60}>
        <AreaChart data={normalizedData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
