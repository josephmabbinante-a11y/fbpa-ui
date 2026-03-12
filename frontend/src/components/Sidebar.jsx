import React, { useEffect, useState } from 'react';
// --- Begin transplanted Sidebar from FBPA branch ---
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import logo from '../assets/opscale-logo.svg';
import { clearAccessToken } from '../utils/authToken';

const DESKTOP_EXPANDED_WIDTH = 264;
const DESKTOP_COLLAPSED_WIDTH = 74;
const MOBILE_CLOSED_WIDTH = 60;
const MOBILE_OPEN_WIDTH = 240;

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'DB', path: '/' },
  {
    id: 'load-center',
    label: 'Load Center',
    icon: 'LC',
    dropdown: true,
    items: [
      { id: 'load-center-home', label: 'Load Board', icon: 'LC', path: '/loadcenter' },
      { id: 'load-board', label: 'Auction Board', icon: 'LB', path: '/auction-board' },
      { id: 'load-builder', label: 'Load Builder', icon: 'BL', path: '/loadcenter/load-builder' },
      { id: 'search-loads', label: 'Search Loads', icon: 'SL', path: '/loadcenter/search-loads' },
    ],
  },
  { id: 'fleet-dashboard', label: 'Fleet Dashboard', icon: 'FD', path: '/fleet-dashboard' },
  { id: 'customers', label: 'Customers', icon: 'CU', path: '/customers' },
  { id: 'locations', label: 'Locations', icon: 'LO', path: '/locations' },
  { id: 'carriers', label: 'Carriers', icon: 'CR', path: '/carriers' },
  { id: 'invoices', label: 'Invoices', icon: 'IN', path: '/invoices' },
  { id: 'exceptions', label: 'Exceptions', icon: 'EX', path: '/exceptions' },
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: 'AI',
    dropdown: true,
    items: [
      { id: 'audit-iq', label: 'Audit IQ', icon: 'AQ', path: '/audit-iq' },
      { id: 'fraud-prevention', label: 'Fraud Prevention', icon: 'FP', path: '/fraud-prevention' },
      { id: 'risk-scoring', label: 'Risk Scoring', icon: 'RS', path: '/risk-scoring' },
      { id: 'route-optimization', label: 'Route Optimization', icon: 'RO', path: '/route-optimization' },
      { id: 'lane-intelligence', label: 'Lane Intelligence', icon: 'LI', path: '/lane-intelligence' },
      { id: 'rate-calculator', label: 'Rate Calculator', icon: 'RC', path: '/truckload-rate-calculator' },
    ],
  },
  { id: 'rate-logic', label: 'Rate Logic Tool', icon: 'RL', path: '/rate-logic-tool' },
  { id: 'reports', label: 'Reports', icon: 'RP', path: '/reports' },
  { id: 'uploads', label: 'Uploads', icon: 'UP', path: '/uploads' },
  { id: 'exceptions-uploads', label: 'Uploads Exceptions', icon: 'UE', path: '/exceptions-uploads' },
  { id: 'settings', label: 'Settings', icon: 'ST', path: '/settings' },
  { id: 'tenant-admin', label: 'Tenant Admin', icon: 'TA', path: '/tenant-admin' },
];

