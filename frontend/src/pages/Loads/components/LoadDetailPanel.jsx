import React from 'react';
import { LoadStatusBadge } from '../../../components/LoadStatusBadge';
import { formatLoadStatusLabel, normalizeLoadStatus, ALLOWED_STATUS_TRANSITIONS } from '../../../utils/loadLifecycle';
import FinancialSummaryCard from './FinancialSummaryCard';
import OperationalActionsCard from './OperationalActionsCard';
import RiskSignalsCard from './RiskSignalsCard';
import EventLogCard from './EventLogCard';

function LoadStatusCard({ detail }) {
  const load = detail?.load;
  if (!load) return null;

  const currentStatus = normalizeLoadStatus(load.status);
  const nextStatuses = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  const history = Array.isArray(load.statusHistory) ? load.statusHistory : [];

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-alt)', fontSize: 13, fontWeight: 700 }}>
        Load Status
      </div>
      <div style={{ padding: 12, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LoadStatusBadge status={currentStatus} />
          {load.loadId && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>#{load.loadId}</span>}
        </div>

        {nextStatuses.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Next possible statuses</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {nextStatuses.map((s) => (
                <span key={s} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-alt)' }}>
                  {formatLoadStatusLabel(s)}
                </span>
              ))}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Status History</div>
            <div style={{ display: 'grid', gap: 4 }}>
              {history.slice(-5).reverse().map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11 }}>
                  <span style={{ fontWeight: 600 }}>{formatLoadStatusLabel(entry.toStatus || entry.status)}</span>
                  {entry.timestamp && (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadDetailPanel({ detail, risk, events, actionState, onDispatch, onReassign, onBidNetwork, onDelivered }) {
  return (
    <aside style={{ width: 380, minWidth: 320, borderLeft: '1px solid var(--border)', paddingLeft: 14, display: 'grid', gap: 12, alignContent: 'start' }}>
      <LoadStatusCard detail={detail} />
      <FinancialSummaryCard detail={detail} />
      <OperationalActionsCard
        detail={detail}
        status={detail?.load?.status}
        actionState={actionState}
        onDispatch={onDispatch}
        onReassign={onReassign}
        onBidNetwork={onBidNetwork}
        onDelivered={onDelivered}
      />
      <RiskSignalsCard risk={risk} status={detail?.load?.status} />
      <EventLogCard events={events} />
    </aside>
  );
}

export {LoadDetailPanel};
