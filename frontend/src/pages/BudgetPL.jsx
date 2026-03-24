import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getDashboard } from '../api/client';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toMoney(v) {
  return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function pct(n, d) {
  if (!d) return '0.0';
  return ((n / d) * 100).toFixed(1);
}

export default function BudgetPL() {
  const { theme } = useTheme();
  const t = theme;

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('monthly'); // monthly | quarterly | ytd
  const [plEntries, setPlEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem('opscale_pl_entries') || '[]'); } catch { return []; }
  });
  const [showEntry, setShowEntry] = useState(false);
  const [entryForm, setEntryForm] = useState({ category: 'Revenue', subcategory: '', amount: '', month: new Date().getMonth(), year: new Date().getFullYear(), notes: '' });

  useEffect(() => {
    setLoading(true);
    getDashboard().then((data) => { setDashData(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { localStorage.setItem('opscale_pl_entries', JSON.stringify(plEntries)); }, [plEntries]);

  const summary = useMemo(() => {
    const s = dashData?.summary || {};
    const revenue = Number(s.totalInvoices || s.totalRevenue || 0);
    const carrierPay = Number(s.totalCarrierPay || 0);
    const savings = Number(s.totalSavings || 0);
    const grossMargin = revenue > 0 ? ((revenue - carrierPay) / revenue) * 100 : 0;
    return { revenue, carrierPay, savings, grossMargin };
  }, [dashData]);

  const plByCategory = useMemo(() => {
    const cats = {};
    plEntries.forEach((e) => {
      const key = e.category;
      if (!cats[key]) cats[key] = { total: 0, items: [] };
      cats[key].total += Number(e.amount) || 0;
      cats[key].items.push(e);
    });
    return cats;
  }, [plEntries]);

  const monthlyTrends = useMemo(() => {
    const months = {};
    plEntries.forEach((e) => {
      const key = `${e.year}-${String(e.month).padStart(2, '0')}`;
      if (!months[key]) months[key] = { revenue: 0, expense: 0 };
      if (e.category === 'Revenue') months[key].revenue += Number(e.amount) || 0;
      else months[key].expense += Number(e.amount) || 0;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([month, data]) => ({ month, ...data, profit: data.revenue - data.expense }));
  }, [plEntries]);

  const sectionStyle = { border: `1px solid ${t.border}`, borderRadius: 12, background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`, overflow: 'hidden' };
  const headerStyle = { padding: '10px 12px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt, fontSize: 14, fontWeight: 700 };
  const bodyStyle = { padding: 12, display: 'grid', gap: 10 };
  const inputStyle = { minHeight: 34, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '7px 10px', fontSize: 12, outline: 'none' };
  const ghostBtn = { border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 12px', cursor: 'pointer' };
  const primaryBtn = { border: `1px solid ${t.accent2 || t.accent}`, background: `linear-gradient(135deg, ${t.accent}, ${t.accent2 || t.accent})`, color: t.bg, borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 12px', cursor: 'pointer' };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: t.textSecondary };

  const handleSaveEntry = () => {
    if (!entryForm.amount) return;
    setPlEntries((prev) => [{ id: `pl-${Date.now()}`, ...entryForm, createdAt: new Date().toISOString() }, ...prev]);
    setShowEntry(false);
    setEntryForm({ category: 'Revenue', subcategory: '', amount: '', month: new Date().getMonth(), year: new Date().getFullYear(), notes: '' });
  };

  const handleDeleteEntry = (id) => setPlEntries((prev) => prev.filter((e) => e.id !== id));

  const totalRevenue = (plByCategory['Revenue']?.total || 0) + summary.revenue;
  const totalExpenses = Object.entries(plByCategory).filter(([k]) => k !== 'Revenue').reduce((s, [, v]) => s + v.total, 0) + summary.carrierPay;
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>Financial & Compliance Ops</div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 26 }}>Budget & P&L</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['monthly', 'quarterly', 'ytd'].map((m) => (
            <button key={m} type="button" onClick={() => setViewMode(m)} style={{ ...ghostBtn, ...(viewMode === m ? { background: `${t.accent}18`, borderColor: t.accent, color: t.accent } : {}) }}>{m.toUpperCase()}</button>
          ))}
          <button type="button" style={primaryBtn} onClick={() => setShowEntry(true)}>+ Add Entry</button>
        </div>
      </div>

      {/* Top-Level Financial KPIs */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Financial Summary</div>
        <div style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Revenue', value: toMoney(totalRevenue), color: '#22c55e' },
            { label: 'Total Expenses', value: toMoney(totalExpenses), color: '#ef4444' },
            { label: 'Net Profit', value: toMoney(netProfit), color: netProfit >= 0 ? '#22c55e' : '#ef4444' },
            { label: 'Gross Margin', value: `${summary.grossMargin.toFixed(1)}%`, color: summary.grossMargin >= 15 ? '#22c55e' : '#f59e0b' },
            { label: 'Audit Savings', value: toMoney(summary.savings), color: t.accent },
          ].map((kpi) => (
            <div key={kpi.label} style={{ flex: '1 1 150px', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.textSecondary, textTransform: 'uppercase' }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Add Entry Form */}
      {showEntry && (
        <section style={sectionStyle}>
          <div style={headerStyle}>Add P&L Entry</div>
          <div style={bodyStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Category</span>
                <select value={entryForm.category} onChange={(e) => setEntryForm((p) => ({ ...p, category: e.target.value }))} style={inputStyle}>
                  {['Revenue', 'Carrier Pay', 'Fuel', 'Insurance', 'Equipment', 'Labor', 'Admin', 'Other'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Subcategory</span><input value={entryForm.subcategory} onChange={(e) => setEntryForm((p) => ({ ...p, subcategory: e.target.value }))} style={inputStyle} placeholder="e.g. Linehaul" /></label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Amount ($) *</span><input value={entryForm.amount} onChange={(e) => setEntryForm((p) => ({ ...p, amount: e.target.value }))} style={inputStyle} placeholder="5000" /></label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Month</span>
                <select value={entryForm.month} onChange={(e) => setEntryForm((p) => ({ ...p, month: Number(e.target.value) }))} style={inputStyle}>
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Year</span><input value={entryForm.year} onChange={(e) => setEntryForm((p) => ({ ...p, year: Number(e.target.value) }))} style={inputStyle} /></label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Notes</span><input value={entryForm.notes} onChange={(e) => setEntryForm((p) => ({ ...p, notes: e.target.value }))} style={inputStyle} placeholder="Description" /></label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={primaryBtn} onClick={handleSaveEntry}>Save Entry</button>
              <button type="button" style={ghostBtn} onClick={() => setShowEntry(false)}>Cancel</button>
            </div>
          </div>
        </section>
      )}

      {/* Monthly Trends */}
      {monthlyTrends.length > 0 && (
        <section style={sectionStyle}>
          <div style={headerStyle}>Monthly Trends</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: t.bgAlt, borderBottom: `1px solid ${t.border}` }}>
                  {['Month', 'Revenue', 'Expenses', 'Profit', 'Margin'].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: t.textSecondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyTrends.map((row) => (
                  <tr key={row.month} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{row.month}</td>
                    <td style={{ padding: '8px 10px', color: '#22c55e' }}>{toMoney(row.revenue)}</td>
                    <td style={{ padding: '8px 10px', color: '#ef4444' }}>{toMoney(row.expense)}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: row.profit >= 0 ? '#22c55e' : '#ef4444' }}>{toMoney(row.profit)}</td>
                    <td style={{ padding: '8px 10px' }}>{row.revenue > 0 ? pct(row.profit, row.revenue) : '0.0'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* P&L Breakdown */}
      <section style={sectionStyle}>
        <div style={headerStyle}>P&L Entries ({plEntries.length})</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: t.bgAlt, borderBottom: `1px solid ${t.border}` }}>
                {['Category', 'Subcategory', 'Amount', 'Month', 'Notes', ''].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: t.textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plEntries.map((e) => (
                <tr key={e.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{e.category}</td>
                  <td style={{ padding: '8px 10px' }}>{e.subcategory || '—'}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: e.category === 'Revenue' ? '#22c55e' : '#ef4444' }}>{toMoney(e.amount)}</td>
                  <td style={{ padding: '8px 10px' }}>{MONTHS[e.month]} {e.year}</td>
                  <td style={{ padding: '8px 10px', color: t.textSecondary }}>{e.notes || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <button type="button" style={{ ...ghostBtn, padding: '3px 6px', fontSize: 10, color: t.error }} onClick={() => handleDeleteEntry(e.id)}>Del</button>
                  </td>
                </tr>
              ))}
              {plEntries.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: t.textSecondary }}>No entries yet. Click "+ Add Entry" to start tracking.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
