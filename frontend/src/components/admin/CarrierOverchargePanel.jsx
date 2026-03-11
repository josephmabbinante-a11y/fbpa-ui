import React, { useState } from 'react';

const STORAGE_KEY = 'fbpa_carrier_overcharge_v1';

const DEFAULTS = {
  warnPct: '5',
  flagPct: '10',
  blockPct: '20',
  notifyEmail: '',
  autoDispute: false,
  requireDocumentation: true,
  escalateAfterDays: '7',
  trackingEnabled: true,
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') return { ...DEFAULTS, ...parsed };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

export default function CarrierOverchargePanel({ t, onSave }) {
  const [config, setConfig] = useState(loadConfig);
  const [message, setMessage] = useState('');

  const themeText = (t && t.text) || '#1a1a2e';
  const themeSecondary = (t && t.textSecondary) || '#6b7280';
  const themeAccent = (t && t.accent) || '#0a7cff';
  const themeBorder = (t && t.border) || '#e5e7eb';
  const themeSurface = (t && t.surface) || '#fff';
  const themeSuccess = (t && t.success) || '#16a34a';
  const themeWarning = (t && t.warning) || '#f59e0b';
  const themeError = (t && t.error) || '#ef4444';

  function update(key, value) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function toggle(key) {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    if (onSave) onSave(config);
    setMessage('Overcharge thresholds saved.');
    setTimeout(() => setMessage(''), 4000);
  }

  const toggleBtnStyle = (enabled) => ({
    position: 'relative',
    width: 36,
    height: 20,
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    background: enabled ? themeAccent : `${themeSecondary}44`,
    flexShrink: 0,
  });

  const toggleDotStyle = (enabled) => ({
    position: 'absolute',
    top: 3,
    left: enabled ? 18 : 3,
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#fff',
    transition: 'left 0.2s',
  });

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
      <h4 style={{ margin: '0 0 4px', color: themeText }}>Carrier Overcharge Thresholds</h4>
      <div style={{ fontSize: 12, color: themeSecondary, marginBottom: 16 }}>
        Define thresholds for automatic detection and handling of carrier overcharges relative to quoted rates.
      </div>

      {message && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            background: `${themeSuccess}18`,
            color: themeSuccess,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          ✓ {message}
        </div>
      )}

      {/* Threshold Visualization */}
      <div
        style={{
          padding: 16,
          borderRadius: 8,
          border: `1px solid ${themeBorder}`,
          background: themeSurface,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: themeText }}>
          📊 Threshold Levels
        </div>
        <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderRadius: 6, overflow: 'hidden', height: 32 }}>
          <div
            style={{
              flex: Number(config.warnPct) || 5,
              background: `${themeSuccess}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: themeSuccess,
            }}
          >
            OK (0–{config.warnPct}%)
          </div>
          <div
            style={{
              flex: (Number(config.flagPct) || 10) - (Number(config.warnPct) || 5),
              background: `${themeWarning}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: themeWarning,
            }}
          >
            ⚠️ Warn
          </div>
          <div
            style={{
              flex: (Number(config.blockPct) || 20) - (Number(config.flagPct) || 10),
              background: `${themeWarning}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: themeWarning,
            }}
          >
            🔍 Review
          </div>
          <div
            style={{
              flex: 5,
              background: `${themeError}33`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: themeError,
            }}
          >
            🚫 Block
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>⚠️ Warning Threshold (%)</label>
            <input
              type="number"
              value={config.warnPct}
              onChange={(e) => update('warnPct', e.target.value)}
              placeholder="5"
              min="0"
              max="100"
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: themeSecondary, marginTop: 2 }}>
              Log a warning notification
            </div>
          </div>
          <div>
            <label style={labelStyle}>🔍 Flag for Review (%)</label>
            <input
              type="number"
              value={config.flagPct}
              onChange={(e) => update('flagPct', e.target.value)}
              placeholder="10"
              min="0"
              max="100"
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: themeSecondary, marginTop: 2 }}>
              Require manual review before payment
            </div>
          </div>
          <div>
            <label style={labelStyle}>🚫 Block Payment (%)</label>
            <input
              type="number"
              value={config.blockPct}
              onChange={(e) => update('blockPct', e.target.value)}
              placeholder="20"
              min="0"
              max="100"
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: themeSecondary, marginTop: 2 }}>
              Automatically block and escalate
            </div>
          </div>
        </div>
      </div>

      {/* Notification & Escalation */}
      <div
        style={{
          padding: 16,
          borderRadius: 8,
          border: `1px solid ${themeBorder}`,
          background: themeSurface,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: themeText }}>
          📧 Notification & Escalation
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Notification Email</label>
          <input
            type="email"
            value={config.notifyEmail}
            onChange={(e) => update('notifyEmail', e.target.value)}
            placeholder="billing@company.com"
            style={inputStyle}
          />
          <div style={{ fontSize: 11, color: themeSecondary, marginTop: 2 }}>
            Receives alerts when overcharges are detected
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Auto-Escalate After (days)</label>
          <input
            type="number"
            value={config.escalateAfterDays}
            onChange={(e) => update('escalateAfterDays', e.target.value)}
            placeholder="7"
            style={{ ...inputStyle, width: 120 }}
          />
          <div style={{ fontSize: 11, color: themeSecondary, marginTop: 2 }}>
            Unresolved overcharges escalate to management after this period
          </div>
        </div>

        {/* Toggle options */}
        {[
          { key: 'autoDispute', label: 'Auto-Dispute Blocked Invoices', desc: 'Automatically generate dispute notifications for invoices exceeding the block threshold' },
          { key: 'requireDocumentation', label: 'Require Supporting Documentation', desc: 'Carriers must provide supporting documents before overcharge disputes can be resolved' },
          { key: 'trackingEnabled', label: 'Overcharge Trend Tracking', desc: 'Track overcharge frequency per carrier to identify repeat offenders' },
        ].map((rule) => (
          <div
            key={rule.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: `1px solid ${themeBorder}`,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: themeText }}>{rule.label}</div>
              <div style={{ fontSize: 12, color: themeSecondary }}>{rule.desc}</div>
            </div>
            <button type="button" style={toggleBtnStyle(config[rule.key])} onClick={() => toggle(rule.key)}>
              <span style={toggleDotStyle(config[rule.key])} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        style={{
          padding: '10px 24px',
          borderRadius: 6,
          border: 'none',
          background: themeAccent,
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Save Overcharge Settings
      </button>
    </div>
  );
}
