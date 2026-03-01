import React from 'react';
import FinancialSummaryCard from './FinancialSummaryCard';
import OperationalActionsCard from './OperationalActionsCard';
import RiskSignalsCard from './RiskSignalsCard';
import EventLogCard from './EventLogCard';

export default function LoadDetailPanel({ detail, risk, events, actionState, onDispatch, onReassign, onBidNetwork, onDelivered }) {
  return (
    <aside style={{ width: 380, minWidth: 320, borderLeft: '1px solid var(--border)', paddingLeft: 14, display: 'grid', gap: 12, alignContent: 'start' }}>
      <FinancialSummaryCard detail={detail} />
      <OperationalActionsCard
        detail={detail}
        actionState={actionState}
        onDispatch={onDispatch}
        onReassign={onReassign}
        onBidNetwork={onBidNetwork}
        onDelivered={onDelivered}
      />
      <RiskSignalsCard risk={risk} />
      <EventLogCard events={events} />
    </aside>
  );
}
