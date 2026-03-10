

import React from 'react';
import KPIWithTrend from './KPIWithTrend';
import { mockRateData } from '../mock/mockRateData';

const SummaryBar = () => {
  const summary = mockRateData.summary;
  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center', justifyContent: 'center' }}>
      <KPIWithTrend label="Total Loads" value={summary.totalLoads} format="number" trendData={[3000,3100,3150,summary.totalLoads]} trendColor="#4fc3f7" />
      <KPIWithTrend label="Avg Rate" value={summary.avgRate} format="currency" trendData={[2.8,2.85,2.9,summary.avgRate]} trendColor="#81c784" />
      <KPIWithTrend label="On-Time %" value={summary.onTime} format="percent" trendData={[94,95,96,summary.onTime]} trendColor="#ffd54f" />
      <KPIWithTrend label="Risk Score" value={summary.riskScore} format="number" trendData={[0.8,0.78,0.77,summary.riskScore]} trendColor="#e57373" />
    </div>
  );
};

export default SummaryBar;
