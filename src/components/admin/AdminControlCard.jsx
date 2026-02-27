import React from 'react';

function IconShell({ children }) {
  return (
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 12,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: 'rgba(24, 210, 255, 0.12)',
        color: '#d9edff',
        border: '1px solid rgba(24, 210, 255, 0.28)',
      }}
    >
      {children}
    </div>
  );
}

function Icon({ type }) {
  const svgProps = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: { display: 'block' },
  };

  if (type === 'company') {
    return (
      <IconShell>
        <svg {...svgProps}>
          <path d="M4 20h16" />
          <path d="M6 20V7l6-3 6 3v13" />
          <path d="M10 10h.01M14 10h.01M10 14h.01M14 14h.01" />
        </svg>
      </IconShell>
    );
  }

  if (type === 'users') {
    return (
      <IconShell>
        <svg {...svgProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </IconShell>
    );
  }

  if (type === 'freight') {
    return (
      <IconShell>
        <svg {...svgProps}>
          <rect x="1" y="6" width="15" height="11" rx="2" />
          <path d="M16 9h4l3 3v5h-7z" />
          <circle cx="5.5" cy="18.5" r="1.5" />
          <circle cx="18.5" cy="18.5" r="1.5" />
        </svg>
      </IconShell>
    );
  }

  if (type === 'audit') {
    return (
      <IconShell>
        <svg {...svgProps}>
          <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </IconShell>
    );
  }

  if (type === 'documents') {
    return (
      <IconShell>
        <svg {...svgProps}>
          <path d="M7 3h8l4 4v14H7z" />
          <path d="M15 3v5h5" />
          <path d="M10 13h6M10 17h6" />
        </svg>
      </IconShell>
    );
  }

  return (
    <IconShell>
      <svg {...svgProps}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 11h8M8 15h5" />
      </svg>
    </IconShell>
  );
}

export default function AdminControlCard({ icon, title, description, actions, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      style={{
        width: '100%',
        textAlign: 'left',
        borderRadius: 14,
        border: isActive ? '1px solid rgba(24, 210, 255, 0.55)' : '1px solid rgba(157, 178, 214, 0.22)',
        background: isActive
          ? 'linear-gradient(135deg, rgba(24, 210, 255, 0.18), rgba(95, 140, 255, 0.12))'
          : 'linear-gradient(170deg, rgba(18, 34, 62, 0.9), rgba(14, 26, 50, 0.92))',
        padding: 16,
        display: 'grid',
        gap: 12,
        cursor: 'pointer',
        color: '#e6efff',
        boxShadow: isActive ? '0 12px 26px rgba(6, 18, 36, 0.45)' : '0 8px 18px rgba(0, 0, 0, 0.2)',
        transition: 'background 170ms ease, border-color 170ms ease, box-shadow 170ms ease',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Icon type={icon} />
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.25 }}>{title}</h2>
          <p style={{ margin: '6px 0 0', color: '#9cb0d3', fontSize: 13, lineHeight: 1.45 }}>{description}</p>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(157, 178, 214, 0.22)',
          paddingTop: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#9cb0d3',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <span>{actions.length} controls</span>
        <span style={{ color: isActive ? '#8df2ff' : '#d5e2ff' }}>{isActive ? 'Active' : 'Select'}</span>
      </div>
    </button>
  );
}
