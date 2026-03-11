import React, { useState } from 'react';

const STORAGE_KEY = 'fbpa_currency_units_v1';
const DEFAULTS = { currency: 'USD', units: 'Imperial' };

function loadInitial(initial) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') return { ...DEFAULTS, ...parsed };
  } catch { /* ignore */ }
  return { ...DEFAULTS, ...initial };
}

export default function CurrencyUnitsForm({ initial, onSave }) {
  const init = loadInitial(initial);
  const [currency, setCurrency] = useState(init.currency);
  const [units, setUnits] = useState(init.units);

  function handleSubmit(e) {
    e.preventDefault();
    const data = { currency, units };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    onSave(data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Currency</label>
        <select value={currency} onChange={e => setCurrency(e.target.value)}>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="CAD">CAD</option>
        </select>
      </div>
      <div>
        <label>Units</label>
        <select value={units} onChange={e => setUnits(e.target.value)}>
          <option value="Imperial">Imperial</option>
          <option value="Metric">Metric</option>
        </select>
      </div>
      <button type="submit">Save</button>
    </form>
  );
}
