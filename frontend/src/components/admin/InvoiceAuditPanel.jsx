import React, { useState } from 'react';

const STORAGE_KEY = 'fbpa_invoice_audit_v1';

const DEFAULTS = {
  dupeCheck: true,
  rateConf: true,
  podRequired: true,
  autoApprove: false,
  dupeWindow: '30',
  approvalThreshold: '500',
  escalationEmail: '',
  requireTwoApprovers: false,
  flagMissingBol: true,
  autoHoldOverLimit: true,
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') return { ...DEFAULTS, ...parsed };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

export default function InvoiceAuditPanel({ t, onSave }) {
  const [config, setConfig] = useState(loadConfig);
  const [message, setMessage] = useState('');

  const themeText = (t && t.text) || '#1a1a2e';
  const themeSecondary = (t && t.textSecondary) || '#6b7280';
  const themeAccent = (t && t.accent) || '#0a7cff';
  const themeBorder = (t && t.border) || '#e5e7eb';
  const themeSurface = (t && t.surface) || '#fff';
  const themeSuccess = (t && t.success) || '#16a34a';
  const themeWarning = (t && t.warning) || '#f59e0b';

  function update(key, value) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function toggle(key) {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    if (onSave) onSave(config);
    setMessage('Invoice audit settings saved.');
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

  const ruleRow = (key, label, desc) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: `1px solid ${themeBorder}`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: themeText }}>{label}</div>
        <div style={{ fontSize: 12, color: themeSecondary }}>{desc}</div>
      </div>
      <button type="button" style={toggleBtnStyle(config[key])} onClick={() => toggle(key)}>
        <span style={toggleDotStyle(config[key])} />
      </button>
    </div>
  );

  // Calculate enabled rules count for summary
  const enabledRules = [
    config.dupeCheck,
    config.rateConf,
    config.podRequired,
    config.autoApprove,
    config.requireTwoApprovers,
    config.flagMissingBol,
    config.autoHoldOverLimit,
  ].filter(Boolean).length;

  return (
    <div>
      <h4 style={{ margin: '0 0 4px', color: themeText }}>Invoice Audit Settings</h4>
      <div style={{ fontSize: 12, color: themeSecondary, marginBottom: 16 }}>
        Configure automated audit rules that run on every incoming carrier invoice before payment is released.
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

      {/* Summary */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: `1px solid ${themeBorder}`,
            background: themeSurface,
            textAlign: 'center',
            minWidth: 90,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: themeAccent }}>{enabledRules}</div>
          <div style={{ fontSize: 11, color: themeSecondary }}>Active Rules</div>
        </div>
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: `1px solid ${themeBorder}`,
            background: themeSurface,
            textAlign: 'center',
            minWidth: 90,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: themeWarning }}>{config.dupeWindow}d</div>
          <div style={{ fontSize: 11, color: themeSecondary }}>Dupe Window</div>
        </div>
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: `1px solid ${themeBorder}`,
            background: themeSurface,
            textAlign: 'center',
            minWidth: 90,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: themeSuccess }}>${config.approvalThreshold}</div>
          <div style={{ fontSize: 11, color: themeSecondary }}>Auto Threshold</div>
        </div>
      </div>

      {/* Core Audit Rules */}
      <div
        style={{
          padding: 16,
          borderRadius: 8,
          border: `1px solid ${themeBorder}`,
          background: themeSurface,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: themeText }}>
          🔍 Core Audit Rules
        </div>
        {ruleRow('dupeCheck', 'Duplicate Invoice Detection', `Flag invoices with same carrier + amount within ${config.dupeWindow} days`)}
        {ruleRow('rateConf', 'Rate Confirmation Matching', 'Require matching rate confirmation on file before payment')}
        {ruleRow('podRequired', 'POD Required for Payment', 'Block payment release until Proof of Delivery is uploaded')}
        {ruleRow('flagMissingBol', 'Flag Missing BOL', 'Flag invoices that reference loads without a Bill of Lading on file')}
      </div>

      {/* Approval Workflow */}
      <div
        style={{
          padding: 16,
          borderRadius: 8,
          border: `1px solid ${themeBorder}`,
          background: themeSurface,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: themeText }}>
          ✅ Approval Workflow
        </div>
        {ruleRow('autoApprove', 'Auto-Approve Clean Invoices', `Auto-approve invoices under $${config.approvalThreshold} if no exceptions detected`)}
        {ruleRow('requireTwoApprovers', 'Require Two Approvers', 'Invoices over approval threshold require sign-off from two authorized users')}
        {ruleRow('autoHoldOverLimit', 'Auto-Hold Over Limit', `Automatically hold invoices exceeding $${config.approvalThreshold} for manual review`)}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: themeSecondary, marginBottom: 4 }}>
              Duplicate Window (days)
            </label>
            <input
              type="number"
              value={config.dupeWindow}
              onChange={(e) => update('dupeWindow', e.target.value)}
              placeholder="30"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: themeSecondary, marginBottom: 4 }}>
              Auto-Approve Threshold ($)
            </label>
            <input
              type="number"
              value={config.approvalThreshold}
              onChange={(e) => update('approvalThreshold', e.target.value)}
              placeholder="500"
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: themeSecondary, marginBottom: 4 }}>
              Escalation Email
            </label>
            <input
              type="email"
              value={config.escalationEmail}
              onChange={(e) => update('escalationEmail', e.target.value)}
              placeholder="audit@company.com"
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: themeSecondary, marginTop: 2 }}>
              Receives notifications when invoices are flagged or held
            </div>
          </div>
        </div>
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
        Save Audit Settings
      </button>
    </div>
  );
}
