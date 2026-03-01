

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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 24 }}>
        <KPIWithTrend label="Carrier Cost" value={kpis.carrierCost} format="currency" trendData={[2.2,2.3,2.35,2.37]} trendColor="#4fc3f7" />
        <KPIWithTrend label="Predicted Market" value={kpis.predictedMarket} format="currency" trendData={[3100,3120,3150,3180]} trendColor="#81c784" />
        <KPIWithTrend label="Recommended Sell" value={kpis.recommendedSell} format="currency" trendData={[3400,3420,3430,3445]} trendColor="#ffd54f" />
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
          <LineChart data={kpis.winProbHistory} label="Win Probability vs. Price" />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Gauge value={winProb + '%'} label="Win Probability" min={0} max={100} />
          <div style={{ fontSize: 14, color: '#aaa' }}>±${kpis.swing}</div>
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
