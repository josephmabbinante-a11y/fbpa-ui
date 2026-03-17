import React, { useEffect, useState } from 'react';
import { getCarriers, createCarrier } from '../src/api/client';

export default function CarrierSection({ onComplete }) {
  const [carriers, setCarriers] = useState([]);
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', mcNumber: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setLoading(true);
    getCarriers()
      .then((res) => {
        if (Array.isArray(res?.carriers)) setCarriers(res.carriers);
        else setCarriers([]);
      })
      .catch(() => setCarriers([]))
      .finally(() => setLoading(false));
  }, [success]);

  const handleSelect = (e) => {
    setSelectedCarrier(e.target.value);
    setError('');
  };

  const handleComplete = () => {
    const carrierObj = carriers.find(c => (c.id || c._id) === selectedCarrier);
    if (!carrierObj) {
      setError('Please select a carrier.');
      return;
    }
    onComplete(carrierObj);
  };

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  return (
    <div>
      <h3>Carrier Assignment</h3>
      {loading ? <div>Loading carriers...</div> : null}
      <label>
        Select Carrier:
        <select value={selectedCarrier} onChange={handleSelect} style={{ marginLeft: 8 }}>
          <option value="">-- Select --</option>
          {carriers.map((c) => (
            <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
          ))}
        </select>
      </label>
      <button style={{ marginLeft: 12 }} onClick={() => setShowNew((v) => !v)}>
        {showNew ? 'Cancel' : 'Add New Carrier'}
      </button>
      {showNew && (
        <div style={{ marginTop: 12, border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
          <div>
            <input name="name" placeholder="Carrier Name" value={form.name} onChange={handleInput} />
          </div>
          <div>
            <input name="mcNumber" placeholder="MC Number" value={form.mcNumber} onChange={handleInput} />
          </div>
          <div>
            <input name="email" placeholder="Email" value={form.email} onChange={handleInput} />
          </div>
          <div>
            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleInput} />
          </div>
          <button onClick={handleCreate} disabled={loading} style={{ marginTop: 8 }}>{loading ? 'Creating...' : 'Create Carrier'}</button>
        </div>
      )}
      {selectedCarrier && carriers.find(c => (c.id || c._id) === selectedCarrier) && (
        <div style={{ marginTop: 12, background: '#f8f8f8', padding: 10, borderRadius: 6 }}>
          <b>Selected Carrier:</b> {carriers.find(c => (c.id || c._id) === selectedCarrier)?.name}<br />
          {carriers.find(c => (c.id || c._id) === selectedCarrier)?.email && <>Email: {carriers.find(c => (c.id || c._id) === selectedCarrier)?.email}<br /></>}
          {carriers.find(c => (c.id || c._id) === selectedCarrier)?.phone && <>Phone: {carriers.find(c => (c.id || c._id) === selectedCarrier)?.phone}<br /></>}
        </div>
      )}
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
      <button style={{ marginTop: 12 }} onClick={handleComplete}>Mark Carrier Complete</button>
    </div>
  );
}
          <div>
            <input name="mcNumber" placeholder="MC Number" value={form.mcNumber} onChange={handleInput} />
          </div>
          <div>
            <input name="email" placeholder="Email" value={form.email} onChange={handleInput} />
          </div>
          <div>
            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleInput} />
          </div>
          <button style={{ marginTop: 8 }} onClick={handleCreate}>Create Carrier</button>
        </div>
      )}
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
      <button style={{ marginTop: 12 }} onClick={handleComplete}>Mark Carrier Complete</button>
    </div>
  );
}
