import React from 'react';

function money(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function FinancialSummaryCard({ detail }) {
  const load = detail?.load;
  if (!load) {
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
        <div style={{ color: 'var(--text-secondary)' }}>Select a load to view financial summary.</div>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Financial Summary</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{money(load.revenue)}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Customer Revenue</div>
      <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
        <div>Carrier Cost: <strong>{money(load.carrierCost)}</strong></div>
        <div>Margin: <strong>{money(load.margin)}</strong> ({Number(load.marginPct || 0).toFixed(1)}%)</div>
        <div>Target Margin: <strong>{Number(load.targetMarginPct || 12).toFixed(1)}%</strong></div>
        <div>Lane Avg Margin: <strong>{Number(detail?.laneAverageMarginPct || 0).toFixed(1)}%</strong></div>
        <div>Delta vs Lane Avg: <strong>{Number(detail?.marginDeltaPct || 0).toFixed(1)}%</strong></div>
      </div>
    </div>
  );
}
