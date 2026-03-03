import React from 'react';

function FilterBar({ filters, onChange, onReset, onCreateLoad, onCreateMultipleLoads }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        marginBottom: 24,
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '24px 32px',
        flexWrap: 'wrap',
        background: 'linear-gradient(160deg, var(--surface), var(--surface-strong))',
      }}
    >
      <div style={{ flex: '1 1 280px' }}>
        <input
          value={filters.q}
          onChange={(e) => onChange?.({ q: e.target.value })}
          placeholder="Search customer, carrier, or load"
          style={{
            width: '100%',
            minHeight: 40,
            padding: '0 16px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-alt)',
            color: 'var(--text)',
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(140px, 1fr))', gap: 16, flex: '1 1 520px' }}>
        <select
          value={filters.status}
          onChange={(e) => onChange?.({ status: e.target.value })}
          style={{ minHeight: 40, padding: '0 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text)' }}
        >
          <option value="">Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PRE_DISPATCH">Pre Dispatch</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="DELIVERED">Delivered</option>
          <option value="EXCEPTION">Exception</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={filters.equipment}
          onChange={(e) => onChange?.({ equipment: e.target.value })}
          style={{ minHeight: 40, padding: '0 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text)' }}
        >
          <option value="">Equipment</option>
          <option value="van">Van</option>
          <option value="reefer">Reefer</option>
          <option value="flatbed">Flatbed</option>
        </select>
        <select
          value={filters.sort || '-updatedAt'}
          onChange={(e) => onChange?.({ sort: e.target.value })}
          style={{ minHeight: 40, padding: '0 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text)' }}
        >
          <option value="-updatedAt">Newest Updated</option>
          <option value="updatedAt">Oldest Updated</option>
          <option value="-pickupAt">Latest Pickup</option>
          <option value="pickupAt">Earliest Pickup</option>
          <option value="-marginPct">Highest Margin %</option>
          <option value="marginPct">Lowest Margin %</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onReset}
          style={{ minHeight: 40, padding: '0 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}
        >
          Reset
        </button>
        {typeof onCreateLoad === 'function' && (
          <button
            type="button"
            onClick={onCreateLoad}
            style={{
              minHeight: 40,
              padding: '0 20px',
              borderRadius: 8,
              border: '1px solid var(--accent-2)',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color: 'var(--bg)',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: 'var(--hover-glow)',
            }}
          >
            + Create New Load
          </button>
        )}
        {typeof onCreateMultipleLoads === 'function' && (
          <button
            type="button"
            onClick={onCreateMultipleLoads}
            style={{
              minHeight: 40,
              padding: '0 20px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-alt)',
              color: 'var(--text)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Create Multiple
          </button>
        )}
      </div>
    </div>
  );
}

export { FilterBar };
export default FilterBar;
