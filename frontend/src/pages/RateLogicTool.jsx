import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import RateCalculator from '../components/RateCalculator.jsx';
import QuoteEmailGenerator from '../components/QuoteEmailGenerator';

const EQUIPMENT_TYPES = [
  { value: 'DV', label: 'Dry Van' },
  { value: 'REEFER', label: 'Reefer' },
  { value: 'FLATBED', label: 'Flatbed' },
  { value: 'DRAY', label: 'Drayage' },
];

function calcCarrierBuy(miles, rpm, equipment, fuel) {
  const equipMulti = equipment === 'REEFER' ? 1.09 : equipment === 'FLATBED' ? 1.06 : 1.0;
  return Math.round(miles * rpm * equipMulti + miles * fuel);
}

function calcShipperQuote(carrierBuy, marginPct) {
  return Math.round(carrierBuy / (1 - marginPct / 100));
}

function calcWinProbability(sellRate, marketRate) {
  const ratio = sellRate / Math.max(marketRate, 1);
  if (ratio <= 0.95) return 92;
  if (ratio <= 1.0) return 78;
  if (ratio <= 1.05) return 62;
  if (ratio <= 1.1) return 44;
  return 28;
}

const TABS = [
  { key: 'engine', label: 'Rate Logic Engine' },
  { key: 'calculator', label: 'Rate Calculator' },
  { key: 'formula', label: 'Pricing Formula' },
  { key: 'email-quote', label: 'Email Quote' },
  { key: 'bulk-import', label: 'Bulk Import' },
];

