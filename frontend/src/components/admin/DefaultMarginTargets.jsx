import React, { useState } from 'react';

const STORAGE_KEY = 'fbpa_margin_targets_v1';
const DEFAULTS = { targetMargin: 15, minMargin: 5, maxMargin: 30 };

function loadInitial(initial) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') return { ...DEFAULTS, ...parsed };
  } catch { /* ignore */ }
  return { ...DEFAULTS, ...initial };
}

export default function DefaultMarginTargets({ initial, onSave }) {
  const init = loadInitial(initial);
  const [targetMargin, setTargetMargin] = useState(init.targetMargin);
  const [minMargin, setMinMargin] = useState(init.minMargin);
  const [maxMargin, setMaxMargin] = useState(init.maxMargin);

  function handleSubmit(e) {
    e.preventDefault();
    const data = { targetMargin, minMargin, maxMargin };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    onSave(data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Target Margin (%)</label>
        <input type="number" value={targetMargin} min={0} max={100} onChange={e => setTargetMargin(Number(e.target.value))} required />
      </div>
      <div>
        <label>Minimum Margin (%)</label>
        <input type="number" value={minMargin} min={0} max={100} onChange={e => setMinMargin(Number(e.target.value))} required />
      </div>
      <div>
        <label>Maximum Margin (%)</label>
        <input type="number" value={maxMargin} min={0} max={100} onChange={e => setMaxMargin(Number(e.target.value))} required />
      </div>
      <button type="submit">Save</button>
    </form>
  );
}
