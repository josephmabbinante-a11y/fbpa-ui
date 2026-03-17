import { useState, useEffect } from 'react';
import GoogleMapEmbed from '../components/GoogleMapEmbed';
import { useTheme, themes } from '../contexts/ThemeContext';
import { getRateLogicMetrics } from '../api/client';


function parseLane(laneText) {
  const [originPart = '', destinationPart = ''] = String(laneText || '').split('→');
  return {
    origin: originPart.trim(),
    destination: destinationPart.trim(),
  };
}

export default function LaneIntelligence() {
  const { theme } = useTheme();
  const t = theme;
  const [lanes, setLanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');

  useEffect(() => {
    setLoading(true);
    getRateLogicMetrics()
      .then((data) => {
        if (data && Array.isArray(data.lanes)) {
          setLanes(data.lanes);
          if (data.lanes.length > 0) {
            const firstLane = data.lanes[0];
            setOriginInput(firstLane.origin || '');
            setDestinationInput(firstLane.destination || '');
          }
        } else {
          setError('No lane data available.');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load lane intelligence data.');
        setLoading(false);
      });
  }, []);

  function handleLaneClick(lane) {
    setOriginInput(lane.origin || '');
    setDestinationInput(lane.destination || '');
  }



  const containerStyle = {
    padding: 24,
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
  };

  const headerStyle = {
    marginBottom: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    minHeight: 52,
    padding: '0 4px',
    borderBottom: `1px solid ${t.border}`,
    background: t.bgAlt,
  };

  const titleStyle = {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
  };

  const subtitleStyle = {
    fontSize: 14,
    color: t.textSecondary,
  };

  const filterBarStyle = {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  };

  const filterInputStyle = {
    padding: '8px 12px',
    borderRadius: 4,
    border: `1px solid ${t.border}`,
    backgroundColor: t.surface,
    color: t.text,
    fontSize: 12,
  };

  const tableWrapperStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    overflow: 'hidden',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle = {
    backgroundColor: t.bgAlt,
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: t.textSecondary,
    borderBottom: `1px solid ${t.border}`,
  };

  const tdStyle = {
    padding: '12px 16px',
    fontSize: 13,
    borderBottom: `1px solid ${t.border}`,
  };

  const trendStyle = (direction) => ({
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: 3,
    backgroundColor: direction === 'up' ? '#10b98150' : '#ef444450',
    color: direction === 'up' ? '#059669' : '#dc2626',
    fontSize: 11,
    fontWeight: 600,
  });

  if (loading) {
    return <div style={{ padding: 32, color: t.text }}>Loading lane intelligence...</div>;
  }
  if (error) {
    return <div style={{ padding: 32, color: 'red' }}>{error}</div>;
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>🛣️ Lane Intelligence</div>
        <div style={subtitleStyle}>Strategic lanes • Market rates • Win probability • Seasonal intelligence</div>
      </div>

      <div style={filterBarStyle}>
        <input
          type="text"
          placeholder="Origin"
          style={filterInputStyle}
          value={originInput}
          onChange={(event) => setOriginInput(event.target.value)}
        />
        <input
          type="text"
          placeholder="Destination"
          style={filterInputStyle}
          value={destinationInput}
          onChange={(event) => setDestinationInput(event.target.value)}
        />
      </div>

      <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 8 }}>
          Google Route Preview • {originInput || 'Origin'} → {destinationInput || 'Destination'}
        </div>
        <GoogleMapEmbed origin={originInput} destination={destinationInput} height={220} />
      </div>

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Lane</th>
              <th style={thStyle}>Avg Rate</th>
              <th style={thStyle}>Annual Volume</th>
              <th style={thStyle}>Win Rate</th>
              <th style={thStyle}>Margin %</th>
              <th style={thStyle}>Seasonal Trend</th>
            </tr>
          </thead>
          <tbody>
            {lanes.map((lane, idx) => (
              <tr
                key={lane.id || idx}
                style={{ cursor: 'pointer' }}
                onClick={() => handleLaneClick(lane)}
                onMouseEnter={e => e.target.parentElement.style.backgroundColor = t.bgAlt}
                onMouseLeave={e => e.target.parentElement.style.backgroundColor = 'transparent'}
              >
                <td style={tdStyle}><strong>{lane.origin} → {lane.destination}</strong></td>
                <td style={tdStyle}>{lane.avgRate ? `$${lane.avgRate.toLocaleString()}` : '-'}</td>
                <td style={tdStyle}>{lane.volume ? `${lane.volume} loads` : '-'}</td>
                <td style={tdStyle}>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: 3,
                    backgroundColor: lane.winRate > 70 ? '#10b98150' : lane.winRate > 50 ? '#3b82f650' : '#f59e0b50',
                    color: lane.winRate > 70 ? '#059669' : lane.winRate > 50 ? '#2563eb' : '#d97706',
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {lane.winRate ? `${lane.winRate}%` : '-'}
                  </div>
                </td>
                <td style={tdStyle}>
                  <strong style={{ color: lane.margin > 28 ? '#10b981' : lane.margin > 24 ? '#3b82f6' : '#f59e0b' }}>
                    {lane.margin ? `${lane.margin}%` : '-'}
                  </strong>
                </td>
                <td style={tdStyle}>
                  <span style={trendStyle(lane.trendDirection)}>
                    {lane.seasonalTrend || '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
