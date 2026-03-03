import React, { useEffect } from 'react';

export default function MarketIntelligenceModule({ load, risk, marketRate, opportunityGap, laneLabel }) {
  useEffect(() => {
    if (!load) return;
    const miles = Number(load.miles || 0);
    const payload = {
      origin: load.origin?.city ? `${load.origin.city}${load.origin?.state ? `, ${load.origin.state}` : ''}` : '',
      destination: load.destination?.city ? `${load.destination.city}${load.destination?.state ? `, ${load.destination.state}` : ''}` : '',
      miles,
      marketRPM: miles > 0 ? Number((Number(marketRate || 0) / miles).toFixed(2)) : 0,
      volatilityIndex: Number(risk?.laneVolatilityScore || 0),
      capacityScore: Number(risk?.capacityHeatIndex || 0),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('fbpa_market_intelligence_feed', JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('fbpa:market-intelligence', { detail: payload }));
  }, [load, marketRate, risk?.laneVolatilityScore, risk?.capacityHeatIndex]);

  if (!load) return null;

  return (
    <section style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-alt)', padding: 20, display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.3 }}>MARKET INTELLIGENCE</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Lane</span><strong>{laneLabel || '—'}</strong></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Market Rate</span><strong>${Number(marketRate || 0).toLocaleString()}</strong></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Opportunity Gap</span><strong>{opportunityGap >= 0 ? '+' : ''}${Number(opportunityGap || 0).toLocaleString()}</strong></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Lane Volatility</span><strong>{Number(risk?.laneVolatilityScore || 0)}</strong></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Capacity Heat</span><strong>{Number(risk?.capacityHeatIndex || 0)}</strong></div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Feeds pricing engine automatically from selected load lifecycle context.</div>
    </section>
  );
}
