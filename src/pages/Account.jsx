import { useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { clearAccessToken } from '../utils/authToken';

export default function Account() {
  const { theme, setTheme } = useTheme();
  const t = themes[theme];
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const containerStyle = {
    padding: 24,
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
  };

  const headerStyle = {
    marginBottom: 32,
  };

  const titleStyle = {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
  };

  const subtitleStyle = {
    fontSize: 14,
    color: t.textSecondary,
  };

  const tabsStyle = {
    display: 'flex',
    gap: 0,
    borderBottom: `1px solid ${t.border}`,
    marginBottom: 32,
  };

  const tabStyle = (isActive) => ({
    padding: '12px 20px',
    fontSize: 13,
    fontWeight: isActive ? 600 : 500,
    color: isActive ? t.accent : t.textSecondary,
    borderBottom: `2px solid ${isActive ? t.accent : 'transparent'}`,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const sectionStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: 24,
    marginBottom: 24,
  };

  const sectionTitleStyle = {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 16,
  };

  const formGroupStyle = {
    marginBottom: 16,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: t.textSecondary,
    marginBottom: 6,
    display: 'block',
  };

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: 4,
    border: `1px solid ${t.border}`,
    backgroundColor: t.bgAlt,
    color: t.text,
    fontSize: 13,
    fontFamily: 'inherit',
  };

  const buttonStyle = {
    padding: '10px 16px',
    backgroundColor: t.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: t.surface,
    color: t.accent,
    border: `1px solid ${t.accent}`,
  };

  const toggleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: t.bgAlt,
    borderRadius: 6,
    marginBottom: 12,
  };

  const toggleButtonStyle = (isActive) => ({
    padding: '4px 8px',
    borderRadius: 3,
    border: 'none',
    backgroundColor: isActive ? t.accent : t.border,
    color: isActive ? '#fff' : t.text,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  });

  const listItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottom: `1px solid ${t.border}`,
    fontSize: 13,
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>👤 Account Settings</div>
        <div style={subtitleStyle}>Manage your profile, team, and preferences</div>
      </div>

      <div style={tabsStyle}>
        <button onClick={() => setActiveTab('profile')} style={tabStyle(activeTab === 'profile')}>Profile</button>
        <button onClick={() => setActiveTab('team')} style={tabStyle(activeTab === 'team')}>Team Management</button>
        <button onClick={() => setActiveTab('billing')} style={tabStyle(activeTab === 'billing')}>Billing & Plan</button>
        <button onClick={() => setActiveTab('integrations')} style={tabStyle(activeTab === 'integrations')}>Integrations</button>
        <button onClick={() => setActiveTab('api')} style={tabStyle(activeTab === 'api')}>API Keys</button>
        <button onClick={() => setActiveTab('preferences')} style={tabStyle(activeTab === 'preferences')}>Preferences</button>
      </div>

      {activeTab === 'profile' && (
        <>
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Personal Information</div>
            <div style={formGroupStyle}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input type="text" style={inputStyle} placeholder="Joseph" />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input type="text" style={inputStyle} placeholder="Abbinante" />
              </div>
            </div>
            <div style={formGroupStyle}>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" style={inputStyle} placeholder="joseph@opscale.ai" />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input type="tel" style={inputStyle} placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <button style={buttonStyle} onMouseEnter={(e) => e.target.style.opacity = 0.9} onMouseLeave={(e) => e.target.style.opacity = 1}>
                Save Changes
              </button>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Company Information</div>
            <div style={formGroupStyle}>
              <div>
                <label style={labelStyle}>Company Name</label>
                <input type="text" style={inputStyle} placeholder="Opscale Supply Chain" />
              </div>
              <div>
                <label style={labelStyle}>Company Website</label>
                <input type="url" style={inputStyle} placeholder="https://opscale.ai" />
              </div>
            </div>
            <div style={formGroupStyle}>
              <div>
                <label style={labelStyle}>EIN</label>
                <input type="text" style={inputStyle} placeholder="XX-XXXXXXX" />
              </div>
              <div>
                <label style={labelStyle}>Address</label>
                <input type="text" style={inputStyle} placeholder="123 Business St" />
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <button style={buttonStyle} onMouseEnter={(e) => e.target.style.opacity = 0.9} onMouseLeave={(e) => e.target.style.opacity = 1}>
                Save Changes
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'team' && (
        <>
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Team Members</div>
            <div style={{ marginBottom: 16 }}>
              <button style={buttonStyle} onMouseEnter={(e) => e.target.style.opacity = 0.9} onMouseLeave={(e) => e.target.style.opacity = 1}>
                + Invite Team Member
              </button>
            </div>
            <div style={listItemStyle}>
              <div>
                <div style={{ fontWeight: 600 }}>Joseph Abbinante</div>
                <div style={{ fontSize: 12, color: t.textSecondary }}>joseph@opscale.ai</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: t.textSecondary }}>Admin</span>
                <span style={{ fontSize: 12, color: '#10b981' }}>Active</span>
              </div>
            </div>
            <div style={listItemStyle}>
              <div>
                <div style={{ fontWeight: 600 }}>Sarah Martinez</div>
                <div style={{ fontSize: 12, color: t.textSecondary }}>sarah@opscale.ai</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: t.textSecondary }}>Operations Manager</span>
                <span style={{ fontSize: 12, color: '#10b981' }}>Active</span>
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Role Management</div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 16 }}>
              <div style={{ marginBottom: 12 }}>🔹 Admin - Full access to all features and settings</div>
              <div style={{ marginBottom: 12 }}>🔹 Operations Manager - Manage loads, shipments, and exceptions</div>
              <div style={{ marginBottom: 12 }}>🔹 Finance - View reports and manage invoicing</div>
              <div>🔹 Viewer - Read-only access to dashboards and reports</div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'billing' && (
        <>
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Current Plan</div>
            <div style={listItemStyle}>
              <div>
                <div style={{ fontWeight: 600 }}>Professional Plan</div>
                <div style={{ fontSize: 12, color: t.textSecondary }}>$499/month • Unlimited users • Advanced analytics</div>
              </div>
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Active</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <button style={secondaryButtonStyle} onMouseEnter={(e) => e.target.style.opacity = 0.9} onMouseLeave={(e) => e.target.style.opacity = 1}>
                Change Plan
              </button>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Billing History</div>
            <div style={listItemStyle}>
              <div>
                <div style={{ fontWeight: 600 }}>Feb 1, 2026</div>
                <div style={{ fontSize: 12, color: t.textSecondary }}>Monthly subscription</div>
              </div>
              <div style={{ fontWeight: 600 }}>$499.00</div>
            </div>
            <div style={listItemStyle}>
              <div>
                <div style={{ fontWeight: 600 }}>Jan 1, 2026</div>
                <div style={{ fontSize: 12, color: t.textSecondary }}>Monthly subscription</div>
              </div>
              <div style={{ fontWeight: 600 }}>$499.00</div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'integrations' && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Connected Integrations</div>
          <div style={listItemStyle}>
            <div>
              <div style={{ fontWeight: 600 }}>Stripe</div>
              <div style={{ fontSize: 12, color: t.textSecondary }}>Payment processing</div>
            </div>
            <button style={secondaryButtonStyle}>Configure</button>
          </div>
          <div style={listItemStyle}>
            <div>
              <div style={{ fontWeight: 600 }}>Slack</div>
              <div style={{ fontSize: 12, color: t.textSecondary }}>Notifications &amp; alerts</div>
            </div>
            <button style={secondaryButtonStyle}>Configure</button>
          </div>
          <div style={listItemStyle}>
            <div>
              <div style={{ fontWeight: 600 }}>Google Sheets</div>
              <div style={{ fontSize: 12, color: t.textSecondary }}>Data export</div>
            </div>
            <button style={secondaryButtonStyle}>Configure</button>
          </div>
        </div>
      )}

      {activeTab === 'api' && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>API Keys</div>
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: t.bgAlt, borderRadius: 4, fontSize: 12 }}>
            <strong>sk_live_4eC39HqLyjWDarhtT657j81e</strong>
            <div style={{ color: t.textSecondary, marginTop: 4 }}>Created on Jan 15, 2026</div>
          </div>
          <button style={buttonStyle} onMouseEnter={(e) => e.target.style.opacity = 0.9} onMouseLeave={(e) => e.target.style.opacity = 1}>
            + Generate New Key
          </button>
        </div>
      )}

      {activeTab === 'preferences' && (
        <>
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Theme</div>
            <div style={toggleStyle}>
              <span>Dark/Light Mode</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button style={toggleButtonStyle(theme === 'dark')} onClick={() => setTheme('dark')}>Dark</button>
                <button style={toggleButtonStyle(theme === 'light')} onClick={() => setTheme('light')}>Light</button>
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Notifications</div>
            <div style={listItemStyle}>
              <div>
                <div style={{ fontWeight: 600 }}>Email Alerts on Exceptions</div>
                <div style={{ fontSize: 12, color: t.textSecondary }}>Get notified when rate issues are detected</div>
              </div>
              <input type="checkbox" style={{ width: 18, height: 18, cursor: 'pointer' }} defaultChecked />
            </div>
            <div style={listItemStyle}>
              <div>
                <div style={{ fontWeight: 600 }}>Weekly Reports</div>
                <div style={{ fontSize: 12, color: t.textSecondary }}>Summary of loads, revenue, and margins</div>
              </div>
              <input type="checkbox" style={{ width: 18, height: 18, cursor: 'pointer' }} defaultChecked />
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Danger Zone</div>
            <div style={{ marginBottom: 16 }}>
              <button
                style={{ ...buttonStyle, backgroundColor: '#ef4444' }}
                onClick={() => {
                  if (window.confirm('Are you sure you want to log out?')) {
                    clearAccessToken();
                    navigate('/login');
                  }
                }}
                onMouseEnter={(e) => e.target.style.opacity = 0.9}
                onMouseLeave={(e) => e.target.style.opacity = 1}
              >
                Log Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
