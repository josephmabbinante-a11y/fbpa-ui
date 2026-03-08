import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { createLocation, listLocations } from '../api/locationsClient';

export default function Locations() {
  const { theme } = useTheme();
  const t = theme || {};
  // Fallback for accent2
  t.accent2 = t.accent2 || '#888';
  const navigate = useNavigate();
  const location = useLocation();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const LOCATION_RENDER_LIMIT = 1000;
  const [draft, setDraft] = useState({
    name: '',
    address: '',
    locationTypes: 'Pickup',
    locationCodes: '',
    primaryContact: '',
    primaryPhone: '',
    branch: 'Shared',
  });

  const loadRows = async () => {
    setLoading(true);
    const result = await listLocations();
    setLoading(false);

    if (result?.error) {
      setMessage(result.error);
      return;
    }

    const items = Array.isArray(result?.items) ? result.items : [];
    setRows(items);
  };

  useEffect(() => {
    loadRows();
  }, []);

  useEffect(() => {
    if (!location?.state?.message) return;
    setMessage(String(location.state.message));
    navigate(location.pathname, { replace: true, state: {} });
  }, [location, navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((item) =>
      [
        item.name,
        item.address,
        item.locationTypes,
        item.locationCodes,
        item.primaryContact,
        item.primaryPhone,
        item.branch,
      ].some((value) => String(value || '').toLowerCase().includes(q))
    );
  }, [rows, query]);

  const renderedLocations = useMemo(
    () => filtered.slice(0, LOCATION_RENDER_LIMIT),
    [filtered]
  );

  const inputStyle = {
    minHeight: 34,
    borderRadius: 8,
    border: `1px solid ${t.border}`,
    background: t.bgAlt,
    color: t.text,
    padding: '7px 10px',
    fontSize: 12,
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

  const handleCreate = async () => {
    setMessage('');
    const result = await createLocation({
      name: draft.name,
      address: draft.address,
      locationTypes: draft.locationTypes,
      locationCodes: draft.locationCodes,
      primaryContact: draft.primaryContact,
      primaryPhone: draft.primaryPhone,
      branch: draft.branch,
    });

    if (result?.error) {
      setMessage(result.error);
      return;
    }

    await loadRows();
    setDraft({
      name: '',
      address: '',
      locationTypes: 'Pickup',
      locationCodes: '',
      primaryContact: '',
      primaryPhone: '',
      branch: 'Shared',
    });
    setShowCreate(false);
    setMessage('Location created.');
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26 }}>Locations</h1>
        <div style={{ color: t.textSecondary, fontSize: 12 }}>View and manage locations for your organization.</div>
        {message && <div style={{ color: t.textSecondary, fontSize: 12, marginTop: 4 }}>{message}</div>}
      </div>

      <section
        style={{
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`,
          overflow: 'hidden',
        }}
      >
        <header style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, flexWrap: 'wrap', minHeight: -52 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search locations..."
                style={{ ...inputStyle, width: 280 }}
              />
              <span style={{ color: t.textSecondary, fontSize: 12 }}>{filtered.length} locations</span>
              {loading && <span style={{ color: t.textSecondary, fontSize: 12 }}>Loading...</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" style={ghostBtn} onClick={() => setShowCreate((value) => !value)}>
                {showCreate ? 'Close' : 'Quick Add'}
              </button>
              <button type="button" style={ghostBtn} onClick={() => navigate('/locations/new')}>
                Add New Location Page
              </button>
              <button type="button" style={primaryBtn}>Bulk Import</button>
            </div>
          </div>
        </header>

        {showCreate && (
          <div style={{ padding: 12, borderBottom: `1px solid ${t.border}`, background: t.bgAlt }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
              <input value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="Location name" style={inputStyle} />
              <input value={draft.locationCodes} onChange={(event) => setDraft((prev) => ({ ...prev, locationCodes: event.target.value }))} placeholder="Location code" style={inputStyle} />
              <input value={draft.primaryContact} onChange={(event) => setDraft((prev) => ({ ...prev, primaryContact: event.target.value }))} placeholder="Primary contact" style={inputStyle} />
              <input value={draft.primaryPhone} onChange={(event) => setDraft((prev) => ({ ...prev, primaryPhone: event.target.value }))} placeholder="Primary phone" style={inputStyle} />
              <input
                value={draft.address}
                onChange={(event) => setDraft((prev) => ({ ...prev, address: event.target.value }))}
                placeholder="Street, City, State Zip"
                style={{ ...inputStyle, gridColumn: 'span 2' }}
              />
              <select value={draft.locationTypes} onChange={(event) => setDraft((prev) => ({ ...prev, locationTypes: event.target.value }))} style={inputStyle}>
                <option value="Pickup">Pickup</option>
                <option value="Delivery">Delivery</option>
                <option value="Pickup, Delivery">Pickup, Delivery</option>
              </select>
              <select value={draft.branch} onChange={(event) => setDraft((prev) => ({ ...prev, branch: event.target.value }))} style={inputStyle}>
                <option value="Shared">Shared</option>
                <option value="Main">Main</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" style={primaryBtn} onClick={handleCreate}>Save Location</button>
            </div>
          </div>
        )}

        {filtered.length > renderedLocations.length && (
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${t.border}`, color: t.warning, fontSize: 12, background: t.bgAlt }}>
            Displaying first {renderedLocations.length.toLocaleString()} locations. Refine search to view more rows.
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
            <thead>
              <tr style={{ background: t.bgAlt, color: t.textSecondary }}>
                <th style={{ padding: 10, textAlign: 'left' }}>Name</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Address</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Location Type(s)</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Location Code(s)</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Savings Rate(%)</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Primary Contact</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Primary Phone</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Branch</th>
              </tr>
            </thead>
            <tbody>
              {renderedLocations.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{row.name}</td>
                  <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{row.address}</td>
                  <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{row.locationTypes}</td>
                  <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{row.locationCodes}</td>
                  <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{row.savingsRate}</td>
                  <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{row.primaryContact}</td>
                  <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{row.primaryPhone || '—'}</td>
                  <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{row.branch}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 16, textAlign: 'center', borderTop: `1px solid ${t.border}`, color: t.textSecondary }}>
                    No locations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
