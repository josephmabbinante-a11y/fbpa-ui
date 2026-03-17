import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { createLocation, listLocations, updateLocation } from '../api/locationsClient';
import { getCustomers } from '../api/client';

const EMPTY_FORM = {
  name: '', locationCode: '', address: '', city: '', state: '', zip: '',
  type: 'Other', role: 'None', customerId: '', customerName: '',
  primaryContact: '', primaryPhone: '', primaryEmail: '', operatingHours: '',
  notes: '', appointmentRequired: false, liftgateRequired: false, insidePickup: false,
};

export default function Locations() {
  const { theme } = useTheme();
  const t = theme || {};
  t.accent2 = t.accent2 || '#888';
  const navigate = useNavigate();
  const location = useLocation();

  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('Active');
  const LOCATION_RENDER_LIMIT = 1000;

  // Create / Edit form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ ...EMPTY_FORM });

  // Right-click context menu state
  const [rowContextMenu, setRowContextMenu] = useState(null);

  const openLocationContextMenu = (row, x, y) => {
    if (!row) return;
    const menuWidth = 240;
    const menuHeight = 200;
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 720;
    const clampedX = Math.max(8, Math.min(x, vw - menuWidth - 8));
    const clampedY = Math.max(8, Math.min(y, vh - menuHeight - 8));
    setRowContextMenu({ row, x: clampedX, y: clampedY });
  };

  useEffect(() => {
    if (!rowContextMenu) return undefined;
    const handlePointerDown = (event) => {
      if (event.target?.closest?.('[data-location-context-menu="true"]')) return;
      setRowContextMenu(null);
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setRowContextMenu(null);
    };
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [rowContextMenu]);

  const loadRows = async () => {
    setLoading(true);
    const result = await listLocations();
    setLoading(false);
    if (result?.error) { setMessage(result.error); return; }
    const items = Array.isArray(result?.items) ? result.items : Array.isArray(result) ? result : [];
    setRows(items);
  };

  const loadCustomers = async () => {
    const data = await getCustomers();
    if (Array.isArray(data)) setCustomers(data);
  };

  useEffect(() => { loadRows(); loadCustomers(); }, []);

  useEffect(() => {
    if (!location?.state?.message) return;
    setMessage(String(location.state.message));
    navigate(location.pathname, { replace: true, state: {} });
  }, [location, navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (roleFilter !== 'all' && item.role !== roleFilter) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (!q) return true;
      return [item.name, item.address, item.city, item.state, item.zip, item.locationCode, item.customerName, item.primaryContact, item.primaryPhone, item.role]
        .some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [rows, query, roleFilter, typeFilter, statusFilter]);

  const renderedLocations = useMemo(() => filtered.slice(0, LOCATION_RENDER_LIMIT), [filtered]);

  // Summary metrics
  const metrics = useMemo(() => ({
    total: rows.length,
    shippers: rows.filter((r) => r.role === 'Shipper' || r.role === 'Both').length,
    consignees: rows.filter((r) => r.role === 'Consignee' || r.role === 'Both').length,
    active: rows.filter((r) => r.status === 'Active').length,
  }), [rows]);

  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const handleCustomerSelect = (customerId) => {
    const cust = customers.find((c) => (c.id || c._id) === customerId);
    setDraft((prev) => ({ ...prev, customerId: customerId, customerName: cust?.name || '' }));
  };

  const openCreate = () => {
    setEditingId(null);
    setDraft({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setDraft({
      name: row.name || '', locationCode: row.locationCode || '', address: row.address || '',
      city: row.city || '', state: row.state || '', zip: row.zip || '',
      type: row.type || 'Other', role: row.role || 'None',
      customerId: row.customerId || '', customerName: row.customerName || '',
      primaryContact: row.primaryContact || '', primaryPhone: row.primaryPhone || '',
      primaryEmail: row.primaryEmail || '', operatingHours: row.operatingHours || '',
      notes: row.notes || '', appointmentRequired: !!row.appointmentRequired,
      liftgateRequired: !!row.liftgateRequired, insidePickup: !!row.insidePickup,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setMessage('');
    if (!draft.name.trim()) { setMessage('Name is required.'); return; }
    let result;
    if (editingId) {
      result = await updateLocation(editingId, draft);
    } else {
      result = await createLocation(draft);
    }
    if (result?.error) { setMessage(result.error); return; }
    await loadRows();
    setShowForm(false);
    setEditingId(null);
    setDraft({ ...EMPTY_FORM });
    setMessage(editingId ? 'Location updated.' : 'Location created.');
  };

  const inputStyle = {
    minHeight: 34, borderRadius: 8, border: `1px solid ${t.border}`,
    background: t.bgAlt, color: t.text, padding: '7px 10px', fontSize: 12, width: '100%', boxSizing: 'border-box',
  };
  const selectStyle = { ...inputStyle };
  const ghostBtn = {
    border: `1px solid ${t.border}`, background: t.surface, color: t.text,
    borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 12px', cursor: 'pointer',
  };
  const primaryBtn = {
    border: `1px solid ${t.accent2}`, background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
    color: t.bg, borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 12px', cursor: 'pointer',
  };

  const roleBadge = (role) => {
    const colors = { Shipper: t.accent, Consignee: t.positive || '#16a34a', Both: t.warning || '#d97706', None: t.textSecondary };
    const c = colors[role] || t.textSecondary;
    return { display: 'inline-block', padding: '3px 8px', borderRadius: 999, background: `${c}20`, color: c, fontSize: 11, fontWeight: 600, border: `1px solid ${c}40` };
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>Locations</h1>
          <div style={{ color: t.textSecondary, fontSize: 12 }}>Manage shipping origins and destinations — shippers, consignees, and customer-tagged facilities.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={ghostBtn} onClick={loadRows}>{loading ? 'Refreshing...' : 'Refresh'}</button>
          <button type="button" style={primaryBtn} onClick={openCreate}>+ Add Location</button>
        </div>
      </div>
      {message && <div style={{ color: t.textSecondary, fontSize: 12, padding: '4px 0' }}>{message}</div>}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {[['Total Locations', metrics.total], ['Shippers', metrics.shippers], ['Consignees', metrics.consignees], ['Active', metrics.active]].map(([label, value]) => (
          <div key={label} style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.surface, padding: 12 }}>
            <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <section style={{ border: `1px solid ${t.border}`, borderRadius: 12, background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{editingId ? 'Edit Location' : 'New Location'}</h2>
            <button type="button" style={ghostBtn} onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            <label style={{ fontSize: 12 }}>Name *<input value={draft.name} onChange={(e) => setField('name', e.target.value)} style={inputStyle} placeholder="Location name" /></label>
            <label style={{ fontSize: 12 }}>Location Code<input value={draft.locationCode} onChange={(e) => setField('locationCode', e.target.value)} style={inputStyle} placeholder="e.g. CHIHUB01" /></label>
            <label style={{ fontSize: 12 }}>Role
              <select value={draft.role} onChange={(e) => setField('role', e.target.value)} style={selectStyle}>
                <option value="None">None</option><option value="Shipper">Shipper</option><option value="Consignee">Consignee</option><option value="Both">Both</option>
              </select>
            </label>
            <label style={{ fontSize: 12 }}>Facility Type
              <select value={draft.type} onChange={(e) => setField('type', e.target.value)} style={selectStyle}>
                <option value="Warehouse">Warehouse</option><option value="Terminal">Terminal</option><option value="Customer">Customer</option><option value="Other">Other</option>
              </select>
            </label>
            <label style={{ fontSize: 12, gridColumn: 'span 2' }}>Street Address<input value={draft.address} onChange={(e) => setField('address', e.target.value)} style={inputStyle} placeholder="123 Commerce Dr" /></label>
            <label style={{ fontSize: 12 }}>City<input value={draft.city} onChange={(e) => setField('city', e.target.value)} style={inputStyle} /></label>
            <label style={{ fontSize: 12 }}>State<input value={draft.state} onChange={(e) => setField('state', e.target.value)} style={inputStyle} /></label>
            <label style={{ fontSize: 12 }}>Zip<input value={draft.zip} onChange={(e) => setField('zip', e.target.value)} style={inputStyle} /></label>
            <label style={{ fontSize: 12 }}>Customer Tag
              <select value={draft.customerId} onChange={(e) => handleCustomerSelect(e.target.value)} style={selectStyle}>
                <option value="">— No Customer —</option>
                {customers.map((c) => <option key={c.id || c._id} value={c.id || c._id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12 }}>Primary Contact<input value={draft.primaryContact} onChange={(e) => setField('primaryContact', e.target.value)} style={inputStyle} /></label>
            <label style={{ fontSize: 12 }}>Primary Phone<input value={draft.primaryPhone} onChange={(e) => setField('primaryPhone', e.target.value)} style={inputStyle} /></label>
            <label style={{ fontSize: 12 }}>Primary Email<input type="email" value={draft.primaryEmail} onChange={(e) => setField('primaryEmail', e.target.value)} style={inputStyle} /></label>
            <label style={{ fontSize: 12 }}>Operating Hours<input value={draft.operatingHours} onChange={(e) => setField('operatingHours', e.target.value)} style={inputStyle} placeholder="e.g. Mon-Fri 8am-5pm" /></label>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={draft.appointmentRequired} onChange={(e) => setField('appointmentRequired', e.target.checked)} /> Appointment Required</label>
            <label style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={draft.liftgateRequired} onChange={(e) => setField('liftgateRequired', e.target.checked)} /> Liftgate Required</label>
            <label style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}><input type="checkbox" checked={draft.insidePickup} onChange={(e) => setField('insidePickup', e.target.checked)} /> Inside Pickup/Delivery</label>
          </div>

          <label style={{ fontSize: 12, display: 'block', marginTop: 10 }}>Notes
            <textarea value={draft.notes} onChange={(e) => setField('notes', e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" style={ghostBtn} onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
            <button type="button" style={primaryBtn} onClick={handleSave}>{editingId ? 'Save Changes' : 'Create Location'}</button>
          </div>
        </section>
      )}

      {/* Filters & Table */}
      <section style={{ border: `1px solid ${t.border}`, borderRadius: 12, background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`, overflow: 'hidden' }}>
        <header style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, code, address, customer..." style={{ ...inputStyle, width: 280 }} />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ ...inputStyle, width: 130 }}>
              <option value="all">All Roles</option><option value="Shipper">Shipper</option><option value="Consignee">Consignee</option><option value="Both">Both</option><option value="None">None</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ ...inputStyle, width: 130 }}>
              <option value="all">All Types</option><option value="Warehouse">Warehouse</option><option value="Terminal">Terminal</option><option value="Customer">Customer</option><option value="Other">Other</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 110 }}>
              <option value="all">All Status</option><option value="Active">Active</option><option value="Inactive">Inactive</option>
            </select>
            <span style={{ color: t.textSecondary, fontSize: 12 }}>{filtered.length} locations</span>
          </div>
        </header>

        {filtered.length > renderedLocations.length && (
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${t.border}`, color: t.warning, fontSize: 12, background: t.bgAlt }}>
            Displaying first {renderedLocations.length.toLocaleString()} locations. Refine search to view more rows.
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: t.bgAlt, color: t.textSecondary }}>
                {['Code', 'Name', 'Address', 'Role', 'Type', 'Customer', 'Contact', 'Phone', 'Flags', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderedLocations.map((row) => (
                <tr
                  key={row.id}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    openLocationContextMenu(row, event.clientX, event.clientY);
                  }}
                  title="Right-click for location shortcuts"
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ padding: '8px', borderTop: `1px solid ${t.border}`, fontFamily: 'monospace', fontWeight: 600 }}>{row.locationCode || '—'}</td>
                  <td style={{ padding: '8px', borderTop: `1px solid ${t.border}`, fontWeight: 600 }}>{row.name}</td>
                  <td style={{ padding: '8px', borderTop: `1px solid ${t.border}` }}>{[row.address, row.city, row.state, row.zip].filter(Boolean).join(', ') || '—'}</td>
                  <td style={{ padding: '8px', borderTop: `1px solid ${t.border}` }}><span style={roleBadge(row.role || 'None')}>{row.role || 'None'}</span></td>
                  <td style={{ padding: '8px', borderTop: `1px solid ${t.border}` }}>{row.type || '—'}</td>
                  <td style={{ padding: '8px', borderTop: `1px solid ${t.border}` }}>{row.customerName || '—'}</td>
                  <td style={{ padding: '8px', borderTop: `1px solid ${t.border}` }}>{row.primaryContact || '—'}</td>
                  <td style={{ padding: '8px', borderTop: `1px solid ${t.border}` }}>{row.primaryPhone || '—'}</td>
                  <td style={{ padding: '8px', borderTop: `1px solid ${t.border}`, fontSize: 11 }}>
                    {[row.appointmentRequired && 'Appt', row.liftgateRequired && 'Lift', row.insidePickup && 'Inside'].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td style={{ padding: '8px', borderTop: `1px solid ${t.border}` }}>
                    <button type="button" style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11 }} onClick={() => openEdit(row)}>Edit</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ padding: 16, textAlign: 'center', borderTop: `1px solid ${t.border}`, color: t.textSecondary }}>No locations found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Right-click context menu */}
      {rowContextMenu?.row && (
        <div
          role="menu"
          data-location-context-menu="true"
          style={{
            position: 'fixed',
            top: rowContextMenu.y,
            left: rowContextMenu.x,
            zIndex: 1200,
            minWidth: 240,
            borderRadius: 10,
            border: `1px solid ${t.border}`,
            background: t.surface,
            boxShadow: '0 14px 30px rgba(0,0,0,0.3)',
            padding: 8,
            display: 'grid',
            gap: 6,
          }}
        >
          <button
            type="button"
            onClick={() => { openEdit(rowContextMenu.row); setRowContextMenu(null); }}
            style={{ ...ghostBtn, minHeight: 34, textAlign: 'left', padding: '6px 12px' }}
          >
            View / Edit Location
          </button>
          <button
            type="button"
            onClick={() => { openCreate(); setRowContextMenu(null); }}
            style={{ ...ghostBtn, minHeight: 34, textAlign: 'left', padding: '6px 12px' }}
          >
            + Create New Location
          </button>
          <hr style={{ border: 'none', borderTop: `1px solid ${t.border}`, margin: '2px 0' }} />
          <button
            type="button"
            onClick={() => { loadRows(); setRowContextMenu(null); }}
            style={{ ...ghostBtn, minHeight: 34, textAlign: 'left', padding: '6px 12px' }}
          >
            Refresh Locations
          </button>
        </div>
      )}
    </div>
  );
}
