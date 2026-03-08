// UI Badge System for Load Lifecycle (React)
// Usage: <LoadStatusBadge status={currentState} />
import React from 'react';

const statusColors = {
  CREATED: '#bdbdbd',
  AUCTION_OPEN: '#1976d2',
  AUCTION_BID: '#0288d1',
  AUCTION_CLOSED: '#7b1fa2',
  TENDER_SENT: '#fbc02d',
  TENDER_ACCEPTED: '#388e3c',
  TENDER_REJECTED: '#d32f2f',
  ASSIGNED: '#512da8',
  IN_TRANSIT: '#0097a7',
  DELIVERED: '#388e3c',
  CANCELLED: '#616161',
  REAUCTION: '#f57c00',
};

const statusLabels = {
  CREATED: 'Created',
  AUCTION_OPEN: 'Auction Open',
  AUCTION_BID: 'Bid Received',
  AUCTION_CLOSED: 'Auction Closed',
  TENDER_SENT: 'Tender Sent',
  TENDER_ACCEPTED: 'Tender Accepted',
  TENDER_REJECTED: 'Tender Rejected',
  ASSIGNED: 'Assigned',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REAUCTION: 'Re-Auction',
};

export function LoadStatusBadge({ status }) {
  const color = statusColors[status] || '#bdbdbd';
  const label = statusLabels[status] || status;
  return (
    <span
      style={{
        background: color,
        color: '#fff',
        borderRadius: '12px',
        padding: '4px 12px',
        fontWeight: 600,
        fontSize: '0.95em',
        marginRight: '8px',
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  );
}
