import React from 'react';

export default function EventLogCard({ events = [] }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Event Log</div>
      <div style={{ display: 'grid', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
        {events.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>No events.</div>}
        {events.map((event) => (
          <div key={event.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
            <div style={{ fontSize: 12, color: 'var(--text)' }}>{event.message}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {event.actor?.name || 'System'} • {new Date(event.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
