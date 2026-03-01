import { useTheme, themes } from '../contexts/ThemeContext';

export default function CompactKPI({ label, value, delta = null, format = 'number', color = 'neutral' }) {
  const { theme } = useTheme();
  const t = themes[theme];

  const colorMap = {
    neutral: t.textSecondary,
    positive: t.positive,
    negative: t.negative,
    warning: t.warning,
  };

  const formatValue = (v) => {
    if (v === null || v === undefined || v === '') return '—';

    const numeric = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(numeric)) return String(v);

    if (format === 'currency') {
      return `$${numeric.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }

    if (format === 'percent') return `${numeric}%`;

    return numeric.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: 4,
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: '600', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: '20px', fontWeight: '700', color: t.text }}>
        {formatValue(value)}
      </div>
      {delta !== null && (
        <div style={{ fontSize: '12px', color: delta >= 0 ? t.positive : t.negative, marginTop: 4 }}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}%
        </div>
      )}
    </div>
  );
}
