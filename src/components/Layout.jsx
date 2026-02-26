import { useEffect, useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

function getSidebarWidth() {
  if (window.innerWidth < 900) return 74;
  const collapsed = localStorage.getItem('opscale_sidebar_collapsed') === 'true';
  return collapsed ? 74 : 264;
}

function Layout({ children }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [sidebarWidth, setSidebarWidth] = useState(() => getSidebarWidth());

  useEffect(() => {
    const syncWidth = () => {
      if (window.innerWidth < 900) {
        setSidebarWidth(74);
        return;
      }
      const collapsed = localStorage.getItem('opscale_sidebar_collapsed') === 'true';
      setSidebarWidth(collapsed ? 74 : 264);
    };

    syncWidth();
    window.addEventListener('resize', syncWidth);
    window.addEventListener('storage', syncWidth);
    window.addEventListener('opscale-sidebar-toggle', syncWidth);

    return () => {
      window.removeEventListener('resize', syncWidth);
      window.removeEventListener('storage', syncWidth);
      window.removeEventListener('opscale-sidebar-toggle', syncWidth);
    };
  }, []);

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', color: t.text }}>
      <main
        style={{
          flex: 1,
          marginLeft: sidebarWidth,
          transition: 'margin-left 220ms ease',
          padding: 20,
        }}
      >
        <section
          className="card-surface page-shell"
          style={{
            minHeight: 'calc(100vh - 40px)',
            backgroundColor: 'rgba(8, 17, 35, 0.56)',
            borderColor: t.border,
          }}
        >
          {children}
        </section>
      </main>
    </div>
  );
}

export default Layout;
