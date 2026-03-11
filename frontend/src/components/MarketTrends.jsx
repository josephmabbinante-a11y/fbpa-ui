

import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import LineChart from './LineChart';
import CapacityHeatMap from './CapacityHeatMap';

const MarketTrends = ({
  forecast,
  setForecast,
  topCarriers,
  laneData,
  bookedLoads,
  laneSummary,
  stateCapacityScores,
  routeEngineView,
}) => {
  const handleToggle = (key) => {
    setForecast((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const historicalRates = (bookedLoads || []).map((row) => Number(row.avgRate || 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CollapsibleSection title="Advanced Pricing Controls" defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>Override Toggles</div>
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
            <input type="checkbox" checked={forecast.addDetention} onChange={() => handleToggle('addDetention')} /> Add Detention (+2 hrs)
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Market Intelligence" defaultOpen>
        <table style={{ width: '100%', fontSize: 13, marginBottom: 12 }}>
          <thead>
            <tr style={{ color: '#aaa' }}>
              <th align="left">Source</th>
              <th align="right">Rate</th>
            </tr>
          </thead>
          <tbody>
            {(laneData || []).map((row) => (
              <tr key={row.source}><td>{row.source}</td><td align="right">${Number(row.rate || 0).toLocaleString()}</td></tr>
            ))}
          </tbody>
        </table>
        <LineChart data={historicalRates} label="Historical Trend Graph" />
        <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 8, display: 'grid', gap: 4, fontSize: 12 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Internal Route Engine View</div>
          <div>{String(routeEngineView?.origin || 'Origin')} → {String(routeEngineView?.destination || 'Destination')}</div>
          <div>
            Estimated Miles: {Number(routeEngineView?.miles || 0).toLocaleString()}
            {'  '}({String(routeEngineView?.method || 'estimated')} • {Math.round(Number(routeEngineView?.confidence || 0) * 100)}%)
          </div>
          <div>Status: {routeEngineView?.loading ? 'Resolving route...' : 'Route ready'}</div>
        </div>
        {laneSummary && (
          <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 8, display: 'grid', gap: 4, fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Lane Analytics</div>
            <div>Total Loads: {Number(laneSummary.totalLoads || 0).toLocaleString()}</div>
            <div>Avg Rate: ${Number(laneSummary.avgRate || 0).toFixed(2)}</div>
            <div>On-Time: {Number(laneSummary.onTime || 0)}%</div>
            <div>Risk Score: {Number(laneSummary.riskScore || 0).toFixed(2)}</div>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Top Carriers" defaultOpen>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(bookedLoads || []).slice(0, 4).map((row) => (
            <div key={row.carrier} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {row.carrier}: ${Number(row.avgRate || 0).toLocaleString()} avg
            </div>
          ))}
        </div>
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

      <CollapsibleSection title="Capacity Heat Map" defaultOpen>
        <CapacityHeatMap scores={stateCapacityScores} />
      </CollapsibleSection>
    </div>
  );
};

export default MarketTrends;
