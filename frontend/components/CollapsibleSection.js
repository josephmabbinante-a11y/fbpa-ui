import React, { useState } from 'react';

export default function CollapsibleSection({ title, complete, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section style={{ marginBottom: 16 }}>
      <header style={{ cursor: 'pointer', fontWeight: 700 }} onClick={() => setOpen((v) => !v)}>
        {title} {complete ? '✅' : ''}
      </header>
      {open && <div style={{ padding: 8 }}>{children}</div>}
    </section>
  );
}
