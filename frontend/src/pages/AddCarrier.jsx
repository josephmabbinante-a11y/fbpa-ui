import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createCarrier } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';

export default function AddCarrier() {
  const { theme } = useTheme();
  const t = theme;
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    scacCode: '',
    mcNumber: '',
    taxId: '',
    dotNumber: '',
    email: '',
    phone: '',
    ext: '',
    remittanceEmail: '',
    website: '',
    branch: 'Shared',
    paymentTerms: 'Net 30',
    insuranceExpiry: '',
    status: 'Active',
    contactName: '',
    contactTitle: '',
    contactPhone: '',
    contactEmail: '',
    contactFax: '',
    privateNotes: '',
    publicNotes: '',
    equipmentTypes: [],
    lanes: '',
    preferredRegions: '',
    complianceNotes: '',
    safetyRating: 'Satisfactory',
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

  const toggleEquipmentType = (entry) => {
    setForm((prev) => {
      const current = Array.isArray(prev.equipmentTypes) ? prev.equipmentTypes : [];
      const next = current.includes(entry)
        ? current.filter((item) => item !== entry)
        : [...current, entry];
      return { ...prev, equipmentTypes: next };
    });
  };

  const handleSave = async () => {
    const nextErrors = {
      name: String(form.name || '').trim() ? '' : 'Carrier name is required.',
      email: form.email && !String(form.email).includes('@') ? 'Enter a valid email.' : '',
      scacCode: form.scacCode && !/^[A-Za-z]{2,4}$/.test(form.scacCode.trim()) ? 'SCAC must be 2–4 letters (e.g. JBHT).' : '',
    };
    setErrors(nextErrors);

    if (nextErrors.name || nextErrors.email || nextErrors.scacCode) {
      setMessage('Please resolve required fields.');
      return;
    }

    setSaving(true);
    setMessage('');

    const result = await createCarrier({
      name: form.name,
      scacCode: form.scacCode,
      mcNumber: form.mcNumber,
      taxId: form.taxId,
      email: form.email,
      phone: form.phone,
      paymentTerms: form.paymentTerms,
      insuranceExpiry: form.insuranceExpiry || null,
      status: form.status,
    });

    setSaving(false);

    if (result?.error) {
      setMessage(result.error);
      return;
    }

    navigate('/carriers', {
      state: { message: 'Carrier created successfully.' },
      replace: false,
    });
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            <Link to="/carriers" style={{ color: t.textSecondary, textDecoration: 'none' }}>Carriers</Link>
            <span>  ›  </span>
            <strong style={{ color: t.text }}>Add Carrier</strong>
          </div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 26 }}>Add Carrier</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/carriers" style={ghostBtn}>Cancel</Link>
          <button type="button" onClick={handleSave} disabled={saving} style={primaryBtn}>
            {saving ? 'Saving...' : 'Save Carrier'}
          </button>
        </div>
      </div>

      {message ? <div style={{ fontSize: 12, color: t.textSecondary }}>{message}</div> : null}

      <section style={sectionStyle}>
        <div style={headerStyle}>Carrier Details</div>
        <div style={bodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Carrier Name *</span>
              <input value={form.name} onChange={(event) => setField('name', event.target.value)} style={{ ...inputStyle, border: errors.name ? `1.5px solid ${t.error}` : inputStyle.border }} placeholder="Carrier legal name" />
              {errors.name ? <span style={{ fontSize: 11, color: t.error }}>{errors.name}</span> : null}
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Branch</span>
              <select value={form.branch} onChange={(event) => setField('branch', event.target.value)} style={inputStyle}>
                <option value="Shared">Shared</option>
                <option value="Main">Main</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>MC Number</span>
              <input value={form.mcNumber} onChange={(event) => setField('mcNumber', event.target.value)} style={inputStyle} placeholder="MC123456" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>SCAC Code</span>
              <input value={form.scacCode} onChange={(event) => setField('scacCode', event.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))} style={{ ...inputStyle, border: errors.scacCode ? `1.5px solid ${t.error}` : inputStyle.border, textTransform: 'uppercase', letterSpacing: 1 }} placeholder="JBHT" maxLength={4} />
              {errors.scacCode ? <span style={{ fontSize: 11, color: t.error }}>{errors.scacCode}</span> : <span style={{ fontSize: 10, color: t.textSecondary }}>2–4 letter Standard Carrier Alpha Code</span>}
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>DOT Number</span>
              <input value={form.dotNumber} onChange={(event) => setField('dotNumber', event.target.value)} style={inputStyle} placeholder="USDOT number" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Tax ID</span>
              <input value={form.taxId} onChange={(event) => setField('taxId', event.target.value)} style={inputStyle} placeholder="12-3456789" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Website</span>
              <input value={form.website} onChange={(event) => setField('website', event.target.value)} style={inputStyle} placeholder="https://carrier.com" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Email</span>
              <input value={form.email} onChange={(event) => setField('email', event.target.value)} style={{ ...inputStyle, border: errors.email ? `1.5px solid ${t.error}` : inputStyle.border }} placeholder="ops@carrier.com" />
              {errors.email ? <span style={{ fontSize: 11, color: t.error }}>{errors.email}</span> : null}
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Phone</span>
              <input value={form.phone} onChange={(event) => setField('phone', event.target.value)} style={inputStyle} placeholder="(555) 123-4567" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Ext</span>
              <input value={form.ext} onChange={(event) => setField('ext', event.target.value)} style={inputStyle} placeholder="Ext" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Remittance Email</span>
              <input value={form.remittanceEmail} onChange={(event) => setField('remittanceEmail', event.target.value)} style={inputStyle} placeholder="ap@carrier.com" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Payment Terms</span>
              <select value={form.paymentTerms} onChange={(event) => setField('paymentTerms', event.target.value)} style={inputStyle}>
                <option value="Net 30">Net 30</option>
                <option value="Net 21">Net 21</option>
                <option value="Net 15">Net 15</option>
                <option value="Quick Pay">Quick Pay</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Insurance Expiry</span>
              <input type="date" value={form.insuranceExpiry} onChange={(event) => setField('insuranceExpiry', event.target.value)} style={inputStyle} />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Status</span>
              <select value={form.status} onChange={(event) => setField('status', event.target.value)} style={inputStyle}>
                <option value="Active">Active</option>
                <option value="Alert">Alert</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Safety Rating</span>
              <select value={form.safetyRating} onChange={(event) => setField('safetyRating', event.target.value)} style={inputStyle}>
                <option value="Satisfactory">Satisfactory</option>
                <option value="Conditional">Conditional</option>
                <option value="Unsatisfactory">Unsatisfactory</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={headerStyle}>Carrier Contact List</div>
        <div style={bodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Name</span>
              <input value={form.contactName} onChange={(event) => setField('contactName', event.target.value)} style={inputStyle} placeholder="Contact name" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Title / Role</span>
              <input value={form.contactTitle} onChange={(event) => setField('contactTitle', event.target.value)} style={inputStyle} placeholder="Dispatch manager" />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Telephone</span>
              <input value={form.contactPhone} onChange={(event) => setField('contactPhone', event.target.value)} style={inputStyle} placeholder="(555) 123-4567" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Email</span>
              <input value={form.contactEmail} onChange={(event) => setField('contactEmail', event.target.value)} style={inputStyle} placeholder="dispatch@carrier.com" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Fax</span>
              <input value={form.contactFax} onChange={(event) => setField('contactFax', event.target.value)} style={inputStyle} placeholder="Fax" />
            </label>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={headerStyle}>Additional Carrier Info</div>
        <div style={bodyStyle}>
          <div style={{ display: 'grid', gap: 6 }}>
            <span style={labelStyle}>Equipment Types</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
              {['Dry Van', 'Reefer', 'Flatbed', 'Power Only', 'Step Deck', 'Hotshot'].map((entry) => (
                <label key={entry} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={form.equipmentTypes.includes(entry)} onChange={() => toggleEquipmentType(entry)} />
                  {entry}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Primary Lanes</span>
              <input value={form.lanes} onChange={(event) => setField('lanes', event.target.value)} style={inputStyle} placeholder="CA-TX, AZ-UT" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Preferred Regions</span>
              <input value={form.preferredRegions} onChange={(event) => setField('preferredRegions', event.target.value)} style={inputStyle} placeholder="West, Southwest" />
            </label>
          </div>

          <label style={{ display: 'grid', gap: 5 }}>
            <span style={labelStyle}>Compliance Notes</span>
            <textarea value={form.complianceNotes} onChange={(event) => setField('complianceNotes', event.target.value)} rows={3} style={{ ...inputStyle, minHeight: 78, resize: 'vertical' }} placeholder="Insurance, authority, or onboarding notes" />
          </label>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={headerStyle}>Notes (Optional)</div>
        <div style={bodyStyle}>
          <label style={{ display: 'grid', gap: 5 }}>
            <span style={labelStyle}>Private Notes</span>
            <textarea value={form.privateNotes} onChange={(event) => setField('privateNotes', event.target.value)} rows={3} style={{ ...inputStyle, minHeight: 84, resize: 'vertical' }} placeholder="Internal-only notes" />
          </label>
          <label style={{ display: 'grid', gap: 5 }}>
            <span style={labelStyle}>Public Notes</span>
            <textarea value={form.publicNotes} onChange={(event) => setField('publicNotes', event.target.value)} rows={3} style={{ ...inputStyle, minHeight: 84, resize: 'vertical' }} placeholder="Notes that can appear in carrier communications" />
          </label>
        </div>
      </section>
    </div>
  );
}