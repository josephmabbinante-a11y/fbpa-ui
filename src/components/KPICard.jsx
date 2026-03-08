// Lightweight trend sparkline component for KPI cards
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function KPICard({ title, value, trend, unit = '' }) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      background: 'var(--surface-elevated)',
      padding: 16,
      borderRadius: 'var(--radius)',
      color: 'var(--text-primary)',
      boxShadow: '0 4px 16px var(--card-shadow, rgba(0,0,0,0.08))',
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{title}</div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginTop: 4,
          marginBottom: 8,
          color: 'var(--text-primary)',
        }}
      >
        {title === 'Total Savings'
          ? `$${value.toLocaleString()}`
          : value.toLocaleString()}
      </div>

      {trend && trend.length > 0 && (
        <div style={{ height: 40, marginTop: 8 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
            <AreaChart
              data={trend}
              margin={{ top: 5, right: 5, bottom: 5, left: -25 }}
            >
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface)',
                  border: 'none',
                  borderRadius: 2,
                  fontSize: 11,
                  color: 'var(--text-primary)',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--accent)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTrend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
