import { useMemo } from 'react';
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
} from 'recharts';
import { useTheme, themes } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';
import { Link } from 'react-router-dom';
import carrierPerformance from '../mock/carriersPerformance';
import { useState } from 'react';

export default function CarriersPerformance() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [carrierForm, setCarrierForm] = useState({ carrier: '', onTime: '', billingErrors: '', invoiceDiscrepancy: '', avgTransitDays: '', claimsRate: '', totalInvoices: '' });
  const [formError, setFormError] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const { demoMode } = useDemo();
  const { theme } = useTheme();
  const t = theme;

  const data = demoMode ? carrierPerformance : [];

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

  const containerStyle = {
    padding: '24px',
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
    width: '100%',
    boxSizing: 'border-box',
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

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
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
    <div style={containerStyle}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
          onClick={() => setShowAddModal(true)}
        >
          + Add Carrier
        </button>
        <button
          style={{ background: '#388e3c', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
          onClick={() => setShowImportModal(true)}
        >
          Import Carrier List (CSV)
        </button>
        <button
          style={{ background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
          title="Integrate with MyCarrierPackets, RTS, etc. (coming soon)"
          disabled
        >
          Integrate with External Platform
        </button>
      </div>

      {/* Add Carrier Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: t.surface, color: t.text, padding: 32, borderRadius: 8, minWidth: 340, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Add Carrier</h2>
            <form onSubmit={e => {
              e.preventDefault();
              setFormError('');
              if (!carrierForm.carrier) return setFormError('Carrier name is required');
              // Here you would add logic to update the carrier list (API or state)
              setShowAddModal(false);
            }} style={{ display: 'grid', gap: 12 }}>
              <input autoFocus placeholder="Carrier Name*" value={carrierForm.carrier} onChange={e => setCarrierForm(f => ({ ...f, carrier: e.target.value }))} style={{ padding: 8, borderRadius: 4, border: `1px solid ${t.border}` }} />
              <input placeholder="On-Time %" value={carrierForm.onTime} onChange={e => setCarrierForm(f => ({ ...f, onTime: e.target.value }))} style={{ padding: 8, borderRadius: 4, border: `1px solid ${t.border}` }} />
              <input placeholder="Billing Errors %" value={carrierForm.billingErrors} onChange={e => setCarrierForm(f => ({ ...f, billingErrors: e.target.value }))} style={{ padding: 8, borderRadius: 4, border: `1px solid ${t.border}` }} />
              <input placeholder="Invoice Discrepancy %" value={carrierForm.invoiceDiscrepancy} onChange={e => setCarrierForm(f => ({ ...f, invoiceDiscrepancy: e.target.value }))} style={{ padding: 8, borderRadius: 4, border: `1px solid ${t.border}` }} />
              <input placeholder="Avg Transit Days" value={carrierForm.avgTransitDays} onChange={e => setCarrierForm(f => ({ ...f, avgTransitDays: e.target.value }))} style={{ padding: 8, borderRadius: 4, border: `1px solid ${t.border}` }} />
              <input placeholder="Claims Rate %" value={carrierForm.claimsRate} onChange={e => setCarrierForm(f => ({ ...f, claimsRate: e.target.value }))} style={{ padding: 8, borderRadius: 4, border: `1px solid ${t.border}` }} />
              <input placeholder="Total Invoices" value={carrierForm.totalInvoices} onChange={e => setCarrierForm(f => ({ ...f, totalInvoices: e.target.value }))} style={{ padding: 8, borderRadius: 4, border: `1px solid ${t.border}` }} />
              {formError && <div style={{ color: t.error, fontSize: 13 }}>{formError}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" style={{ background: t.accent, color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Add</button>
                <button type="button" style={{ background: t.bgAlt, color: t.text, border: `1px solid ${t.border}`, borderRadius: 4, padding: '8px 16px', fontWeight: 500, cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Carrier List Modal */}
      {showImportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: t.surface, color: t.text, padding: 32, borderRadius: 8, minWidth: 340, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Import Carrier List (CSV)</h2>
            <form onSubmit={async e => {
              e.preventDefault();
              setImportStatus('');
              const file = e.target.elements.csvfile.files[0];
              if (!file) return setImportStatus('Please select a CSV file.');
              // Here you would add logic to parse and import the CSV
              setImportStatus('Import successful! (mock)');
              setShowImportModal(false);
            }} style={{ display: 'grid', gap: 12 }}>
              <input type="file" name="csvfile" accept=".csv" style={{ marginBottom: 4 }} />
              {importStatus && <div style={{ color: importStatus.includes('success') ? t.positive : t.error, fontSize: 13 }}>{importStatus}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" style={{ background: t.accent, color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>Import</button>
                <button type="button" style={{ background: t.bgAlt, color: t.text, border: `1px solid ${t.border}`, borderRadius: 4, padding: '8px 16px', fontWeight: 500, cursor: 'pointer' }} onClick={() => setShowImportModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Carrier Performance</h1>
        <div style={{ fontSize: 12, color: t.textSecondary }}>
          On-time performance, billing errors, and invoice discrepancy metrics by carrier.
        </div>
        {!demoMode ? <div style={{ marginTop: 8, fontSize: 12, color: t.warning }}>Carrier preview data is available when Mock Data mode is ON.</div> : null}
      </div>

      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: t.textSecondary, textTransform: 'uppercase' }}>
            On-Time Performance
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
              <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
                <XAxis dataKey="carrier" stroke={t.textSecondary} fontSize={10} />
                <YAxis stroke={t.textSecondary} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: t.bgAlt,
                    border: `1px solid ${t.border}`,
                    borderRadius: 4,
                    color: t.text,
                    fontSize: 12,
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Bar dataKey="onTime" fill={t.positive} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: t.textSecondary, textTransform: 'uppercase' }}>
            Billing & Invoice Discrepancies
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
              <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.borderLight} />
                <XAxis dataKey="carrier" stroke={t.textSecondary} fontSize={10} />
                <YAxis stroke={t.textSecondary} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: t.bgAlt,
                    border: `1px solid ${t.border}`,
                    borderRadius: 4,
                    color: t.text,
                    fontSize: 12,
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Line type="monotone" dataKey="billingErrors" stroke={t.warning} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="invoiceDiscrepancy" stroke={t.error} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
        <table style={tableStyle}>
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
            {data.map((row) => (
              <tr key={row.carrier}>
                <td style={tdStyle}>
                  <Link
                    to={`/carriers/${encodeURIComponent(row.carrier)}`}
                    style={{ color: '#1976d2', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {row.carrier}
                  </Link>
                </td>
                <td style={tdStyle}>{row.onTime.toFixed(1)}%</td>
                <td style={tdStyle}>{row.billingErrors.toFixed(1)}%</td>
                <td style={tdStyle}>{row.invoiceDiscrepancy.toFixed(1)}%</td>
                <td style={tdStyle}>{row.avgTransitDays.toFixed(1)}</td>
                <td style={tdStyle}>{row.claimsRate.toFixed(1)}%</td>
                <td style={tdStyle}>{row.totalInvoices.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
