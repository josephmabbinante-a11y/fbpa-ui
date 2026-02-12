import { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const TrendLineChart = memo(({ data, dataKey, title, color = '#8884d8', yAxisLabel = 'Value' }) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ width: '100%' }}>
      <h3 style={{ marginBottom: 16, fontSize: '14px', fontWeight: '600', color: '#b0b0b0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </h3>
      <div style={{ height: 280, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
            <XAxis
              dataKey="date"
              fontSize={12}
              stroke="#9a9a9a"
            />
            <YAxis
              fontSize={12}
              stroke="#9a9a9a"
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: '#9a9a9a' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#2a2a2a',
                border: '1px solid #4a4a4a',
                borderRadius: 4,
                padding: 8,
                color: '#e8e8e8',
              }}
              formatter={(value) => 
                yAxisLabel === 'Count' ? value : `$${value.toLocaleString()}`
              }
              labelStyle={{ color: '#e8e8e8' }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default TrendLineChart;
