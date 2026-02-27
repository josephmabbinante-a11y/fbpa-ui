import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function TrendLineChart({ data, dataKey, title, color = '#8884d8', yAxisLabel = 'Value' }) {
  const [lastValidData, setLastValidData] = useState([]);
  const normalizedData = useMemo(() => {
    const arr = (data || [])
      .map((row, index) => {
        const rawY = Number(row?.[dataKey]);
        return {
          ...row,
          __x:
            row?.date ||
            row?.day ||
            row?.month ||
            row?.period ||
            `Point ${index + 1}`,
          __y: Number.isFinite(rawY) ? rawY : 0,
        };
      })
      .filter((row) => row.__x);
    if (arr.length) setLastValidData(arr);
    return arr;
  }, [data, dataKey]);

  const chartDataToUse = normalizedData.length ? normalizedData : lastValidData;

  if (!chartDataToUse.length) {
    return (
      <div style={{ width: '100%' }}>
        <h3 style={{ marginBottom: 16, fontSize: '14px', fontWeight: '600', color: '#b0b0b0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </h3>
        <div style={{ height: 280, width: '100%', display: 'grid', placeItems: 'center', border: '1px dashed #3a3a3a', borderRadius: 6, color: '#9a9a9a', fontSize: 12 }}>
          No chart data available
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <h3 style={{ marginBottom: 16, fontSize: '14px', fontWeight: '600', color: '#b0b0b0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </h3>
      <div style={{ height: 280, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%" debounce={60}>
          <LineChart data={normalizedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
            <XAxis
              dataKey="__x"
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
              formatter={(value) => {
                const n = Number(value);
                if (!Number.isFinite(n)) return '-';
                if (yAxisLabel === 'Count') return n.toLocaleString();
                return `$${n.toLocaleString()}`;
              }}
              labelStyle={{ color: '#e8e8e8' }}
            />
            <Line
              type="monotone"
              dataKey="__y"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
