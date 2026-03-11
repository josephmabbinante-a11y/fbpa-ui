import React, { useState } from 'react';

const STORAGE_KEY = 'fbpa_commission_overrides_v1';

const initialOverrides = [
  { id: 1, agent: 'Sarah Martinez', baseRate: 10, overrideRate: 12, effectiveDate: '2025-01-01', reason: 'Top performer Q4' },
  { id: 2, agent: 'James Chen', baseRate: 10, overrideRate: 15, effectiveDate: '2025-03-01', reason: 'Senior agent promotion' },
];

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialOverrides;
  } catch {
    return initialOverrides;
  }
}

export default function CommissionOverrideManagement({ t }) {
  const [overrides, setOverrides] = useState(loadOverrides);
  const [agent, setAgent] = useState('');
  const [baseRate, setBaseRate] = useState('10');
  const [overrideRate, setOverrideRate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editOverrideRate, setEditOverrideRate] = useState('');

  const themeText = (t && t.text) || '#1a1a2e';
  const themeSecondary = (t && t.textSecondary) || '#6b7280';
  const themeAccent = (t && t.accent) || '#0a7cff';
  const themeBorder = (t && t.border) || '#e5e7eb';
  const themeSurface = (t && t.surface) || '#fff';
  const themeError = (t && t.error) || '#ef4444';
  const themeWarning = (t && t.warning) || '#f59e0b';

  function saveOverrides(next) {
    setOverrides(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addOverride(e) {
    e.preventDefault();
    if (!agent.trim() || !overrideRate) return;
    const next = [
      ...overrides,
      {
        id: Date.now(),
        agent: agent.trim(),
        baseRate: Number(baseRate) || 10,
        overrideRate: Number(overrideRate),
        effectiveDate: effectiveDate || new Date().toISOString().slice(0, 10),
        reason: reason.trim(),
      },
    ];
    saveOverrides(next);
    setAgent('');
    setBaseRate('10');
    setOverrideRate('');
    setEffectiveDate('');
    setReason('');
  }

  function deleteOverride(id) {
    saveOverrides(overrides.filter((o) => o.id !== id));
  }

  function startEdit(override) {
    setEditingId(override.id);
    setEditOverrideRate(String(override.overrideRate));
  }

  function saveEdit(id) {
    saveOverrides(
      overrides.map((o) => (o.id === id ? { ...o, overrideRate: Number(editOverrideRate) } : o)),
    );
    setEditingId(null);
  }

  const diffBadge = (base, override) => {
    const diff = override - base;
    const isPositive = diff > 0;
    return {
      display: 'inline-block',
      padding: '2px 6px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      background: isPositive ? `${themeWarning}22` : `${themeSecondary}18`,
      color: isPositive ? themeWarning : themeSecondary,
    };
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: `1px solid ${themeBorder}`,
    fontSize: 13,
    background: 'transparent',
    color: themeText,
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: themeSecondary,
    marginBottom: 4,
  };

  return (
    <div>
      <h4 style={{ margin: '0 0 4px', color: themeText }}>Commission Overrides</h4>
      <div style={{ fontSize: 12, color: themeSecondary, marginBottom: 16 }}>
        Manage per-agent commission rate overrides. Overrides take precedence over the default base rate.
      </div>

      {overrides.length === 0 ? (
        <div style={{ color: themeSecondary, fontSize: 13, padding: '12px 0' }}>No commission overrides configured.</div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {overrides.map((o) => (
            <div
              key={o.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${themeBorder}`,
                marginBottom: 8,
                background: themeSurface,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: themeText }}>{o.agent}</div>
                <div style={{ fontSize: 12, color: themeSecondary, marginTop: 2 }}>
                  Base: {o.baseRate}% → Override: {o.overrideRate}%
                  {o.effectiveDate && <span style={{ marginLeft: 8 }}>· Effective: {o.effectiveDate}</span>}
                </div>
                {o.reason && (
                  <div style={{ fontSize: 11, color: themeSecondary, marginTop: 2, fontStyle: 'italic' }}>
                    {o.reason}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {editingId === o.id ? (
                  <>
                    <input
                      type="number"
                      value={editOverrideRate}
                      onChange={(e) => setEditOverrideRate(e.target.value)}
                      style={{ width: 70, fontSize: 12, padding: '3px 6px', borderRadius: 4, border: `1px solid ${themeBorder}` }}
                      min="0"
                      max="100"
                    />
                    <span style={{ fontSize: 11, color: themeSecondary }}>%</span>
                    <button
                      type="button"
                      onClick={() => saveEdit(o.id)}
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        cursor: 'pointer',
                        borderRadius: 4,
                        border: `1px solid ${themeAccent}`,
                        background: themeAccent,
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        cursor: 'pointer',
                        borderRadius: 4,
                        border: `1px solid ${themeBorder}`,
                        background: 'transparent',
                        color: themeSecondary,
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span style={diffBadge(o.baseRate, o.overrideRate)}>
                      {o.overrideRate > o.baseRate ? '+' : ''}
                      {o.overrideRate - o.baseRate}%
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(o)}
                      style={{
                        fontSize: 11,
                        padding: '3px 10px',
                        cursor: 'pointer',
                        borderRadius: 4,
                        border: `1px solid ${themeBorder}`,
                        background: 'transparent',
                        color: themeText,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteOverride(o.id)}
                      style={{
                        border: `1px solid ${themeError}`,
                        color: themeError,
                        background: 'transparent',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          padding: 16,
          borderRadius: 8,
          border: `1px solid ${themeBorder}`,
          background: themeSurface,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: themeText }}>Add Override</div>
        <form onSubmit={addOverride}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={labelStyle}>Agent Name</label>
              <input value={agent} onChange={(e) => setAgent(e.target.value)} placeholder="e.g. Sarah Martinez" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Effective Date</label>
              <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label style={labelStyle}>Base Rate (%)</label>
              <input type="number" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} min="0" max="100" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Override Rate (%)</label>
              <input type="number" value={overrideRate} onChange={(e) => setOverrideRate(e.target.value)} placeholder="12" required min="0" max="100" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Reason</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Top performer Q4" style={inputStyle} />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              border: 'none',
              background: themeAccent,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Add Override
          </button>
        </form>
      </div>
    </div>
  );
}
