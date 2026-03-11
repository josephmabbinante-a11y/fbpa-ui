import React, { useMemo } from 'react';

function hashText(value) {
  const text = String(value || '');
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function toPoint(seedText, width, height) {
  const hash = hashText(seedText);
  const x = 28 + (hash % Math.max(1, width - 56));
  const y = 28 + ((Math.floor(hash / 97) % Math.max(1, height - 56)));
  return { x, y };
}

export default function InternalRoutePreview({ originLabel, destinationLabel, miles = 0, height = 160 }) {
  const width = 480;

  const route = useMemo(() => {
    const from = toPoint(originLabel, width, height);
    const to = toPoint(destinationLabel, width, height);
    const midpointX = Math.round((from.x + to.x) / 2);
    const bend = (hashText(`${originLabel}|${destinationLabel}`) % 40) - 20;
    const controlY = Math.max(20, Math.min(height - 20, Math.round((from.y + to.y) / 2) + bend));
    const path = `M ${from.x} ${from.y} Q ${midpointX} ${controlY} ${to.x} ${to.y}`;
    const normalizedMiles = Math.max(0, Number(miles || 0));
    const etaHours = normalizedMiles > 0 ? Math.max(1, Math.round(normalizedMiles / 52)) : 0;

    return {
      from,
      to,
      path,
      etaHours,
      normalizedMiles,
    };
  }, [originLabel, destinationLabel, miles, height]);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-alt)', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Internal route preview">
        <defs>
          <linearGradient id="route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={width} height={height} fill="var(--bg-alt)" />
        <path d={route.path} fill="none" stroke="url(#route-grad)" strokeWidth="4" strokeLinecap="round" />

        <circle cx={route.from.x} cy={route.from.y} r="6" fill="#2563eb" />
        <circle cx={route.to.x} cy={route.to.y} r="6" fill="#ef4444" />

        <text x={12} y={18} fontSize="11" fill="var(--text-secondary)">Internal Route Engine Preview</text>
        <text x={12} y={height - 10} fontSize="11" fill="var(--text-secondary)">
          {route.normalizedMiles > 0 ? `${Math.round(route.normalizedMiles).toLocaleString()} mi • ETA ${route.etaHours}h` : 'Distance unavailable'}
        </text>
      </svg>
    </div>
  );
}
