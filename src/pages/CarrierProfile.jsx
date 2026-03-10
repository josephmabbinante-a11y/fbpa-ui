import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCarriers } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';
import AuctionPricingWidget from '../components/AuctionPricingWidget';

// --- Carrier Intelligence Profile Dashboard ---
export default function CarrierProfile() {
  const { carrier } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = theme;
  const [consoleMessages, setConsoleMessages] = useState([]);

  // Utility to log and show messages in the console panel
  const logToConsole = (msg, type = 'info') => {
    setConsoleMessages((prev) => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);
    // Optionally, also log to browser console
    if (type === 'error') {
       
      console.error(msg);
    } else {
       
      console.log(msg);
    }
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [carrierRecord, setCarrierRecord] = useState(null);

  useEffect(() => {
    const loadCarrier = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getCarriers({ limit: 5000 });
        logToConsole('Fetched carriers from API', 'info');
        const carriers = Array.isArray(result?.carriers) ? result.carriers : [];
        const normalizedParam = decodeURIComponent(String(carrier || '')).trim().toLowerCase();
        const matched = carriers.find((entry) => (
          String(entry?.id || '').toLowerCase() === normalizedParam
          || String(entry?.mcNumber || '').toLowerCase() === normalizedParam
          || String(entry?.name || '').toLowerCase() === normalizedParam
        ));
        if (!matched) {
          setError('Carrier profile not found.');
          logToConsole('Carrier profile not found.', 'error');
          setLoading(false);
          return;
        }
        setCarrierRecord(matched);
        logToConsole(`Loaded carrier: ${matched.name || matched.id}`, 'info');
        setLoading(false);
      } catch (err) {
        setError('Error loading carrier data.');
        logToConsole(`Error loading carrier data: ${err.message || err}`, 'error');
        setLoading(false);
      }
    };
    loadCarrier();
  }, [carrier]);

  if (loading) {
    return <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: 16 }}>Loading carrier profile...</div>;
  }
  if (error || !carrierRecord) {
    return (
      <div style={{ display: 'grid', gap: 8, background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 700 }}>{error || 'Carrier not found.'}</div>
        <div>
          <button type="button" onClick={() => navigate('/carriers')} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>Back to Carriers</button>
        </div>
      </div>
    );
  }

  // --- HEADER STRIP ---
  // ...existing code for extracting carrier fields, status, risk, etc.
  // --- PRIMARY LAYOUT ---
  // ...existing code for extracting metrics, compliance, financials, etc.

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* CARRIER SCORE AT TOP (composite) */}
      <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
        <div style={{ background: 'var(--surface-elevated)', color: 'var(--text-primary)', borderRadius: 18, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)', padding: '8px 32px', fontWeight: 800, fontSize: 22, border: '2px solid var(--accent)' }}>
          Carrier Score: 88 / 100 – Reliable
        </div>
      </div>
      {/* HEADER STRIP */}
      <div style={{ /* ...existing style... */ }}>
        {/* ...existing code... */}
      </div>

      {/* MAIN DASHBOARD LAYOUT */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', padding: '0 28px', flex: 1 }}>
        {/* LEFT COLUMN (Operational & Compliance) */}
        <div style={{ flex: 2, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Compliance Overview Card */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)', padding: 20, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Compliance Overview</div>
            {/* Predictive compliance fields, health score, banners, etc. */}
            {(() => {
              // Example static values, replace with real data
              const insuranceExpDate = '2026-06-01';
              const authorityStartDate = '2023-01-15';
              const today = new Date();
              const expDate = new Date(insuranceExpDate);
              const authorityDate = new Date(authorityStartDate);
              const daysUntilExp = Math.max(0, Math.round((expDate - today) / (1000 * 60 * 60 * 24)));
              const authorityAgeYears = ((today - authorityDate) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
              const expRisk = daysUntilExp < 30 ? 'High Risk' : daysUntilExp < 90 ? 'Medium Risk' : 'Low Risk';
              const expColor = daysUntilExp < 30 ? 'var(--danger)' : daysUntilExp < 90 ? 'var(--warning)' : 'var(--success)';
              const oosRate = 3.2; // Example static value
              return (
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 14 }}>
                  <span>Authority Status: <b>Active</b></span>
                  <span>Authority Age: <b>{authorityAgeYears} years</b> <span style={{ color: 'var(--success)', fontWeight: 600 }}>(Stable)</span></span>
                  <span>Safety Rating: <b>Satisfactory</b></span>
                  <span>Cargo Insurance: <b>$1,000,000</b></span>
                  <span>Auto Liability: <b>$1,000,000</b></span>
                  <span>Insurance Expiration: <b>{daysUntilExp} days</b> <span style={{ color: expColor, fontWeight: 600 }}>({expRisk})</span></span>
                  <span>OOS Rate: <b>{oosRate}%</b> <span style={{ color: oosRate < 5 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{oosRate < 5 ? '(Below industry avg)' : '(High)'}</span></span>
                  <span>W-9: <b>✔</b></span>
                  <span>Agreement: <b>✔</b></span>
                  <span>COI Verified: <b>2026-03-01</b></span>
                </div>
              );
            })()}
            <div style={{ marginTop: 10, fontWeight: 600, color: 'var(--success)' }}>Compliance Health Score: 92 / 100</div>
            {/* Example: Red banner if non-compliant */}
            {/* <div style={{ marginTop: 12, background: t.error || '#ef4444', color: t.surfaceStrong || '#fff', padding: 10, borderRadius: 8, fontWeight: 700 }}>Carrier Non-Compliant – Dispatch Locked</div> */}
          </div>

          {/* Operational Profile Card */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)', padding: 20, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Operational Profile</div>
            {/* ...equipment, lanes, certifications, tracking, performance indicators... */}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 14 }}>
              <span>Equipment: Dry Van, Reefer</span>
              <span>Preferred Lanes: Midwest, Southeast</span>
              <span>Reefer Capable: <b>✔</b></span>
              <span>Hazmat: <b>✔</b></span>
              <span>Team: <b>✔</b></span>
              <span>Tracking: ELD, App</span>
              <span>On-Time %: <b>97%</b></span>
              <span>Claims: <b>0</b></span>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 18, fontSize: 13 }}>
              <span>On-Time Pickup: <b>98%</b></span>
              <span>On-Time Delivery: <b>97%</b></span>
              <span>Claim Ratio: <b>0%</b></span>
              <span>Tracking Compliance: <b>99%</b></span>
            </div>
          </div>

          {/* Load History Panel (Tabbed) */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)', padding: 20, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Load History</div>
            {/* ...tabs for Active, Completed, Cancelled, Claims... */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <button style={{ padding: '4px 14px', borderRadius: 6, background: 'var(--accent)', color: 'var(--surface-elevated)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Active Loads</button>
              <button style={{ padding: '4px 14px', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Completed</button>
              <button style={{ padding: '4px 14px', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Cancelled</button>
              <button style={{ padding: '4px 14px', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Claims</button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Load ID | Lane | Margin | Status | Performance Rating</div>
            {/* ...table of loads... */}
          </div>

          {/* Documents Vault */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)', padding: 20, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Documents Vault</div>
            {/* ...upload/view docs, expiration tracking... */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 14 }}>
              <span>COI <b>✔</b></span>
              <span>W-9 <b>✔</b></span>
              <span>Agreement <b>✔</b></span>
              <span>Safety Reports</span>
              <span>Rate Confirmations</span>
              <span>Factoring Letter</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>All documents tracked for expiration and verification.</div>
          </div>
        </div>

        {/* RIGHT COLUMN (Financial & Risk) */}
        <div style={{ flex: 1, minWidth: 320, maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 90 }}>
          {/* Financial Snapshot */}
          <div style={{ background: 'var(--surface)', borderRadius: 12, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)', padding: 20, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Financial Snapshot</div>
            {/* ...financial metrics, payment terms, quick pay, factoring... */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <span>Total Spend YTD: <b>$1,200,000</b></span>
              <span>Open AP: <b>$42,000</b></span>
              <span>Avg Rate/Mile: <b>$2.45</b></span>
              <span>Avg Margin: <b>14%</b></span>
              <span>Quick Pay Usage: <b>12%</b></span>
              <span>Factoring Enabled: <b>✔</b></span>
              <span>Payment Terms: <b>Net 30</b></span>
            </div>
          </div>

          {/* Risk & Intelligence Panel */}
          <div style={{ background: t.surface, borderRadius: 12, boxShadow: `0 2px 8px 0 ${t.shadow || 'rgba(0,0,0,0.08)'}`, padding: 20, border: `1px solid ${t.border}` }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Risk & Intelligence</div>
            {/* ...risk score, risk bars, exposure, reliability... */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <span>Risk Score: <b>88 / 100</b></span>
              <span>Double Broker Risk: <b>Low</b></span>
              <span>Insurance Exp Risk: <b>Low</b></span>
              <span>Claim Exposure: <b>Low</b></span>
              <span>Volatility Sensitivity: <b>Low</b></span>
              <span>Capacity Reliability: <b>High</b></span>
            </div>
          </div>

          {/* Internal Notes & Flags */}
          <div style={{ background: t.surface, borderRadius: 12, boxShadow: `0 2px 8px 0 ${t.shadow || 'rgba(0,0,0,0.08)'}`, padding: 20, border: `1px solid ${t.border}` }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Internal Notes & Flags</div>
            {/* ...red flags, notes, escalation tags... */}
            <div style={{ color: t.error || '#ef4444', fontWeight: 700, marginBottom: 6 }}>Red Flag: Insurance Expiring Soon</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Internal notes visible to admins only.</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Escalation: None</div>
          </div>
        </div>
      </div>

      {/* STATUS ENGINE & WORKFLOW AUTOMATION HOOKS (future: settings, banners, disables) */}
      {/* ...status options, workflow rules, enforcement banners, etc. */}

      {/* THEME/CONSOLE PANEL */}
      <div style={{ marginTop: 24, padding: 12, background: 'var(--surface-elevated)', color: 'var(--text-primary)', borderRadius: 10, border: '1px solid var(--border)', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Console Output</div>
        <div style={{ maxHeight: 120, overflowY: 'auto', fontSize: 12, display: 'grid', gap: 4 }}>
          {consoleMessages.length === 0 ? (
            <span style={{ color: 'var(--text-secondary)' }}>No messages yet.</span>
          ) : (
            consoleMessages.map((entry, idx) => (
              <span key={idx} style={{ color: entry.type === 'error' ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: entry.type === 'error' ? 700 : 400 }}>
                [{entry.ts}] {entry.type.toUpperCase()}: {entry.msg}
              </span>
            ))
          )}
        </div>
      </div>

      <AuctionPricingWidget />
    </div>
  );
}
