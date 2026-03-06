import React from 'react';

const STATE_TILES = [
  { code: 'WA', row: 1, col: 1 }, { code: 'MT', row: 1, col: 3 }, { code: 'ND', row: 1, col: 5 }, { code: 'MN', row: 1, col: 6 }, { code: 'WI', row: 1, col: 7 }, { code: 'MI', row: 1, col: 8 }, { code: 'VT', row: 1, col: 11 }, { code: 'ME', row: 1, col: 12 },
  { code: 'OR', row: 2, col: 1 }, { code: 'ID', row: 2, col: 2 }, { code: 'WY', row: 2, col: 3 }, { code: 'SD', row: 2, col: 5 }, { code: 'IA', row: 2, col: 6 }, { code: 'IL', row: 2, col: 7 }, { code: 'IN', row: 2, col: 8 }, { code: 'OH', row: 2, col: 9 }, { code: 'PA', row: 2, col: 10 }, { code: 'NY', row: 2, col: 11 }, { code: 'NH', row: 2, col: 12 },
  { code: 'CA', row: 3, col: 1 }, { code: 'NV', row: 3, col: 2 }, { code: 'UT', row: 3, col: 3 }, { code: 'CO', row: 3, col: 4 }, { code: 'NE', row: 3, col: 5 }, { code: 'MO', row: 3, col: 6 }, { code: 'KY', row: 3, col: 8 }, { code: 'WV', row: 3, col: 9 }, { code: 'VA', row: 3, col: 10 }, { code: 'MD', row: 3, col: 11 }, { code: 'MA', row: 3, col: 12 },
  { code: 'AZ', row: 4, col: 2 }, { code: 'NM', row: 4, col: 3 }, { code: 'KS', row: 4, col: 5 }, { code: 'AR', row: 4, col: 6 }, { code: 'TN', row: 4, col: 8 }, { code: 'NC', row: 4, col: 10 }, { code: 'SC', row: 4, col: 11 }, { code: 'NJ', row: 4, col: 12 },
  { code: 'TX', row: 5, col: 4 }, { code: 'OK', row: 5, col: 5 }, { code: 'LA', row: 5, col: 6 }, { code: 'MS', row: 5, col: 7 }, { code: 'AL', row: 5, col: 8 }, { code: 'GA', row: 5, col: 9 }, { code: 'FL', row: 5, col: 10 },
  { code: 'AK', row: 6, col: 1 }, { code: 'HI', row: 6, col: 2 },
];

function clampScore(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(100, parsed));
}

function scoreToColor(score) {
  const normalized = clampScore(score);
  if (normalized === null) return 'var(--bg-alt)';
  const hue = Math.round(220 - ((normalized / 100) * 220));
  return `hsl(${hue} 74% 54%)`;
}

export default function CapacityHeatMap({ scores = {} }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 4 }}>
        {STATE_TILES.map((tile) => {
          const score = clampScore(scores?.[tile.code]);
          return (
            <div
              key={tile.code}
              title={score === null ? `${tile.code}: No data` : `${tile.code}: ${score}/100`}
              style={{
                gridColumn: tile.col,
                gridRow: tile.row,
                minHeight: 24,
                borderRadius: 4,
                border: '1px solid var(--border)',
                background: scoreToColor(score),
                color: score !== null && score >= 60 ? '#fff' : 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {tile.code}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
        <div style={{ height: 8, borderRadius: 999, background: 'linear-gradient(90deg, hsl(220 74% 54%) 0%, hsl(150 74% 54%) 45%, hsl(45 85% 56%) 72%, hsl(0 74% 54%) 100%)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Cool Capacity (0)</span>
          <span>Tight Capacity (100)</span>
        </div>
      </div>
    </div>
  );
}
