import React from 'react';
import { useNavigate } from 'react-router-dom';

const tabs = [
  { key: 'loads', label: 'Loads', path: '/loads' },
  { key: 'rates', label: 'Rate Intelligence', path: '/rate-logic' },
  { key: 'dispatch', label: 'Dispatch Planner', path: '/shipments' },
  { key: 'billing', label: 'Billing', path: '/invoices' },
  { key: 'command', label: 'Command Center', path: '/dashboard' },
];

export default function PrimaryTabs({ active = 'loads' }) {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => navigate(tab.path)}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: active === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
            background: 'transparent',
            color: active === tab.key ? 'var(--text)' : 'var(--text-secondary)',
            fontWeight: active === tab.key ? 700 : 500,
            cursor: 'pointer',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
