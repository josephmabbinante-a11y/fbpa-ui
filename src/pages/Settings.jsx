import { useState } from 'react';
// Dashboard customization defaults and helpers
const defaultDashboardPrefs = {
  showTotalInvoices: true,
  showExceptions: true,
  showTotalSavings: true,
  showPending: true,
  showExceptionDistribution: true,
  showSavingsByCarrier: true,
  showRecentActivity: true,
};
const DASH_PREFS_KEY = 'dashboardPrefs';
function getDashboardPrefs() {
  try {
    return JSON.parse(localStorage.getItem(DASH_PREFS_KEY)) || defaultDashboardPrefs;
  } catch {
    return defaultDashboardPrefs;
  }
}
function setDashboardPrefs(prefs) {
  localStorage.setItem(DASH_PREFS_KEY, JSON.stringify(prefs));
}
import { useDemo } from '../demo/DemoContext';
import { connectEdiIntegration } from '../api/client';
import { useTheme, themes } from '../contexts/ThemeContext';
import logo from '../assets/opscale-logo.svg';

export default function Settings() {
    const [dashboardPrefs, setPrefs] = useState(getDashboardPrefs());
    function handleDashboardPrefChange(key) {
      const updated = { ...dashboardPrefs, [key]: !dashboardPrefs[key] };
      setPrefs(updated);
      setDashboardPrefs(updated);
    }
  const { theme, toggleTheme } = useTheme();
  const t = themes[theme];
  const [ediStatus, setEdiStatus] = useState(null);
  const [ediLoading, setEdiLoading] = useState(false);
  const [mockMode, setMockMode] = useState(() => {
    try {
      return localStorage.getItem('mockMode') === 'true';
    } catch {
      return false;
    }
  });

  const toggleMockMode = () => {
    setMockMode((prev) => {
      try {
        localStorage.setItem('mockMode', !prev);
      } catch {}
      return !prev;
    });
  };

  // Demo Mode integration
  const { demoMode, enableDemo, disableDemo } = useDemo();

  const containerStyle = {
    padding: '32px',
    maxWidth: '800px',
    backgroundColor: t.bg,
    color: t.text,
  };

  const sectionStyle = {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: `1px solid ${t.border}`,
  };

  const sectionTitleStyle = {
    fontSize: '14px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: t.text,
    marginBottom: 16,
  };

  const settingRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: `1px solid ${t.borderLight}`,
  };

  const labelStyle = {
    fontSize: '14px',
    color: t.text,
  };

  const toggleStyle = {
    width: 48,
    height: 28,
    backgroundColor: theme === 'dark' ? t.accent : t.borderLight,
    border: `2px solid ${theme === 'dark' ? t.accent : t.border}`,
    borderRadius: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '2px 4px',
    transition: 'all 0.3s ease',
  };

  const toggleDotStyle = {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: '50%',
    transition: 'transform 0.3s ease',
    transform: theme === 'dark' ? 'translateX(20px)' : 'translateX(0)',
  };

  const integrationCardStyle = {
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    padding: 16,
    backgroundColor: t.surface,
  };

  const integrationButtonStyle = (variant = 'primary') => ({
    padding: '8px 12px',
    backgroundColor: variant === 'primary' ? t.accent : t.bgAlt,
    color: variant === 'primary' ? '#fff' : t.text,
    border: `1px solid ${variant === 'primary' ? t.accent : t.border}`,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  });

  const handleConnect = async (provider) => {
    setEdiLoading(true);
    setEdiStatus(null);
    const res = await connectEdiIntegration({
      provider,
      mode: 'connect',
    });
    setEdiLoading(false);
    if (res && !res.error) {
      setEdiStatus(`${provider} connected`);
    } else {
      setEdiStatus(`Connect failed: ${res && res.error ? res.error : 'unknown'}`);
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: 32 }}>Settings</h1>

      {/* Appearance Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Appearance</h2>
        <div style={settingRowStyle}>
          <label style={labelStyle}>Theme</label>
          <button
            onClick={toggleTheme}
            style={toggleStyle}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <div style={toggleDotStyle} />
          </button>
        </div>
        <div style={settingRowStyle}>
          <label style={labelStyle}>Mock Data Mode</label>
          <button
            onClick={toggleMockMode}
            style={{ ...toggleStyle, backgroundColor: mockMode ? t.accent : t.borderLight, border: `2px solid ${mockMode ? t.accent : t.border}` }}
            title={mockMode ? 'Disable mock data' : 'Enable mock data'}
          >
            <div style={{ ...toggleDotStyle, transform: mockMode ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
        </div>
        <div style={settingRowStyle}>
          <label style={labelStyle}>Demo Mode</label>
          <button
            onClick={demoMode ? disableDemo : enableDemo}
            style={{ ...toggleStyle, backgroundColor: demoMode ? t.accent : t.borderLight, border: `2px solid ${demoMode ? t.accent : t.border}` }}
            title={demoMode ? 'Disable demo mode' : 'Enable demo mode'}
          >
            <div style={{ ...toggleDotStyle, transform: demoMode ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
        </div>

        <div style={{ marginTop: 12, fontSize: '13px', color: t.textSecondary }}>
          Current: <strong>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong>
        </div>
      </div>

      {/* Navigation Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Navigation</h2>
        <p style={{ fontSize: '13px', color: t.textSecondary, margin: '0 0 16px 0' }}>
          Sidebar collapse preference is saved automatically.
        </p>
        <div style={settingRowStyle}>
          <label style={labelStyle}>Collapsed sidebar on startup</label>
          <span style={{ fontSize: '13px', color: t.textSecondary }}>
            {localStorage.getItem('opscale_sidebar_collapsed') === 'true' ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {/* EDI Integrations Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>EDI Integrations</h2>
        <p style={{ fontSize: '13px', color: t.textSecondary, margin: '0 0 16px 0' }}>
          Connect QuickBooks, TMS, and SaaS platforms that send or receive freight bills.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div style={integrationCardStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>QuickBooks Online</div>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 12 }}>
              Sync AP bills, payment status, and vendor masters.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                style={integrationButtonStyle()}
                onClick={() => handleConnect('QuickBooks')}
                disabled={ediLoading}
              >
                {ediLoading ? 'Connecting...' : 'Connect'}
              </button>
              <button type="button" style={integrationButtonStyle('secondary')}>Docs</button>
            </div>
          </div>

          <div style={integrationCardStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>TMS / ERP</div>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 12 }}>
              204/210/214/990 EDI flows for freight bills and updates.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                style={integrationButtonStyle()}
                onClick={() => handleConnect('TMS')}
                disabled={ediLoading}
              >
                {ediLoading ? 'Connecting...' : 'Configure'}
              </button>
              <button type="button" style={integrationButtonStyle('secondary')}>Spec</button>
            </div>
          </div>

          <div style={integrationCardStyle}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>SaaS Billing Hub</div>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 12 }}>
              Webhooks + REST for invoice ingestion and reconciliation.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                style={integrationButtonStyle()}
                onClick={() => handleConnect('SaaS')}
                disabled={ediLoading}
              >
                {ediLoading ? 'Connecting...' : 'Create Token'}
              </button>
              <button type="button" style={integrationButtonStyle('secondary')}>Webhooks</button>
            </div>
          </div>
        </div>

        {ediStatus && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 4,
              fontSize: 12,
              backgroundColor: ediStatus.startsWith('Connect failed') ? `${t.error}10` : `${t.positive}10`,
              color: ediStatus.startsWith('Connect failed') ? t.error : t.positive,
              border: `1px solid ${ediStatus.startsWith('Connect failed') ? t.error : t.positive}`,
            }}
          >
            {ediStatus}
          </div>
        )}

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          <div style={integrationCardStyle}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Inbound EDI</div>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 8 }}>
              Receive carrier invoices and shipment updates.
            </div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>
              Endpoint: <span style={{ color: t.text }}>edi.opscale.ai/inbound</span>
            </div>
          </div>
          <div style={integrationCardStyle}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Outbound EDI</div>
            <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 8 }}>
              Send approved freight bills and remittance info.
            </div>
            <div style={{ fontSize: 12, color: t.textSecondary }}>
              Endpoint: <span style={{ color: t.text }}>edi.opscale.ai/outbound</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Customization Section */}
      <div style={{ ...sectionStyle, background: t.bgAlt, borderRadius: 8, padding: 20 }}>
        <h2 style={sectionTitleStyle}>Dashboard Customization</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
          {Object.keys(defaultDashboardPrefs).map((key) => (
            <label key={key} style={{ minWidth: 180, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={dashboardPrefs[key]}
                onChange={() => handleDashboardPrefChange(key)}
                style={{ accentColor: t.accent }}
              />
              {(() => {
                switch (key) {
                  case 'showTotalInvoices': return 'Total Invoices';
                  case 'showExceptions': return 'Exceptions';
                  case 'showTotalSavings': return 'Total Savings';
                  case 'showPending': return 'Pending';
                  case 'showExceptionDistribution': return 'Exception Distribution';
                  case 'showSavingsByCarrier': return 'Savings by Carrier';
                  case 'showRecentActivity': return 'Recent Activity';
                  default: return key;
                }
              })()}
            </label>
          ))}
        </div>
        <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 10 }}>
          Toggle dashboard sections on or off to customize your view.
        </div>
      </div>

      {/* About Section */}
      <div style={{ paddingBottom: 24 }}>
        <h2 style={sectionTitleStyle}>About</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: t.textSecondary }}>
          <img src={logo} alt="Opscale Audit IQ" style={{ height: 40, width: 'auto', display: 'block', flexShrink: 0 }} />
          <div style={{ fontSize: '13px' }}>
            <div style={{ fontWeight: 700, color: t.text }}>Opscale Audit IQ & Bill Pay</div>
            <div>v1.0.0 — Freight Bill Payment & Audit System</div>
          </div>
        </div>
      </div>
    </div>
  );
}
