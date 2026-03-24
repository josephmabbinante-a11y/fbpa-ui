// UI Badge System for Load Lifecycle (React)
// Usage: <LoadStatusBadge status={currentState} />
import React from 'react';
import { normalizeLoadStatus, formatLoadStatusLabel } from '../utils/loadLifecycle';

const STATUS_COLORS = {
  DRAFT: '#94a3b8',
  QUOTED: '#64748b',
  RATE_LOCKED: '#6366f1',
  BOOKED: '#8b5cf6',
  TENDERED: '#f59e0b',
  CARRIER_ASSIGNED: '#a855f7',
  DRIVER_ASSIGNED: '#7c3aed',
  PRE_DISPATCH: '#0ea5e9',
  DISPATCHED: '#3b82f6',
  AT_PICKUP: '#06b6d4',
  LOADED: '#14b8a6',
  IN_TRANSIT: '#0891b2',
  AT_DELIVERY: '#10b981',
  DELIVERED: '#22c55e',
  POD_RECEIVED: '#16a34a',
  INVOICED: '#059669',
  READY_TO_PAY: '#047857',
  PAID: '#15803d',
  DETENTION_ACTIVE: '#ef4444',
  LAYOVER_REQUIRED: '#f97316',
  TONU_PENDING: '#dc2626',
  CLAIM_OPEN: '#e11d48',
  SHORT_PAID: '#be123c',
  RECONCILIATION_REQUIRED: '#d946ef',
  CANCELLED: '#6b7280',
  ON_HOLD: '#eab308',
  EXCEPTION: '#ef4444',
};

export { STATUS_COLORS };

export function LoadStatusBadge({ status, size = 'md' }) {
  const normalized = normalizeLoadStatus(status);
  const color = STATUS_COLORS[normalized] || '#94a3b8';
  const label = formatLoadStatusLabel(normalized);
  const isSmall = size === 'sm';
  return (
    <span
      style={{
        background: `${color}18`,
        color: color,
        borderRadius: 99,
        padding: isSmall ? '2px 8px' : '4px 12px',
        fontWeight: 700,
        fontSize: isSmall ? 10 : 12,
        display: 'inline-block',
        textTransform: 'capitalize',
        letterSpacing: 0.3,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
