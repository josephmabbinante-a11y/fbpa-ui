import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Cell,
} from 'recharts';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme, themes } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';
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

function scoreOnTime(value) {
  return clamp(value, 0, 100);
}

function scoreBilling(value) {
  return clamp(100 - value * 20, 0, 100);
}

function scoreInvoiceAccuracy(value) {
  return clamp(100 - value * 20, 0, 100);
}

function scoreTransit(value) {
  return clamp(100 - value * 15, 0, 100);
}

function scoreClaims(value) {
  return clamp(100 - value * 25, 0, 100);
}

export default function CarrierScorecard() {
  const { carrier } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { demoMode } = useDemo();
  const t = themes[theme];

  const decodedCarrier = decodeURIComponent(carrier);
  const carriers = demoMode ? carrierPerformance : [];
  const data = carriers.find((c) => c.carrier === decodedCarrier);

  const [show, setShow] = useState({
    onTime: true,
    billingErrors: true,
    invoiceDiscrepancy: true,
    avgTransitDays: true,
    claimsRate: true,
    totalInvoices: true,
    shipmentVolume: true,
    avgShipmentValue: true,
    lateDeliveries: true,
    trend: true,
    summary: true,
    advanced: false,
  });

  const poolAverages = useMemo(
    () => ({
      onTime: averageMetric(carriers, 'onTime'),
      billingErrors: averageMetric(carriers, 'billingErrors'),
      invoiceDiscrepancy: averageMetric(carriers, 'invoiceDiscrepancy'),
      avgTransitDays: averageMetric(carriers, 'avgTransitDays'),
      claimsRate: averageMetric(carriers, 'claimsRate'),
      totalInvoices: averageMetric(carriers, 'totalInvoices'),
    }),
    [carriers]
  );

  if (!data) {
    return (
      <div style={{ padding: 32, color: t.text }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>Back</button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{demoMode ? 'Carrier not found' : 'Carrier preview available in Mock Data mode only'}</div>
      </div>
    );
  }

  const shipmentVolume = data.totalInvoices;
  const avgShipmentValue = Math.round((data.onTime * 18) + (shipmentVolume * 1.7) - (data.claimsRate * 120));
  const lateDeliveries = Math.round((1 - data.onTime / 100) * shipmentVolume);

  const serviceRank = getRank(carriers, 'onTime', data.carrier, true);
  const billingRank = getRank(carriers, 'billingErrors', data.carrier, false);
  const claimsRank = getRank(carriers, 'claimsRate', data.carrier, false);

  const poolVolume = carriers.reduce((sum, item) => sum + item.totalInvoices, 0);

  const monthlyOffsets = [-1.4, -0.9, -0.5, 0.2, 0.7, 1.1];
  const monthLabels = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const trendData = monthLabels.map((month, index) => {
    const offset = monthlyOffsets[index];
    return {
      month,
      selectedOnTime: clamp(data.onTime + offset, 80, 99.8),
      poolOnTime: clamp(poolAverages.onTime + offset * 0.65, 80, 99.5),
      selectedClaims: clamp(data.claimsRate + (offset * -0.08), 0.1, 3),
    };
  });

  const riskRateData = carriers.map((item) => ({
    carrier: item.carrier,
    billingErrors: item.billingErrors,
    invoiceDiscrepancy: item.invoiceDiscrepancy,
    claimsRate: item.claimsRate,
  }));

  const serviceLevelData = carriers.map((item) => ({
    carrier: item.carrier,
    onTime: item.onTime,
    totalInvoices: item.totalInvoices,
    isSelected: item.carrier === data.carrier,
  }));

  const radarData = [
    {
      metric: 'On-Time',
      selected: scoreOnTime(data.onTime),
      poolAvg: scoreOnTime(poolAverages.onTime),
    },
    {
      metric: 'Billing',
      selected: scoreBilling(data.billingErrors),
      poolAvg: scoreBilling(poolAverages.billingErrors),
    },
    {
      metric: 'Invoice Acc.',
      selected: scoreInvoiceAccuracy(data.invoiceDiscrepancy),
      poolAvg: scoreInvoiceAccuracy(poolAverages.invoiceDiscrepancy),
    },
    {
      metric: 'Transit',
      selected: scoreTransit(data.avgTransitDays),
      poolAvg: scoreTransit(poolAverages.avgTransitDays),
    },
    {
      metric: 'Claims',
      selected: scoreClaims(data.claimsRate),
      poolAvg: scoreClaims(poolAverages.claimsRate),
    },
  ];

  return (
    <div style={{ padding: 32, background: t.bg, color: t.text, minHeight: '100vh' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16, background: t.bgAlt, border: `1px solid ${t.border}`, color: t.text, borderRadius: 6, padding: '8px 12px', cursor: 'pointer' }}>Back</button>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{data.carrier} Scorecard</h1>

      <div style={{ marginBottom: 18, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 14, marginRight: 8 }}>Customize:</span>
        {Object.keys(show).map((key) => key !== 'advanced' && key !== 'summary' && (
          <label key={key} style={{ fontSize: 13, marginRight: 8 }}>
            <input type="checkbox" checked={show[key]} onChange={(e) => setShow((s) => ({ ...s, [key]: e.target.checked }))} /> {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
          </label>
        ))}
        <label style={{ fontSize: 13 }}>
          <input type="checkbox" checked={show.summary} onChange={(e) => setShow((s) => ({ ...s, summary: e.target.checked }))} /> Summary
        </label>
        <label style={{ fontSize: 13 }}>
          <input type="checkbox" checked={show.advanced} onChange={(e) => setShow((s) => ({ ...s, advanced: e.target.checked }))} /> Advanced
        </label>
      </div>

      <div style={{ marginBottom: 24, fontSize: 15 }}>
        {show.onTime && (<><strong>On-Time %:</strong> {data.onTime.toFixed(1)}%<br /></>)}
        {show.billingErrors && (<><strong>Billing Errors %:</strong> {data.billingErrors.toFixed(1)}%<br /></>)}
        {show.invoiceDiscrepancy && (<><strong>Invoice Discrepancy %:</strong> {data.invoiceDiscrepancy.toFixed(1)}%<br /></>)}
        {show.avgTransitDays && (<><strong>Avg Transit (Days):</strong> {data.avgTransitDays.toFixed(1)}<br /></>)}
        {show.claimsRate && (<><strong>Claims %:</strong> {data.claimsRate.toFixed(1)}%<br /></>)}
        {show.totalInvoices && (<><strong>Total Invoices:</strong> {data.totalInvoices.toLocaleString()}<br /></>)}
        {show.shipmentVolume && (<><strong>Shipment Volume:</strong> {shipmentVolume.toLocaleString()}<br /></>)}
        {show.avgShipmentValue && (<><strong>Avg Shipment Value:</strong> ${avgShipmentValue.toLocaleString()}<br /></>)}
        {show.lateDeliveries && (<><strong>Late Deliveries (est):</strong> {lateDeliveries.toLocaleString()}<br /></>)}
      </div>

      {show.summary && (
        <div style={{ background: t.surface, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: 24, fontSize: 15, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Performance Summary</h2>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {show.onTime && <li>On-time rank in pool: <strong>#{serviceRank}</strong> of {carriers.length}</li>}
            {show.billingErrors && <li>Billing quality rank: <strong>#{billingRank}</strong> of {carriers.length}</li>}
            {show.claimsRate && <li>Claims safety rank: <strong>#{claimsRank}</strong> of {carriers.length}</li>}
            {show.totalInvoices && <li>Invoice share: <strong>{((data.totalInvoices / poolVolume) * 100).toFixed(1)}%</strong> of carrier pool volume</li>}
          </ul>

          <div style={{ marginTop: 28, marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Carrier Pool Comparison</h3>
            <div style={{ fontSize: 13, color: t.textSecondary }}>
              Selected carrier is benchmarked against the full carrier pool across service, risk, and stability metrics.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <div style={{ background: t.bgAlt, borderRadius: 8, padding: 12, minHeight: 240 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>On-Time Performance by Carrier</div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceLevelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
                    <XAxis dataKey="carrier" stroke={t.textSecondary} fontSize={11} />
                    <YAxis stroke={t.textSecondary} fontSize={11} domain={[80, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 4, color: t.text, fontSize: 13 }} />
                    <Bar dataKey="onTime" name="On-Time %">
                      {serviceLevelData.map((entry) => (
                        <Cell key={entry.carrier} fill={entry.isSelected ? t.accent : t.positive} opacity={entry.isSelected ? 1 : 0.55} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: t.bgAlt, borderRadius: 8, padding: 12, minHeight: 240 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Risk Rates Across Carrier Pool</div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskRateData}>
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

            <div style={{ background: t.bgAlt, borderRadius: 8, padding: 12, minHeight: 240 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Selected Carrier vs Pool Average</div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={t.borderLight} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: t.textSecondary, fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: t.textSecondary, fontSize: 10 }} />
                    <Radar name={data.carrier} dataKey="selected" stroke={t.accent} fill={t.accent} fillOpacity={0.35} />
                    <Radar name="Pool Avg" dataKey="poolAvg" stroke={t.textSecondary} fill={t.textSecondary} fillOpacity={0.2} />
                    <Tooltip contentStyle={{ backgroundColor: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 4, color: t.text, fontSize: 13 }} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: t.bgAlt, borderRadius: 8, padding: 12, minHeight: 240 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>On-Time Trend vs Carrier Pool</div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
                    <XAxis dataKey="month" stroke={t.textSecondary} fontSize={11} />
                    <YAxis stroke={t.textSecondary} fontSize={11} domain={[85, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 4, color: t.text, fontSize: 13 }} />
                    {show.trend && <Line type="monotone" dataKey="selectedOnTime" stroke={t.accent} strokeWidth={2.5} dot={{ r: 2 }} name={`${data.carrier} On-Time %`} />}
                    {show.trend && <Line type="monotone" dataKey="poolOnTime" stroke={t.positive} strokeWidth={2.5} dot={{ r: 2 }} name="Pool Avg On-Time %" />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {show.advanced && (
        <div style={{ background: t.bgAlt, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: 24, fontSize: 15 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Advanced Details</h2>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Pool average on-time: <strong>{poolAverages.onTime.toFixed(1)}%</strong></li>
            <li>Pool average billing errors: <strong>{poolAverages.billingErrors.toFixed(1)}%</strong></li>
            <li>Pool average claims: <strong>{poolAverages.claimsRate.toFixed(1)}%</strong></li>
            <li>Pool average transit: <strong>{poolAverages.avgTransitDays.toFixed(1)} days</strong></li>
          </ul>
        </div>
      )}
    </div>
  );
}
