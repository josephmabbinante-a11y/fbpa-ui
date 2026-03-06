// Load Lifecycle State Machine (TypeScript)
// States and transitions for auction/tender workflows

export type LoadState =
  | 'CREATED'
  | 'AUCTION_OPEN'
  | 'AUCTION_BID'
  | 'AUCTION_CLOSED'
  | 'TENDER_SENT'
  | 'TENDER_ACCEPTED'
  | 'TENDER_REJECTED'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REAUCTION';

export type LoadEvent =
  | 'OPEN_AUCTION'
  | 'BID_RECEIVED'
  | 'CLOSE_AUCTION'
  | 'SEND_TENDER'
  | 'ACCEPT_TENDER'
  | 'REJECT_TENDER'
  | 'ASSIGN_CARRIER'
  | 'START_TRANSIT'
  | 'COMPLETE_DELIVERY'
  | 'CANCEL_LOAD'
  | 'START_REAUCTION';

export const transitions: Record<LoadState, Partial<Record<LoadEvent, LoadState>>> = {
  CREATED: { OPEN_AUCTION: 'AUCTION_OPEN', CANCEL_LOAD: 'CANCELLED' },
  AUCTION_OPEN: { BID_RECEIVED: 'AUCTION_BID', CANCEL_LOAD: 'CANCELLED' },
  AUCTION_BID: { CLOSE_AUCTION: 'AUCTION_CLOSED', CANCEL_LOAD: 'CANCELLED' },
  AUCTION_CLOSED: {
    SEND_TENDER: 'TENDER_SENT',
    START_REAUCTION: 'REAUCTION',
    CANCEL_LOAD: 'CANCELLED',
  },
  TENDER_SENT: {
    ACCEPT_TENDER: 'TENDER_ACCEPTED',
    REJECT_TENDER: 'TENDER_REJECTED',
    CANCEL_LOAD: 'CANCELLED',
  },
  TENDER_ACCEPTED: { ASSIGN_CARRIER: 'ASSIGNED', CANCEL_LOAD: 'CANCELLED' },
  TENDER_REJECTED: { START_REAUCTION: 'REAUCTION', CANCEL_LOAD: 'CANCELLED' },
  ASSIGNED: { START_TRANSIT: 'IN_TRANSIT', CANCEL_LOAD: 'CANCELLED' },
  IN_TRANSIT: { COMPLETE_DELIVERY: 'DELIVERED', CANCEL_LOAD: 'CANCELLED' },
  DELIVERED: {},
  CANCELLED: {},
  REAUCTION: { OPEN_AUCTION: 'AUCTION_OPEN', CANCEL_LOAD: 'CANCELLED' },
};

export function getNextState(current: LoadState, event: LoadEvent): LoadState | null {
  const next = transitions[current]?.[event];
  return next || null;
}

// Exception handling logic
export class FSMException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FSMException';
  }
}

export function transitionState(current: LoadState, event: LoadEvent): LoadState {
  const next = getNextState(current, event);
  if (!next) {
    throw new FSMException(`Invalid transition: ${current} + ${event}`);
  }
  return next;
}

// Auto-fallback re-auction logic
export function autoFallbackReauction(current: LoadState): LoadState {
  if (current === 'AUCTION_CLOSED' || current === 'TENDER_REJECTED') {
    return 'REAUCTION';
  }
  throw new FSMException('Auto-fallback re-auction not allowed from current state');
}
