import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getCarriers } from '../api/client';
import { listLoads } from '../api/loadsClient';

const URGENCY_OPTIONS = ['Standard', 'Urgent', 'Critical'];
const TENDER_STATUS = ['Open', 'Tendered', 'Accepted', 'Declined', 'Expired'];

export default function CapacityBoard() {
  const { theme } = useTheme();
  const t = theme;

  const [carriers, setCarriers] = useState([]);
  const [loads, setLoads] = useState([]);
  const [query, setQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [tenders, setTenders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('opscale_tenders') || '[]'); } catch { return []; }
  });
  const [showTender, setShowTender] = useState(false);
  const [tenderForm, setTenderForm] = useState({ loadRef: '', carrierId: '', urgency: 'Standard', rate: '', expiresAt: '', notes: '' });

  useEffect(() => {
    getCarriers().then((data) => { if (Array.isArray(data)) setCarriers(data); });
    listLoads({ status: 'Available' }).then((data) => {
      const items = Array.isArray(data?.loads) ? data.loads : Array.isArray(data) ? data : [];
      setLoads(items.slice(0, 50));
    });
  }, []);

  useEffect(() => { localStorage.setItem('opscale_tenders', JSON.stringify(tenders)); }, [tenders]);

  const capacityByMode = useMemo(() => {
    const modes = {};
    carriers.forEach((c) => {
      const mode = c.equipmentType || c.mode || 'Unknown';
      if (!modes[mode]) modes[mode] = { total: 0, available: 0 };
      modes[mode].total += 1;
      if (c.status === 'Active') modes[mode].available += 1;
    });
    return Object.entries(modes).map(([mode, data]) => ({ mode, ...data }));
  }, [carriers]);

  const filteredLoads = useMemo(() => {
    const q = query.toLowerCase();
    return loads.filter((l) => {
      if (q && ![l.origin, l.destination, l.customer, l.referenceNumber, l.loadId].some((v) => String(v || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [loads, query]);

  const filteredTenders = useMemo(() => {
    return tenders.filter((td) => urgencyFilter === 'All' || td.urgency === urgencyFilter);
  }, [tenders, urgencyFilter]);

  const sectionStyle = { border: `1px solid ${t.border}`, borderRadius: 12, background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`, overflow: 'hidden' };
  const headerStyle = { padding: '10px 12px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt, fontSize: 14, fontWeight: 700 };
  const bodyStyle = { padding: 12, display: 'grid', gap: 10 };
  const inputStyle = { minHeight: 34, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '7px 10px', fontSize: 12, outline: 'none' };
  const ghostBtn = { border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 12px', cursor: 'pointer' };
  const primaryBtn = { border: `1px solid ${t.accent2 || t.accent}`, background: `linear-gradient(135deg, ${t.accent}, ${t.accent2 || t.accent})`, color: t.bg, borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 12px', cursor: 'pointer' };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: t.textSecondary };

  const handleCreateTender = () => {
    if (!tenderForm.loadRef.trim() || !tenderForm.carrierId) return;
    const carrier = carriers.find((c) => (c.id || c._id) === tenderForm.carrierId);
    setTenders((prev) => [{
      id: `tnd-${Date.now()}`,
      loadRef: tenderForm.loadRef,
      carrierName: carrier?.name || 'Unknown',
      carrierId: tenderForm.carrierId,
      urgency: tenderForm.urgency,
      rate: tenderForm.rate,
      status: 'Tendered',
      expiresAt: tenderForm.expiresAt,
      notes: tenderForm.notes,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setShowTender(false);
    setTenderForm({ loadRef: '', carrierId: '', urgency: 'Standard', rate: '', expiresAt: '', notes: '' });
  };

  const updateTenderStatus = (id, status) => {
    setTenders((prev) => prev.map((td) => td.id === id ? { ...td, status } : td));
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>Carrier Operations</div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 26 }}>Capacity Sourcing & Tender Management</h1>
        </div>
        <button type="button" style={primaryBtn} onClick={() => setShowTender(true)}>+ New Tender</button>
      </div>

      {/* Capacity by Equipment */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Carrier Capacity by Equipment Type</div>
        <div style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {capacityByMode.length === 0 && (
            <div style={{ padding: 16, color: t.textSecondary, fontSize: 12 }}>No carrier data available.</div>
          )}
          {capacityByMode.map((m) => (
            <div key={m.mode} style={{ flex: '1 1 140px', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.textSecondary, textTransform: 'uppercase' }}>{m.mode}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.accent }}>{m.available}</div>
              <div style={{ fontSize: 11, color: t.textSecondary }}>of {m.total} carriers</div>
            </div>
          ))}
        </div>
      </section>

      {/* Available Loads */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Available Loads ({filteredLoads.length})</div>
        <div style={{ padding: '8px 12px' }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search loads by origin, destination, ref…" style={{ ...inputStyle, width: '100%' }} />
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 260 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: t.bgAlt, borderBottom: `1px solid ${t.border}` }}>
                {['Ref #', 'Origin', 'Destination', 'Customer', 'Mode', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: t.textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLoads.slice(0, 20).map((l) => (
                <tr key={l.id || l._id || l.loadId} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{l.referenceNumber || l.loadId || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>{l.origin || l.pickupCity || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>{l.destination || l.deliveryCity || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>{l.customer || l.customerName || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>{l.mode || l.equipmentType || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${t.accent}18`, color: t.accent }}>{l.status || 'Available'}</span>
                  </td>
                </tr>
              ))}
              {filteredLoads.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: t.textSecondary }}>No available loads.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* New Tender Form */}
      {showTender && (
        <section style={sectionStyle}>
          <div style={headerStyle}>Create Tender</div>
          <div style={bodyStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Load Ref / ID *</span><input value={tenderForm.loadRef} onChange={(e) => setTenderForm((p) => ({ ...p, loadRef: e.target.value }))} style={inputStyle} placeholder="LD-10042" /></label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Carrier *</span>
                <select value={tenderForm.carrierId} onChange={(e) => setTenderForm((p) => ({ ...p, carrierId: e.target.value }))} style={inputStyle}>
                  <option value="">— Select Carrier —</option>
                  {carriers.map((c) => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Urgency</span>
                <select value={tenderForm.urgency} onChange={(e) => setTenderForm((p) => ({ ...p, urgency: e.target.value }))} style={inputStyle}>
                  {URGENCY_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Rate ($)</span><input value={tenderForm.rate} onChange={(e) => setTenderForm((p) => ({ ...p, rate: e.target.value }))} style={inputStyle} placeholder="3200" /></label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Expires At</span><input type="datetime-local" value={tenderForm.expiresAt} onChange={(e) => setTenderForm((p) => ({ ...p, expiresAt: e.target.value }))} style={inputStyle} /></label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Notes</span><input value={tenderForm.notes} onChange={(e) => setTenderForm((p) => ({ ...p, notes: e.target.value }))} style={inputStyle} placeholder="Instructions" /></label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={primaryBtn} onClick={handleCreateTender}>Send Tender</button>
              <button type="button" style={ghostBtn} onClick={() => setShowTender(false)}>Cancel</button>
            </div>
          </div>
        </section>
      )}

      {/* Tenders Table */}
      <section style={sectionStyle}>
        <div style={{ ...headerStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Active Tenders ({filteredTenders.length})</span>
          <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)} style={{ ...inputStyle, minHeight: 28, padding: '4px 8px' }}>
            <option value="All">All Urgency</option>
            {URGENCY_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: t.bgAlt, borderBottom: `1px solid ${t.border}` }}>
                {['Load Ref', 'Carrier', 'Rate', 'Urgency', 'Status', 'Expires', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: t.textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTenders.map((td) => (
                <tr key={td.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{td.loadRef}</td>
                  <td style={{ padding: '8px 10px' }}>{td.carrierName}</td>
                  <td style={{ padding: '8px 10px' }}>{td.rate ? `$${Number(td.rate).toLocaleString()}` : '—'}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: td.urgency === 'Critical' ? '#ef444422' : td.urgency === 'Urgent' ? '#f59e0b22' : `${t.accent}18`, color: td.urgency === 'Critical' ? '#ef4444' : td.urgency === 'Urgent' ? '#f59e0b' : t.accent }}>{td.urgency}</span>
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: td.status === 'Accepted' ? '#22c55e22' : td.status === 'Declined' ? '#ef444422' : `${t.accent}18`, color: td.status === 'Accepted' ? '#22c55e' : td.status === 'Declined' ? '#ef4444' : t.accent }}>{td.status}</span>
                  </td>
                  <td style={{ padding: '8px 10px', color: t.textSecondary, fontSize: 11 }}>{td.expiresAt ? new Date(td.expiresAt).toLocaleString() : '—'}</td>
                  <td style={{ padding: '8px 10px', display: 'flex', gap: 4 }}>
                    {td.status === 'Tendered' && (
                      <>
                        <button type="button" style={{ ...ghostBtn, padding: '3px 6px', fontSize: 10, color: '#22c55e' }} onClick={() => updateTenderStatus(td.id, 'Accepted')}>Accept</button>
                        <button type="button" style={{ ...ghostBtn, padding: '3px 6px', fontSize: 10, color: '#ef4444' }} onClick={() => updateTenderStatus(td.id, 'Declined')}>Decline</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTenders.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: t.textSecondary }}>No tenders created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
