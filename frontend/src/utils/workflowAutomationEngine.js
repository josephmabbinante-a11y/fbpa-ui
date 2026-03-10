import { normalizeLoadStatus } from './loadLifecycle';

const WORKFLOW_AUTOMATION_STORAGE_KEY = 'fbpa_workflow_automation_config_v1';
const AI_SHADOW_EVENTS_STORAGE_KEY = 'fbpa_ai_shadow_lifecycle_events_v1';

const workflowListeners = new Set();

export const WORKFLOW_TRIGGERS = ['Status change', 'Margin threshold', 'SLA breach', 'Volatility threshold', 'Capacity heat threshold'];
export const WORKFLOW_ACTIONS = ['Send notification', 'Assign carrier', 'Lock dispatch', 'Escalate to role', 'Generate invoice draft', 'Create task', 'Change status', 'Trigger webhook'];

const SYSTEM_RULES = [
  {
    id: 'sys-status-exception-lock-invoice',
    name: 'Lock invoice on exception',
    scope: 'system',
    enabled: true,
    critical: true,
    trigger: { type: 'Status change', value: 'EXCEPTION' },
    conditions: [],
    actions: [{ type: 'Lock dispatch' }, { type: 'Escalate to role', role: 'ops_manager' }],
  },
  {
    id: 'sys-status-delivered-invoice-draft',
    name: 'Create invoice draft after delivery',
    scope: 'system',
    enabled: true,
    critical: true,
    trigger: { type: 'Status change', value: 'DELIVERED' },
    conditions: [],
    actions: [{ type: 'Generate invoice draft' }],
  },
  {
    id: 'sys-sla-breach-escalate',
    name: 'Escalate SLA breach',
    scope: 'system',
    enabled: true,
    critical: true,
    trigger: { type: 'SLA breach', threshold: 30 },
    conditions: [],
    actions: [{ type: 'Send notification', channel: 'In-App' }, { type: 'Escalate to role', role: 'dispatch_supervisor' }],
  },
];

function readStorage() {
  try {
    const raw = localStorage.getItem(WORKFLOW_AUTOMATION_STORAGE_KEY);
    if (!raw) {
      return {
        useSystemDefaults: true,
        companyRules: [],
        userRules: [],
      };
    }
    const parsed = JSON.parse(raw);
    return {
      useSystemDefaults: parsed?.useSystemDefaults !== false,
      companyRules: Array.isArray(parsed?.companyRules) ? parsed.companyRules : [],
      userRules: Array.isArray(parsed?.userRules) ? parsed.userRules : [],
    };
  } catch {
    return {
      useSystemDefaults: true,
      companyRules: [],
      userRules: [],
    };
  }
}

export function getWorkflowAutomationConfig() {
  const stored = readStorage();
  return {
    useSystemDefaults: stored.useSystemDefaults,
    systemRules: SYSTEM_RULES.map((rule) => ({ ...rule })),
    companyRules: stored.companyRules,
    userRules: stored.userRules,
  };
}

export function saveWorkflowAutomationConfig(nextConfig) {
  const current = getWorkflowAutomationConfig();

  const payload = {
    useSystemDefaults: nextConfig?.useSystemDefaults !== false,
    companyRules: Array.isArray(nextConfig?.companyRules)
      ? nextConfig.companyRules.filter((rule) => !SYSTEM_RULES.some((systemRule) => systemRule.id === rule.id))
      : current.companyRules,
    userRules: Array.isArray(nextConfig?.userRules)
      ? nextConfig.userRules.filter((rule) => !SYSTEM_RULES.some((systemRule) => systemRule.id === rule.id))
      : current.userRules,
  };

  localStorage.setItem(WORKFLOW_AUTOMATION_STORAGE_KEY, JSON.stringify(payload));
  return getWorkflowAutomationConfig();
}

function toMetricNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function evaluateTrigger(rule, event) {
  const triggerType = rule?.trigger?.type;
  const threshold = toMetricNumber(rule?.trigger?.threshold);
  const nextStatus = normalizeLoadStatus(event?.nextStatus || event?.load?.status);
  const metrics = event?.metrics || {};

  if (triggerType === 'Status change') {
    const target = normalizeLoadStatus(rule?.trigger?.value);
    return nextStatus === target;
  }
  if (triggerType === 'Margin threshold') {
    return toMetricNumber(metrics.margin) < threshold;
  }
  if (triggerType === 'SLA breach') {
    return toMetricNumber(metrics.eta_delta_minutes) > threshold;
  }
  if (triggerType === 'Volatility threshold') {
    return toMetricNumber(metrics.volatility) > threshold;
  }
  if (triggerType === 'Capacity heat threshold') {
    return toMetricNumber(metrics.capacity_heat) > threshold;
  }

  return false;
}

function evaluateCondition(condition, metrics) {
  if (!condition) return true;
  const field = String(condition?.field || '');
  const operator = String(condition?.operator || '<');
  const threshold = toMetricNumber(condition?.value);
  const metricValue = toMetricNumber(metrics?.[field]);

  if (operator === '<') return metricValue < threshold;
  if (operator === '>') return metricValue > threshold;
  if (operator === '<=') return metricValue <= threshold;
  if (operator === '>=') return metricValue >= threshold;
  if (operator === '==') return metricValue === threshold;
  return false;
}

function evaluateRule(rule, event) {
  if (!rule?.enabled) return false;
  if (!evaluateTrigger(rule, event)) return false;

  const metrics = event?.metrics || {};
  const conditions = Array.isArray(rule?.conditions) ? rule.conditions : [];
  return conditions.every((condition) => evaluateCondition(condition, metrics));
}

export function evaluateWorkflowActions(event, config = getWorkflowAutomationConfig()) {
  const systemRules = config?.useSystemDefaults === false ? [] : (config?.systemRules || SYSTEM_RULES);
  const rulePool = [...systemRules, ...(config?.companyRules || []), ...(config?.userRules || [])];

  const matches = rulePool.filter((rule) => evaluateRule(rule, event));
  return matches.flatMap((rule) => (Array.isArray(rule.actions) ? rule.actions : []).map((action) => ({
    ruleId: rule.id,
    ruleName: rule.name,
    scope: rule.scope || 'user',
    action,
  })));
}

export function recordLifecycleShadowEvent(payload) {
  try {
    const raw = localStorage.getItem(AI_SHADOW_EVENTS_STORAGE_KEY);
    const existing = Array.isArray(raw ? JSON.parse(raw) : null) ? JSON.parse(raw) : [];
    const next = [
      {
        ...payload,
        timestamp: payload?.timestamp || new Date().toISOString(),
      },
      ...existing,
    ].slice(0, 500);

    localStorage.setItem(AI_SHADOW_EVENTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // no-op
  }
}

export function emitWorkflowEvent(event, config = getWorkflowAutomationConfig()) {
  const actions = evaluateWorkflowActions(event, config);
  const envelope = {
    event,
    actions,
    timestamp: new Date().toISOString(),
  };

  recordLifecycleShadowEvent({
    type: event?.type || 'status_transition',
    loadId: event?.load?.id || event?.loadId || '',
    fromStatus: normalizeLoadStatus(event?.previousStatus),
    toStatus: normalizeLoadStatus(event?.nextStatus || event?.load?.status),
    actions,
    metrics: event?.metrics || {},
  });

  workflowListeners.forEach((listener) => {
    try {
      listener(envelope);
    } catch {
      // no-op
    }
  });

  return envelope;
}

export function subscribeWorkflowEvents(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }

  workflowListeners.add(listener);
  return () => {
    workflowListeners.delete(listener);
  };
}

export function getAiShadowLifecycleEvents() {
  try {
    const raw = localStorage.getItem(AI_SHADOW_EVENTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}