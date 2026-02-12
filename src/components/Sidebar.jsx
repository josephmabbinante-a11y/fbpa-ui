import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme, themes } from '../contexts/ThemeContext';
import logo from '../assets/opscale-logo.svg';

const menu = [
  {
    label: 'Dashboard',
    icon: '📊',
    path: '/dashboard',
    children: []
  },
  {
    label: 'Load Board',
    icon: '🚛',
    path: '/load-board',
    children: []
  },
  {
    label: 'Shipments',
    icon: '📦',
    path: '/shipments',
    children: []
  },
  {
    label: 'Operations',
    icon: '⚙️',
    children: [
      { label: 'Invoices', path: '/invoices' },
      { label: 'Uploads', path: '/uploads' },
      { label: 'Exceptions', path: '/exceptions' }
    ]
  },
  {
    label: 'Finance',
    icon: '💰',
    children: [
      { label: 'Accounts Receivable', path: '/finance/ar' },
      { label: 'Accounts Payable', path: '/finance/ap' },
      { label: 'Aging Report', path: '/finance/aging' }
    ]
  },
  {
    label: 'Analytics',
    icon: '📈',
    children: [
      { label: 'Reports', path: '/reports' },
      { label: 'Carrier Performance', path: '/carrier-performance' },
      { label: 'Lane Intelligence', path: '/lane-intelligence' }
    ]
  },
  {
    label: 'CRM',
    icon: '👥',
    children: [
      { label: 'Customers', path: '/customers' },
      { label: 'Carriers', path: '/carriers' }
    ]
  },
  {
    label: 'Tools',
    icon: '🔧',
    path: '/rate-logic',
    children: []
  },
  {
    label: 'Account',
    icon: '👤',
    path: '/account',
    children: []
  }
];

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const t = themes[theme];
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState(
    menu.reduce((acc, section, idx) => ({ ...acc, [idx]: true }), {})
  );

  // Load collapsed state on mount
  useEffect(() => {
    const stored = localStorage.getItem('opscale_sidebar_collapsed') === 'true';
    setCollapsed(stored);
    const expandedStored = localStorage.getItem('opscale_sidebar_expanded');
    if (expandedStored) {
      try {
        setExpandedSections(JSON.parse(expandedStored));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('opscale_sidebar_collapsed', newState);
  };

  const toggleSection = (index) => {
    const newState = { ...expandedSections, [index]: !expandedSections[index] };
    setExpandedSections(newState);
    localStorage.setItem('opscale_sidebar_expanded', JSON.stringify(newState));
  };

  const isChildActive = (children) => {
    return children.some((child) => child.path === location.pathname);
  };

  const isSectionActive = (section) => {
    if (section.path) {
      return section.path === location.pathname;
    }
    return section.children ? isChildActive(section.children) : false;
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
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 8px', overflow: 'auto' }}>
        {menu.map((section, idx) => {
          const isExpanded = expandedSections[idx];
          const isActive = isSectionActive(section);
          const hasChildren = section.children && section.children.length > 0;

          if (!hasChildren) {
            // Direct link item (Dashboard, Load Board, Shipments, Tools, Account)
            return (
              <a
                key={idx}
                href={section.path}
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
                  fontWeight: isActive ? 600 : 500,
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
                  {section.icon}
                </span>
                {!collapsed && <span>{section.label}</span>}
              </a>
            );
          }

          // Collapsible section (Operations, Finance, Analytics, CRM)
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Section Header */}
              <button
                onClick={() => toggleSection(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 4,
                  border: `1px solid ${isActive ? t.border : 'transparent'}`,
                  backgroundColor: isActive ? t.surface : 'transparent',
                  color: isActive ? t.accent : t.textSecondary,
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = t.surface;
                  e.target.style.color = t.text;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = t.textSecondary;
                  }
                }}
              >
                <span style={{ fontSize: '16px', minWidth: 20, textAlign: 'center' }}>
                  {section.icon}
                </span>
                {!collapsed && (
                  <>
                    <span style={{ flex: 1 }}>{section.label}</span>
                    <span style={{ fontSize: '12px', transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                      ▼
                    </span>
                  </>
                )}
              </button>

              {/* Child Items */}
              {isExpanded && !collapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginLeft: 12 }}>
                  {section.children.map((child) => {
                    const isChildActive = child.path === location.pathname;
                    return (
                      <a
                        key={child.path}
                        href={child.path}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderRadius: 4,
                          textDecoration: 'none',
                          color: isChildActive ? t.accent : t.textSecondary,
                          backgroundColor: isChildActive ? t.surface : 'transparent',
                          fontSize: '12px',
                          fontWeight: isChildActive ? 600 : 400,
                          border: `1px solid ${isChildActive ? t.border : 'transparent'}`,
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          if (!isChildActive) {
                            e.target.style.backgroundColor = t.surface;
                            e.target.style.color = t.text;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isChildActive) {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = t.textSecondary;
                          }
                        }}
                      >
                        <span style={{ minWidth: 4, height: 4, borderRadius: '50%', backgroundColor: isChildActive ? t.accent : t.border, marginRight: 8 }} />
                        {child.label}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 4,
            border: `1px solid ${t.border}`,
            backgroundColor: t.surface,
            color: t.textSecondary,
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = t.bgAlt;
            e.target.style.color = t.text;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = t.surface;
            e.target.style.color = t.textSecondary;
          }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'} {!collapsed && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
        </button>
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
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = t.bgAlt;
            e.target.style.color = t.text;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = t.surface;
            e.target.style.color = t.textSecondary;
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
