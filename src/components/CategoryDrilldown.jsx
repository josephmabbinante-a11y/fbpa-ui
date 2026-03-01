import { useEffect, useMemo, useState } from 'react';
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

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) =>
  `$${asNumber(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatPercent = (value) => `${asNumber(value).toFixed(1)}%`;

export default function CategoryDrilldown({ data }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const categories = useMemo(
    () => (Array.isArray(data) ? data.filter((item) => item && typeof item.category === 'string') : []),
    [data]
  );
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    if (!categories.length) {
      setActiveCategory('');
      return;
    }
    if (!categories.some((item) => item.category === activeCategory)) {
      setActiveCategory(categories[0].category);
    }
  }, [categories, activeCategory]);

  const active = useMemo(() => {
    if (!categories.length) return null;
    return categories.find((item) => item.category === activeCategory) || categories[0];
  }, [categories, activeCategory]);

  if (!active) {
    return (
      <div style={{ width: '100%' }}>
        <h3 style={{ marginBottom: 16, fontSize: '14px', fontWeight: '600', color: '#b0b0b0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Category Drilldown
        </h3>
        <div style={{ height: 220, width: '100%', display: 'grid', placeItems: 'center', border: '1px dashed #3a3a3a', borderRadius: 6, color: '#9a9a9a', fontSize: 12 }}>
          No chart data available
        </div>
      </div>
    );
  }

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
  const kpis = Array.isArray(active.kpis) ? active.kpis.filter(Boolean) : [];
  const trend = Array.isArray(active.trend) ? active.trend.filter(Boolean) : [];
  const customers = Array.isArray(active.customers) ? active.customers.filter(Boolean) : [];
  const causes = Array.isArray(active.causes) ? active.causes.filter(Boolean) : [];

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {categories.map((item) => (
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
        <div style={{ fontSize: 12, color: t.textSecondary }}>{active.summary || 'No summary available.'}</div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {kpis.map((kpi) => {
          const value =
            kpi.format === 'currency'
              ? formatCurrency(kpi.value)
              : kpi.format === 'percent'
              ? formatPercent(kpi.value)
              : asNumber(kpi.value).toLocaleString();
          return (
            <div key={String(kpi.label || 'kpi')} style={kpiStyle}>
              <div style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {kpi.label || 'Metric'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: t.text }}>{value}</div>
              <div style={{ fontSize: 11, color: t.textSecondary }}>{kpi.note || ''}</div>
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
              <LineChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
              <BarChart data={customers} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
                <Pie data={causes} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {causes.map((entry, index) => (
                    <Cell key={`cause-${String(entry.name || index)}`} fill={palette[index % palette.length]} />
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
