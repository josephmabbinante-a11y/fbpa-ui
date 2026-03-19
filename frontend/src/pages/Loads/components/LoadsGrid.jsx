import React from 'react';
import LoadRow from './LoadRow';
import EmptyState from '../../../components/EmptyState';

function LoadsGrid({ items = [], selectedId, onSelect, onContextMenuAction, onQuickAction }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'auto', background: 'var(--surface)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
        <thead>
          <tr style={{ background: 'var(--surface-strong)', color: 'var(--text)', boxShadow: 'inset 0 -1px 0 var(--border), var(--shadow-soft)', height: 34 }}>
            <th style={{ padding: '0 10px', textAlign: 'left', fontSize: 11 }}>Load #</th>
            <th style={{ padding: '0 10px', textAlign: 'left', fontSize: 11 }}>Status</th>
            <th style={{ padding: '0 10px', textAlign: 'left', fontSize: 11 }}>Category</th>
            <th style={{ padding: '0 10px', textAlign: 'left', fontSize: 11 }}>Customer</th>
            <th style={{ padding: '0 10px', textAlign: 'left', fontSize: 11 }}>Carrier</th>
            <th style={{ padding: '0 10px', textAlign: 'left', fontSize: 11 }}>Origin</th>
            <th style={{ padding: '0 10px', textAlign: 'left', fontSize: 11 }}>Destination</th>
            <th style={{ padding: '0 10px', textAlign: 'right', fontSize: 11 }}>Miles</th>
            <th style={{ padding: '0 10px', textAlign: 'right', fontSize: 11 }}>Revenue</th>
            <th style={{ padding: '0 10px', textAlign: 'right', fontSize: 11 }}>Carrier Cost</th>
            <th style={{ padding: '0 10px', textAlign: 'right', fontSize: 11 }}>Margin</th>
            <th style={{ padding: '0 10px', textAlign: 'right', fontSize: 11 }}>Margin %</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <LoadRow
              key={`${String(item?.id || 'load')}-${index}`}
              load={item}
              selected={String(item?.id || '') === String(selectedId || '')}
              onSelect={onSelect}
              onContextMenuAction={onContextMenuAction}
              onQuickAction={onQuickAction}
            />
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={12}>
                <EmptyState
                  icon="🚚"
                  headline="No loads yet"
                  category="logistics"
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export { LoadsGrid };
export default LoadsGrid;
