import React, { useState } from 'react';

const STORAGE_KEY = 'fbpa_rate_logic_v1';

const DEFAULTS = {
  baseMethod: 'Per Mile',
  fuelSurcharge: '8.5',
  detentionRate: '75',
  layoverRate: '250',
  tolerancePct: '3',
  fuelIndexSource: 'DOE National Average',
  accessorialMarkup: '15',
  minLinehaul: '250',
  maxAge: '90',
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') return { ...DEFAULTS, ...parsed };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

export default function RateLogicPanel({ t, onSave }) {
  const [config, setConfig] = useState(loadConfig);
  const [message, setMessage] = useState('');

  const themeText = (t && t.text) || '#1a1a2e';
  const themeSecondary = (t && t.textSecondary) || '#6b7280';
  const themeAccent = (t && t.accent) || '#0a7cff';
  const themeBorder = (t && t.border) || '#e5e7eb';
  const themeSurface = (t && t.surface) || '#fff';
  const themeSuccess = (t && t.success) || '#16a34a';
  const themeWarning = (t && t.warning) || '#f59e0b';

  function update(key, value) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    if (onSave) onSave(config);
    setMessage('Rate logic configuration saved.');
    setTimeout(() => setMessage(''), 4000);
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: `1px solid ${themeBorder}`,
    fontSize: 13,
    background: 'transparent',
    color: themeText,
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: themeSecondary,
    marginBottom: 4,
  };

  const hintStyle = {
    fontSize: 11,
    color: themeSecondary,
    marginTop: 2,
  };

  return (
    <div>
      <h4 style={{ margin: '0 0 4px', color: themeText }}>Rate Logic Configuration</h4>
      <div style={{ fontSize: 12, color: themeSecondary, marginBottom: 16 }}>
        Configure how freight rates are calculated, including base methods, surcharges, and tolerance thresholds.
      </div>

      {message && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            background: `${themeSuccess}18`,
            color: themeSuccess,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          ✓ {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Base Rate Configuration */}
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            border: `1px solid ${themeBorder}`,
            background: themeSurface,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: themeText }}>
            📊 Base Rate Configuration
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Base Rate Method</label>
              <select value={config.baseMethod} onChange={(e) => update('baseMethod', e.target.value)} style={inputStyle}>
                <option>Per Mile</option>
                <option>Flat Rate</option>
                <option>Percentage of Linehaul</option>
                <option>Weight-Based</option>
                <option>Cubic Volume</option>
              </select>
              <div style={hintStyle}>Primary method for calculating freight charges</div>
            </div>
            <div>
              <label style={labelStyle}>Minimum Linehaul ($)</label>
              <input
                type="number"
                value={config.minLinehaul}
                onChange={(e) => update('minLinehaul', e.target.value)}
                placeholder="250"
                style={inputStyle}
              />
              <div style={hintStyle}>Minimum charge per shipment regardless of method</div>
            </div>
          </div>
        </div>

        {/* Surcharges & Accessorials */}
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            border: `1px solid ${themeBorder}`,
            background: themeSurface,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: themeText }}>
            💰 Surcharges & Accessorials
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Fuel Surcharge (%)</label>
              <input
                type="number"
                value={config.fuelSurcharge}
                onChange={(e) => update('fuelSurcharge', e.target.value)}
                placeholder="8.5"
                step="0.1"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Fuel Index Source</label>
              <select value={config.fuelIndexSource} onChange={(e) => update('fuelIndexSource', e.target.value)} style={inputStyle}>
                <option>DOE National Average</option>
                <option>EIA Weekly Retail</option>
                <option>Custom Table</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Detention Rate ($/hr)</label>
              <input
                type="number"
                value={config.detentionRate}
                onChange={(e) => update('detentionRate', e.target.value)}
                placeholder="75"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Layover Rate ($/day)</label>
              <input
                type="number"
                value={config.layoverRate}
                onChange={(e) => update('layoverRate', e.target.value)}
                placeholder="250"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Accessorial Markup (%)</label>
              <input
                type="number"
                value={config.accessorialMarkup}
                onChange={(e) => update('accessorialMarkup', e.target.value)}
                placeholder="15"
                style={inputStyle}
              />
              <div style={hintStyle}>Default markup on all accessorial charges</div>
            </div>
          </div>
        </div>

        {/* Audit & Tolerance */}
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            border: `1px solid ${themeBorder}`,
            background: themeSurface,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: themeText }}>
            🔍 Audit & Tolerance
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Overcharge Tolerance (%)</label>
              <input
                type="number"
                value={config.tolerancePct}
                onChange={(e) => update('tolerancePct', e.target.value)}
                placeholder="3"
                style={inputStyle}
              />
              <div style={hintStyle}>
                Invoices exceeding the quoted rate by more than this percentage will be flagged
              </div>
            </div>
            <div>
              <label style={labelStyle}>Rate Quote Max Age (days)</label>
              <input
                type="number"
                value={config.maxAge}
                onChange={(e) => update('maxAge', e.target.value)}
                placeholder="90"
                style={inputStyle}
              />
              <div style={hintStyle}>Quotes older than this will require re-pricing</div>
            </div>
          </div>

          {/* Tolerance visual */}
          <div style={{ marginTop: 16, padding: 12, borderRadius: 6, background: `${themeAccent}08`, border: `1px solid ${themeBorder}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: themeText, marginBottom: 8 }}>Tolerance Preview</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: `${themeSuccess}33`, position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${Math.min(Number(config.tolerancePct) || 3, 30) * 3.33}%`,
                    borderRadius: 4,
                    background: themeSuccess,
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: themeSuccess, fontWeight: 700, minWidth: 36 }}>
                ≤{config.tolerancePct || 3}%
              </span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: `${themeWarning}33` }} />
              <span style={{ fontSize: 11, color: themeWarning, fontWeight: 700, minWidth: 36 }}>
                &gt;{config.tolerancePct || 3}%
              </span>
            </div>
            <div style={{ fontSize: 11, color: themeSecondary, marginTop: 4 }}>
              Invoices within {config.tolerancePct || 3}% of quoted rate auto-approve · Over {config.tolerancePct || 3}% triggers review
            </div>
          </div>
        </div>

        <button
          type="submit"
          style={{
            padding: '10px 24px',
            borderRadius: 6,
            border: 'none',
            background: themeAccent,
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Save Rate Configuration
        </button>
      </form>
    </div>
  );
}
