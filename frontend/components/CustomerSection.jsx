import React, { useEffect, useState } from 'react';
import { getCustomers, createCustomer } from '../src/api/client';

export default function CustomerSection({ load, setLoad, onComplete }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCustomers()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.customers || []);
        setCustomers(list);
      })
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, [creating]);

  const handleSelect = (e) => {
    const id = e.target.value;
    setSelectedCustomerId(id);
    setError('');
    const found = customers.find(c => (c.id || c._id) === id);
    setSelectedCustomer(found || null);
    if (found) {
      setLoad(prev => ({ ...prev, customer: found }));
    }
  };

  const handleComplete = () => {
    if (!selectedCustomer) {
      setError('Please select a customer.');
      return;
    }
    setLoad(prev => ({ ...prev, customer: selectedCustomer }));
    onComplete();
  };

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleCreate = async () => {
    if (!form.name) {
      setError('Customer name is required.');
      return;
    }
    setCreating(true);
    const res = await createCustomer(form);
    if (res?.error) setError(res.error);
    else {
      setShowNew(false);
      setForm({ name: '', email: '', phone: '' });
      setSelectedCustomerId(res.id || res._id);
      setSelectedCustomer(res);
      setLoad(prev => ({ ...prev, customer: res }));
    }
    setCreating(false);
  };

  return (
    <div>
      <h3>Customer Information</h3>
      {loading ? <div>Loading customers...</div> : null}
      <label>
        Select Customer:
        <select value={selectedCustomerId} onChange={handleSelect} style={{ marginLeft: 8 }}>
          <option value="">-- Select --</option>
          {customers.map((c) => (
            <option key={c.id || c._id} value={c.id || c._id}>{c.name || c.companyName}</option>
          ))}
        </select>
      </label>
      <button style={{ marginLeft: 12 }} onClick={() => setShowNew(v => !v)}>
        {showNew ? 'Cancel' : 'Add New Customer'}
      </button>
      {showNew && (
        <div style={{ marginTop: 12, border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
          <div>
            <input name="name" placeholder="Customer Name" value={form.name} onChange={handleInput} />
          </div>
          <div>
            <input name="email" placeholder="Email" value={form.email} onChange={handleInput} />
          </div>
          <div>
            <input name="phone" placeholder="Phone" value={form.phone} onChange={handleInput} />
          </div>
          <button onClick={handleCreate} disabled={creating} style={{ marginTop: 8 }}>{creating ? 'Creating...' : 'Create Customer'}</button>
        </div>
      )}
      {selectedCustomer && (
        <div style={{ marginTop: 12, background: '#f8f8f8', padding: 10, borderRadius: 6 }}>
          <b>Selected Customer:</b> {selectedCustomer.name || selectedCustomer.companyName}<br />
          {selectedCustomer.email && <>Email: {selectedCustomer.email}<br /></>}
          {selectedCustomer.phone && <>Phone: {selectedCustomer.phone}<br /></>}
        </div>
      )}
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      <button style={{ marginTop: 12 }} onClick={handleComplete}>Mark Customer Complete</button>
    </div>
  );
}
