import React from 'react';
import LoadRow from './LoadRow';

export default function LoadsGrid({ items = [], selectedId, onSelect }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--bg-alt)', color: 'var(--text-secondary)' }}>
            <th style={{ padding: 10, textAlign: 'left' }}>Status</th>
            <th style={{ padding: 10, textAlign: 'left' }}>Customer</th>
            <th style={{ padding: 10, textAlign: 'left' }}>Carrier</th>
            <th style={{ padding: 10, textAlign: 'right' }}>Miles</th>
            <th style={{ padding: 10, textAlign: 'right' }}>Revenue</th>
            <th style={{ padding: 10, textAlign: 'right' }}>Carrier Cost</th>
            <th style={{ padding: 10, textAlign: 'right' }}>Margin</th>
            <th style={{ padding: 10, textAlign: 'right' }}>Margin %</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <LoadRow key={item.id} load={item} selected={item.id === selectedId} onSelect={onSelect} />
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: 18, textAlign: 'center', color: 'var(--text-secondary)' }}>
                No loads match current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
