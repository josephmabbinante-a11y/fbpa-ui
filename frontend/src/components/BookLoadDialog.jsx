
import React, { useState, useEffect } from 'react';

export default function BookLoadDialog({ open, onClose, onBook, carriers, load, loading }) {
  const [carrierId, setCarrierId] = useState('');
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      setCarrierId('');
      setRate('');
      setNotes('');
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!carrierId || !rate) {
      setError('Carrier and rate are required.');
      return;
    }
    try {
      await onBook({ carrierId, rate, notes });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err?.message || 'Booking failed.');
    }
  };

  const isCarriersLoading = !carriers || carriers.length === 0;
  const isSubmitDisabled = loading || isCarriersLoading || !carrierId || !rate;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 340, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
        <h2 style={{ marginBottom: 16 }}>Book Load</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ fontWeight: 600 }}>Carrier</label>
            <select value={carrierId} onChange={e => setCarrierId(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required disabled={isCarriersLoading}>
              <option value="">{isCarriersLoading ? 'Loading carriers...' : 'Select carrier'}</option>
              {carriers && carriers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600 }}>Rate</label>
            <input type="number" value={rate} onChange={e => setRate(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} required min={1} disabled={loading} />
          </div>
          <div>
            <label style={{ fontWeight: 600 }}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4 }} rows={2} disabled={loading} />
          </div>
          {error && <div style={{ color: 'red', fontSize: 13 }}>{error}</div>}
          {success && <div style={{ color: 'green', fontSize: 13 }}>Booking successful!</div>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: 'none', background: '#eee', borderRadius: 4 }} disabled={loading}>Cancel</button>
            <button type="submit" disabled={isSubmitDisabled} style={{ padding: '8px 16px', border: 'none', background: isSubmitDisabled ? '#aaa' : '#007bff', color: '#fff', borderRadius: 4, fontWeight: 600 }}>{loading ? 'Booking...' : 'Book'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
