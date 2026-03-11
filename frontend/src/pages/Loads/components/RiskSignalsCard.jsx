import React from 'react';
import { deriveRouteDetailModules } from '../../../utils/loadLifecycle';

export default function RiskSignalsCard({ risk, status }) {
  const modules = deriveRouteDetailModules(status);

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
        <div>Lane Volatility: <strong>{Number.isFinite(Number(risk.laneVolatilityScore)) ? `${Number(risk.laneVolatilityScore)}/100` : '—'}</strong></div>
        {modules.showCapacityHeat && <div>Capacity Heat: <strong>{Number.isFinite(Number(risk.capacityHeatIndex)) ? `${Number(risk.capacityHeatIndex)}/100` : '—'}</strong></div>}
        <div>Compliance: <strong>{risk.complianceStatus || '—'}</strong></div>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: Array.isArray(risk.warnings) && risk.warnings.length > 0 ? 'var(--warning)' : 'var(--text-secondary)' }}>
        Warnings: {Array.isArray(risk.warnings) && risk.warnings.length > 0 ? risk.warnings.join(', ') : 'None'}
      </div>
    </div>
  );
}
