
import React from 'react';
import KPIWithTrend from './KPIWithTrend';

const SummaryBar = () => {
  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center', justifyContent: 'center' }}>
      <KPIWithTrend label="Total Loads" value={3203} format="number" trendData={[3000,3100,3150,3203]} trendColor="#4fc3f7" />
      <KPIWithTrend label="Avg Rate" value={2.92} format="currency" trendData={[2.8,2.85,2.9,2.92]} trendColor="#81c784" />
      <KPIWithTrend label="On-Time %" value={96} format="percent" trendData={[94,95,96,96]} trendColor="#ffd54f" />
      <KPIWithTrend label="Risk Score" value={0.76} format="number" trendData={[0.8,0.78,0.77,0.76]} trendColor="#e57373" />
    </div>
  );
};

export default SummaryBar;
