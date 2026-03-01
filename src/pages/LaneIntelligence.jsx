import { useTheme, themes } from '../contexts/ThemeContext';

export default function LaneIntelligence() {
  const { theme } = useTheme();
  const t = themes[theme];

  const containerStyle = {
    padding: 24,
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
  };

  const headerStyle = {
    marginBottom: 32,
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

  const laneData = [
    {
      lane: 'LAX → DAL',
      avgRate: '$2,450',
      volume: 127,
      winRate: '68%',
      margin: '26.5%',
      seasonalTrend: '↑ High Demand',
      trendDirection: 'up',
    },
    {
      lane: 'CHI → MIA',
      avgRate: '$1,820',
      volume: 94,
      winRate: '55%',
      margin: '28.3%',
      seasonalTrend: '→ Stable',
      trendDirection: 'flat',
    },
    {
      lane: 'ATL → TOR',
      avgRate: '$3,100',
      volume: 312,
      winRate: '72%',
      margin: '24.8%',
      seasonalTrend: '↓ Declining',
      trendDirection: 'down',
    },
    {
      lane: 'DEN → PHX',
      avgRate: '$1,250',
      volume: 211,
      winRate: '81%',
      margin: '32.1%',
      seasonalTrend: '↑ Growing',
      trendDirection: 'up',
    },
    {
      lane: 'NYC → LA',
      avgRate: '$4,800',
      volume: 156,
      winRate: '43%',
      margin: '19.2%',
      seasonalTrend: '↓ Declining',
      trendDirection: 'down',
    },
  ];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>🛣️ Lane Intelligence</div>
        <div style={subtitleStyle}>Strategic lanes • Market rates • Win probability • Seasonal intelligence</div>
      </div>

      <div style={filterBarStyle}>
        <input type="text" placeholder="Search by origin..." style={filterInputStyle} />
        <input type="text" placeholder="Search by destination..." style={filterInputStyle} />
        <select style={filterInputStyle} defaultValue="all">
          <option value="all">All Lanes</option>
          <option value="growing">Growing</option>
          <option value="stable">Stable</option>
          <option value="declining">Declining</option>
        </select>
        <select style={filterInputStyle} defaultValue="all">
          <option value="all">All Volumes</option>
          <option value="high">High (100+)</option>
          <option value="medium">Medium (50-100)</option>
          <option value="low">Low (&lt;50)</option>
        </select>
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
            {laneData.map((lane) => (
              <tr key={lane.lane} style={{ cursor: 'pointer' }} onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = t.bgAlt} onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}>
                <td style={tdStyle}><strong>{lane.lane}</strong></td>
                <td style={tdStyle}>{lane.avgRate}</td>
                <td style={tdStyle}>{lane.volume} loads</td>
                <td style={tdStyle}>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: 3,
                    backgroundColor: parseInt(lane.winRate) > 70 ? '#10b98150' : parseInt(lane.winRate) > 50 ? '#3b82f650' : '#f59e0b50',
                    color: parseInt(lane.winRate) > 70 ? '#059669' : parseInt(lane.winRate) > 50 ? '#2563eb' : '#d97706',
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {lane.winRate}
                  </div>
                </td>
                <td style={tdStyle}>
                  <strong style={{ color: parseFloat(lane.margin) > 28 ? '#10b981' : parseFloat(lane.margin) > 24 ? '#3b82f6' : '#f59e0b' }}>
                    {lane.margin}
                  </strong>
                </td>
                <td style={tdStyle}>
                  <span style={trendStyle(lane.trendDirection)}>
                    {lane.seasonalTrend}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
        <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>💡 Insights</div>
          <ul style={{ fontSize: 13, lineHeight: 1.6, color: t.textSecondary, listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: 8 }}>✓ DEN → PHX shows highest win rate (81%) with strong margins</li>
            <li style={{ marginBottom: 8 }}>✓ ATL → TOR is your volume leader - consider capacity expansion</li>
            <li style={{ marginBottom: 8 }}>✓ NYC → LA declining - explore rate competitiveness</li>
            <li style={{ marginBottom: 8 }}>✓ Current market favors LAX → DAL lane (high demand)</li>
          </ul>
        </div>
        <div style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>📊 Market Strategy</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: t.textSecondary }}>
            <div style={{ marginBottom: 8 }}>Lanes sorted by margin potential and market conditions. Use this to:</div>
            <ul style={{ listStyle: 'inside', paddingLeft: 0, margin: 0 }}>
              <li>Identify underpriced lanes</li>
              <li>Spot seasonal opportunities</li>
              <li>Build carrier relationships on high-volume corridors</li>
              <li>Set pricing benchmarks</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
