import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createCustomer } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import PlaceSearchMap from '../components/PlaceSearchMap';

export default function AddCustomer() {
  const { theme } = useTheme();
  const t = theme;
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    industry: '',
    taxId: '',
    billingAddress: '',
    status: 'Active',
    contactName: '',
    contactTitle: '',
    contactPhone: '',
    contactEmail: '',
    paymentTerms: 'Net 30',
    creditLimit: '',
    privateNotes: '',
    publicNotes: '',
  });

  const sectionStyle = {
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`,
    overflow: 'hidden',
  };

  const headerStyle = {
    padding: '10px 12px',
    borderBottom: `1px solid ${t.border}`,
    background: t.bgAlt,
    fontSize: 14,
    fontWeight: 700,
  };

  const bodyStyle = {
    padding: 12,
    display: 'grid',
    gap: 10,
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: t.textSecondary,
  };

  const inputStyle = {
    minHeight: 34,
    borderRadius: 8,
    border: `1px solid ${t.border}`,
    background: t.bgAlt,
    color: t.text,
    padding: '7px 10px',
    fontSize: 12,
    outline: 'none',
  };

  const ghostBtn = {
    border: `1px solid ${t.border}`,
    background: t.surface,
    color: t.text,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    padding: '8px 12px',
    cursor: 'pointer',
    textDecoration: 'none',
  };

  const primaryBtn = {
    border: `1px solid ${t.accent2}`,
    background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
    color: t.bg,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    padding: '8px 12px',
    cursor: 'pointer',
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSave = async () => {
    const nextErrors = {
      name: String(form.name || '').trim() ? '' : 'Customer name is required.',
      email: form.email && !String(form.email).includes('@') ? 'Enter a valid email.' : '',
    };
    setErrors(nextErrors);

    if (nextErrors.name || nextErrors.email) {
      setMessage('Please resolve required fields.');
      return;
    }

    setSaving(true);
    setMessage('');

    const result = await createCustomer({
      name: form.name,
      contact: form.company,
      email: form.email,
      phone: form.phone,
      industry: form.industry,
      taxId: form.taxId,
      address: form.billingAddress,
      status: form.status,
    });

    setSaving(false);

    if (result?.error) {
      setMessage(result.error);
      return;
    }

    navigate('/customers', {
      state: { message: 'Customer created successfully.' },
      replace: false,
    });
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            <Link to="/customers" style={{ color: t.textSecondary, textDecoration: 'none' }}>Customers</Link>
            <span>  ›  </span>
            <strong style={{ color: t.text }}>Add Customer</strong>
          </div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 26 }}>Add Customer</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/customers" style={ghostBtn}>Cancel</Link>
          <button type="button" onClick={handleSave} disabled={saving} style={primaryBtn}>
            {saving ? 'Saving...' : 'Save Customer'}
          </button>
        </div>
      </div>

      {message ? <div style={{ fontSize: 12, color: t.textSecondary }}>{message}</div> : null}

      <PlaceSearchMap
        label="Customer Search & Map"
        placeholder="Search customer name, address, or HQ…"
        onPlaceSelected={useCallback((place) => {
          setForm((prev) => ({
            ...prev,
            name: place.name || prev.name,
            company: place.name || prev.company,
            billingAddress: place.formattedAddress || prev.billingAddress,
          }));
          setMessage('Customer details prefilled from map search.');
        }, [])}
      />

      <section style={sectionStyle}>
        <div style={headerStyle}>Customer Details</div>
        <div style={bodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Customer Name *</span>
              <input value={form.name} onChange={(e) => setField('name', e.target.value)} style={{ ...inputStyle, border: errors.name ? `1.5px solid ${t.error}` : inputStyle.border }} placeholder="Customer legal name" />
              {errors.name ? <span style={{ fontSize: 11, color: t.error }}>{errors.name}</span> : null}
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Company</span>
              <input value={form.company} onChange={(e) => setField('company', e.target.value)} style={inputStyle} placeholder="Company name" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Industry</span>
              <input value={form.industry} onChange={(e) => setField('industry', e.target.value)} style={inputStyle} placeholder="e.g. Manufacturing" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Status</span>
              <select value={form.status} onChange={(e) => setField('status', e.target.value)} style={inputStyle}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Email</span>
              <input value={form.email} onChange={(e) => setField('email', e.target.value)} style={{ ...inputStyle, border: errors.email ? `1.5px solid ${t.error}` : inputStyle.border }} placeholder="billing@company.com" />
              {errors.email ? <span style={{ fontSize: 11, color: t.error }}>{errors.email}</span> : null}
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Phone</span>
              <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} style={inputStyle} placeholder="(555) 123-4567" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Tax ID</span>
              <input value={form.taxId} onChange={(e) => setField('taxId', e.target.value)} style={inputStyle} placeholder="12-3456789" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Payment Terms</span>
              <select value={form.paymentTerms} onChange={(e) => setField('paymentTerms', e.target.value)} style={inputStyle}>
                <option value="Net 30">Net 30</option>
                <option value="Net 21">Net 21</option>
                <option value="Net 15">Net 15</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Billing Address</span>
              <input value={form.billingAddress} onChange={(e) => setField('billingAddress', e.target.value)} style={inputStyle} placeholder="123 Main St, City, ST 00000" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Credit Limit</span>
              <input value={form.creditLimit} onChange={(e) => setField('creditLimit', e.target.value)} style={inputStyle} placeholder="$50,000" />
            </label>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={headerStyle}>Primary Contact</div>
        <div style={bodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Name</span>
              <input value={form.contactName} onChange={(e) => setField('contactName', e.target.value)} style={inputStyle} placeholder="Contact name" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Title / Role</span>
              <input value={form.contactTitle} onChange={(e) => setField('contactTitle', e.target.value)} style={inputStyle} placeholder="Logistics manager" />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Telephone</span>
              <input value={form.contactPhone} onChange={(e) => setField('contactPhone', e.target.value)} style={inputStyle} placeholder="(555) 123-4567" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Email</span>
              <input value={form.contactEmail} onChange={(e) => setField('contactEmail', e.target.value)} style={inputStyle} placeholder="contact@company.com" />
            </label>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={headerStyle}>Notes (Optional)</div>
        <div style={bodyStyle}>
          <label style={{ display: 'grid', gap: 5 }}>
            <span style={labelStyle}>Private Notes</span>
            <textarea value={form.privateNotes} onChange={(e) => setField('privateNotes', e.target.value)} rows={3} style={{ ...inputStyle, minHeight: 84, resize: 'vertical' }} placeholder="Internal-only notes" />
          </label>
          <label style={{ display: 'grid', gap: 5 }}>
            <span style={labelStyle}>Public Notes</span>
            <textarea value={form.publicNotes} onChange={(e) => setField('publicNotes', e.target.value)} rows={3} style={{ ...inputStyle, minHeight: 84, resize: 'vertical' }} placeholder="Notes visible on invoices or communications" />
          </label>
        </div>
      </section>
    </div>
  );
}
