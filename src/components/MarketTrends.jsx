
import React, { useState } from 'react';
import CollapsibleSection from './CollapsibleSection';

const MarketTrends = () => {
  const [forecast, setForecast] = useState({
    frontEvents: true,
    fiveNDR: true,
    marketSoftening: true,
    rejectionSpikes: true,
    addDetention: false,
  });

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
            <tr><td>SUPER TRUCKING INC</td><td align="right">$2,989</td><td align="right">96%</td><td align="right">0.76</td><td align="right">$435</td></tr>
            <tr><td>NEW WAVE CARRIER</td><td align="right">$2,958</td><td align="right">91%</td><td align="right">0.68</td><td align="right">$454</td></tr>
            <tr><td>FASTLANE LOGISTICS</td><td align="right">$5,940</td><td align="right">97%</td><td align="right">0.92</td><td align="right">$874</td></tr>
          </tbody>
        </table>
      </CollapsibleSection>
    </div>
  );
};

export default MarketTrends;
