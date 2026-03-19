import React from 'react';

const SUB_TABS = [
  { key: 'all', label: 'All' },
  { key: 'my', label: 'My Loads' },
  { key: 'uncovered', label: 'Uncovered' },
  { key: 'posted', label: 'Posted to Board' },
  { key: 'at_risk', label: 'At Risk' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'void', label: 'Void' },
];

export default function SubTabs({ activeTab = 'all', onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
      {SUB_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange?.(tab.key)}
          style={{
            border: '1px solid var(--border)',
            background: activeTab === tab.key ? 'var(--bg-alt)' : 'transparent',
            color: activeTab === tab.key ? 'var(--text)' : 'var(--text-secondary)',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: activeTab === tab.key ? 700 : 500,
            cursor: 'pointer',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export { SubTabs };
