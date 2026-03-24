import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createLocation, listLocations } from '../api/locationsClient';
import { getCustomers } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import PlaceSearchMap from '../components/PlaceSearchMap';
import { useEffect } from 'react';

export default function AddLocation() {
  const { theme } = useTheme();
  const t = theme;
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    lat: null,
    lng: null,
    branch: 'Shared',
    telephone: '',
    ext: '',
    email: '',
    website: '',
    facilityType: 'Warehouse',
    locationType: 'Pickup',
    locationCode: '',
    locationClass: '',
    role: 'None',
    status: 'Active',
    operatingHours: '',
    paymentTerms: 'Net 30',
    customerId: '',
    customerName: '',
    insidePickupDelivery: false,
    callBeforePickupDelivery: false,
    liftgateServiceNeeded: false,
    appointmentRequired: false,
    hazmatCertified: false,
    temperatureControlled: false,
    equipmentTypes: [],
    lanes: '',
    preferredRegions: '',
    dockCount: '',
    maxTrailerLength: '',
    contactName: '',
    contactTitle: '',
    contactPhone: '',
    contactEmail: '',
    contactFax: '',
    complianceNotes: '',
    privateNotes: '',
    publicNotes: '',
  });

  useEffect(() => {
    getCustomers().then((data) => {
      if (Array.isArray(data)) setCustomers(data);
    });
  }, []);

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

  const handleCustomerSelect = (customerId) => {
    const cust = customers.find((c) => (c.id || c._id) === customerId);
    setForm((prev) => ({ ...prev, customerId, customerName: cust?.name || '' }));
  };

  const handleSearch = async () => {
    const q = String(searchQuery || '').trim();
    if (!q) { setSearchMatches([]); return; }
    const result = await listLocations({ q });
    const items = Array.isArray(result?.items) ? result.items : [];
    setSearchMatches(items.slice(0, 5));
  };

  const handleUseSearchMatch = (item) => {
    setForm((prev) => ({
      ...prev,
      name: String(item?.name || prev.name),
      address: String(item?.address || prev.address),
      city: String(item?.city || prev.city),
      state: String(item?.state || prev.state),
      zip: String(item?.zip || prev.zip),
      branch: String(item?.branch || prev.branch || 'Shared'),
      locationType: String(item?.locationTypes || prev.locationType || 'Pickup'),
      locationCode: String(item?.locationCodes || item?.locationCode || prev.locationCode),
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
      setMessage('Please resolve required fields.');
      return;
    }

    setSaving(true);
    setMessage('');

    const result = await createLocation({
      name: form.name,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      lat: form.lat,
      lng: form.lng,
      type: form.facilityType,
      locationTypes: form.locationType,
      locationCode: form.locationCode,
      locationClass: form.locationClass,
      role: form.role,
      status: form.status,
      operatingHours: form.operatingHours,
      primaryContact: form.contactName,
      primaryPhone: [form.telephone, form.ext ? `ext ${form.ext}` : ''].filter(Boolean).join(' '),
      primaryEmail: form.email || form.contactEmail,
      branch: form.branch,
      customerId: form.customerId,
      customerName: form.customerName,
      paymentTerms: form.paymentTerms,
      website: form.website,
      appointmentRequired: form.appointmentRequired,
      liftgateRequired: form.liftgateServiceNeeded,
      insidePickup: form.insidePickupDelivery,
      callBeforePickupDelivery: form.callBeforePickupDelivery,
      hazmatCertified: form.hazmatCertified,
      temperatureControlled: form.temperatureControlled,
      equipmentTypes: form.equipmentTypes,
      lanes: form.lanes,
      preferredRegions: form.preferredRegions,
      dockCount: form.dockCount,
      maxTrailerLength: form.maxTrailerLength,
      complianceNotes: form.complianceNotes,
      notes: [form.privateNotes, form.publicNotes].filter(Boolean).join('\n---\n'),
    });

    setSaving(false);

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
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            <Link to="/locations" style={{ color: t.textSecondary, textDecoration: 'none' }}>Locations</Link>
            <span>  ›  </span>
            <strong style={{ color: t.text }}>Add Location</strong>
          </div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 26 }}>Add Location</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/locations" style={ghostBtn}>Cancel</Link>
          <button type="button" onClick={handleSave} disabled={saving} style={primaryBtn}>
            {saving ? 'Saving...' : 'Save Location'}
          </button>
        </div>
      </div>

      {message ? (
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          padding: '8px 12px',
          borderRadius: 8,
          border: `1px solid ${message.includes('error') || message.includes('required') || message.includes('resolve') ? t.error : t.accent}`,
          background: message.includes('error') || message.includes('required') || message.includes('resolve') ? `${t.error}18` : `${t.accent}18`,
          color: message.includes('error') || message.includes('required') || message.includes('resolve') ? t.error : t.accent,
        }}>{message}</div>
      ) : null}

      <PlaceSearchMap
        label="Location Search & Map"
        placeholder="Search address, business, or place name…"
        onPlaceSelected={useCallback((place) => {
          setForm((prev) => ({
            ...prev,
            name: place.name || prev.name,
            address: place.formattedAddress || prev.address,
            city: place.city || prev.city,
            state: place.state || prev.state,
            zip: place.zip || prev.zip,
            lat: place.lat ?? prev.lat,
            lng: place.lng ?? prev.lng,
          }));
          setMessage('Location details prefilled from map search.');
        }, [])}
      />

      {/* Existing Location Search */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Existing Location Search</div>
        <div style={bodyStyle}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
              placeholder="Search existing locations by name or address…"
              style={{ ...inputStyle, flex: '1 1 300px' }}
            />
            <button type="button" style={ghostBtn} onClick={handleSearch}>Search</button>
          </div>
          {searchMatches.length > 0 ? (
            <div style={{ display: 'grid', gap: 4 }}>
              {searchMatches.map((item) => (
                <button key={item.id} type="button" onClick={() => handleUseSearchMatch(item)} style={{ ...ghostBtn, textAlign: 'left', fontWeight: 500 }}>
                  {item.name} — {[item.address, item.city, item.state, item.zip].filter(Boolean).join(', ')}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Location Details */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Location Details</div>
        <div style={bodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Location Name *</span>
              <input value={form.name} onChange={(e) => setField('name', e.target.value)} style={{ ...inputStyle, border: errors.name ? `1.5px solid ${t.error}` : inputStyle.border }} placeholder="Warehouse, terminal, facility…" />
              {errors.name ? <span style={{ fontSize: 11, color: t.error }}>{errors.name}</span> : null}
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Location Code</span>
              <input value={form.locationCode} onChange={(e) => setField('locationCode', e.target.value.toUpperCase())} style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: 0.5 }} placeholder="e.g. CHI-WH01" maxLength={8} />
              <span style={{ fontSize: 10, color: t.textSecondary || '#888' }}>Auto-generated if left blank</span>
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Facility Type</span>
              <select value={form.facilityType} onChange={(e) => setField('facilityType', e.target.value)} style={inputStyle}>
                <option value="Warehouse">Warehouse</option>
                <option value="Terminal">Terminal</option>
                <option value="Customer">Customer</option>
                <option value="Cross Dock">Cross Dock</option>
                <option value="Distribution Center">Distribution Center</option>
                <option value="Other">Other</option>
              </select>
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
            <label style={{ display: 'grid', gap: 5, gridColumn: 'span 2' }}>
              <span style={labelStyle}>Street Address *</span>
              <input value={form.address} onChange={(e) => setField('address', e.target.value)} style={{ ...inputStyle, border: errors.address ? `1.5px solid ${t.error}` : inputStyle.border }} placeholder="123 Commerce Dr" />
              {errors.address ? <span style={{ fontSize: 11, color: t.error }}>{errors.address}</span> : null}
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>City</span>
              <input value={form.city} onChange={(e) => setField('city', e.target.value)} style={inputStyle} placeholder="City" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>State</span>
              <input value={form.state} onChange={(e) => setField('state', e.target.value)} style={inputStyle} placeholder="ST" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Zip Code</span>
              <input value={form.zip} onChange={(e) => setField('zip', e.target.value)} style={inputStyle} placeholder="00000" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Role</span>
              <select value={form.role} onChange={(e) => setField('role', e.target.value)} style={inputStyle}>
                <option value="None">None</option>
                <option value="Shipper">Shipper</option>
                <option value="Consignee">Consignee</option>
                <option value="Both">Both</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Branch</span>
              <select value={form.branch} onChange={(e) => setField('branch', e.target.value)} style={inputStyle}>
                <option value="Shared">Shared</option>
                <option value="Main">Main</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Location Class</span>
              <input value={form.locationClass} onChange={(e) => setField('locationClass', e.target.value)} style={inputStyle} placeholder="e.g. Distribution" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Email</span>
              <input value={form.email} onChange={(e) => setField('email', e.target.value)} style={inputStyle} placeholder="ops@facility.com" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Telephone</span>
              <input value={form.telephone} onChange={(e) => setField('telephone', e.target.value)} style={inputStyle} placeholder="(555) 123-4567" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Ext.</span>
              <input value={form.ext} onChange={(e) => setField('ext', e.target.value)} style={inputStyle} placeholder="Ext" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Website</span>
              <input value={form.website} onChange={(e) => setField('website', e.target.value)} style={inputStyle} placeholder="https://facility.com" />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Location Type</span>
              <select value={form.locationType} onChange={(e) => setField('locationType', e.target.value)} style={inputStyle}>
                <option value="Pickup">Pickup</option>
                <option value="Delivery">Delivery</option>
                <option value="Pickup, Delivery">Pickup & Delivery</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Operating Hours</span>
              <input value={form.operatingHours} onChange={(e) => setField('operatingHours', e.target.value)} style={inputStyle} placeholder="Mon-Fri 8am-5pm" />
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
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Customer Tag</span>
              <select value={form.customerId} onChange={(e) => handleCustomerSelect(e.target.value)} style={inputStyle}>
                <option value="">— No Customer —</option>
                {customers.map((c) => <option key={c.id || c._id} value={c.id || c._id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </label>
          </div>

          {form.lat != null && form.lng != null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: t.textSecondary }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${t.accent}18`, color: t.accent, padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                Geocoded
              </span>
              <span>{Number(form.lat).toFixed(5)}, {Number(form.lng).toFixed(5)}</span>
            </div>
          ) : null}
        </div>
      </section>

      {/* Facility Options */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Facility Options</div>
        <div style={bodyStyle}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.appointmentRequired} onChange={(e) => setField('appointmentRequired', e.target.checked)} />
              Appointment Required
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.liftgateServiceNeeded} onChange={(e) => setField('liftgateServiceNeeded', e.target.checked)} />
              Liftgate Service Needed
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.insidePickupDelivery} onChange={(e) => setField('insidePickupDelivery', e.target.checked)} />
              Inside Pickup/Delivery
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.callBeforePickupDelivery} onChange={(e) => setField('callBeforePickupDelivery', e.target.checked)} />
              Call Before Pickup/Delivery
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.hazmatCertified} onChange={(e) => setField('hazmatCertified', e.target.checked)} />
              Hazmat Certified
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.temperatureControlled} onChange={(e) => setField('temperatureControlled', e.target.checked)} />
              Temperature Controlled
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Dock Count</span>
              <input value={form.dockCount} onChange={(e) => setField('dockCount', e.target.value)} style={inputStyle} placeholder="e.g. 12" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Max Trailer Length</span>
              <input value={form.maxTrailerLength} onChange={(e) => setField('maxTrailerLength', e.target.value)} style={inputStyle} placeholder="e.g. 53 ft" />
            </label>
          </div>
        </div>
      </section>

      {/* Additional Location Info */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Additional Location Info</div>
        <div style={bodyStyle}>
          <div style={{ display: 'grid', gap: 6 }}>
            <span style={labelStyle}>Equipment Types Accepted</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
              {['Dry Van', 'Reefer', 'Flatbed', 'Power Only', 'Step Deck', 'Hotshot', 'Tanker', 'Intermodal'].map((entry) => (
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
              <input value={form.lanes} onChange={(e) => setField('lanes', e.target.value)} style={inputStyle} placeholder="CA-TX, AZ-UT" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Preferred Regions</span>
              <input value={form.preferredRegions} onChange={(e) => setField('preferredRegions', e.target.value)} style={inputStyle} placeholder="West, Southwest" />
            </label>
          </div>

          <label style={{ display: 'grid', gap: 5 }}>
            <span style={labelStyle}>Compliance Notes</span>
            <textarea value={form.complianceNotes} onChange={(e) => setField('complianceNotes', e.target.value)} rows={3} style={{ ...inputStyle, minHeight: 78, resize: 'vertical' }} placeholder="Insurance, certification, or onboarding notes" />
          </label>
        </div>
      </section>

      {/* Primary Contact */}
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
              <input value={form.contactTitle} onChange={(e) => setField('contactTitle', e.target.value)} style={inputStyle} placeholder="Dock supervisor, receiving mgr…" />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Telephone</span>
              <input value={form.contactPhone} onChange={(e) => setField('contactPhone', e.target.value)} style={inputStyle} placeholder="(555) 123-4567" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Email</span>
              <input value={form.contactEmail} onChange={(e) => setField('contactEmail', e.target.value)} style={inputStyle} placeholder="contact@facility.com" />
            </label>
            <label style={{ display: 'grid', gap: 5 }}>
              <span style={labelStyle}>Fax</span>
              <input value={form.contactFax} onChange={(e) => setField('contactFax', e.target.value)} style={inputStyle} placeholder="Fax number" />
            </label>
          </div>
        </div>
      </section>

      {/* Notes */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Notes (Optional)</div>
        <div style={bodyStyle}>
          <label style={{ display: 'grid', gap: 5 }}>
            <span style={labelStyle}>Private Notes</span>
            <textarea value={form.privateNotes} onChange={(e) => setField('privateNotes', e.target.value)} rows={3} style={{ ...inputStyle, minHeight: 84, resize: 'vertical' }} placeholder="Internal-only notes" />
          </label>
          <label style={{ display: 'grid', gap: 5 }}>
            <span style={labelStyle}>Public Notes</span>
            <textarea value={form.publicNotes} onChange={(e) => setField('publicNotes', e.target.value)} rows={3} style={{ ...inputStyle, minHeight: 84, resize: 'vertical' }} placeholder="Notes visible on BOL or communications" />
          </label>
        </div>
      </section>
    </div>
  );
}