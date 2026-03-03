import React from 'react';

const LineChart = ({ data = [], label = '' }) => {
  const values = Array.isArray(data) ? data.map((n) => Number(n)).filter((n) => Number.isFinite(n)) : [];
  const width = 320;
  const height = 90;
  const padding = 10;

  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const span = Math.max(1, max - min);

  const points = values.map((value, index) => {
    const x = padding + ((width - (padding * 2)) * (index / Math.max(1, values.length - 1)));
    const y = height - padding - (((value - min) / span) * (height - (padding * 2)));
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ textAlign: 'center', display: 'grid', gap: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 90, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
        <polyline
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          points={points || `${padding},${height / 2} ${width - padding},${height / 2}`}
        />
      </svg>
    </div>
  );
};

export default LineChart;
