
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCarriers } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';

// --- Carrier Intelligence Profile Dashboard ---
export default function CarrierProfile() {
  const { carrier } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = themes[theme];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [carrierRecord, setCarrierRecord] = useState(null);

  useEffect(() => {
    const loadCarrier = async () => {
      setLoading(true);
      setError('');
      const result = await getCarriers({ limit: 5000 });
      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      const carriers = Array.isArray(result?.carriers) ? result.carriers : [];
      const normalizedParam = decodeURIComponent(String(carrier || '')).trim().toLowerCase();
      const matched = carriers.find((entry) => (
        String(entry?.id || '').toLowerCase() === normalizedParam
        || String(entry?.mcNumber || '').toLowerCase() === normalizedParam
        || String(entry?.name || '').toLowerCase() === normalizedParam
      ));
      if (!matched) {
        setError('Carrier profile not found.');
        setLoading(false);
        return;
      }
      setCarrierRecord(matched);
      setLoading(false);
    };
    loadCarrier();
  }, [carrier]);

  if (loading) {
    return <div style={{ fontSize: 12, color: t.textSecondary }}>Loading carrier profile...</div>;
  }
  if (error || !carrierRecord) {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 12, color: t.error }}>{error || 'Carrier not found.'}</div>
        <div>
          <button type="button" onClick={() => navigate('/carriers')} style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, fontWeight: 600, cursor: 'pointer' }}>Back to Carriers</button>
        </div>
      </div>
    );
  }

  // --- HEADER STRIP ---
  // ...existing code for extracting carrier fields, status, risk, etc.
  // --- PRIMARY LAYOUT ---
  // ...existing code for extracting metrics, compliance, financials, etc.

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minHeight: '100vh', background: t.bg, color: t.text }}>
      {/* CARRIER SCORE AT TOP (composite) */}
      <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
        <div style={{ background: '#fff', color: '#222', borderRadius: 18, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)', padding: '8px 32px', fontWeight: 800, fontSize: 22, border: '2px solid #10b981' }}>
          Carrier Score: 88 / 100 – Reliable
        </div>
        {/* Score Breakdown Panel */}
        <ScoreBreakdownPanel />
      </div>
      {/* HEADER STRIP */}
      <div style={{ /* ...existing style... */ }}>
        {/* ...existing code... */}
      </div>

// --- Score Breakdown Panel ---
function ScoreBreakdownPanel() {
  const [open, setOpen] = useState(false);
  // Example breakdown data, replace with real logic
  const breakdown = [
    { label: 'Compliance', score: 92, weight: 40 },
    { label: 'Performance', score: 89, weight: 30 },
    { label: 'Coverage Match', score: 84, weight: 20 },
    { label: 'Risk Behavior', score: 78, weight: 10 },
  ];
  return (
    <div style={{ marginTop: 8, textAlign: 'center' }}>
      <button
        style={{
          padding: '4px 18px',
          borderRadius: 8,
          background: open ? t.accent : t.bgAlt,
          color: open ? '#fff' : t.text,
          border: `1px solid ${t.accent}`,
          fontWeight: 700,
          cursor: 'pointer',
          fontSize: 15,
        }}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide Score Breakdown' : 'Show Score Breakdown'}
      </button>
      {open && (
        <div style={{ marginTop: 12, textAlign: 'left', display: 'inline-block', background: t.bgAlt, borderRadius: 10, padding: 16, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)' }}>
          <h4 style={{ color: t.accent, fontWeight: 700, marginBottom: 8 }}>Score Breakdown</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {breakdown.map((item) => (
              <li key={item.label} style={{ marginBottom: 6, fontSize: 14 }}>
                <span style={{ fontWeight: 600 }}>{item.label}:</span> <span style={{ color: t.accent }}>{item.score}</span> <span style={{ color: '#888', fontSize: 12 }}>({item.weight}% weight)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
                {open && (
                  <div style={{
                    margin: '10px auto 0',
                    background: t.surface,
                    borderRadius: 12,
                    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
                    padding: '16px 24px',
                    border: `1px solid ${t.border}`,
                    maxWidth: 340,
                    textAlign: 'left',
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Score Breakdown</div>
                    {breakdown.map((item) => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginBottom: 6 }}>
                        <span>{item.label}</span>
                        <span style={{ fontWeight: 700 }}>{item.score} <span style={{ color: t.textSecondary, fontWeight: 400 }}>(Weight {item.weight}%)</span></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 28px 12px 28px',
        background: t.surface,
        borderBottom: `2px solid ${t.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
      }}>
        {/* LEFT: Carrier Identity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{carrierRecord.name || 'Carrier Name'}</div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 14, marginTop: 2 }}>
            <span>MC #{carrierRecord.mcNumber || '—'}</span>
            <span>DOT #{carrierRecord.dotNumber || '—'}</span>
            <span style={{ padding: '2px 10px', borderRadius: 12, background: '#10b981', color: '#fff', fontWeight: 700, fontSize: 13 }}>Active</span>
            <span style={{ padding: '2px 10px', borderRadius: 12, background: '#f59e42', color: '#fff', fontWeight: 700, fontSize: 13 }}>Risk: Low</span>
          </div>
        </div>
        {/* RIGHT: Quick Status & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
            <span style={{ color: '#10b981', fontWeight: 700 }}>Authority Verified ✔</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>Insurance Verified ✔</span>
            <span>Compliance Exp: <b>2026-06-01</b></span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button style={{ padding: '6px 14px', borderRadius: 6, background: t.accent, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Assign to Load</button>
            <button style={{ padding: '6px 14px', borderRadius: 6, background: t.bgAlt, color: t.text, border: `1px solid ${t.accent}`, fontWeight: 700, cursor: 'pointer' }}>View Documents</button>
            <button style={{ padding: '6px 14px', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Suspend Carrier</button>
            <button style={{ padding: '6px 14px', borderRadius: 6, background: t.bgAlt, color: t.text, border: `1px solid ${t.accent}`, fontWeight: 700, cursor: 'pointer' }}>Request COI Update</button>
          </div>
        </div>
      </div>

      {/* MAIN DASHBOARD LAYOUT */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', padding: '0 28px', flex: 1 }}>
        {/* LEFT COLUMN (Operational & Compliance) */}
        <div style={{ flex: 2, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Compliance Overview Card */}
          <div style={{ background: t.surface, borderRadius: 12, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)', padding: 20, border: `1px solid ${t.border}` }}>
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
              const expColor = daysUntilExp < 30 ? '#ef4444' : daysUntilExp < 90 ? '#f59e42' : '#10b981';
              const oosRate = 3.2; // Example static value
              return (
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 14 }}>
                  <span>Authority Status: <b>Active</b></span>
                  <span>Authority Age: <b>{authorityAgeYears} years</b> <span style={{ color: '#10b981', fontWeight: 600 }}>(Stable)</span></span>
                  <span>Safety Rating: <b>Satisfactory</b></span>
                  <span>Cargo Insurance: <b>$1,000,000</b></span>
                  <span>Auto Liability: <b>$1,000,000</b></span>
                  <span>Insurance Expiration: <b>{daysUntilExp} days</b> <span style={{ color: expColor, fontWeight: 600 }}>({expRisk})</span></span>
                  <span>OOS Rate: <b>{oosRate}%</b> <span style={{ color: oosRate < 5 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{oosRate < 5 ? '(Below industry avg)' : '(High)'}</span></span>
                  <span>W-9: <b>✔</b></span>
                  <span>Agreement: <b>✔</b></span>
                  <span>COI Verified: <b>2026-03-01</b></span>
                </div>
              );
            })()}
            <div style={{ marginTop: 10, fontWeight: 600, color: '#10b981' }}>Compliance Health Score: 92 / 100</div>
            {/* Example: Red banner if non-compliant */}
            {/* <div style={{ marginTop: 12, background: '#ef4444', color: '#fff', padding: 10, borderRadius: 8, fontWeight: 700 }}>Carrier Non-Compliant – Dispatch Locked</div> */}
          </div>

          {/* Operational Profile Card */}
          <div style={{ background: t.surface, borderRadius: 12, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)', padding: 20, border: `1px solid ${t.border}` }}>
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
          <div style={{ background: t.surface, borderRadius: 12, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)', padding: 20, border: `1px solid ${t.border}` }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Load History</div>
            {/* ...tabs for Active, Completed, Cancelled, Claims... */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <button style={{ padding: '4px 14px', borderRadius: 6, background: t.accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Active Loads</button>
              <button style={{ padding: '4px 14px', borderRadius: 6, background: t.bgAlt, color: t.text, border: `1px solid ${t.accent}`, fontWeight: 600, cursor: 'pointer' }}>Completed</button>
              <button style={{ padding: '4px 14px', borderRadius: 6, background: t.bgAlt, color: t.text, border: `1px solid ${t.accent}`, fontWeight: 600, cursor: 'pointer' }}>Cancelled</button>
              <button style={{ padding: '4px 14px', borderRadius: 6, background: t.bgAlt, color: t.text, border: `1px solid ${t.accent}`, fontWeight: 600, cursor: 'pointer' }}>Claims</button>
            </div>
            <div style={{ fontSize: 13, color: t.textSecondary }}>Load ID | Lane | Margin | Status | Performance Rating</div>
            {/* ...table of loads... */}
          </div>

          {/* Documents Vault */}
          <div style={{ background: t.surface, borderRadius: 12, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.06)', padding: 20, border: `1px solid ${t.border}` }}>
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
            <div style={{ marginTop: 8, fontSize: 12, color: t.textSecondary }}>All documents tracked for expiration and verification.</div>
          </div>
        </div>

        {/* RIGHT COLUMN (Financial & Risk) */}
        <div style={{ flex: 1, minWidth: 320, maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 90 }}>
          {/* Financial Snapshot */}
          <div style={{ background: t.surface, borderRadius: 12, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)', padding: 20, border: `1px solid ${t.border}` }}>
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
          <div style={{ background: t.surface, borderRadius: 12, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)', padding: 20, border: `1px solid ${t.border}` }}>
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
          <div style={{ background: t.surface, borderRadius: 12, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)', padding: 20, border: `1px solid ${t.border}` }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Internal Notes & Flags</div>
            {/* ...red flags, notes, escalation tags... */}
            <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: 6 }}>Red Flag: Insurance Expiring Soon</div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 8 }}>Internal notes visible to admins only.</div>
            <div style={{ fontSize: 13, color: t.textSecondary }}>Escalation: None</div>
          </div>
        </div>
      </div>

      {/* STATUS ENGINE & WORKFLOW AUTOMATION HOOKS (future: settings, banners, disables) */}
      {/* ...status options, workflow rules, enforcement banners, etc. */}

      {/* CARRIER SCORE AT TOP (composite) */}
      <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
        <div style={{ background: '#fff', color: '#222', borderRadius: 18, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)', padding: '8px 32px', fontWeight: 800, fontSize: 22, border: '2px solid #10b981' }}>
          Carrier Score: 88 / 100 – Reliable
        </div>
      </div>
    </div>
  );
}
