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
    <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 4 }}>
      <div style={{ fontSize: 12, color: '#666' }}>{title}</div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginTop: 4,
          marginBottom: 8,
        }}
      >
        {title === 'Total Savings'
          ? `$${value.toLocaleString()}`
          : value.toLocaleString()}
      </div>

      {trend && trend.length > 0 && (
        <div style={{ height: 40, marginTop: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trend}
              margin={{ top: 5, right: 5, bottom: 5, left: -25 }}
            >
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#f5f5f5',
                  border: 'none',
                  borderRadius: 2,
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                strokeWidth={1}
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
