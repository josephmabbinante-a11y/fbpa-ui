import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createLocation, listLocations } from '../api/locationsClient';
import { useTheme, themes } from '../contexts/ThemeContext';

export default function AddLocation() {
  const { theme } = useTheme();
  const t = theme;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState([]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '',
    address: '',
    branch: 'Shared',
    telephone: '',
    ext: '',
    locationType: 'Pickup',
    locationCode: '',
    locationClass: '',
    insidePickupDelivery: false,
    callBeforePickupDelivery: false,
    liftgateServiceNeeded: false,
    appointmentRequired: false,
    contactName: '',
    contactTitle: '',
    contactPhone: '',
    contactEmail: '',
    contactFax: '',
    privateNotes: '',
    publicNotes: '',
  });

  const sectionStyle = useMemo(() => ({
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`,
    overflow: 'hidden',
    boxShadow: '0 10px 24px rgba(0,0,0,0.14)',
  }), [t.border, t.surface, t.surfaceStrong]);

  const sectionHeaderStyle = {
    padding: '10px 12px',
    borderBottom: `1px solid ${t.border}`,
    background: t.bgAlt,
    fontWeight: 700,
    fontSize: 14,
  };

  const sectionBodyStyle = {
    padding: 12,
    display: 'grid',
    gap: 10,
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: t.textSecondary,
    letterSpacing: 0.2,
  };

  const inputStyle = {
    minHeight: 36,
    borderRadius: 10,
    border: `1px solid ${t.border}`,
    background: t.bgAlt,
    color: t.text,
    padding: '7px 10px',
    fontSize: 12,
    outline: 'none',
  };

  const cardInput = (hasError) => ({
    ...inputStyle,
    border: hasError ? `1.5px solid ${t.error}` : inputStyle.border,
    background: hasError ? t.surface : inputStyle.background,
  });

  const primaryBtn = {
    border: `1px solid ${t.accent2}`,
    background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
    color: t.bg,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    minHeight: 36,
    padding: '8px 12px',
    cursor: 'pointer',
  };

  const ghostBtn = {
    border: `1px solid ${t.border}`,
    background: t.surface,
    color: t.text,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    minHeight: 36,
    padding: '8px 12px',
    cursor: 'pointer',
    textDecoration: 'none',
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSearch = async () => {
    const q = String(searchQuery || '').trim();
    if (!q) {
      setSearchMatches([]);
      return;
    }
    const result = await listLocations({ q });
    const items = Array.isArray(result?.items) ? result.items : [];
    setSearchMatches(items.slice(0, 5));
  };

  const handleUseSearchMatch = (item) => {
    setForm((prev) => ({
      ...prev,
      name: String(item?.name || prev.name),
      address: String(item?.address || prev.address),
      branch: String(item?.branch || prev.branch || 'Shared'),
      locationType: String(item?.locationTypes || prev.locationType || 'Pickup'),
      locationCode: String(item?.locationCodes || prev.locationCode),
      contactName: String(item?.primaryContact || prev.contactName),
      contactPhone: String(item?.primaryPhone || prev.contactPhone),
    }));
    setMessage('Location details prefilled from search result.');
  };

  const handleSave = async () => {
    const nextErrors = {
      name: String(form.name || '').trim() ? '' : 'Location name is required.',
      address: String(form.address || '').trim() ? '' : 'Location address is required.',
    };
    setErrors(nextErrors);

    if (nextErrors.name || nextErrors.address) {
      setMessage('Please complete required fields.');
      return;
    }

    setLoading(true);
    setMessage('');

    const result = await createLocation({
      name: form.name,
      address: form.address,
      locationTypes: form.locationType,
      locationCodes: form.locationCode,
      primaryContact: form.contactName,
      primaryPhone: [form.contactPhone, form.ext ? `ext ${form.ext}` : ''].filter(Boolean).join(' '),
      branch: form.branch,
    });

    setLoading(false);

    if (result?.error) {
      setMessage(result.error);
      return;
    }

    navigate('/locations', {
      state: { message: 'Location created successfully.' },
      replace: false,
    });
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            <Link to="/locations" style={{ color: t.textSecondary, textDecoration: 'none' }}>Locations</Link>
            <span>  ›  </span>
            <strong style={{ color: t.text }}>New Location</strong>
          </div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 26 }}>Add Location</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/locations" style={ghostBtn}>Cancel</Link>
          <button type="button" style={primaryBtn} disabled={loading} onClick={handleSave}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {message ? (
        <div style={{ fontSize: 12, color: t.textSecondary, border: `1px solid ${t.border}`, borderRadius: 10, padding: '8px 10px', background: t.bgAlt }}>
          {message}
        </div>
      ) : null}

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>Location Search</div>
        <div style={sectionBodyStyle}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={labelStyle}>Search for a Location</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Enter a location name and/or address"
              style={{ ...inputStyle, minWidth: 260, flex: '1 1 320px' }}
            />
            <button type="button" style={ghostBtn} onClick={handleSearch}>Search</button>
          </div>
          {searchMatches.length > 0 ? (
            <div style={{ display: 'grid', gap: 6 }}>
              {searchMatches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleUseSearchMatch(item)}
                  style={{ ...ghostBtn, textAlign: 'left', fontWeight: 500 }}
                >
                  {item.name} — {item.address}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>Location Address</div>
        <div style={sectionBodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Name of Location *</span>
              <input value={form.name} onChange={(event) => setField('name', event.target.value)} style={cardInput(Boolean(errors.name))} placeholder="Location Name" />
              {errors.name ? <span style={{ color: t.error, fontSize: 11 }}>{errors.name}</span> : null}
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Branch</span>
              <select value={form.branch} onChange={(event) => setField('branch', event.target.value)} style={inputStyle}>
                <option value="Shared">Shared</option>
                <option value="Main">Main</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'grid', gap: 5 }}>
            <span style={labelStyle}>Location Address *</span>
            <textarea value={form.address} onChange={(event) => setField('address', event.target.value)} rows={3} style={{ ...cardInput(Boolean(errors.address)), minHeight: 84, resize: 'vertical' }} placeholder="Address" />
            {errors.address ? <span style={{ color: t.error, fontSize: 11 }}>{errors.address}</span> : null}
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Telephone</span>
              <input value={form.telephone} onChange={(event) => setField('telephone', event.target.value)} style={inputStyle} placeholder="Telephone" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Ext.</span>
              <input value={form.ext} onChange={(event) => setField('ext', event.target.value)} style={inputStyle} placeholder="Ext" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Location Type</span>
              <select value={form.locationType} onChange={(event) => setField('locationType', event.target.value)} style={inputStyle}>
                <option value="Pickup">Pickup</option>
                <option value="Delivery">Delivery</option>
                <option value="Pickup, Delivery">Pickup, Delivery</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Location Code</span>
              <input value={form.locationCode} onChange={(event) => setField('locationCode', event.target.value)} style={inputStyle} placeholder="Location Code" />
            </label>
          </div>

          <label style={{ display: 'grid', gap: 5 }}>
            <span style={labelStyle}>Location Class</span>
            <input value={form.locationClass} onChange={(event) => setField('locationClass', event.target.value)} style={inputStyle} placeholder="Location Class" />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, fontSize: 12 }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={form.liftgateServiceNeeded} onChange={(event) => setField('liftgateServiceNeeded', event.target.checked)} />
              Liftgate Service Needed
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={form.insidePickupDelivery} onChange={(event) => setField('insidePickupDelivery', event.target.checked)} />
              Inside Pickup/Delivery
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={form.appointmentRequired} onChange={(event) => setField('appointmentRequired', event.target.checked)} />
              Appointment Required
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={form.callBeforePickupDelivery} onChange={(event) => setField('callBeforePickupDelivery', event.target.checked)} />
              Call Before Pickup/Delivery
            </label>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>Location Contact List</div>
        <div style={sectionBodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Name</span>
              <input value={form.contactName} onChange={(event) => setField('contactName', event.target.value)} style={inputStyle} placeholder="Contact Name" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Title / Role / Position / Dept.</span>
              <input value={form.contactTitle} onChange={(event) => setField('contactTitle', event.target.value)} style={inputStyle} placeholder="Contact Title / Role / Position / Dept." />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              <label style={{ display: 'grid', gap: 5 }}>
                <span style={labelStyle}>Telephone & Ext.</span>
                <input value={form.contactPhone} onChange={(event) => setField('contactPhone', event.target.value)} style={inputStyle} placeholder="Telephone" />
              </label>
              <label style={{ display: 'grid', gap: 5 }}>
                <span style={labelStyle}>Fax</span>
                <input value={form.contactFax} onChange={(event) => setField('contactFax', event.target.value)} style={inputStyle} placeholder="Fax" />
              </label>
            </div>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Email</span>
              <input value={form.contactEmail} onChange={(event) => setField('contactEmail', event.target.value)} style={inputStyle} placeholder="Email address" />
            </label>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>Notes (Optional)</div>
        <div style={sectionBodyStyle}>
          <label style={{ display: 'grid', gap: 5 }}>
            <span style={labelStyle}>Private Notes</span>
            <textarea value={form.privateNotes} onChange={(event) => setField('privateNotes', event.target.value)} rows={3} style={{ ...inputStyle, minHeight: 84, resize: 'vertical' }} placeholder="Private Notes" />
          </label>
          <label style={{ display: 'grid', gap: 5 }}>
            <span style={labelStyle}>Public Notes</span>
            <textarea value={form.publicNotes} onChange={(event) => setField('publicNotes', event.target.value)} rows={3} style={{ ...inputStyle, minHeight: 84, resize: 'vertical' }} placeholder="Public Notes" />
          </label>
        </div>
      </section>
    </div>
  );
}