import { useMemo, useEffect, useState } from 'react';
import { LOAD_STATUSES } from '../../utils/loadLifecycle';
import {
  getWorkflowAutomationConfig,
  saveWorkflowAutomationConfig,
  WORKFLOW_ACTIONS,
  WORKFLOW_TRIGGERS,
} from '../../utils/workflowAutomationEngine';

const CONDITION_FIELDS = [
  { key: 'margin', label: 'margin < X' },
  { key: 'volatility', label: 'volatility > Y' },
  { key: 'capacity_heat', label: 'capacity heat > Z' },
  { key: 'eta_delta_minutes', label: 'eta_delta > N minutes' },
];

function titleCase(text) {
  return String(text || '').replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildDraft(scope = 'company') {
  return {
    id: `${scope}-${Date.now()}`,
    name: '',
    scope,
    enabled: true,
    critical: false,
    trigger: { type: 'Status change', value: 'PRE_DISPATCH', threshold: 30 },
    conditions: [
      { field: 'margin', operator: '<', value: 10 },
    ],
    actions: [
      { type: 'Send notification' },
    ],
  };
}

export default function WorkflowAutomationEnginePanel({ t, onSave }) {
  const [config, setConfig] = useState(() => getWorkflowAutomationConfig());
  const [draft, setDraft] = useState(() => buildDraft('company'));
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const allRules = useMemo(
    () => [
      ...((config.useSystemDefaults ? config.systemRules : []).map((rule) => ({ ...rule, sourceLabel: 'System Default' }))),
      ...(config.companyRules || []).map((rule) => ({ ...rule, sourceLabel: 'Company Rule' })),
      ...(config.userRules || []).map((rule) => ({ ...rule, sourceLabel: 'User Rule' })),
    ],
    [config],
  );

  const panelStyle = {
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    background: t.surface,
    padding: 16,
    display: 'grid',
    gap: 12,
  };

  const inputStyle = {
    minHeight: 34,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    background: t.bgAlt,
    color: t.text,
    padding: '0 10px',
    fontSize: 12,
  };

  const saveConfig = (nextConfig, success = 'Workflow automation updated.') => {
    const stored = saveWorkflowAutomationConfig(nextConfig);
    setConfig(stored);
    setMessage(success);
    if (typeof onSave === 'function') {
      onSave(stored);
    }
  };

  const appendDraftRule = () => {
    const name = String(draft.name || '').trim();
    if (!name) {
      setMessage('Rule name is required.');
      return;
    }

    const key = draft.scope === 'user' ? 'userRules' : 'companyRules';
    const nextConfig = {
      ...config,
      [key]: [...(config[key] || []), draft],
    };

    saveConfig(nextConfig, `${titleCase(draft.scope)} rule created.`);
    setDraft(buildDraft(draft.scope));
  };

  const removeRule = (rule) => {
    if (rule.critical || rule.scope === 'system') {
      setMessage('System critical rules cannot be deleted.');
      return;
    }

    const key = rule.scope === 'user' ? 'userRules' : 'companyRules';
    const nextConfig = {
      ...config,
      [key]: (config[key] || []).filter((item) => item.id !== rule.id),
    };
    saveConfig(nextConfig, 'Rule deleted.');
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Workflow Automation Engine</div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>Event-driven rule execution from lifecycle transitions. System defaults stay enabled by default.</div>
          </div>
          <button
            type="button"
            onClick={() => saveConfig({ ...config, useSystemDefaults: !config.useSystemDefaults }, config.useSystemDefaults ? 'System default rules paused.' : 'System default rules enabled.')}
            style={{ border: `1px solid ${config.useSystemDefaults ? t.accent : t.border}`, background: config.useSystemDefaults ? t.accent : 'transparent', color: config.useSystemDefaults ? '#fff' : t.text, borderRadius: 8, minHeight: 34, padding: '0 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}
          >
            System Defaults: {config.useSystemDefaults ? 'Enabled' : 'Paused'}
          </button>
        </div>
      </div>

      <div style={panelStyle}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>Automation Rules</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {allRules.map((rule) => (
            <div key={rule.id} style={{ border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, display: 'grid', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{rule.name} {rule.critical ? '• Critical' : ''}</div>
                <button
                  type="button"
                  onClick={() => removeRule(rule)}
                  disabled={rule.critical || rule.scope === 'system'}
                  style={{ border: `1px solid ${t.error}`, color: t.error, background: 'transparent', borderRadius: 6, fontSize: 11, fontWeight: 700, minHeight: 28, padding: '0 10px', cursor: (rule.critical || rule.scope === 'system') ? 'not-allowed' : 'pointer', opacity: (rule.critical || rule.scope === 'system') ? 0.6 : 1 }}
                >
                  Delete
                </button>
              </div>
              <div style={{ fontSize: 11, color: t.textSecondary }}>{rule.sourceLabel}</div>
              <div style={{ fontSize: 12 }}>Trigger: <strong>{rule.trigger?.type}</strong>{rule.trigger?.value ? ` → ${rule.trigger.value}` : ''}{rule.trigger?.threshold !== undefined ? ` (${rule.trigger.threshold})` : ''}</div>
              <div style={{ fontSize: 12 }}>Actions: {(rule.actions || []).map((action) => action.type).join(', ') || 'None'}</div>
            </div>
          ))}
          {allRules.length === 0 && <div style={{ fontSize: 12, color: t.textSecondary }}>No rules configured.</div>}
        </div>
      </div>

      <div style={panelStyle}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>Add Rule</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
          <input value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="Rule name" style={inputStyle} />
          <select value={draft.scope} onChange={(event) => setDraft((prev) => ({ ...prev, scope: event.target.value }))} style={inputStyle}>
            <option value="company">Company-level customization</option>
            <option value="user">User-defined rule</option>
          </select>
          <select value={draft.trigger.type} onChange={(event) => setDraft((prev) => ({ ...prev, trigger: { ...prev.trigger, type: event.target.value } }))} style={inputStyle}>
            {WORKFLOW_TRIGGERS.map((trigger) => <option key={trigger} value={trigger}>{trigger}</option>)}
          </select>
          {draft.trigger.type === 'Status change' ? (
            <select value={draft.trigger.value} onChange={(event) => setDraft((prev) => ({ ...prev, trigger: { ...prev.trigger, value: event.target.value } }))} style={inputStyle}>
              {LOAD_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          ) : (
            <input type="number" value={draft.trigger.threshold} onChange={(event) => setDraft((prev) => ({ ...prev, trigger: { ...prev.trigger, threshold: Number(event.target.value || 0) } }))} placeholder="Threshold" style={inputStyle} />
          )}
          <select value={draft.conditions[0]?.field || 'margin'} onChange={(event) => setDraft((prev) => ({ ...prev, conditions: [{ ...(prev.conditions?.[0] || { operator: '<', value: 0 }), field: event.target.value }] }))} style={inputStyle}>
            {CONDITION_FIELDS.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}
          </select>
          <input type="number" value={draft.conditions[0]?.value ?? 0} onChange={(event) => setDraft((prev) => ({ ...prev, conditions: [{ ...(prev.conditions?.[0] || { field: 'margin', operator: '<' }), value: Number(event.target.value || 0) }] }))} placeholder="Condition value" style={inputStyle} />
          <select value={draft.actions[0]?.type || 'Send notification'} onChange={(event) => setDraft((prev) => ({ ...prev, actions: [{ type: event.target.value }] }))} style={inputStyle}>
            {WORKFLOW_ACTIONS.map((action) => <option key={action} value={action}>{action}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={appendDraftRule}
          style={{ border: `1px solid ${t.accent}`, background: t.accent, color: '#fff', borderRadius: 8, minHeight: 34, padding: '0 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12, width: 'fit-content' }}
        >
          Add Rule
        </button>
      </div>

      {message && <div style={{ fontSize: 12, color: t.textSecondary }}>{message}</div>}
    </div>
  );
}
