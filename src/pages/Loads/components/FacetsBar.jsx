import React from 'react';

const STATUS_ORDER = [
  { key: 'open', label: 'Open' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'uncovered', label: 'Uncovered' },
  { key: 'at_risk', label: 'At Risk' },
  { key: 'delivered', label: 'Delivered' },
];

export default function FacetsBar({ facets }) {
  const status = facets?.status || {};

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
      {STATUS_ORDER.map((item) => (
        <div
          key={item.key}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 999,
            padding: '4px 10px',
            fontSize: 11,
            color: 'var(--text-secondary)',
            background: 'var(--bg-alt)',
          }}
        >
          {item.label}: <strong style={{ color: 'var(--text)' }}>{Number(status[item.key] || 0).toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
}
