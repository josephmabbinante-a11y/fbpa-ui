

import React from 'react';
import CollapsibleSection from './CollapsibleSection';

const LoadInputs = ({
  shipmentOptions,
  origin,
  setOrigin,
  destination,
  setDestination,
  rpm,
  setRpm,
  volatility,
  setVolatility,
  capacity,
  setCapacity,
  predictedSwing,
  laneData,
  bookedLoads,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CollapsibleSection title="Market Intelligence" defaultOpen>
        <div style={{ marginBottom: 12 }}>
          <label>Shipment Details:</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <select value={origin} onChange={e => setOrigin(e.target.value)}>
              {shipmentOptions.origins.map(opt => <option key={opt}>{opt}</option>)}
            </select>
            <select value={destination} onChange={e => setDestination(e.target.value)}>
              {shipmentOptions.destinations.map(opt => <option key={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Market RPM Feed:</label>
          <input type="range" min={2} max={4} step={0.01} value={rpm} onChange={e => setRpm(Number(e.target.value))} />
          <span style={{ marginLeft: 8 }}>{rpm.toFixed(2)}</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Lane Volatility Index:</label>
          <input type="range" min={0} max={100} value={volatility} onChange={e => setVolatility(Number(e.target.value))} />
          <span style={{ marginLeft: 8 }}>{volatility}%</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Capacity Heat Score:</label>
          <input type="range" min={0} max={100} value={capacity} onChange={e => setCapacity(Number(e.target.value))} />
          <span style={{ marginLeft: 8 }}>{capacity}/100</span>
        </div>
        <div style={{ fontSize: 13, color: '#aaa' }}>Predicted 48hr swing: <b>+${predictedSwing}</b></div>
      </CollapsibleSection>

      <CollapsibleSection title="Lane Data" defaultOpen={false}>
        <table style={{ width: '100%', fontSize: 13, marginBottom: 12 }}>
          <thead>
            <tr style={{ color: '#aaa' }}>
              <th align="left">Source</th>
              <th align="right">Rate</th>
            </tr>
          </thead>
          <tbody>
            {laneData.map(row => (
              <tr key={row.source}><td>{row.source}</td><td align="right">${row.rate.toLocaleString()}</td></tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Last 10 Booked Loads</div>
        <table style={{ width: '100%', fontSize: 13 }}>
          <thead>
            <tr style={{ color: '#aaa' }}>
              <th align="left">Carrier</th>
              <th align="right">Avg Rate</th>
              <th align="right">Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {bookedLoads.map(row => (
              <tr key={row.carrier}><td>{row.carrier}</td><td align="right">${row.avgRate.toLocaleString()}</td><td align="right">${row.riskScore.toLocaleString()}</td></tr>
            ))}
          </tbody>
        </table>
      </CollapsibleSection>
    </div>
  );
};

export default LoadInputs;
