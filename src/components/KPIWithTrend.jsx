import { useState } from 'react';
import CompactKPI from './CompactKPI';
import SparklineChart from './SparklineChart';
import { useTheme, themes } from '../contexts/ThemeContext';

/**
 * KPI card with embedded trend sparkline
 * Combines CompactKPI with a lightweight area chart
 * Clickable to navigate to related page
 */
export default function KPIWithTrend({ label, value, delta, format, trendData, trendColor = '#0066cc', onClick }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: 12,
        backgroundColor: isHovered ? t.bgAlt : t.surface,
        border: `1px solid ${isHovered ? trendColor : t.border}`,
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        width: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
        transform: onClick && isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: onClick && isHovered ? `0 4px 12px ${trendColor}20` : 'none',
      }}
    >
      <CompactKPI label={label} value={value} delta={delta} format={format} />
      {trendData && trendData.length > 0 && (
        <SparklineChart data={trendData} color={trendColor} height={35} />
      )}
    </div>
  );
}
