import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme, themes } from '../contexts/ThemeContext';

const formatCurrency = (value) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatPercent = (value) => `${value.toFixed(1)}%`;

export default function CategoryDrilldown({ data }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [activeCategory, setActiveCategory] = useState(data && data.length ? data[0].category : '');

  const active = useMemo(() => (data || []).find((item) => item.category === activeCategory), [data, activeCategory]);

  if (!data || data.length === 0 || !active) return null;

  const cardStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    padding: 16,
  };

  const tabStyle = (isActive) => ({
    padding: '8px 12px',
    borderRadius: 6,
    border: `1px solid ${isActive ? t.accent : t.border}`,
    backgroundColor: isActive ? `${t.accent}20` : t.bgAlt,
    color: t.text,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  });

  const kpiStyle = {
    backgroundColor: t.bgAlt,
    border: `1px solid ${t.borderLight}`,
    borderRadius: 6,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  const chartCardStyle = {
    ...cardStyle,
    padding: 12,
  };

  const palette = [t.positive, t.warning, t.error, t.accent, t.neutral];

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {data.map((item) => (
          <button
            key={item.category}
            type="button"
            onClick={() => setActiveCategory(item.category)}
            style={tabStyle(activeCategory === item.category)}
          >
            {item.category}
          </button>
        ))}
      </div>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{active.category}</div>
        <div style={{ fontSize: 12, color: t.textSecondary }}>{active.summary}</div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {active.kpis.map((kpi) => {
          const value =
            kpi.format === 'currency'
              ? formatCurrency(kpi.value)
              : kpi.format === 'percent'
              ? formatPercent(kpi.value)
              : kpi.value.toLocaleString();
          return (
            <div key={kpi.label} style={kpiStyle}>
              <div style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: t.text }}>{value}</div>
              <div style={{ fontSize: 11, color: t.textSecondary }}>{kpi.note}</div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        <div style={chartCardStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: t.textSecondary, textTransform: 'uppercase' }}>
            Findings + Recovery Trend
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={active.trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
                <XAxis dataKey="period" stroke={t.textSecondary} fontSize={11} />
                <YAxis stroke={t.textSecondary} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: t.bgAlt,
                    border: `1px solid ${t.border}`,
                    borderRadius: 4,
                    color: t.text,
                    fontSize: 12,
                  }}
                  formatter={(value, name) => (name === 'recovery' ? formatCurrency(value) : value)}
                />
                <Line type="monotone" dataKey="findings" stroke={t.warning} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="recovery" stroke={t.positive} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={chartCardStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: t.textSecondary, textTransform: 'uppercase' }}>
            Top Customers By Impact
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={active.customers} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
                <XAxis dataKey="customer" stroke={t.textSecondary} fontSize={10} />
                <YAxis stroke={t.textSecondary} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: t.bgAlt,
                    border: `1px solid ${t.border}`,
                    borderRadius: 4,
                    color: t.text,
                    fontSize: 12,
                  }}
                  formatter={(value, name) => (name === 'recovery' ? formatCurrency(value) : value)}
                />
                <Bar dataKey="findings" fill={t.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={chartCardStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: t.textSecondary, textTransform: 'uppercase' }}>
            Root Cause Mix
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={active.causes} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {active.causes.map((entry, index) => (
                    <Cell key={`cause-${entry.name}`} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: t.bgAlt,
                    border: `1px solid ${t.border}`,
                    borderRadius: 4,
                    color: t.text,
                    fontSize: 12,
                  }}
                  formatter={(value) => `${value} items`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
