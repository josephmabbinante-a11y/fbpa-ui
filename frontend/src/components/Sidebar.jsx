import React, { useEffect, useState } from 'react';
// --- Begin transplanted Sidebar from FBPA branch ---
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import logo from '../assets/opscale-logo.svg';
import { useAuth } from '../contexts/AuthContext.jsx';
function Sidebar() {
  const { logout } = useAuth();
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

  // Optimize collapsed sidebar for space
  // Increase sidebar width to fill more of the gap
  // Further increase sidebar width for better balance
  // Increase only the collapsed sidebar width, keep expanded width unchanged
  const sidebarWidth = isMobile
    ? (showMobileSidebar ? 110 : 60)
    : (collapsed ? 96 : 260);
  const showLabels = !collapsed && (!isMobile || showMobileSidebar);
  const navGap = collapsed ? 2 : 10;

  // Original navItems menu structure
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', path: '/' },
    { id: 'invoices', label: 'Invoices', icon: '🧾', path: '/invoices' },
    { id: 'exceptions', label: 'Exceptions', icon: '❗', path: '/exceptions' },
    { id: 'fleet-dashboard', label: 'Fleet Dashboard', icon: '🚛', path: '/fleet' },
    {
      id: 'load-center', label: 'Load Center', icon: '🚚', dropdown: true, items: [
        { id: 'freight-exchange', label: 'Freight Exchange', icon: '🚛', path: '/load-board' },
        { id: 'dispatch', label: 'Dispatch', icon: '🛣️', path: '/loadcenter/dispatch-screen' },
      ]
    },
    {
      id: 'finance', label: 'Finance', icon: '💰', dropdown: true, items: [
        { id: 'ap', label: 'AP (Carrier Pay)', icon: 'AP', path: '/finance/ap' },
        { id: 'ar', label: 'AR (Broker)', icon: 'AR', path: '/finance/ar' },
        { id: 'aging', label: 'Aging', icon: 'AG', path: '/finance/aging' },
      ]
    },
    {
      id: 'analytics', label: 'Analytics', icon: '📊', dropdown: true, items: [
        { id: 'spend-reports', label: 'Spend Reports', icon: 'SR', path: '/reports' },
        { id: 'carrier-performance', label: 'Carrier Performance', icon: 'CP', path: '/carriers-list' },
        { id: 'lane-intelligence', label: 'Lane Intelligence', icon: 'LI', path: '/lane-intelligence' },
        { id: 'audit-iq', label: 'Audit IQ', icon: 'AQ', path: '/audit-iq' },
        { id: 'fraud-prevention', label: 'Fraud Prevention', icon: 'FP', path: '/fraud-prevention' },
        { id: 'risk-scoring', label: 'Risk Scoring', icon: 'RS', path: '/risk-scoring' },
        { id: 'route-optimization', label: 'Route Optimization', icon: 'RO', path: '/route-optimization' },
      ]
    },
    {
      id: 'crm', label: 'CRM', icon: '👥', dropdown: true, items: [
        { id: 'carriers', label: 'Carriers', icon: 'C', path: '/carriers' },
        { id: 'customers', label: 'Customers', icon: 'CU', path: '/customers' },
        { id: 'locations', label: 'Locations', icon: '📍', path: '/locations' },
      ]
    },
    {
      id: 'tools', label: 'Tools', icon: '🛠️', dropdown: true, items: [
        { id: 'rate-logic', label: 'Rate Logic Tool', icon: 'RL', path: '/rate-logic-tool' },
        { id: 'truckload-rate-calculator', label: 'Truckload Rate Calculator', icon: 'RC', path: '/truckload-rate-calculator' },
      ]
    },
    { id: 'account', label: 'Account', icon: '👤', path: '/settings' },
  ];

  return (
    <aside
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        maxWidth: sidebarWidth,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, var(--bg-secondary) 80%, var(--surface) 100%)',
        borderRight: '1px solid var(--border-strong)',
        boxShadow: '0 8px 32px var(--sidebar-shadow, rgba(0,0,0,0.18))',
        zIndex: 100,
        overflowX: 'hidden',
      }}
    >
      <header
        style={{
          minHeight: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: showLabels ? 'space-between' : 'center',
          padding: showLabels ? '8px 10px' : '8px 4px',
          borderBottom: `1px solid ${theme.border}`,
          background: 'var(--bg-secondary)',
          boxShadow: 'inset 0 -1px 0 var(--banner-accent), var(--banner-glow), var(--banner-glow-dynamic)',
          gap: 4,
        }}
      >
        {showLabels && <img src={logo} alt="Opscale Audit IQ" style={{ height: 32, width: 'auto' }} />}
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
            width: 28,
            height: 28,
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            backgroundColor: 'var(--surface-elevated)',
            color: theme.textSecondary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            padding: 0,
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
          padding: collapsed ? '8px 2px' : '14px 10px',
          overflowY: 'auto',
          flex: 1,
          alignItems: collapsed ? 'center' : 'stretch',
        }}
      >
        {navItems.map((item) =>
          item.dropdown ? (
            <div key={item.id} style={{ marginBottom: collapsed ? 2 : 4, width: '100%' }}>
              <button
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: collapsed ? 0 : 10,
                  borderRadius: 10,
                  border: `1px solid ${theme.border}`,
                  background: 'var(--surface)',
                  color: theme.textSecondary,
                  padding: collapsed ? '6px 0' : '10px 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  width: '100%',
                  minWidth: collapsed ? 36 : undefined,
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
                    minWidth: 28,
                    height: 28,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 7,
                    backgroundColor: `${theme.accent}14`,
                    border: `1px solid ${theme.border}`,
                    fontSize: 15,
                    letterSpacing: 0.4,
                  }}
                >
                  {item.icon}
                </span>
                {showLabels && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                {showLabels && <span style={{ marginLeft: 'auto', fontSize: 16 }}>{'▸'}</span>}
              </button>
              <div style={{ marginLeft: collapsed ? 0 : 32, marginTop: 2 }}>
                {item.items.map((sub) => (
                  <NavLink
                    key={sub.id}
                    to={sub.path}
                    className="neon-outline"
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: collapsed ? 0 : 10,
                      borderRadius: 8,
                      border: `1px solid ${isActive ? theme.accent : theme.border}`,
                      background: isActive
                        ? `linear-gradient(140deg, ${theme.accent}28, ${theme.accent}18)`
                        : 'transparent',
                      color: isActive ? theme.text : theme.textSecondary,
                      padding: collapsed ? '6px 0' : '8px 12px',
                      fontSize: 12,
                      fontWeight: 500,
                      marginBottom: 2,
                      minWidth: collapsed ? 36 : undefined,
                      transition: 'all 180ms ease',
                    })}
                  >
                    <span
                      style={{
                        minWidth: 22,
                        height: 22,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 5,
                        backgroundColor: `${theme.accent}14`,
                        border: `1px solid ${theme.border}`,
                        fontSize: 12,
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
                justifyContent: 'center',
                gap: collapsed ? 0 : 10,
                borderRadius: 10,
                border: `1px solid ${isActive ? theme.accent : theme.border}`,
                borderLeft: `3px solid ${isActive ? theme.accent : 'transparent'}`,
                background: isActive
                  ? `${theme.accent}1a`
                  : 'var(--surface)',
                color: isActive ? theme.text : theme.textSecondary,
                padding: collapsed ? '6px 0' : '10px 12px',
                fontSize: 13,
                fontWeight: 600,
                minWidth: collapsed ? 36 : undefined,
                transition: 'all 180ms ease',
                boxShadow: isActive ? '0 2px 8px var(--accent-shadow, rgba(47,128,255,0.08))' : 'none',
              })}
            >
              <span
                style={{
                  minWidth: 28,
                  height: 28,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 7,
                  backgroundColor: `${theme.accent}14`,
                  border: `1px solid ${theme.border}`,
                  fontSize: 15,
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
            logout();
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

export default Sidebar;
