import React, { useState } from 'react';

const STORAGE_KEY = 'fbpa_routing_defaults_v1';
const DEFAULTS = { defaultOrigin: '', defaultDestination: '', autoRoute: true };

function loadInitial(initial) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') return { ...DEFAULTS, ...parsed };
  } catch { /* ignore */ }
  return { ...DEFAULTS, ...initial };
}

export default function RoutingDefaults({ initial, onSave }) {
  const init = loadInitial(initial);
  const [defaultOrigin, setDefaultOrigin] = useState(init.defaultOrigin);
  const [defaultDestination, setDefaultDestination] = useState(init.defaultDestination);
  const [autoRoute, setAutoRoute] = useState(init.autoRoute);

  function handleSubmit(e) {
    e.preventDefault();
    const data = { defaultOrigin, defaultDestination, autoRoute };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    onSave(data);
  }

  return (
    <form onSubmit={handleSubmit}>
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
