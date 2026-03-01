import React from 'react';

function formatCurrency(amount) {
  const n = Number(amount || 0);
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function statusTone(status) {
  if (status === 'open') return '#1d4ed8';
  if (status === 'in_transit') return '#047857';
  if (status === 'uncovered') return '#b45309';
  if (status === 'delivered') return '#6b7280';
  return '#374151';
}

export default function LoadRow({ load, selected, onSelect }) {
  return (
    <tr
      onClick={() => onSelect?.(load)}
      style={{
        background: selected ? 'rgba(59,130,246,0.15)' : 'transparent',
        cursor: 'pointer',
      }}
    >
      <td style={{ padding: 10 }}>
        <span style={{ background: statusTone(load.status), color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
          {String(load.status || '').replace('_', ' ')}
        </span>
      </td>
      <td style={{ padding: 10 }}>{load.customer?.name || '—'}</td>
      <td style={{ padding: 10 }}>{load.carrier?.name || '—'}</td>
      <td style={{ padding: 10, textAlign: 'right' }}>{Number(load.miles || 0).toLocaleString()}</td>
      <td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency(load.revenue)}</td>
      <td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency(load.carrierCost)}</td>
      <td style={{ padding: 10, textAlign: 'right' }}>{formatCurrency(load.margin)}</td>
      <td style={{ padding: 10, textAlign: 'right' }}>{Number(load.marginPct || 0).toFixed(1)}%</td>
    </tr>
  );
}
