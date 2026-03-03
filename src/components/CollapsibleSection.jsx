import { useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

export default function CollapsibleSection({ title, children, complete = false, defaultOpen = true }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <section style={{ border: `1px solid ${t.accent}`, borderRadius: 12, marginBottom: 16, background: complete ? '#e6ffe6' : t.surface }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          cursor: 'pointer',
          background: complete ? '#e6ffe6' : t.surface,
          borderBottom: `1px solid ${t.accent}`,
        }}
        onClick={() => setIsOpen((v) => !v)}
      >
        <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
        <span style={{ color: complete ? 'green' : '#aaa', fontWeight: 600, marginRight: 12 }}>
          {complete ? 'Complete' : isOpen ? 'Open' : 'Collapsed'}
        </span>
        <span style={{ fontSize: 18 }}>{isOpen ? '▼' : '▶'}</span>
      </header>
      {isOpen && <div style={{ padding: 16 }}>{children}</div>}
    </section>
  );
}
