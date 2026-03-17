import React, { useState } from 'react';

function StopCard({ stop, onChange, onRemove }) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 8, background: '#fafafa', display: 'grid', gap: 8 }}>
      <input value={stop.address} onChange={e => onChange({ ...stop, address: e.target.value })} placeholder="Address (Google validated)" />
      <input type="date" value={stop.date} onChange={e => onChange({ ...stop, date: e.target.value })} />
      <input value={stop.appointmentTime} onChange={e => onChange({ ...stop, appointmentTime: e.target.value })} placeholder="Appointment Time" />
      <input value={stop.contact} onChange={e => onChange({ ...stop, contact: e.target.value })} placeholder="Contact" />
      <input value={stop.notes} onChange={e => onChange({ ...stop, notes: e.target.value })} placeholder="Notes" />
      <button type="button" onClick={onRemove} style={{ color: '#ff4136', fontWeight: 600 }}>Remove</button>
    </div>
  );
}

export default function StopsSection({ onComplete, setStopsData }) {
  const [stops, setStops] = useState([
    { address: '', date: '', appointmentTime: '', contact: '', notes: '' }
  ]);
  const [isComplete, setIsComplete] = useState(false);

  function handleStopChange(idx, newStop) {
    const newStops = stops.slice();
    newStops[idx] = newStop;
    setStops(newStops);
    if (setStopsData) setStopsData(newStops);
    checkComplete(newStops);
  }

  function handleAddStop() {
    const newStops = [...stops, { address: '', date: '', appointmentTime: '', contact: '', notes: '' }];
    setStops(newStops);
    if (setStopsData) setStopsData(newStops);
  }

  function handleRemoveStop(idx) {
    const newStops = stops.filter((_, i) => i !== idx);
    setStops(newStops);
    if (setStopsData) setStopsData(newStops);
    checkComplete(newStops);
  }

  function checkComplete(stopsArr) {
    // All stops must have address and date
    const valid = stopsArr.every(s => s.address && s.date);
    setIsComplete(valid);
    if (valid && onComplete) onComplete();
  }

  // Drag-and-drop reordering (simple version)
  function handleDragStart(e, idx) {
    e.dataTransfer.setData('stopIdx', idx);
  }
  function handleDrop(e, idx) {
    const fromIdx = Number(e.dataTransfer.getData('stopIdx'));
    if (fromIdx === idx) return;
    const newStops = stops.slice();
    const [moved] = newStops.splice(fromIdx, 1);
    newStops.splice(idx, 0, moved);
    setStops(newStops);
    if (setStopsData) setStopsData(newStops);
    checkComplete(newStops);
  }

  return (
    <>
      <div style={{ marginBottom: 16, background: '#f4f8ff', padding: 12, borderRadius: 6, color: '#234', fontSize: 15 }}>
        <strong>Stops Section</strong><br />
        List all pickup, delivery, and intermediate stops for this load. Include addresses, dates, appointment times, and any special instructions for each stop. Complete and precise stop information helps ensure efficient routing and on-time performance.
      </div>
      <div>
        {stops.map((stop, idx) => (
          <div key={idx} draggable onDragStart={e => handleDragStart(e, idx)} onDrop={e => handleDrop(e, idx)} onDragOver={e => e.preventDefault()}>
            <StopCard stop={stop} onChange={newStop => handleStopChange(idx, newStop)} onRemove={() => handleRemoveStop(idx)} />
          </div>
        ))}
        <button type="button" onClick={handleAddStop} style={{ marginTop: 8, fontWeight: 600 }}>+ Add Stop</button>
        {isComplete && <div style={{ color: 'green', fontWeight: 600, marginTop: 8 }}>Stops section complete</div>}
      </div>
    </>
  );
}
