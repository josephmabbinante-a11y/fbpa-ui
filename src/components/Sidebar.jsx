
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme, themes } from '../contexts/ThemeContext';
import logo from '../assets/opscale-logo.svg';
import { clearAccessToken } from '../utils/authToken';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'DB', path: '/' },
  { id: 'fleet-dashboard', label: 'Fleet Dashboard', icon: 'FD', path: '/fleet' },
  // Orders and Order Management removed
  // Customers and Carriers removed
  { id: 'invoices', label: 'Invoices', icon: 'IN', path: '/invoices' },
  { id: 'exceptions', label: 'Exceptions', icon: 'EX', path: '/exceptions' },
  { id: 'rate-logic', label: 'Rate Logic Tool', icon: 'RL', path: '/rate-logic' },
  { id: 'reports', label: 'Reports', icon: 'RP', path: '/reports' },
  { id: 'uploads', label: 'Uploads', icon: 'UP', path: '/uploads' },
  { id: 'settings', label: 'Settings', icon: 'ST', path: '/settings' },
];

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const t = themes[theme];
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

  // Responsive: detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dropdown state for groups
  const [openDropdowns, setOpenDropdowns] = useState({});
  const handleDropdownToggle = (groupId) => {
    setOpenDropdowns((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Sidebar width (example, adjust as needed)
  const sidebarWidth = collapsed ? 60 : 240;
  const navGap = collapsed ? 4 : 10;

  // Show sidebar on mobile only when showMobileSidebar is true
  // On desktop, always show (collapsed or not)
  const sidebarVisible = isMobile ? showMobileSidebar : true;

  useEffect(() => {
    try {
      localStorage.setItem('opscale_sidebar_collapsed', String(collapsed));
    } catch {
      // localStorage may be unavailable
    }

    window.dispatchEvent(new Event('opscale-sidebar-toggle'));
  }, [collapsed]);

  return (
    <>
      {/* Overlay for mobile menu */}
      {isMobile && showMobileSidebar && (
        <div
          onClick={() => setShowMobileSidebar(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 99,
            transition: 'opacity 0.2s',
          }}
        />
      )}
      <aside
        style={{
          width: sidebarWidth,
          display: sidebarVisible ? 'flex' : 'none',
          flexDirection: 'column',
          position: 'fixed',
          inset: '0 auto 0 0',
          background: `linear-gradient(185deg, ${t.bgAlt}, ${t.surface})`,
          borderRight: `1px solid ${t.border}`,
          boxShadow: '18px 0 36px rgba(1, 5, 18, 0.45)',
          zIndex: 100,
          transition: 'width 200ms ease',
        }}
      >
      <header
        style={{
          minHeight: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '12px 8px' : '12px 14px',
          borderBottom: `1px solid ${t.border}`,
          gap: 8,
        }}
      >
        {!collapsed && <img src={logo} alt="Opscale Audit IQ" style={{ height: 40, width: 'auto' }} />}
        <button
          type="button"
          onClick={() => {
            if (isMobile) {
              setShowMobileSidebar((v) => !v);
            } else {
              setCollapsed((c) => !c);
            }
          }}
          className="neon-outline"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            border: `1px solid ${t.border}`,
            backgroundColor: t.surfaceStrong,
            color: t.textSecondary,
            cursor: 'pointer',
          }}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isMobile ? (showMobileSidebar ? '×' : '≡') : collapsed ? '>' : '<'}
        </button>
      </header>

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
                onClick={() => handleDropdownToggle(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  borderRadius: 12,
                  border: `1px solid ${openDropdowns[item.id] ? t.accent : t.border}`,
                  background: openDropdowns[item.id]
                    ? `linear-gradient(140deg, rgba(24, 210, 255, 0.12), rgba(95, 140, 255, 0.10))`
                    : 'transparent',
                  color: openDropdowns[item.id] ? t.text : t.textSecondary,
                  padding: collapsed ? '10px 8px' : '10px 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  width: '100%',
                  cursor: 'pointer',
                  transition: 'all 180ms ease',
                }}
                aria-expanded={openDropdowns[item.id]}
                aria-controls={`dropdown-${item.id}`}
              >
                <span
                  style={{
                    minWidth: 34,
                    height: 30,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${t.border}`,
                    fontSize: 11,
                    letterSpacing: 0.4,
                  }}
                >
                  {item.icon}
                </span>
                {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                {!collapsed && <span style={{ marginLeft: 'auto', fontSize: 16 }}>{openDropdowns[item.id] ? '▾' : '▸'}</span>}
              </button>
              {openDropdowns[item.id] && (
                <div id={`dropdown-${item.id}`} style={{ marginLeft: collapsed ? 0 : 36, marginTop: 2 }}>
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
                        border: `1px solid ${isActive ? t.accent : t.border}`,
                        background: isActive
                          ? `linear-gradient(140deg, rgba(24, 210, 255, 0.18), rgba(95, 140, 255, 0.14))`
                          : 'transparent',
                        color: isActive ? t.text : t.textSecondary,
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
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${t.border}`,
                          fontSize: 10,
                          letterSpacing: 0.3,
                        }}
                      >
                        {sub.icon}
                      </span>
                      {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{sub.label}</span>}
                    </NavLink>
                  ))}
                </div>
              )}
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
                border: `1px solid ${isActive ? t.accent : t.border}`,
                background: isActive
                  ? `linear-gradient(140deg, rgba(24, 210, 255, 0.22), rgba(95, 140, 255, 0.18))`
                  : 'transparent',
                color: isActive ? t.text : t.textSecondary,
                padding: collapsed ? '10px 8px' : '10px 12px',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 180ms ease',
                boxShadow: isActive ? 'inset 0 0 0 1px rgba(255,255,255,0.04)' : 'none',
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
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${t.border}`,
                  fontSize: 11,
                  letterSpacing: 0.4,
                }}
              >
                {item.icon}
              </span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </NavLink>
          )
        )}
      </nav>

      <footer style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>
        <button
          type="button"
          className="neon-outline"
          onClick={() => {
            clearAccessToken();
            navigate('/login');
          }}
          style={{
            width: '100%',
            minHeight: 42,
            borderRadius: 12,
            border: `1px solid ${t.border}`,
            background: `linear-gradient(145deg, ${t.surfaceStrong}, ${t.surface})`,
            color: t.textSecondary,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Log Out
        </button>
      </footer>
      </aside>
    </>
  );
}
