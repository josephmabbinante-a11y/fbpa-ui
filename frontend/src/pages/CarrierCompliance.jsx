import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getCarriers } from '../api/client';

const DOC_TYPES = ['Insurance - Auto', 'Insurance - Cargo', 'Insurance - General', 'W-9', 'Operating Authority', 'IFTA License', 'ELM Certificate', 'Drug & Alcohol Policy', 'Other'];
const SAFETY_RATINGS = ['Satisfactory', 'Conditional', 'Unsatisfactory', 'Not Rated'];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function complianceScore(carrier) {
  let score = 0;
  let total = 0;
  const checks = [
    { key: 'mcNumber', weight: 20 },
    { key: 'taxId', weight: 10 },
    { key: 'insuranceExpiry', weight: 30, dateCheck: true },
    { key: 'dotNumber', weight: 15 },
    { key: 'safetyRating', weight: 25 },
  ];
  checks.forEach((c) => {
    total += c.weight;
    const val = carrier[c.key];
    if (c.dateCheck) {
      const days = daysUntil(val);
      if (days !== null && days > 0) score += c.weight;
    } else if (val && val !== 'Unsatisfactory' && val !== 'Not Rated') {
      score += c.weight;
    }
  });
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

export default function CarrierCompliance() {
  const { theme } = useTheme();
  const t = theme;

  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [documents, setDocuments] = useState(() => {
    try { return JSON.parse(localStorage.getItem('opscale_compliance_docs') || '[]'); } catch { return []; }
  });
  const [docForm, setDocForm] = useState({ carrierId: '', type: DOC_TYPES[0], expiresAt: '', verified: false, notes: '' });
  const [showDocForm, setShowDocForm] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCarriers().then((data) => {
      if (Array.isArray(data)) setCarriers(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { localStorage.setItem('opscale_compliance_docs', JSON.stringify(documents)); }, [documents]);

  const enrichedCarriers = useMemo(() => {
    return carriers.map((c) => ({
      ...c,
      _score: complianceScore(c),
      _insuranceDays: daysUntil(c.insuranceExpiry),
      _docCount: documents.filter((d) => d.carrierId === (c.id || c._id)).length,
    }));
  }, [carriers, documents]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return enrichedCarriers.filter((c) => {
      if (statusFilter === 'Expiring' && (c._insuranceDays === null || c._insuranceDays > 30)) return false;
      if (statusFilter === 'Expired' && (c._insuranceDays === null || c._insuranceDays > 0)) return false;
      if (statusFilter === 'Compliant' && c._score < 80) return false;
      if (statusFilter === 'Non-Compliant' && c._score >= 80) return false;
      if (q && ![c.name, c.mcNumber, c.dotNumber, c.email].some((v) => String(v || '').toLowerCase().includes(q))) return false;
      return true;
    }).sort((a, b) => a._score - b._score);
  }, [enrichedCarriers, query, statusFilter]);

  const summary = useMemo(() => {
    const total = enrichedCarriers.length;
    const compliant = enrichedCarriers.filter((c) => c._score >= 80).length;
    const expiringSoon = enrichedCarriers.filter((c) => c._insuranceDays !== null && c._insuranceDays > 0 && c._insuranceDays <= 30).length;
    const expired = enrichedCarriers.filter((c) => c._insuranceDays !== null && c._insuranceDays <= 0).length;
    return { total, compliant, expiringSoon, expired };
  }, [enrichedCarriers]);

  const sectionStyle = { border: `1px solid ${t.border}`, borderRadius: 12, background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`, overflow: 'hidden' };
  const headerStyle = { padding: '10px 12px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt, fontSize: 14, fontWeight: 700 };
  const bodyStyle = { padding: 12, display: 'grid', gap: 10 };
  const inputStyle = { minHeight: 34, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '7px 10px', fontSize: 12, outline: 'none' };
  const ghostBtn = { border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 12px', cursor: 'pointer' };
  const primaryBtn = { border: `1px solid ${t.accent2 || t.accent}`, background: `linear-gradient(135deg, ${t.accent}, ${t.accent2 || t.accent})`, color: t.bg, borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 12px', cursor: 'pointer' };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: t.textSecondary };

  const handleAddDoc = () => {
    if (!docForm.carrierId) return;
    setDocuments((prev) => [{ id: `doc-${Date.now()}`, ...docForm, createdAt: new Date().toISOString() }, ...prev]);
    setShowDocForm(false);
    setDocForm({ carrierId: '', type: DOC_TYPES[0], expiresAt: '', verified: false, notes: '' });
  };

  const scoreColor = (score) => score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>Financial & Compliance Ops</div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 26 }}>Carrier Compliance & Safety</h1>
        </div>
        <button type="button" style={primaryBtn} onClick={() => setShowDocForm(true)}>+ Add Document</button>
      </div>

      {/* KPIs */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Compliance Overview</div>
        <div style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Carriers', value: summary.total, color: t.accent },
            { label: 'Compliant (≥80%)', value: summary.compliant, color: '#22c55e' },
            { label: 'Expiring ≤30d', value: summary.expiringSoon, color: '#f59e0b' },
            { label: 'Expired', value: summary.expired, color: '#ef4444' },
          ].map((kpi) => (
            <div key={kpi.label} style={{ flex: '1 1 140px', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.textSecondary, textTransform: 'uppercase' }}>{kpi.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Doc Form */}
      {showDocForm && (
        <section style={sectionStyle}>
          <div style={headerStyle}>Add Compliance Document</div>
          <div style={bodyStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Carrier *</span>
                <select value={docForm.carrierId} onChange={(e) => setDocForm((p) => ({ ...p, carrierId: e.target.value }))} style={inputStyle}>
                  <option value="">— Select —</option>
                  {carriers.map((c) => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Document Type</span>
                <select value={docForm.type} onChange={(e) => setDocForm((p) => ({ ...p, type: e.target.value }))} style={inputStyle}>
                  {DOC_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Expiration</span><input type="date" value={docForm.expiresAt} onChange={(e) => setDocForm((p) => ({ ...p, expiresAt: e.target.value }))} style={inputStyle} /></label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, alignItems: 'end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <input type="checkbox" checked={docForm.verified} onChange={(e) => setDocForm((p) => ({ ...p, verified: e.target.checked }))} /> Verified
              </label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Notes</span><input value={docForm.notes} onChange={(e) => setDocForm((p) => ({ ...p, notes: e.target.value }))} style={inputStyle} placeholder="Optional notes" /></label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={primaryBtn} onClick={handleAddDoc}>Save Document</button>
              <button type="button" style={ghostBtn} onClick={() => setShowDocForm(false)}>Cancel</button>
            </div>
          </div>
        </section>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search carriers…" style={{ ...inputStyle, flex: '1 1 260px' }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="All">All</option>
          <option value="Compliant">Compliant</option>
          <option value="Non-Compliant">Non-Compliant</option>
          <option value="Expiring">Insurance Expiring ≤30d</option>
          <option value="Expired">Insurance Expired</option>
        </select>
      </div>

      {/* Table */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Carrier Compliance ({filtered.length})</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: t.bgAlt, borderBottom: `1px solid ${t.border}` }}>
                {['Carrier', 'MC #', 'DOT #', 'Safety Rating', 'Insurance Exp.', 'Docs', 'Score', ''].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: t.textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id || c._id} style={{ borderBottom: `1px solid ${t.border}`, cursor: 'pointer' }} onClick={() => setSelectedCarrier(c)}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '8px 10px' }}>{c.mcNumber || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>{c.dotNumber || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>{c.safetyRating || 'Not Rated'}</td>
                  <td style={{ padding: '8px 10px' }}>
                    {c.insuranceExpiry ? (
                      <span style={{ color: c._insuranceDays <= 0 ? '#ef4444' : c._insuranceDays <= 30 ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                        {new Date(c.insuranceExpiry).toLocaleDateString()} ({c._insuranceDays}d)
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '8px 10px' }}>{c._docCount}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ fontWeight: 700, color: scoreColor(c._score) }}>{c._score}%</span>
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <button type="button" style={{ ...ghostBtn, padding: '3px 8px', fontSize: 10 }}>View</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: t.textSecondary }}>{loading ? 'Loading…' : 'No carriers match filters.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Selected Carrier Detail */}
      {selectedCarrier && (
        <section style={sectionStyle}>
          <div style={{ ...headerStyle, display: 'flex', justifyContent: 'space-between' }}>
            <span>{selectedCarrier.name} — Compliance Detail</span>
            <button type="button" style={{ ...ghostBtn, padding: '3px 8px', fontSize: 10 }} onClick={() => setSelectedCarrier(null)}>Close</button>
          </div>
          <div style={bodyStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: 12 }}>
              <div><span style={labelStyle}>MC Number</span><div>{selectedCarrier.mcNumber || '—'}</div></div>
              <div><span style={labelStyle}>DOT Number</span><div>{selectedCarrier.dotNumber || '—'}</div></div>
              <div><span style={labelStyle}>Tax ID</span><div>{selectedCarrier.taxId || '—'}</div></div>
              <div><span style={labelStyle}>Safety Rating</span><div>{selectedCarrier.safetyRating || 'Not Rated'}</div></div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Documents on File</div>
            <div style={{ display: 'grid', gap: 4 }}>
              {documents.filter((d) => d.carrierId === (selectedCarrier.id || selectedCarrier._id)).map((d) => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 6, border: `1px solid ${t.border}`, fontSize: 11 }}>
                  <span style={{ fontWeight: 600 }}>{d.type}</span>
                  <span style={{ color: t.textSecondary }}>{d.expiresAt ? `Exp: ${d.expiresAt}` : 'No expiration'} {d.verified ? '✓ Verified' : ''}</span>
                </div>
              ))}
              {documents.filter((d) => d.carrierId === (selectedCarrier.id || selectedCarrier._id)).length === 0 && (
                <div style={{ fontSize: 11, color: t.textSecondary }}>No documents on file.</div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
