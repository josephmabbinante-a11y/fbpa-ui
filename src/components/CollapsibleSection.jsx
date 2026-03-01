import { useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

export default function CollapsibleSection({ title, children, defaultOpen = true, icon = '▼' }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: 24 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          color: t.text,
          transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
        }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = t.bgAlt)}
        onMouseLeave={(e) => (e.target.style.backgroundColor = t.surface)}
      >
        <span style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s ease' }}>
          {icon}
        </span>
        {title}
      </button>
      {isOpen && (
        <div style={{ marginTop: 12, paddingLeft: 8, borderLeft: `2px solid ${t.border}`, paddingBottom: 0 }}>
          {children}
        </div>
      )}
    </div>
  );
}
