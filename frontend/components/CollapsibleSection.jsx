import React, {useState} from 'react';

export default function CollapsibleSection({ title, complete, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section style={{ marginBottom: 12, border: '1px solid #dbeafe', borderRadius: 8, background: '#f4f8ff' }}>
      <header
        style={{
          cursor:'pointer',
          fontWeight: 700,
          margin: 0,
          padding: '12px 16px',
          background: '#e0eaff',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderBottom: '1px solid #dbeafe',
        }}
        onClick={() => setOpen((v) => !v)}
      >
        {title} {complete ? '✅' : ''}
      </header>
      {open && (
        <div style={{ margin: 0, padding: '16px' }}>
          {children}
        </div>
      )}
    </section>
  );
}
