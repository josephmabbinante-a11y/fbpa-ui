import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { listQuoteHistory, createQuote, updateQuote } from '../api/client';

const STATUS_OPTIONS = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'];
const MODE_OPTIONS = ['FTL', 'LTL', 'Intermodal', 'Drayage', 'Flatbed', 'Reefer'];

const STATUS_MAP = { Draft: 'draft', Sent: 'sent', Accepted: 'accepted', Rejected: 'rejected', Expired: 'expired' };
const STATUS_REVERSE = { draft: 'Draft', sent: 'Sent', accepted: 'Accepted', rejected: 'Rejected', expired: 'Expired' };

const EMPTY_QUOTE = {
  customerName: '',
  origin: '',
  destination: '',
  mode: 'FTL',
  weight: '',
  rate: '',
  margin: '',
  validUntil: '',
  status: 'Draft',
  notes: '',
};

function toMoney(v) {
  return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function QuotingRFP() {
  const { theme } = useTheme();
  const t = theme;

  const [quotes, setQuotes] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_QUOTE });
  const [editId, setEditId] = useState(null);
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  const fetchQuotes = useCallback(async () => {
    setLoadingQuotes(true);
    const result = await listQuoteHistory({ limit: 200 });
    if (result?.items && !result.error) {
      const mapped = result.items.map((q) => ({
        id: q.quoteId || q._id,
        customerName: q.customerName || '',
        origin: q.origin || '',
        destination: q.destination || '',
        mode: q.equipmentType === 'reefer' ? 'Reefer' : q.equipmentType === 'flatbed' ? 'Flatbed' : 'FTL',
        weight: '',
        rate: q.totalQuoteAmount || q.recommendedSellRate || q.ruleRate || '',
        margin: q.margin || '',
        validUntil: q.validUntil ? new Date(q.validUntil).toISOString().slice(0, 10) : '',
        status: STATUS_REVERSE[q.status] || 'Draft',
        notes: q.notes || '',
        source: q.source || 'rfp',
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      }));
      setQuotes(mapped);
    } else {
      // Fall back to localStorage if API unavailable
      try { setQuotes(JSON.parse(localStorage.getItem('opscale_quotes') || '[]')); } catch { setQuotes([]); }
    }
    setLoadingQuotes(false);
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  // Keep localStorage synced as cache
  useEffect(() => { localStorage.setItem('opscale_quotes', JSON.stringify(quotes)); }, [quotes]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return quotes.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (q && ![item.customerName, item.origin, item.destination, item.mode].some((v) => String(v || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [quotes, query, statusFilter]);

  const summaryStats = useMemo(() => {
    const total = quotes.length;
    const sent = quotes.filter((q) => q.status === 'Sent').length;
    const accepted = quotes.filter((q) => q.status === 'Accepted').length;
    const totalValue = quotes.reduce((sum, q) => sum + (Number(q.rate) || 0), 0);
    const wonValue = quotes.filter((q) => q.status === 'Accepted').reduce((sum, q) => sum + (Number(q.rate) || 0), 0);
    const closeRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0.0';
    return { total, sent, accepted, totalValue, wonValue, closeRate };
  }, [quotes]);

  const sectionStyle = { border: `1px solid ${t.border}`, borderRadius: 12, background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`, overflow: 'hidden' };
  const headerStyle = { padding: '10px 12px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt, fontSize: 14, fontWeight: 700 };
  const bodyStyle = { padding: 12, display: 'grid', gap: 10 };
  const inputStyle = { minHeight: 34, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '7px 10px', fontSize: 12, outline: 'none' };
  const ghostBtn = { border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 12px', cursor: 'pointer' };
  const primaryBtn = { border: `1px solid ${t.accent2 || t.accent}`, background: `linear-gradient(135deg, ${t.accent}, ${t.accent2 || t.accent})`, color: t.bg, borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 12px', cursor: 'pointer' };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: t.textSecondary };

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.customerName.trim() || !form.origin.trim() || !form.destination.trim()) return;

    const equipmentMap = { FTL: 'dry_van', LTL: 'dry_van', Reefer: 'reefer', Flatbed: 'flatbed', Intermodal: 'dry_van', Drayage: 'dry_van' };

    if (editId) {
      // Update existing quote via API
      const result = await updateQuote(editId, {
        status: STATUS_MAP[form.status] || 'draft',
        customerName: form.customerName,
        notes: form.notes,
        validUntil: form.validUntil || null,
      });
      if (!result?.error) {
        setQuotes((prev) => prev.map((q) => q.id === editId ? { ...q, ...form, updatedAt: new Date().toISOString() } : q));
      }
    } else {
      // Create new quote via API
      const result = await createQuote({
        source: 'rfp',
        customerName: form.customerName,
        origin: form.origin,
        destination: form.destination,
        equipmentType: equipmentMap[form.mode] || 'dry_van',
        totalQuoteAmount: Number(form.rate) || null,
        recommendedSellRate: Number(form.rate) || null,
        margin: Number(form.margin) || null,
        status: STATUS_MAP[form.status] || 'draft',
        validUntil: form.validUntil || null,
        notes: form.notes,
      });
      if (!result?.error && result?.quote) {
        const q = result.quote;
        setQuotes((prev) => [{
          ...form,
          id: q.quoteId || q._id,
          createdAt: q.createdAt || new Date().toISOString(),
          updatedAt: q.updatedAt || new Date().toISOString(),
          source: 'rfp',
        }, ...prev]);
      } else {
        // Offline fallback
        setQuotes((prev) => [{ ...form, id: `qt-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev]);
      }
    }
    setShowForm(false);
    setForm({ ...EMPTY_QUOTE });
    setEditId(null);
  };

  const handleEdit = (item) => {
    setForm({ customerName: item.customerName, origin: item.origin, destination: item.destination, mode: item.mode, weight: item.weight, rate: item.rate, margin: item.margin, validUntil: item.validUntil, status: item.status, notes: item.notes });
    setEditId(item.id);
    setShowForm(true);
  };

  const handleDelete = (id) => setQuotes((prev) => prev.filter((q) => q.id !== id));

  if (loadingQuotes) {
    return <div style={{ padding: 24, color: t.textSecondary }}>Loading quote history…</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>Account Mgmt / Sales Ops</div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 26 }}>Quoting & RFP Management</h1>
        </div>
        <button type="button" style={primaryBtn} onClick={() => { setShowForm(true); setForm({ ...EMPTY_QUOTE }); setEditId(null); }}>+ New Quote</button>
      </div>

      {/* KPIs */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Quote Summary</div>
        <div style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Quotes', value: summaryStats.total, color: t.accent },
            { label: 'Sent', value: summaryStats.sent, color: '#3b82f6' },
            { label: 'Accepted', value: summaryStats.accepted, color: '#22c55e' },
            { label: 'Close Rate', value: `${summaryStats.closeRate}%`, color: '#f59e0b' },
            { label: 'Total Quoted', value: toMoney(summaryStats.totalValue), color: t.text },
            { label: 'Won Revenue', value: toMoney(summaryStats.wonValue), color: '#22c55e' },
          ].map((kpi) => (
            <div key={kpi.label} style={{ flex: '1 1 130px', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.textSecondary, textTransform: 'uppercase' }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Form */}
      {showForm && (
        <section style={sectionStyle}>
          <div style={headerStyle}>{editId ? 'Edit Quote' : 'New Quote'}</div>
          <div style={bodyStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Customer *</span><input value={form.customerName} onChange={(e) => setField('customerName', e.target.value)} style={inputStyle} placeholder="Acme Shipping Co." /></label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Origin *</span><input value={form.origin} onChange={(e) => setField('origin', e.target.value)} style={inputStyle} placeholder="Chicago, IL" /></label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Destination *</span><input value={form.destination} onChange={(e) => setField('destination', e.target.value)} style={inputStyle} placeholder="Dallas, TX" /></label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Mode</span>
                <select value={form.mode} onChange={(e) => setField('mode', e.target.value)} style={inputStyle}>
                  {MODE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Weight (lbs)</span><input value={form.weight} onChange={(e) => setField('weight', e.target.value)} style={inputStyle} placeholder="42000" /></label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Rate ($)</span><input value={form.rate} onChange={(e) => setField('rate', e.target.value)} style={inputStyle} placeholder="3500" /></label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Target Margin %</span><input value={form.margin} onChange={(e) => setField('margin', e.target.value)} style={inputStyle} placeholder="18" /></label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Valid Until</span><input type="date" value={form.validUntil} onChange={(e) => setField('validUntil', e.target.value)} style={inputStyle} /></label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Status</span>
                <select value={form.status} onChange={(e) => setField('status', e.target.value)} style={inputStyle}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Notes</span><input value={form.notes} onChange={(e) => setField('notes', e.target.value)} style={inputStyle} placeholder="Internal notes" /></label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={primaryBtn} onClick={handleSave}>{editId ? 'Update' : 'Save Quote'}</button>
              <button type="button" style={ghostBtn} onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search quotes…" style={{ ...inputStyle, flex: '1 1 260px' }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="All">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Quotes ({filtered.length})</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: t.bgAlt, borderBottom: `1px solid ${t.border}` }}>
                {['Customer', 'Lane', 'Mode', 'Source', 'Rate', 'Margin', 'Status', 'Valid Until', ''].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: t.textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{q.customerName}</td>
                  <td style={{ padding: '8px 10px' }}>{q.origin} → {q.destination}</td>
                  <td style={{ padding: '8px 10px' }}>{q.mode}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: q.source === 'auction' ? '#f59e0b22' : q.source === 'calculator' ? '#3b82f622' : `${t.accent}18`, color: q.source === 'auction' ? '#f59e0b' : q.source === 'calculator' ? '#3b82f6' : t.accent }}>{q.source || 'rfp'}</span>
                  </td>
                  <td style={{ padding: '8px 10px' }}>{q.rate ? toMoney(q.rate) : '—'}</td>
                  <td style={{ padding: '8px 10px' }}>{q.margin ? `${q.margin}%` : '—'}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: q.status === 'Accepted' ? '#22c55e22' : q.status === 'Rejected' ? '#ef444422' : `${t.accent}18`, color: q.status === 'Accepted' ? '#22c55e' : q.status === 'Rejected' ? '#ef4444' : t.accent }}>{q.status}</span>
                  </td>
                  <td style={{ padding: '8px 10px', color: t.textSecondary, fontSize: 11 }}>{q.validUntil || '—'}</td>
                  <td style={{ padding: '8px 10px', display: 'flex', gap: 4 }}>
                    <button type="button" style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11 }} onClick={() => handleEdit(q)}>Edit</button>
                    <button type="button" style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11, color: t.error }} onClick={() => handleDelete(q.id)}>Del</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: t.textSecondary }}>No quotes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
