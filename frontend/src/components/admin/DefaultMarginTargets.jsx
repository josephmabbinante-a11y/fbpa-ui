import React, { useState } from 'react';

export default function DefaultMarginTargets({ initial, onSave }) {
  const [targetMargin, setTargetMargin] = useState(initial?.targetMargin || 15);
  const [minMargin, setMinMargin] = useState(initial?.minMargin || 5);
  const [maxMargin, setMaxMargin] = useState(initial?.maxMargin || 30);

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ targetMargin, minMargin, maxMargin }); }}>
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
