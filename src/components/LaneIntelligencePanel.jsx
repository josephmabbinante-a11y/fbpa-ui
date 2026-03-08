import React from 'react';

export default function LaneIntelligencePanel({ stops, carrierAssigned, onComplete }) {
  // Simulated calculations
  const totalMiles = stops.length * 500;
  const deadheadEstimate = carrierAssigned ? 50 : null;
  const capacityHeatIndex = Math.floor(Math.random() * 100);
  const laneVolatilityScore = Math.floor(Math.random() * 100);
  const marketRPM = (Math.random() * 3 + 1).toFixed(2);
  const suggestedSellRate = totalMiles * marketRPM;
  const suggestedBuyRate = totalMiles * (marketRPM - 0.5);
  const marginBandPrediction = ((suggestedSellRate - suggestedBuyRate) / suggestedSellRate * 100).toFixed(1);
  const riskLevel = marginBandPrediction < 8 ? 'High' : marginBandPrediction < 14 ? 'Medium' : 'Low';

  // Completion logic: at least 2 stops
  const isComplete = stops.length >= 2;
  if (isComplete && onComplete) onComplete();

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div><strong>Total Miles:</strong> {totalMiles}</div>
      {carrierAssigned && <div><strong>Deadhead Estimate:</strong> {deadheadEstimate}</div>}
      <div><strong>Capacity Heat Index:</strong> {capacityHeatIndex}</div>
      <div><strong>Lane Volatility Score:</strong> {laneVolatilityScore}</div>
      <div><strong>Market RPM:</strong> {marketRPM}</div>
      <div><strong>Suggested Sell Rate:</strong> ${suggestedSellRate.toFixed(2)}</div>
      <div><strong>Suggested Buy Rate:</strong> ${suggestedBuyRate.toFixed(2)}</div>
      <div><strong>Margin Band Prediction:</strong> {marginBandPrediction}%</div>
      <div><strong>Risk Level:</strong> <span style={{ color: riskLevel === 'High' ? '#ff4136' : riskLevel === 'Medium' ? '#ffdc00' : '#2ecc40' }}>{riskLevel}</span></div>
      {isComplete && <div style={{ color: 'green', fontWeight: 600 }}>Lane Intelligence complete</div>}
    </div>
  );
}
