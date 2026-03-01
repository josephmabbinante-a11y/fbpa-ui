import React from 'react';

export default function FilterBar({ filters, onChange, onReset }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
      <input
        value={filters.q}
        onChange={(e) => onChange?.({ q: e.target.value })}
        placeholder="Search customer, carrier, or load"
        style={{
          minWidth: 220,
          padding: '7px 10px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'var(--bg-alt)',
          color: 'var(--text)',
        }}
      />
      <select
        value={filters.status}
        onChange={(e) => onChange?.({ status: e.target.value })}
        style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text)' }}
      >
        <option value="">Status</option>
        <option value="open">Open</option>
        <option value="in_transit">In Transit</option>
        <option value="uncovered">Uncovered</option>
        <option value="delivered">Delivered</option>
      </select>
      <select
        value={filters.equipment}
        onChange={(e) => onChange?.({ equipment: e.target.value })}
        style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text)' }}
      >
        <option value="">Equipment</option>
        <option value="van">Van</option>
        <option value="reefer">Reefer</option>
        <option value="flatbed">Flatbed</option>
      </select>
      <button
        type="button"
        onClick={onReset}
        style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
      >
        Reset
      </button>
    </div>
  );
}
