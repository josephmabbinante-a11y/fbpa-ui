import React, { useState } from 'react';

export default function CurrencyUnitsForm({ initial, onSave }) {
  const [currency, setCurrency] = useState(initial?.currency || 'USD');
  const [units, setUnits] = useState(initial?.units || 'Imperial');

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ currency, units }); }}>
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
