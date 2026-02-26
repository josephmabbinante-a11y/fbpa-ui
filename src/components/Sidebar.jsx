
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme, themes } from '../contexts/ThemeContext';
import logo from '../assets/opscale-logo.svg';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'DB', path: '/' },
  { id: 'fleet-dashboard', label: 'Fleet Dashboard', icon: 'FD', path: '/fleet-dashboard' },
  { id: 'invoices', label: 'Invoices', icon: 'IN', path: '/invoices' },
  { id: 'exceptions', label: 'Exceptions', icon: 'EX', path: '/exceptions' },
  { id: 'rate-logic', label: 'Rate Logic Tool', icon: 'RL', path: '/rate-logic' },
  { id: 'reports', label: 'Reports', icon: 'RP', path: '/reports' },
  { id: 'carriers', label: 'Carrier Performance', icon: 'CP', path: '/carriers' },
  { id: 'loads', label: 'Loads', icon: 'LD', path: '/loads' },
  { id: 'uploads', label: 'Uploads', icon: 'UP', path: '/uploads' },
  { id: 'customers', label: 'Customers', icon: 'CU', path: '/customers' },
  { id: 'profile', label: 'My Audit IQ Profile', icon: 'PR', path: '/profile' },
  { id: 'settings', label: 'Settings', icon: 'ST', path: '/settings' },
];

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const t = themes[theme];
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      } else {
        const stored = localStorage.getItem('opscale_sidebar_collapsed') === 'true';
        setCollapsed(stored);
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);
  }, []);


  useEffect(() => {
    window.dispatchEvent(new Event('opscale-sidebar-toggle'));
  }, [collapsed]);

  const sidebarWidth = collapsed ? 74 : 264;
  const navGap = useMemo(() => (collapsed ? 10 : 8), [collapsed]);

  const toggleCollapsed = () => {
    if (isMobile) {
      setCollapsed((prev) => !prev);
      return;
    }
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('opscale_sidebar_collapsed', String(newState));
  };

  return (
    <aside
      style={{
        width: sidebarWidth,
        display: 'flex',
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
          onClick={toggleCollapsed}
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
          {collapsed ? '>' : '<'}
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
        {navItems.map((item) => (
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
        ))}
      </nav>

      <footer style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>
        <button
          type="button"
          className="neon-outline"
          onClick={() => {
            try {
              localStorage.removeItem('accessToken');
            } catch {
              // Ignore localStorage issues in private mode.
            }
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
  );
}
