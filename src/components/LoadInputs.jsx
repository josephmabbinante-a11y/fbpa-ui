


import React, { useState } from 'react';
import CollapsibleSection from './CollapsibleSection';
import { useDemo } from '../demo/DemoContext';
import { mockLocations } from '../mock/mockLocations';

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
  const { demoMode } = useDemo();
  const locations = demoMode ? mockLocations : [];

  // Autocomplete logic for location search
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originFocused, setOriginFocused] = useState(false);
  const [destFocused, setDestFocused] = useState(false);
  // Shipment details state
  const [weight, setWeight] = useState('');
  const [pieces, setPieces] = useState('');
  const [commodity, setCommodity] = useState('');
  const [reference, setReference] = useState('');
  const [shipDate, setShipDate] = useState('');
  const [errors, setErrors] = useState({});

  const filterLocations = (query) => {
    if (!query) return locations;
    const q = query.toLowerCase();
    return locations.filter(
      loc =>
        loc.city.toLowerCase().includes(q) ||
        loc.state.toLowerCase().includes(q) ||
        loc.zip.includes(q)
    );
  };

  const originSuggestions = filterLocations(originQuery).slice(0, 6);
  const destSuggestions = filterLocations(destQuery).slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CollapsibleSection title="Market Intelligence" defaultOpen>
        <div style={{ marginBottom: 12 }}>
          <label>Shipment Details:</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={originQuery || origin}
                onChange={e => {
                  setOriginQuery(e.target.value);
                  setOriginFocused(true);
                }}
                onFocus={() => setOriginFocused(true)}
                onBlur={() => setTimeout(() => setOriginFocused(false), 150)}
                placeholder="Origin (city, state, zip)"
                style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
                required
              />
              {originFocused && originSuggestions.length > 0 && (
                <ul style={{ position: 'absolute', zIndex: 10, background: '#fff', color: '#222', width: '100%', border: '1px solid #ccc', borderRadius: 4, marginTop: 2, maxHeight: 160, overflowY: 'auto', fontSize: 14 }}>
                  {originSuggestions.map(loc => (
                    <li
                      key={loc.city + loc.state + loc.zip}
                      style={{ padding: 6, cursor: 'pointer' }}
                      onMouseDown={() => {
                        setOrigin(`${loc.city}, ${loc.state} ${loc.zip}`);
                        setOriginQuery(`${loc.city}, ${loc.state} ${loc.zip}`);
                        setOriginFocused(false);
                      }}
                    >
                      {loc.city}, {loc.state} {loc.zip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={destQuery || destination}
                onChange={e => {
                  setDestQuery(e.target.value);
                  setDestFocused(true);
                }}
                onFocus={() => setDestFocused(true)}
                onBlur={() => setTimeout(() => setDestFocused(false), 150)}
                placeholder="Destination (city, state, zip)"
                style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
                required
              />
              {destFocused && destSuggestions.length > 0 && (
                <ul style={{ position: 'absolute', zIndex: 10, background: '#fff', color: '#222', width: '100%', border: '1px solid #ccc', borderRadius: 4, marginTop: 2, maxHeight: 160, overflowY: 'auto', fontSize: 14 }}>
                  {destSuggestions.map(loc => (
                    <li
                      key={loc.city + loc.state + loc.zip}
                      style={{ padding: 6, cursor: 'pointer' }}
                      onMouseDown={() => {
                        setDestination(`${loc.city}, ${loc.state} ${loc.zip}`);
                        setDestQuery(`${loc.city}, ${loc.state} ${loc.zip}`);
                        setDestFocused(false);
                      }}
                    >
                      {loc.city}, {loc.state} {loc.zip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {/* Shipment details fields */}
          <form
            style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}
            onSubmit={e => {
              e.preventDefault();
              // Validate required fields
              const newErrors = {};
              if (!weight) newErrors.weight = 'Required';
              if (!pieces) newErrors.pieces = 'Required';
              if (!commodity) newErrors.commodity = 'Required';
              if (!shipDate) newErrors.shipDate = 'Required';
              setErrors(newErrors);
              if (Object.keys(newErrors).length === 0) {
                // Submit or trigger rating logic here
              }
            }}
            autoComplete="off"
          >
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="number"
                min={1}
                placeholder="Weight (lbs)"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                style={{ flex: 1, padding: 6, borderRadius: 4, border: errors.weight ? '1.5px solid #e00' : '1px solid #ccc', background: errors.weight ? '#fff6f6' : undefined }}
                required
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
              />
              <input
                type="number"
                min={1}
                placeholder="Pieces"
                value={pieces}
                onChange={e => setPieces(e.target.value)}
                style={{ flex: 1, padding: 6, borderRadius: 4, border: errors.pieces ? '1.5px solid #e00' : '1px solid #ccc', background: errors.pieces ? '#fff6f6' : undefined }}
                required
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                placeholder="Commodity"
                value={commodity}
                onChange={e => setCommodity(e.target.value)}
                style={{ flex: 1, padding: 6, borderRadius: 4, border: errors.commodity ? '1.5px solid #e00' : '1px solid #ccc', background: errors.commodity ? '#fff6f6' : undefined }}
                required
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
              />
              <input
                type="text"
                placeholder="Reference #"
                value={reference}
                onChange={e => setReference(e.target.value)}
                style={{ flex: 1, padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="date"
                value={shipDate}
                onChange={e => setShipDate(e.target.value)}
                style={{ flex: 1, padding: 6, borderRadius: 4, border: errors.shipDate ? '1.5px solid #e00' : '1px solid #ccc', background: errors.shipDate ? '#fff6f6' : undefined }}
                required
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
              />
            </div>
            {/* Error summary */}
            {Object.keys(errors).length > 0 && (
              <div style={{ color: '#e00', fontSize: 12, marginTop: 2 }}>
                {Object.entries(errors).map(([k, v]) => (
                  <span key={k} style={{ marginRight: 8 }}>{k}: {v}</span>
                ))}
              </div>
            )}
          </form>
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