export default function Sidebar() {
  const {
    theme,
    themeMode,
    modePreference,
    palette,
    availablePalettes,
    setModePreference,
    setPalette,
    settings,
    setAdvancedSetting,
  } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('opscale_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(true);

  useEffect(() => {
    const storedCollapsed = localStorage.getItem('opscale_sidebar_collapsed') === 'true';
    const storedMobileOpen = localStorage.getItem('opscale_mobile_sidebar_open') === 'true';
    setCollapsed(storedCollapsed);
    setShowMobileSidebar(storedMobileOpen);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    localStorage.setItem('opscale_sidebar_collapsed', String(collapsed));
    window.dispatchEvent(new Event('opscale-sidebar-toggle'));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem('opscale_mobile_sidebar_open', String(showMobileSidebar));
    window.dispatchEvent(new Event('opscale-sidebar-toggle'));
  }, [showMobileSidebar]);

  const sidebarWidth = isMobile
    ? (showMobileSidebar ? MOBILE_OPEN_WIDTH : MOBILE_CLOSED_WIDTH)
    : (collapsed ? DESKTOP_COLLAPSED_WIDTH : DESKTOP_EXPANDED_WIDTH);
  const showLabels = !collapsed && (!isMobile || showMobileSidebar);
  const navGap = collapsed ? 4 : 10;

  return (
    <aside
      style={{
        width: sidebarWidth,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        inset: '0 auto 0 0',
        background: 'linear-gradient(180deg, var(--bg-secondary) 80%, var(--surface) 100%)',
        borderRight: '1px solid var(--border-strong)',
        boxShadow: '0 8px 32px var(--sidebar-shadow, rgba(0,0,0,0.18))',
        zIndex: 100,
      }}
    >
        <header
          style={{
            minHeight: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: showLabels ? 'space-between' : 'center',
            padding: showLabels ? '12px 14px' : '12px 8px',
            borderBottom: `1px solid ${theme.border}`,
            background: 'var(--bg-secondary)',
            boxShadow: 'inset 0 -1px 0 var(--banner-accent), var(--banner-glow), var(--banner-glow-dynamic)',
            gap: 8,
          }}
        >
          {showLabels && <img src={logo} alt="Opscale Audit IQ" style={{ height: 40, width: 'auto' }} />}
          <button
            type="button"
            onClick={() => {
              if (isMobile) {
                setShowMobileSidebar((v) => !v);
              } else {
                setCollapsed((c) => !c);
              }
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              backgroundColor: 'var(--surface-elevated)',
              color: theme.textSecondary,
              cursor: 'pointer',
            }}
            title={isMobile ? (showMobileSidebar ? 'Close Menu' : 'Open Menu') : (collapsed ? 'Expand Sidebar' : 'Collapse Sidebar')}
          >
            {isMobile ? (showMobileSidebar ? '×' : '≡') : collapsed ? '>' : '<'}
          </button>
        </header>
        {/* ...existing sidebar content... */}

      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: navGap,
          padding: '14px 10px',
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {navItems.map((item) =>
          item.dropdown ? (
            <div key={item.id} style={{ marginBottom: 4 }}>
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  background: 'var(--surface)',
                  color: theme.textSecondary,
                  padding: collapsed ? '10px 8px' : '10px 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  width: '100%',
                  cursor: 'pointer',
                  transition: 'all 180ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${theme.accent}14`;
                  e.currentTarget.style.color = theme.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--surface)';
                  e.currentTarget.style.color = theme.textSecondary;
                }}
                aria-expanded={false}
              >
                <span
                  style={{
                    minWidth: 34,
                    height: 30,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: `${theme.accent}14`,
                    border: `1px solid ${theme.border}`,
                    fontSize: 11,
                    letterSpacing: 0.4,
                  }}
                >
                  {item.icon}
                </span>
                {showLabels && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                {showLabels && <span style={{ marginLeft: 'auto', fontSize: 16 }}>{'▸'}</span>}
              </button>
              <div style={{ marginLeft: collapsed ? 0 : 36, marginTop: 2 }}>
                {item.items.map((sub) => (
                  <NavLink
                    key={sub.id}
                    to={sub.path}
                    className="neon-outline"
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      borderRadius: 10,
                      border: `1px solid ${isActive ? theme.accent : theme.border}`,
                      background: isActive
                        ? `linear-gradient(140deg, ${theme.accent}28, ${theme.accent}18)`
                        : 'transparent',
                      color: isActive ? theme.text : theme.textSecondary,
                      padding: collapsed ? '8px 8px' : '8px 12px',
                      fontSize: 12,
                      fontWeight: 500,
                      marginBottom: 2,
                      transition: 'all 180ms ease',
                    })}
                  >
                    <span
                      style={{
                        minWidth: 24,
                        height: 22,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 6,
                        backgroundColor: `${theme.accent}14`,
                        border: `1px solid ${theme.border}`,
                        fontSize: 10,
                        letterSpacing: 0.3,
                      }}
                    >
                      {sub.icon}
                    </span>
                    {showLabels && <span style={{ whiteSpace: 'nowrap' }}>{sub.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ) : (
            <NavLink
              key={item.id}
              to={item.path}
              className="neon-outline"
              end={item.path === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderRadius: 12,
                border: `1px solid ${isActive ? theme.accent : theme.border}`,
                borderLeft: `3px solid ${isActive ? theme.accent : 'transparent'}`,
                background: isActive
                  ? `${theme.accent}1a`
                  : 'var(--surface)',
                color: isActive ? theme.text : theme.textSecondary,
                padding: collapsed ? '10px 8px' : '10px 12px',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 180ms ease',
                boxShadow: isActive ? '0 2px 8px var(--accent-shadow, rgba(47,128,255,0.08))' : 'none',
              })}
            >
              <span
                style={{
                  minWidth: 34,
                  height: 30,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  backgroundColor: `${theme.accent}14`,
                  border: `1px solid ${theme.border}`,
                  fontSize: 11,
                  letterSpacing: 0.4,
                }}
              >
                {item.icon}
              </span>
              {showLabels && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </NavLink>
          )
        )}
      </nav>

      <footer style={{ padding: 10, borderTop: `1px solid ${theme.border}` }}>
        {showLabels && (
          <div style={{ display: 'grid', gap: 8, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${theme.border}` }}>
            <button
              type="button"
              onClick={() => setShowThemePanel((value) => !value)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: theme.textSecondary,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>Theme</span>
              <span style={{ fontSize: 10 }}>{showThemePanel ? '−' : '+'}</span>
            </button>

            {showThemePanel && (
              <>
                <select
                  value={palette}
                  onChange={(event) => setPalette(event.target.value)}
                  style={{
                    minHeight: 32,
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    background: theme.bgAlt,
                    color: theme.text,
                    padding: '6px 8px',
                    fontSize: 11,
                  }}
                >
                  {availablePalettes.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.label}</option>
                  ))}
                </select>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 6 }}>
                  {[
                    { id: 'light', label: '☀ Light' },
                    { id: 'dark', label: '🌙 Dark' },
                    { id: 'auto', label: '🖥 Auto' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setModePreference(option.id)}
                      style={{
                        borderRadius: 8,
                        border: `1px solid ${modePreference === option.id ? theme.accent : theme.border}`,
                        background: modePreference === option.id ? theme.surfaceStrong : theme.bgAlt,
                        color: theme.text,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '6px 4px',
                        cursor: 'pointer',
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 6 }}>
                  {[
                    { key: 'subtle', label: 'Subtle' },
                    { key: 'balanced', label: 'Balanced' },
                    { key: 'intense', label: 'Intense' },
                  ].map((stage) => (
                    <button
                      key={stage.key}
                      type="button"
                      onClick={() => setAdvancedSetting('fontScale', stage.key === 'subtle' ? 0.95 : stage.key === 'intense' ? 1.05 : 1)}
                      style={{
                        borderRadius: 8,
                        border: `1px solid ${settings.fontScale === (stage.key === 'subtle' ? 0.95 : stage.key === 'intense' ? 1.05 : 1) ? theme.accent : theme.border}`,
                        background: settings.fontScale === (stage.key === 'subtle' ? 0.95 : stage.key === 'intense' ? 1.05 : 1) ? theme.surfaceStrong : theme.bgAlt,
                        color: theme.text,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '6px 4px',
                        cursor: 'pointer',
                      }}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: theme.textSecondary }}>
                    <span>Font heaviness</span>
                    <span>{Math.round(settings.fontWeight || 600)}</span>
                  </div>
                  <input
                    type="range"
                    min="400"
                    max="700"
                    step="50"
                    value={Math.round(settings.fontWeight || 600)}
                    onChange={(event) => setAdvancedSetting('fontWeight', Number(event.target.value))}
                  />
                </div>

                <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: theme.textSecondary }}>
                    <span>Page effects</span>
                    <span>{Math.round((settings.effectsStrength || 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={Math.round((settings.effectsStrength || 1) * 100)}
                    onChange={(event) => setAdvancedSetting('effectsStrength', Number(event.target.value) / 100)}
                  />
                </div>

                <div style={{ fontSize: 10, color: theme.textSecondary }}>Active mode: {themeMode}</div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: theme.textSecondary }}>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.scheduleEnabled)}
                    onChange={(event) => setAdvancedSetting('scheduleEnabled', event.target.checked)}
                  />
                  Schedule dark (7pm–7am)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: theme.textSecondary }}>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.forceDarkDataPages)}
                    onChange={(event) => setAdvancedSetting('forceDarkDataPages', event.target.checked)}
                  />
                  Force dark on data-heavy pages
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: theme.textSecondary }}>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.reduceAnimationInDark)}
                    onChange={(event) => setAdvancedSetting('reduceAnimationInDark', event.target.checked)}
                  />
                  Reduce animation in dark mode
                </label>
              </>
            )}
          </div>
        )}

        <button
          type="button"
          className="neon-outline"
          onClick={() => {
            clearAccessToken();
            window.dispatchEvent(new Event('storage'));
            navigate('/login');
          }}
          style={{
            width: '100%',
            minHeight: 42,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            background: `linear-gradient(145deg, ${theme.surfaceStrong}, ${theme.surface})`,
            color: theme.textSecondary,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Log Out
        </button>
      </footer>
    </aside>
  );
}
// --- End transplanted Sidebar ---
