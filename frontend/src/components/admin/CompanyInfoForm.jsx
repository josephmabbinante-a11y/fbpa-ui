import React, { useState } from 'react';

export default function CompanyInfoForm({ initial, onSave }) {
  const [company, setCompany] = useState(initial?.company || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [mc, setMc] = useState(initial?.mc || '');
  const [dot, setDot] = useState(initial?.dot || '');
  const [ein, setEin] = useState(initial?.ein || '');
  const [billingContact, setBillingContact] = useState(initial?.billingContact || '');
  const [billingEmail, setBillingEmail] = useState(initial?.billingEmail || '');
  const [paymentTerms, setPaymentTerms] = useState(initial?.paymentTerms || 'Net 30');

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ company, address, phone, email, mc, dot, ein, billingContact, billingEmail, paymentTerms }); }}>
      <div>
        <label>Company Name</label>
        <input value={company} onChange={e => setCompany(e.target.value)} required />
      </div>
      <div>
        <label>MC Number</label>
        <input value={mc} onChange={e => setMc(e.target.value)} placeholder="MC-XXXXXXX" />
      </div>
      <div>
        <label>DOT Number</label>
        <input value={dot} onChange={e => setDot(e.target.value)} placeholder="USDOT XXXXXXX" />
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
      <div>
        <label>Tax ID / EIN</label>
        <input value={ein} onChange={e => setEin(e.target.value)} placeholder="XX-XXXXXXX" />
      </div>
      <div>
        <label>Billing Contact Name</label>
        <input value={billingContact} onChange={e => setBillingContact(e.target.value)} />
      </div>
      <div>
        <label>Billing Contact Email</label>
        <input type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} />
      </div>
      <div>
        <label>Payment Terms</label>
        <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
          <option value="Net 15">Net 15</option>
          <option value="Net 30">Net 30</option>
          <option value="Net 45">Net 45</option>
          <option value="QuickPay 2%/10">QuickPay 2%/10</option>
        </select>
      </div>
      <button type="submit">Save</button>
    </form>
  );
}
