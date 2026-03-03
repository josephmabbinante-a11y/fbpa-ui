import React from 'react';

const PAGE_SIZES = ['10', '25', '50', '100'];

export default function PaginationBar({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const numericPage = Number(page || 1);
  const numericPageSize = Number(pageSize || 25);
  const numericTotal = Number(total || 0);
  const totalPages = Math.max(1, Math.ceil(numericTotal / numericPageSize));

  return (
    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
        Page {numericPage} of {totalPages} • {numericTotal.toLocaleString()} total loads
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Page size
          <select
            value={String(pageSize || '25')}
            onChange={(e) => onPageSizeChange?.(e.target.value)}
            style={{ marginLeft: 6, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text)' }}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => onPageChange?.(String(Math.max(1, numericPage - 1)))}
          disabled={numericPage <= 1}
          style={buttonStyle(numericPage <= 1)}
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => onPageChange?.(String(Math.min(totalPages, numericPage + 1)))}
          disabled={numericPage >= totalPages}
          style={buttonStyle(numericPage >= totalPages)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export { PaginationBar };

function buttonStyle(disabled) {
  return {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--bg-alt)',
    color: 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  };
}
