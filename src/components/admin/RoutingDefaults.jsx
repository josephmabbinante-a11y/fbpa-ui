import React, { useState } from 'react';

export default function RoutingDefaults({ initial, onSave }) {
  const [defaultOrigin, setDefaultOrigin] = useState(initial?.defaultOrigin || '');
  const [defaultDestination, setDefaultDestination] = useState(initial?.defaultDestination || '');
  const [autoRoute, setAutoRoute] = useState(initial?.autoRoute ?? true);

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ defaultOrigin, defaultDestination, autoRoute }); }}>
      <div>
        <label>Default Origin</label>
        <input value={defaultOrigin} onChange={e => setDefaultOrigin(e.target.value)} placeholder="e.g. Chicago, IL" />
      </div>
      <div>
        <label>Default Destination</label>
        <input value={defaultDestination} onChange={e => setDefaultDestination(e.target.value)} placeholder="e.g. Dallas, TX" />
      </div>
      <div>
        <label>
          <input type="checkbox" checked={autoRoute} onChange={e => setAutoRoute(e.target.checked)} />
          Enable Auto-Routing
        </label>
      </div>
      <button type="submit">Save</button>
    </form>
  );
}
