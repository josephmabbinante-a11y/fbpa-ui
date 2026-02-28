
import React, { useState } from 'react';
import CollapsibleSection from './CollapsibleSection';

const LoadInputs = () => {
  const [origin, setOrigin] = useState('Los Angeles, CA');
  const [destination, setDestination] = useState('Dallas, TX');
  const [rpm, setRpm] = useState(2.37);
  const [volatility, setVolatility] = useState(18);
  const [capacity, setCapacity] = useState(72);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CollapsibleSection title="Market Intelligence" defaultOpen>
        <div style={{ marginBottom: 12 }}>
          <label>Shipment Details:</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <select value={origin} onChange={e => setOrigin(e.target.value)}>
              <option>Los Angeles, CA</option>
              <option>Chicago, IL</option>
              <option>Atlanta, GA</option>
            </select>
            <select value={destination} onChange={e => setDestination(e.target.value)}>
              <option>Dallas, TX</option>
              <option>Houston, TX</option>
              <option>Miami, FL</option>
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
        <div style={{ fontSize: 13, color: '#aaa' }}>Predicted 48hr swing: <b>+$185</b></div>
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
            <tr><td>Greenscreens.ai</td><td align="right">$2,966</td></tr>
            <tr><td>DAT</td><td align="right">$2,968</td></tr>
            <tr><td>Internal Historical</td><td align="right">$2,910</td></tr>
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
            <tr><td>SUPER TRUCKING INC</td><td align="right">$2,989</td><td align="right">$445</td></tr>
            <tr><td>NEW WAVE CARRIER</td><td align="right">$2,958</td><td align="right">$254</td></tr>
            <tr><td>FASTLANE LOGISTICS</td><td align="right">$5,940</td><td align="right">$974</td></tr>
          </tbody>
        </table>
      </CollapsibleSection>
    </div>
  );
};

export default LoadInputs;
