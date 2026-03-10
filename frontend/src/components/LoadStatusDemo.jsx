// Example: Using LoadStatusBadge in a React page
import React, { useState } from 'react';
import { LoadStatusBadge } from './LoadStatusBadge';

const demoStates = [
  'CREATED', 'AUCTION_OPEN', 'AUCTION_BID', 'AUCTION_CLOSED', 'TENDER_SENT',
  'TENDER_ACCEPTED', 'TENDER_REJECTED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'REAUCTION'
];

export default function LoadStatusDemo() {
  const [stateIdx, setStateIdx] = useState(0);
  const currentState = demoStates[stateIdx];

  return (
    <div style={{ padding: 24 }}>
      <h2>Load Status Badge Demo</h2>
      <LoadStatusBadge status={currentState} />
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => setStateIdx((i) => (i + 1) % demoStates.length)}
          style={{ padding: '8px 16px', fontSize: '1em' }}
        >
          Next State
        </button>
      </div>
      <div style={{ marginTop: 16 }}>
        <strong>Current State:</strong> {currentState}
      </div>
    </div>
  );
}
