import React from 'react';

export default function RiskSignalsCard({ risk }) {
  if (!risk) {
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
        <div style={{ color: 'var(--text-secondary)' }}>No risk signals loaded yet.</div>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Risk Signals</div>
      <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
        <div>Lane Volatility: <strong>{risk.laneVolatilityScore}/100</strong></div>
        <div>Capacity Heat: <strong>{risk.capacityHeatIndex}/100</strong></div>
        <div>Compliance: <strong>{risk.complianceStatus}</strong></div>
        <div>Pickup Countdown: <strong>{Math.max(0, Math.round((risk.pickupCountdownMinutes || 0) / 60))}h</strong></div>
      </div>
      {Array.isArray(risk.warnings) && risk.warnings.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--warning)' }}>
          Warnings: {risk.warnings.join(', ')}
        </div>
      )}
    </div>
  );
}