export default function RateLogicTool() {
  const { theme } = useTheme();
  const t = theme;

  const [activeTab, setActiveTab] = useState('engine');

  // Simple calculator state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [miles, setMiles] = useState(1380);
  const [marketRpm, setMarketRpm] = useState(2.42);
  const [equipment, setEquipment] = useState('DV');
  const [marginTarget, setMarginTarget] = useState(15);
  const [fuelCost, setFuelCost] = useState(0.55);
  const [demandHigh, setDemandHigh] = useState(false);
  const [supplyLow, setSupplyLow] = useState(false);

  const carrierBuy = calcCarrierBuy(miles, marketRpm, equipment, fuelCost);
  const adjustedMargin = demandHigh && supplyLow ? marginTarget + 3 : marginTarget;
  const shipperQuote = calcShipperQuote(carrierBuy, adjustedMargin);
  const brokerMargin = shipperQuote - carrierBuy;
  const marketRate = Math.round(miles * marketRpm * 1.08);
  const winPct = calcWinProbability(shipperQuote, marketRate);
  const rpmSell = (shipperQuote / miles).toFixed(2);

  const cardStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: 20,
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: t.textSecondary,
    marginBottom: 4,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 4,
    border: `1px solid ${t.border}`,
    backgroundColor: t.bg,
    color: t.text,
    fontSize: 13,
    boxSizing: 'border-box',
  };

  const tabStyle = (active) => ({
    padding: '8px 18px',
    borderRadius: 4,
    border: `1px solid ${active ? t.accent : t.border}`,
    backgroundColor: active ? t.accent : 'transparent',
    color: active ? '#fff' : t.text,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
  });

  const resultLabelStyle = { fontSize: 12, color: t.textSecondary, marginBottom: 2 };

  const resultValueStyle = (color) => ({
    fontSize: 22,
    fontWeight: 700,
    color: color || t.text,
  });

  return (
    <div style={{ padding: 24, backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>
      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>💰 Rate Logic Tool</div>
        <div style={{ fontSize: 14, color: t.textSecondary }}>
          Rate engine • Quick calculator • Pricing formula • Email quotes • Bulk import
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button key={tab.key} style={tabStyle(activeTab === tab.key)} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Rate Logic Engine (full engine) ── */}
      {activeTab === 'engine' && <RateCalculator />}

      {/* ── Quick Rate Calculator ── */}
      {activeTab === 'calculator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📍 Lane Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Origin</label>
                  <input style={inputStyle} value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Origin city, state" />
                </div>
                <div>
                  <label style={labelStyle}>Destination</label>
                  <input style={inputStyle} value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destination city, state" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Miles</label>
                  <input style={inputStyle} type="number" value={miles} onChange={e => setMiles(Number(e.target.value))} min={1} />
                </div>
                <div>
                  <label style={labelStyle}>Equipment Type</label>
                  <select style={inputStyle} value={equipment} onChange={e => setEquipment(e.target.value)}>
                    {EQUIPMENT_TYPES.map(eq => (
                      <option key={eq.value} value={eq.value}>{eq.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📊 Market Conditions</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Market RPM ($)</label>
                  <input style={inputStyle} type="number" step="0.01" value={marketRpm} onChange={e => setMarketRpm(Number(e.target.value))} min={0.5} />
                </div>
                <div>
                  <label style={labelStyle}>Fuel Component ($/mi)</label>
                  <input style={inputStyle} type="number" step="0.01" value={fuelCost} onChange={e => setFuelCost(Number(e.target.value))} min={0} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={demandHigh} onChange={e => setDemandHigh(e.target.checked)} />
                  Lane Demand High
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={supplyLow} onChange={e => setSupplyLow(e.target.checked)} />
                  Truck Supply Low
                </label>
              </div>
              {demandHigh && supplyLow && (
                <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 8, padding: '6px 10px', backgroundColor: '#f59e0b18', borderRadius: 4 }}>
                  ⚡ High demand + low supply detected — margin target auto-adjusted +3%
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>🎯 Margin Target</div>
              <label style={labelStyle}>Broker Margin % (target: {adjustedMargin}%)</label>
              <input
                type="range"
                min={5}
                max={35}
                value={marginTarget}
                onChange={e => setMarginTarget(Number(e.target.value))}
                style={{ width: '100%', marginBottom: 8 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.textSecondary }}>
                <span>5% (aggressive)</span>
                <span style={{ fontWeight: 700, color: t.text }}>{adjustedMargin}% current</span>
                <span>35% (conservative)</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...cardStyle, background: `linear-gradient(135deg, ${t.surface}, ${t.bgAlt})` }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>📈 Rate Output</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ ...cardStyle, padding: 14 }}>
                  <div style={resultLabelStyle}>Carrier Buy Rate</div>
                  <div style={resultValueStyle('#3b82f6')}>${carrierBuy.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 4 }}>${(carrierBuy / miles).toFixed(2)}/mi</div>
                </div>
                <div style={{ ...cardStyle, padding: 14 }}>
                  <div style={resultLabelStyle}>Shipper Quote</div>
                  <div style={resultValueStyle('#10b981')}>${shipperQuote.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 4 }}>${rpmSell}/mi</div>
                </div>
                <div style={{ ...cardStyle, padding: 14 }}>
                  <div style={resultLabelStyle}>Broker Margin</div>
                  <div style={resultValueStyle('#f59e0b')}>${brokerMargin.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 4 }}>{adjustedMargin}% margin</div>
                </div>
                <div style={{ ...cardStyle, padding: 14 }}>
                  <div style={resultLabelStyle}>Win Probability</div>
                  <div style={resultValueStyle(winPct >= 65 ? '#10b981' : winPct >= 45 ? '#f59e0b' : '#ef4444')}>{winPct}%</div>
                  <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 4 }}>vs. market rate</div>
                </div>
              </div>

              <div style={{ padding: '14px 16px', backgroundColor: t.bg, borderRadius: 6, border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Calculation Breakdown</div>
                <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6, color: t.textSecondary }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Distance</span>
                    <span style={{ color: t.text, fontWeight: 500 }}>{miles.toLocaleString()} mi</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Base Linehaul ({equipment})</span>
                    <span style={{ color: t.text, fontWeight: 500 }}>${Math.round(miles * marketRpm).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Fuel Component</span>
                    <span style={{ color: t.text, fontWeight: 500 }}>${Math.round(miles * fuelCost).toLocaleString()}</span>
                  </div>
                  {equipment !== 'DV' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Equipment Surcharge</span>
                      <span style={{ color: '#f59e0b', fontWeight: 500 }}>
                        +{equipment === 'REEFER' ? '9%' : '6%'}
                      </span>
                    </div>
                  )}
                  {(demandHigh && supplyLow) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Demand Multiplier</span>
                      <span style={{ color: '#f59e0b', fontWeight: 500 }}>+3% margin</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${t.border}`, paddingTop: 6 }}>
                    <span>Market Reference Rate</span>
                    <span style={{ color: t.text, fontWeight: 500 }}>${marketRate.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pricing Formula ── */}
      {activeTab === 'formula' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📐 Pricing Formula</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 2, backgroundColor: t.bg, padding: 16, borderRadius: 6, border: `1px solid ${t.border}` }}>
              <div style={{ color: '#3b82f6' }}>Base Linehaul Rate</div>
              <div style={{ color: t.textSecondary }}>+ Fuel Adjustment</div>
              <div style={{ color: t.textSecondary }}>+ Equipment Multiplier</div>
              <div style={{ color: '#f59e0b' }}>+ Demand Multiplier</div>
              <div style={{ color: t.textSecondary }}>+ Risk Adjustment</div>
              <div style={{ borderTop: `1px solid ${t.border}`, marginTop: 8, paddingTop: 8, color: '#10b981', fontWeight: 700 }}>= Carrier Buy Rate</div>
              <div style={{ color: '#10b981' }}>÷ (1 - Margin Target %)</div>
              <div style={{ borderTop: `1px solid ${t.border}`, marginTop: 8, paddingTop: 8, color: '#f59e0b', fontWeight: 700 }}>= Shipper Quote Price</div>
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📋 Example Calculation</div>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: t.textSecondary }}>
              <div style={{ marginBottom: 12, padding: '10px 14px', backgroundColor: t.bg, borderRadius: 6, border: `1px solid ${t.border}` }}>
                <div style={{ fontWeight: 600, color: t.text, marginBottom: 6 }}>Chicago, IL → Miami, FL</div>
                <div>Distance: 1,380 miles</div>
                <div>Market RPM: $2.42</div>
                <div>Equipment: Dry Van</div>
                <div>Fuel: $0.55/mi</div>
              </div>
              <div style={{ padding: '10px 14px', backgroundColor: t.bg, borderRadius: 6, border: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Base Linehaul</span><span style={{ color: t.text }}>$3,340</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Fuel Component</span><span style={{ color: t.text }}>$759</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderTop: `1px solid ${t.border}`, paddingTop: 8 }}>
                  <span style={{ fontWeight: 600, color: '#3b82f6' }}>Carrier Buy Rate</span><span style={{ fontWeight: 600, color: '#3b82f6' }}>$4,099</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Broker Margin (15%)</span><span style={{ color: '#f59e0b' }}>$724</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${t.border}`, paddingTop: 8 }}>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>Shipper Quote</span><span style={{ fontWeight: 600, color: '#10b981' }}>$4,823</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>⚙️ Margin Optimization Logic</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { condition: 'Lane demand HIGH + truck supply LOW', action: 'Increase margin target +3%', color: '#10b981' },
                { condition: 'Rejection rate spike detected', action: 'Reduce sell rate -2%', color: '#ef4444' },
                { condition: 'Capacity tight in region', action: 'Apply capacity surcharge', color: '#f59e0b' },
                { condition: 'Seasonal peak period', action: 'Demand multiplier applied', color: '#3b82f6' },
              ].map((rule) => (
                <div key={rule.condition} style={{ padding: 12, backgroundColor: t.bg, borderRadius: 6, border: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 6 }}>IF</div>
                  <div style={{ fontSize: 12, color: t.text, marginBottom: 8 }}>{rule.condition}</div>
                  <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 4 }}>THEN</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: rule.color }}>{rule.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Email Quote Generator ── */}
      {activeTab === 'email-quote' && <QuoteEmailGenerator />}

      {/* ── Bulk Import Templates ── */}
      {activeTab === 'bulk-import' && (
        <section
          style={{
            border: '1px solid var(--border)',
            borderRadius: 10,
            background: 'var(--surface)',
            padding: '12px 14px',
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700 }}>Bulk Rate Import Templates</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Download a starter CSV, fill your lanes, then upload through your bulk import workflow.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a
              href="/templates/rate_bulk_import_template.csv"
              download
              style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: 'var(--text)', textDecoration: 'none', background: 'var(--bg-alt)' }}
            >
              Download Standard Template
            </a>
            <a
              href="/templates/rate_bulk_import_template_extended.csv"
              download
              style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: 'var(--text)', textDecoration: 'none', background: 'var(--bg-alt)' }}
            >
              Download Extended Template
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
