import React from 'react';

export default function StickyLoadHeader({ loadNumber, status, customer, totalMiles, sellRate, buyRate, grossMargin, marginPct, riskIndicator }) {
  // Color logic for margin
  let marginColor = '#2ecc40'; // green
  if (marginPct < 8) marginColor = '#ff4136'; // red
  else if (marginPct < 14) marginColor = '#ffdc00'; // yellow

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(8, minmax(0,1fr))',
      gap: 12,
      alignItems: 'center',
      padding: '10px 0',
      background: '#fff',
      borderBottom: '2px solid #eee',
      position: 'sticky',
      top: 0,
      zIndex: 20,
    }}>
      <div><strong>Load #</strong><br />{loadNumber}</div>
      <div><strong>Status</strong><br />{status}</div>
      <div><strong>Customer</strong><br />{customer}</div>
      <div><strong>Total Miles</strong><br />{totalMiles}</div>
      <div><strong>Sell Rate</strong><br />${sellRate}</div>
      <div><strong>Buy Rate</strong><br />${buyRate}</div>
      <div><strong>Gross Margin $</strong><br /><span style={{ color: marginColor }}>${grossMargin}</span></div>
      <div><strong>Margin %</strong><br /><span style={{ color: marginColor }}>{marginPct}%</span></div>
      <div><strong>Risk</strong><br /><span style={{ color: riskIndicator === 'High' ? '#ff4136' : riskIndicator === 'Medium' ? '#ffdc00' : '#2ecc40' }}>{riskIndicator}</span></div>
    </div>
  );
}
