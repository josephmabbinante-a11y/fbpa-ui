

import React from 'react';
import KPIWithTrend from './KPIWithTrend';
import Gauge from './Gauge';
import LineChart from './LineChart';
import Button from './Button';

const RateBreakdown = ({
  kpis,
  winProb,
  setWinProb,
}) => {
  const carrierCost = Number(kpis?.carrierCost ?? 0);
  const predictedMarket = Number(kpis?.predictedMarket ?? 0);
  const recommendedSell = Number(kpis?.recommendedSell ?? 0);
  const winProbHistory = Array.isArray(kpis?.winProbHistory) ? kpis.winProbHistory : [];
  const swing = Number(kpis?.swing ?? 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 24 }}>
        <KPIWithTrend label="Carrier Cost" value={carrierCost} format="currency" trendData={winProbHistory} trendColor="#4fc3f7" />
        <KPIWithTrend label="Predicted Market" value={predictedMarket} format="currency" trendData={winProbHistory} trendColor="#81c784" />
        <KPIWithTrend label="Recommended Sell" value={recommendedSell} format="currency" trendData={winProbHistory} trendColor="#ffd54f" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ flex: 2 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Win Probability ~{winProb}%</div>
          <input
            type="range"
            min={0}
            max={100}
            value={winProb}
            onChange={e => setWinProb(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <LineChart data={winProbHistory} label="Win Probability vs. Price" />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Gauge value={winProb + '%'} label="Win Probability" min={0} max={100} />
          <div style={{ fontSize: 14, color: '#aaa' }}>±${swing}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Button variant="primary">Book This Rate</Button>
        <Button variant="secondary">Save</Button>
      </div>
    </div>
  );
};

export default RateBreakdown;
