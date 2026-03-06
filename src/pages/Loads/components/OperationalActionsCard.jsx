import React from 'react';
import { deriveRouteDetailModules } from '../../../utils/loadLifecycle';

export default function OperationalActionsCard({ detail, status, actionState, onDispatch, onReassign, onBidNetwork, onDelivered }) {
  const can = detail?.controls || {};
  const disabled = actionState?.busy;
  const modules = deriveRouteDetailModules(status);

  if (!modules.showDispatchControls && !can.canMarkDelivered) {
    return null;
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Operational Controls</div>
      <div style={{ display: 'grid', gap: 8 }}>
        <button type="button" disabled={!can.canDispatch || disabled} onClick={onDispatch} style={btnStyle(disabled)}>
          Dispatch
        </button>
        <button type="button" disabled={!can.canReassign || disabled} onClick={onReassign} style={btnStyle(disabled)}>
          Reassign Carrier
        </button>
        <button type="button" disabled={!can.canBidNetwork || disabled} onClick={onBidNetwork} style={btnStyle(disabled)}>
          Send to Bid Network
        </button>
        <button type="button" disabled={!can.canMarkDelivered || disabled} onClick={onDelivered} style={btnStyle(disabled)}>
          Mark Delivered
        </button>
      </div>
      {actionState?.error && (
        <div style={{ marginTop: 10, color: 'var(--error)', fontSize: 12 }}>
          {actionState.error}
        </div>
      )}
      {actionState?.success && (
        <div style={{ marginTop: 10, color: 'var(--success)', fontSize: 12 }}>
          {actionState.success}
        </div>
      )}
    </div>
  );
}

function btnStyle(disabled) {
  return {
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--bg-alt)',
    color: 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    textAlign: 'left',
    fontSize: 13,
    fontWeight: 600,
  };
}
