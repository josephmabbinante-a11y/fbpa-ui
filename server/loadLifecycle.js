export const LOAD_STATUSES = [
  'DRAFT',
  'QUOTED',
  'RATE_LOCKED',
  'BOOKED',
  'TENDERED',
  'CARRIER_ASSIGNED',
  'DRIVER_ASSIGNED',
  'PRE_DISPATCH',
  'DISPATCHED',
  'AT_PICKUP',
  'LOADED',
  'IN_TRANSIT',
  'AT_DELIVERY',
  'DELIVERED',
  'POD_RECEIVED',
  'INVOICED',
  'READY_TO_PAY',
  'PAID',
  'DETENTION_ACTIVE',
  'LAYOVER_REQUIRED',
  'TONU_PENDING',
  'CLAIM_OPEN',
  'SHORT_PAID',
  'RECONCILIATION_REQUIRED',
  'CANCELLED',
  'ON_HOLD',
  'EXCEPTION',
];

export const LOAD_STATUS_SET = new Set(LOAD_STATUSES);

const LEGACY_STATUS_ALIASES = {
  open: 'DRAFT',
  in_transit: 'IN_TRANSIT',
  delivered: 'DELIVERED',
  at_risk: 'EXCEPTION',
  uncovered: 'TENDERED',
  void: 'CANCELLED',
  deleted: 'CANCELLED',
};

export const ALLOWED_STATUS_TRANSITIONS = {
  DRAFT: ['QUOTED', 'ON_HOLD', 'CANCELLED'],
  QUOTED: ['RATE_LOCKED', 'ON_HOLD', 'CANCELLED'],
  RATE_LOCKED: ['BOOKED', 'ON_HOLD', 'CANCELLED'],
  BOOKED: ['TENDERED', 'ON_HOLD', 'CANCELLED'],
  TENDERED: ['CARRIER_ASSIGNED', 'ON_HOLD', 'CANCELLED', 'EXCEPTION'],
  CARRIER_ASSIGNED: ['DRIVER_ASSIGNED', 'ON_HOLD', 'CANCELLED', 'EXCEPTION'],
  DRIVER_ASSIGNED: ['PRE_DISPATCH', 'ON_HOLD', 'CANCELLED', 'EXCEPTION'],
  PRE_DISPATCH: ['DISPATCHED', 'ON_HOLD', 'CANCELLED', 'EXCEPTION'],
  DISPATCHED: ['AT_PICKUP', 'DETENTION_ACTIVE', 'LAYOVER_REQUIRED', 'TONU_PENDING', 'EXCEPTION'],
  AT_PICKUP: ['LOADED', 'DETENTION_ACTIVE', 'EXCEPTION'],
  LOADED: ['IN_TRANSIT', 'EXCEPTION'],
  IN_TRANSIT: ['AT_DELIVERY', 'EXCEPTION', 'DETENTION_ACTIVE', 'LAYOVER_REQUIRED'],
  AT_DELIVERY: ['DELIVERED', 'EXCEPTION'],
  DELIVERED: ['POD_RECEIVED', 'EXCEPTION'],
  POD_RECEIVED: ['INVOICED', 'EXCEPTION'],
  INVOICED: ['READY_TO_PAY', 'SHORT_PAID', 'RECONCILIATION_REQUIRED', 'EXCEPTION'],
  READY_TO_PAY: ['PAID', 'SHORT_PAID', 'RECONCILIATION_REQUIRED', 'EXCEPTION'],
  SHORT_PAID: ['RECONCILIATION_REQUIRED', 'READY_TO_PAY', 'EXCEPTION'],
  RECONCILIATION_REQUIRED: ['READY_TO_PAY', 'EXCEPTION'],
  CLAIM_OPEN: ['RECONCILIATION_REQUIRED', 'READY_TO_PAY', 'EXCEPTION'],
  DETENTION_ACTIVE: ['IN_TRANSIT', 'AT_DELIVERY', 'EXCEPTION'],
  LAYOVER_REQUIRED: ['IN_TRANSIT', 'AT_DELIVERY', 'EXCEPTION'],
  TONU_PENDING: ['CANCELLED', 'RECONCILIATION_REQUIRED', 'EXCEPTION'],
  ON_HOLD: ['DRAFT', 'QUOTED', 'RATE_LOCKED', 'BOOKED', 'TENDERED', 'CARRIER_ASSIGNED', 'DRIVER_ASSIGNED', 'PRE_DISPATCH', 'EXCEPTION', 'CANCELLED'],
  EXCEPTION: ['ON_HOLD', 'RECONCILIATION_REQUIRED', 'CLAIM_OPEN', 'CANCELLED', 'PRE_DISPATCH', 'IN_TRANSIT', 'AT_DELIVERY', 'DELIVERED'],
  CANCELLED: [],
  PAID: [],
};

export function normalizeLoadStatus(value) {
  if (!value) return 'DRAFT';
  const raw = String(value).trim();
  const alias = LEGACY_STATUS_ALIASES[raw.toLowerCase()];
  if (alias) return alias;
  const normalized = raw.toUpperCase().replace(/\s+/g, '_');
  return LOAD_STATUS_SET.has(normalized) ? normalized : 'DRAFT';
}

export function formatLoadStatusLabel(status) {
  return normalizeLoadStatus(status).replaceAll('_', ' ');
}

export function canTransitionStatus(fromStatus, toStatus, options = {}) {
  const source = normalizeLoadStatus(fromStatus);
  const target = normalizeLoadStatus(toStatus);

  if (source === target) return true;
  if (Boolean(options.overrideRolePermission)) return true;

  const allowed = ALLOWED_STATUS_TRANSITIONS[source] || [];
  return allowed.includes(target);
}

export function deriveControlsForStatus(status) {
  const normalized = normalizeLoadStatus(status);
  return {
    canDispatch: normalized === 'PRE_DISPATCH',
    canReassign: !['DELIVERED', 'POD_RECEIVED', 'INVOICED', 'READY_TO_PAY', 'PAID', 'CANCELLED'].includes(normalized),
    canBidNetwork: ['BOOKED', 'TENDERED', 'CARRIER_ASSIGNED', 'DRIVER_ASSIGNED', 'PRE_DISPATCH'].includes(normalized),
    canMarkDelivered: normalized === 'AT_DELIVERY',
  };
}

export function createStatusHistoryEntry({ fromStatus, toStatus, userId, reason, source }) {
  return {
    id: `ST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    fromStatus: normalizeLoadStatus(fromStatus),
    toStatus: normalizeLoadStatus(toStatus),
    status: normalizeLoadStatus(toStatus),
    userId: String(userId || 'system'),
    reason: String(reason || ''),
    source: String(source || 'workflow-engine'),
    createdAt: new Date().toISOString(),
  };
}

export function findTransitionPath(fromStatus, toStatus) {
  const from = normalizeLoadStatus(fromStatus);
  const to = normalizeLoadStatus(toStatus);
  if (from === to) return [from];

  const queue = [[from]];
  const visited = new Set([from]);

  while (queue.length > 0) {
    const path = queue.shift();
    const tail = path[path.length - 1];
    const nextStates = ALLOWED_STATUS_TRANSITIONS[tail] || [];

    for (const next of nextStates) {
      if (visited.has(next)) continue;
      const nextPath = [...path, next];
      if (next === to) return nextPath;
      visited.add(next);
      queue.push(nextPath);
    }
  }

  return null;
}
