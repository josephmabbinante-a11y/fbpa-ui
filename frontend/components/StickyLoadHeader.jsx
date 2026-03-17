import React from 'react';

export default function StickyLoadHeader(props) {
  // TODO: Render load summary header
  return (
    <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 8 }}>
      <strong>Load #{props.loadNumber}</strong> | Status: {props.status} | Customer: {props.customer}
    </div>
  );
}
