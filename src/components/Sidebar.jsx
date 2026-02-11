import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme, themes } from '../contexts/ThemeContext';
import logo from '../assets/opscale-logo.svg';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/' },
  { id: 'fleet-dashboard', label: 'Fleet Dashboard', icon: '🚌', path: '/fleet-dashboard' },
  { id: 'invoices', label: 'Invoices', icon: '📄', path: '/invoices' },
  { id: 'exceptions', label: 'Exceptions', icon: '⚠️', path: '/exceptions' },
  { id: 'rate-logic', label: 'Rate Logic Tool', icon: '💡', path: '/rate-logic' },
  { id: 'reports', label: 'Reports', icon: '📈', path: '/reports' },
  { id: 'carriers', label: 'Carrier Performance', icon: '🚚', path: '/carriers' },
  { id: 'uploads', label: 'Uploads', icon: '📤', path: '/uploads' },
  { id: 'customers', label: 'Customers', icon: '👥', path: '/customers' },
  { id: 'profile', label: 'My Audit IQ Profile', icon: '🧑‍💼', path: '/profile' },
  { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings' },
];

export default function Sidebar() {
  const { theme } = useTheme();
  const t = themes[theme];
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Load collapsed state on mount
  useEffect(() => {
    const stored = localStorage.getItem('opscale_sidebar_collapsed') === 'true';
    setCollapsed(stored);
  }, []);

  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('opscale_sidebar_collapsed', newState);
  };

  return (
    <div
      style={{
        width: collapsed ? 64 : 240,
        backgroundColor: t.bgAlt,
        borderRight: `1px solid ${t.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${t.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 56,
        }}
      >
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', overflow: 'hidden' }}>
            <img src={logo} alt="Opscale Audit IQ" style={{ height: 40, width: 'auto', display: 'block', maxWidth: '100%' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}>
            <img src={logo} alt="Opscale" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          style={{
            background: 'none',
            border: 'none',
            color: t.textSecondary,
            cursor: 'pointer',
            fontSize: '18px',
            padding: 4,
            marginLeft: collapsed ? -4 : undefined,
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 8px', overflow: 'auto' }}>
        {navItems.map((item) => {
          const isActive = item.path === location.pathname;
          return (
            <a
              key={item.id}
              href={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 4,
                textDecoration: 'none',
                color: isActive ? t.accent : t.textSecondary,
                backgroundColor: isActive ? t.surface : 'transparent',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                border: `1px solid ${isActive ? t.border : 'transparent'}`,
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.target.style.backgroundColor = t.surface;
                  e.target.style.color = t.text;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = t.textSecondary;
                }
              }}
            >
              <span style={{ fontSize: '16px', minWidth: 20, textAlign: 'center' }}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </a>
          );
        })}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: `1px solid ${t.border}` }}>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem('accessToken');
            } catch {
              // ignore storage errors
            }
            navigate('/login');
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 4,
            border: `1px solid ${t.border}`,
            backgroundColor: t.surface,
            color: t.textSecondary,
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
