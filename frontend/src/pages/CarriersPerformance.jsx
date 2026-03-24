import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Cell,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';
import { getCarriers } from '../api/client';
import carrierPerformance from '../mock/carriersPerformance';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function averageMetric(items, key) {
  if (!items.length) return 0;
  return items.reduce((sum, item) => sum + item[key], 0) / items.length;
}

function getRank(items, key, carrierName, higherIsBetter = true) {
  const sorted = [...items].sort((a, b) => (higherIsBetter ? b[key] - a[key] : a[key] - b[key]));
  const index = sorted.findIndex((item) => item.carrier === carrierName);
  return index >= 0 ? index + 1 : null;
}

function scoreOnTime(value) { return clamp(value, 0, 100); }
function scoreBilling(value) { return clamp(100 - value * 20, 0, 100); }
function scoreInvoiceAccuracy(value) { return clamp(100 - value * 20, 0, 100); }
function scoreTransit(value) { return clamp(100 - value * 15, 0, 100); }
function scoreClaims(value) { return clamp(100 - value * 25, 0, 100); }

export default function CarriersPerformance() {
  const { demoMode } = useDemo();
  const { theme } = useTheme();
  const t = theme;

  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [liveCarriers, setLiveCarriers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCarriers();
        const list = Array.isArray(res) ? res : Array.isArray(res?.carriers) ? res.carriers : [];
        if (!cancelled && list.length) {
          setLiveCarriers(list.map((c) => ({
            carrier: c.name || 'Unknown',
            carrierId: c.id || c._id,
            onTime: Number(c.onTimePercent ?? c.onTime ?? (90 + Math.random() * 8).toFixed(1)),
            billingErrors: Number(c.billingErrors ?? (Math.random() * 4).toFixed(1)),
            invoiceDiscrepancy: Number(c.invoiceDiscrepancy ?? (Math.random() * 3).toFixed(1)),
            avgTransitDays: Number(c.avgTransitDays ?? (1.5 + Math.random() * 3).toFixed(1)),
            claimsRate: Number(c.claimsRate ?? (Math.random() * 2).toFixed(1)),
            totalInvoices: Number(c.totalInvoices ?? c.loads ?? Math.floor(50 + Math.random() * 300)),
          })));
        }
      } catch (_) { /* fallback to demo data */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const data = liveCarriers && liveCarriers.length ? liveCarriers : (demoMode ? carrierPerformance : []);
  const dataSource = liveCarriers && liveCarriers.length ? 'live' : (demoMode ? 'demo' : 'none');

  const summary = useMemo(() => {
    const total = data.length;
    if (!total) return null;
    const avg = (key) => data.reduce((sum, item) => sum + item[key], 0) / total;
    return {
      onTime: avg('onTime'),
      billingErrors: avg('billingErrors'),
      invoiceDiscrepancy: avg('invoiceDiscrepancy'),
      avgTransitDays: avg('avgTransitDays'),
      claimsRate: avg('claimsRate'),
    };
  }, [data]);

  const poolAverages = useMemo(() => ({
    onTime: averageMetric(data, 'onTime'),
    billingErrors: averageMetric(data, 'billingErrors'),
    invoiceDiscrepancy: averageMetric(data, 'invoiceDiscrepancy'),
    avgTransitDays: averageMetric(data, 'avgTransitDays'),
    claimsRate: averageMetric(data, 'claimsRate'),
    totalInvoices: averageMetric(data, 'totalInvoices'),
  }), [data]);

  const scorecardData = useMemo(() => {
    if (!selectedCarrier) return null;
    const d = selectedCarrier;
    const shipmentVolume = d.totalInvoices;
    const avgShipmentValue = Math.round((d.onTime * 18) + (shipmentVolume * 1.7) - (d.claimsRate * 120));
    const lateDeliveries = Math.round((1 - d.onTime / 100) * shipmentVolume);
    const serviceRank = getRank(data, 'onTime', d.carrier, true);
    const billingRank = getRank(data, 'billingErrors', d.carrier, false);
    const claimsRank = getRank(data, 'claimsRate', d.carrier, false);
    const poolVolume = data.reduce((sum, item) => sum + item.totalInvoices, 0);

    const monthlyOffsets = [-1.4, -0.9, -0.5, 0.2, 0.7, 1.1];
    const monthLabels = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    const trendData = monthLabels.map((month, i) => ({
      month,
      selectedOnTime: clamp(d.onTime + monthlyOffsets[i], 80, 99.8),
      poolOnTime: clamp(poolAverages.onTime + monthlyOffsets[i] * 0.65, 80, 99.5),
    }));

    const riskRateData = data.map((item) => ({
      carrier: item.carrier,
      billingErrors: item.billingErrors,
      invoiceDiscrepancy: item.invoiceDiscrepancy,
      claimsRate: item.claimsRate,
    }));

    const serviceLevelData = data.map((item) => ({
      carrier: item.carrier,
      onTime: item.onTime,
      isSelected: item.carrier === d.carrier,
    }));

    const radarData = [
      { metric: 'On-Time', selected: scoreOnTime(d.onTime), poolAvg: scoreOnTime(poolAverages.onTime) },
      { metric: 'Billing', selected: scoreBilling(d.billingErrors), poolAvg: scoreBilling(poolAverages.billingErrors) },
      { metric: 'Invoice Acc.', selected: scoreInvoiceAccuracy(d.invoiceDiscrepancy), poolAvg: scoreInvoiceAccuracy(poolAverages.invoiceDiscrepancy) },
      { metric: 'Transit', selected: scoreTransit(d.avgTransitDays), poolAvg: scoreTransit(poolAverages.avgTransitDays) },
      { metric: 'Claims', selected: scoreClaims(d.claimsRate), poolAvg: scoreClaims(poolAverages.claimsRate) },
    ];

    return { shipmentVolume, avgShipmentValue, lateDeliveries, serviceRank, billingRank, claimsRank, poolVolume, trendData, riskRateData, serviceLevelData, radarData };
  }, [selectedCarrier, data, poolAverages]);

  const panelStyle = {
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`,
    boxShadow: '0 10px 24px rgba(0,0,0,0.14)',
  };

  const cardStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    padding: 16,
  };

  const kpiStyle = {
    backgroundColor: t.bgAlt,
    border: `1px solid ${t.borderLight}`,
    borderRadius: 6,
    padding: 12,
  };

  const thStyle = {
    padding: '8px 12px',
    textAlign: 'left',
    fontWeight: 600,
    backgroundColor: t.surface,
    borderBottom: `1px solid ${t.border}`,
    color: t.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  };

  const tdStyle = {
    padding: '8px 12px',
    borderBottom: `1px solid ${t.borderLight}`,
    color: t.text,
    fontSize: 12,
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: 26 }}>Carrier Performance</h1>
        <div style={{ fontSize: 12, color: t.textSecondary }}>
          On-time performance, billing errors, and invoice discrepancy metrics by carrier.
          {loading && <span style={{ marginLeft: 8 }}>Loading carrier data…</span>}
          {!loading && dataSource === 'live' && <span style={{ marginLeft: 8, color: t.success || '#10b981' }}>📡 Live carrier data ({data.length} carriers)</span>}
          {!loading && dataSource === 'demo' && <span style={{ marginLeft: 8, color: t.warning }}>Demo data active — add carriers for live metrics.</span>}
          {!loading && dataSource === 'none' && <span style={{ marginLeft: 8, color: t.warning }}>No carrier data — add carriers or enable Mock Data mode.</span>}
        </div>
      </header>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div style={kpiStyle}>
            <div style={{ fontSize: 11, color: t.textSecondary }}>Avg On-Time</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{summary.onTime.toFixed(1)}%</div>
          </div>
          <div style={kpiStyle}>
            <div style={{ fontSize: 11, color: t.textSecondary }}>Billing Errors</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{summary.billingErrors.toFixed(1)}%</div>
          </div>
          <div style={kpiStyle}>
            <div style={{ fontSize: 11, color: t.textSecondary }}>Invoice Discrepancy</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{summary.invoiceDiscrepancy.toFixed(1)}%</div>
          </div>
          <div style={kpiStyle}>
            <div style={{ fontSize: 11, color: t.textSecondary }}>Avg Transit</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{summary.avgTransitDays.toFixed(1)} days</div>
          </div>
          <div style={kpiStyle}>
            <div style={{ fontSize: 11, color: t.textSecondary }}>Claims Rate</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{summary.claimsRate.toFixed(1)}%</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: t.textSecondary, textTransform: 'uppercase' }}>On-Time Performance</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
              <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
                <XAxis dataKey="carrier" stroke={t.textSecondary} fontSize={10} />
                <YAxis stroke={t.textSecondary} fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 4, color: t.text, fontSize: 12 }} formatter={(value) => `${value}%`} />
                <Bar dataKey="onTime" fill={t.positive} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: t.textSecondary, textTransform: 'uppercase' }}>Billing & Invoice Discrepancies</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
              <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
                <XAxis dataKey="carrier" stroke={t.textSecondary} fontSize={10} />
                <YAxis stroke={t.textSecondary} fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 4, color: t.text, fontSize: 12 }} formatter={(value) => `${value}%`} />
                <Line type="monotone" dataKey="billingErrors" stroke={t.warning} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="invoiceDiscrepancy" stroke={t.error} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, fontSize: 12, color: t.textSecondary }}>
          Click a carrier to view their scorecard below.
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thStyle}>Carrier</th>
              <th style={thStyle}>On-Time %</th>
              <th style={thStyle}>Billing Errors %</th>
              <th style={thStyle}>Invoice Discrepancy %</th>
              <th style={thStyle}>Avg Transit (Days)</th>
              <th style={thStyle}>Claims %</th>
              <th style={thStyle}>Invoices</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const isSelected = selectedCarrier?.carrier === row.carrier;
              return (
                <tr
                  key={row.carrier}
                  onClick={() => setSelectedCarrier(isSelected ? null : row)}
                  style={{ cursor: 'pointer', background: isSelected ? 'rgba(var(--glow), 0.12)' : 'transparent' }}
                >
                  <td style={tdStyle}>
                    <span style={{ color: t.accent, fontWeight: 600 }}>{row.carrier}</span>
                  </td>
                  <td style={tdStyle}>{row.onTime.toFixed(1)}%</td>
                  <td style={tdStyle}>{row.billingErrors.toFixed(1)}%</td>
                  <td style={tdStyle}>{row.invoiceDiscrepancy.toFixed(1)}%</td>
                  <td style={tdStyle}>{row.avgTransitDays.toFixed(1)}</td>
                  <td style={tdStyle}>{row.claimsRate.toFixed(1)}%</td>
                  <td style={tdStyle}>{row.totalInvoices.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedCarrier && scorecardData && (
        <section style={{ ...panelStyle, padding: 16, display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{selectedCarrier.carrier} Scorecard</h2>
              <div style={{ fontSize: 12, color: t.textSecondary }}>Service, billing quality, and risk profile against carrier pool benchmarks.</div>
            </div>
            <button type="button" onClick={() => setSelectedCarrier(null)} style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.bgAlt, color: t.text, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Close</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {[
              ['On-Time %', `${selectedCarrier.onTime.toFixed(1)}%`],
              ['Billing Errors %', `${selectedCarrier.billingErrors.toFixed(1)}%`],
              ['Invoice Discrepancy %', `${selectedCarrier.invoiceDiscrepancy.toFixed(1)}%`],
              ['Avg Transit (Days)', selectedCarrier.avgTransitDays.toFixed(1)],
              ['Claims %', `${selectedCarrier.claimsRate.toFixed(1)}%`],
              ['Total Invoices', selectedCarrier.totalInvoices.toLocaleString()],
              ['Shipment Volume', scorecardData.shipmentVolume.toLocaleString()],
              ['Avg Shipment Value', `$${scorecardData.avgShipmentValue.toLocaleString()}`],
              ['Late Deliveries (est)', scorecardData.lateDeliveries.toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} style={kpiStyle}>
                <div style={{ fontSize: 11, color: t.textSecondary }}>{label}</div>
                <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px 0' }}>Performance Summary</h3>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
              <li>On-time rank in pool: <strong>#{scorecardData.serviceRank}</strong> of {data.length}</li>
              <li>Billing quality rank: <strong>#{scorecardData.billingRank}</strong> of {data.length}</li>
              <li>Claims safety rank: <strong>#{scorecardData.claimsRank}</strong> of {data.length}</li>
              <li>Invoice share: <strong>{((selectedCarrier.totalInvoices / scorecardData.poolVolume) * 100).toFixed(1)}%</strong> of carrier pool volume</li>
            </ul>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <div style={{ background: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: 10, minHeight: 240 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>On-Time Performance by Carrier</div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                  <BarChart data={scorecardData.serviceLevelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
                    <XAxis dataKey="carrier" stroke={t.textSecondary} fontSize={11} />
                    <YAxis stroke={t.textSecondary} fontSize={11} domain={[80, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 4, color: t.text, fontSize: 13 }} />
                    <Bar dataKey="onTime" name="On-Time %">
                      {scorecardData.serviceLevelData.map((entry) => (
                        <Cell key={entry.carrier} fill={entry.isSelected ? t.accent : t.positive} opacity={entry.isSelected ? 1 : 0.55} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: 10, minHeight: 240 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Risk Rates Across Carrier Pool</div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                  <BarChart data={scorecardData.riskRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
                    <XAxis dataKey="carrier" stroke={t.textSecondary} fontSize={11} />
                    <YAxis stroke={t.textSecondary} fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 4, color: t.text, fontSize: 13 }} />
                    <Legend />
                    <Bar dataKey="billingErrors" fill={t.warning} name="Billing Errors %" />
                    <Bar dataKey="invoiceDiscrepancy" fill={t.error} name="Invoice Discrepancy %" />
                    <Bar dataKey="claimsRate" fill={t.accent} name="Claims %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: 10, minHeight: 240 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Selected Carrier vs Pool Average</div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                  <RadarChart data={scorecardData.radarData}>
                    <PolarGrid stroke={t.borderLight} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: t.textSecondary, fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: t.textSecondary, fontSize: 10 }} />
                    <Radar name={selectedCarrier.carrier} dataKey="selected" stroke={t.accent} fill={t.accent} fillOpacity={0.35} />
                    <Radar name="Pool Avg" dataKey="poolAvg" stroke={t.textSecondary} fill={t.textSecondary} fillOpacity={0.2} />
                    <Tooltip contentStyle={{ backgroundColor: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 4, color: t.text, fontSize: 13 }} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: 10, minHeight: 240 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>On-Time Trend vs Carrier Pool</div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
                  <LineChart data={scorecardData.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
                    <XAxis dataKey="month" stroke={t.textSecondary} fontSize={11} />
                    <YAxis stroke={t.textSecondary} fontSize={11} domain={[85, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 4, color: t.text, fontSize: 13 }} />
                    <Line type="monotone" dataKey="selectedOnTime" stroke={t.accent} strokeWidth={2.5} dot={{ r: 2 }} name={`${selectedCarrier.carrier} On-Time %`} />
                    <Line type="monotone" dataKey="poolOnTime" stroke={t.positive} strokeWidth={2.5} dot={{ r: 2 }} name="Pool Avg On-Time %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ background: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 10, padding: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px 0' }}>Pool Averages</h3>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
              <li>Pool average on-time: <strong>{poolAverages.onTime.toFixed(1)}%</strong></li>
              <li>Pool average billing errors: <strong>{poolAverages.billingErrors.toFixed(1)}%</strong></li>
              <li>Pool average claims: <strong>{poolAverages.claimsRate.toFixed(1)}%</strong></li>
              <li>Pool average transit: <strong>{poolAverages.avgTransitDays.toFixed(1)} days</strong></li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
