

import React from 'react';
import CollapsibleSection from './CollapsibleSection';

const MarketTrends = ({ forecast, setForecast, topCarriers }) => {
  const handleToggle = (key) => {
    setForecast((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CollapsibleSection title="Predictive Lane Forecast" defaultOpen>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label>
            <input type="checkbox" checked={forecast.frontEvents} onChange={() => handleToggle('frontEvents')} /> Front Events Option
          </label>
          <label>
            <input type="checkbox" checked={forecast.fiveNDR} onChange={() => handleToggle('fiveNDR')} /> Five+ NDR
          </label>
          <label>
            <input type="checkbox" checked={forecast.marketSoftening} onChange={() => handleToggle('marketSoftening')} /> Market Softening
          </label>
          <label>
            <input type="checkbox" checked={forecast.rejectionSpikes} onChange={() => handleToggle('rejectionSpikes')} /> Rejection Spikes
          </label>
          <label>
            <input type="checkbox" checked={forecast.addDetention} onChange={() => handleToggle('addDetention')} /> Add Detention (+2 hrs)
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Top Carriers" defaultOpen>
        <table style={{ width: '100%', fontSize: 13 }}>
          <thead>
            <tr style={{ color: '#aaa' }}>
              <th align="left">Carrier</th>
              <th align="right">Avg Rate</th>
              <th align="right">On-Time</th>
              <th align="right">Risk Score</th>
              <th align="right">Margin</th>
            </tr>
          </thead>
          <tbody>
            {topCarriers.map(row => (
              <tr key={row.carrier}>
                <td>{row.carrier}</td>
                <td align="right">${row.avgRate.toLocaleString()}</td>
                <td align="right">{row.onTime}%</td>
                <td align="right">{row.riskScore}</td>
                <td align="right">${row.margin.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CollapsibleSection>
    </div>
  );
};

export default MarketTrends;
