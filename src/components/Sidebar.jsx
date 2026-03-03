import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { clearAccessToken } from '../utils/authToken';
import { useThemeTokens, useTheme } from '../contexts/ThemeContext';
import { themePackages } from '../contexts/themePackages';

const navSections = [
  {
    label: '',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'load-center', label: 'Load Center', icon: '', path: '/loadcenter' },
      { id: 'shipments', label: 'Shipments', icon: '', path: '/shipments' },
      { id: 'dispatch', label: 'Dispatch', icon: '', path: '/loadcenter/dispatch-screen' },
    ],
  },
  {
    label: 'Network',
    items: [
      { id: 'customers', label: 'Customers', icon: '', path: '/customers' },
      { id: 'carriers', label: 'Carriers', icon: '', path: '/carriers' },
      { id: 'locations', label: 'Locations', icon: '', path: '/locations' },
    ],
  },
  {
    label: 'Fleet',
    items: [
      { id: 'fleet-dashboard', label: 'Fleet Dashboard', icon: '', path: '/fleet' },
      { id: 'driver-tracker', label: 'Driver Tracker', icon: '', path: '/tracker' },
      { id: 'maintenance', label: 'Maintenance', icon: '', path: '/fleet/maintenance-queue' },
      { id: 'assets', label: 'Assets', icon: '', path: '/fleet/assets' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'ar', label: 'AR', icon: '', path: '/finance/ar' }, 
      { id: 'ap', label: 'AP', icon: '', path: '/finance/ap' }, 
      { id: 'aging', label: 'Aging', icon: '', path: '/finance/aging' }, 
      { id: 'invoices', label: 'Invoices', icon: '', path: '/invoices' }, 
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'rate-intelligence', label: 'Rate Intelligence', icon: '', path: '/rate-logic' },
      { id: 'lane-intelligence', label: 'Lane Intelligence', icon: '', path: '/lane-intelligence' },
      { id: 'reports', label: 'Reports', icon: '', path: '/reports' },
      { id: 'system-status', label: 'System Status', icon: '', path: '/system-status' },
    ],
  },
  {
    label: 'Data',
    items: [
      { id: 'exceptions', label: 'Exceptions', icon: '', path: '/exceptions' },
      { id: 'uploads', label: 'Upload Center', icon: '', path: '/uploads' },
    ],
  },
  {
    label: '',
    items: [
      { id: 'settings', label: 'Settings', icon: '⚙', path: '/settings' }
    ],
  },
];

const themes = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

function Sidebar() {
  const [showSettings, setShowSettings] = useState(false);
  let theme = useThemeTokens();
  if (!theme || !theme.colors) {
    theme = themePackages.sentinelDark;
  }
  const { themePackageKey, setThemePackageKey } = useTheme();

  return (
    <aside style={{ width: 260, minHeight: '100vh', background: theme.colors.background, borderRight: `1px solid ${theme.colors.border}`, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ padding: '16px', borderBottom: `1px solid ${theme.colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 20 }}>{theme.emoji} FBPA</span>
        <button
          aria-label="Open settings panel"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
          onClick={() => setShowSettings((v) => !v)}
        >
          ⚙️
        </button>
      </div>
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {navSections.map((section, idx) => (
          <div key={section.label + idx} style={{ marginBottom: section.label ? 18 : 0 }}>
            {section.label && (
              <div style={{ fontWeight: 600, fontSize: 13, color: theme.colors.textSecondary, margin: '8px 0 4px 16px' }}>
                {section.label === '' ? '' : `▼ ${section.label}`}
              </div>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className="neon-outline"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  textDecoration: 'none',
                  color: theme.colors.textPrimary,
                  borderRadius: theme.borderRadius,
                  marginBottom: 2,
                  background: 'none',
                  transition: 'background 0.18s, box-shadow 0.18s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = theme.gradients.primaryButton;
                  e.currentTarget.style.boxShadow = theme.hoverGlow;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {item.icon && <span style={{ marginRight: 8 }}>{item.icon}</span>}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <footer style={{ padding: 16, borderTop: `1px solid ${theme.colors.border}` }}>
        <button type="button" onClick={clearAccessToken} style={{ width: '100%', padding: '8px 0', borderRadius: theme.borderRadius, border: 'none', background: theme.colors.surface, color: theme.colors.textPrimary, fontWeight: 600 }}>Log Out</button>
      </footer>
      {showSettings && (
        <div style={{ position: 'absolute', top: 60, left: 0, width: '100%', background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadow, zIndex: 10, padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="theme-select" style={{ fontWeight: 600, marginRight: 8 }}>Theme:</label>
            <select
              id="theme-select"
              value={themePackageKey}
              onChange={e => setThemePackageKey(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: theme.borderRadius, border: `1px solid ${theme.colors.border}` }}
            >
              <option value="sentinelDark">Sentinel Dark</option>
              <option value="freightNeon">Freight Neon</option>
              <option value="executiveLight">Executive Light</option>
              <option value="militaryTactical">Military Tactical</option>
            </select>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              style={{ padding: '6px 12px', borderRadius: theme.borderRadius, border: 'none', background: theme.colors.surface, color: theme.colors.textPrimary, fontWeight: 600 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
