import React, { useState } from 'react';

export default function CompanyInfoForm({ initial, onSave }) {
  const [company, setCompany] = useState(initial?.company || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [email, setEmail] = useState(initial?.email || '');

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ company, address, phone, email }); }}>
      <div>
        <label>Company Name</label>
        <input value={company} onChange={e => setCompany(e.target.value)} required />
      </div>
      <div>
        <label>Address</label>
        <input value={address} onChange={e => setAddress(e.target.value)} />
      </div>
      <div>
        <label>Phone</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <div>
        <label>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <button type="submit">Save</button>
    </form>
  );
}
