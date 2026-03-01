

import React from 'react';
import KPIWithTrend from './KPIWithTrend';
import { useDemo } from '../demo/DemoContext';
import { mockRateData } from '../mock/mockRateData';

const EMPTY_SUMMARY = {
  totalLoads: 0,
  avgRate: 0,
  onTime: 0,
  riskScore: 0,
};

const SummaryBar = () => {
  const { demoMode } = useDemo();
  const summary = demoMode ? mockRateData.summary : EMPTY_SUMMARY;
  const totalLoadsTrend = demoMode ? [3000, 3100, 3150, summary.totalLoads] : [];
  const avgRateTrend = demoMode ? [2.8, 2.85, 2.9, summary.avgRate] : [];
  const onTimeTrend = demoMode ? [94, 95, 96, summary.onTime] : [];
  const riskScoreTrend = demoMode ? [0.8, 0.78, 0.77, summary.riskScore] : [];

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center', justifyContent: 'center' }}>
      <KPIWithTrend label="Total Loads" value={summary.totalLoads} format="number" trendData={totalLoadsTrend} trendColor="#4fc3f7" />
      <KPIWithTrend label="Avg Rate" value={summary.avgRate} format="currency" trendData={avgRateTrend} trendColor="#81c784" />
      <KPIWithTrend label="On-Time %" value={summary.onTime} format="percent" trendData={onTimeTrend} trendColor="#ffd54f" />
      <KPIWithTrend label="Risk Score" value={summary.riskScore} format="number" trendData={riskScoreTrend} trendColor="#e57373" />
    </div>
  );
};

export default SummaryBar;
