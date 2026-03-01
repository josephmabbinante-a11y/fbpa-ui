import { useEffect, useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

const DESKTOP_EXPANDED_WIDTH = 264;
const DESKTOP_COLLAPSED_WIDTH = 74;
const MOBILE_CLOSED_WIDTH = 60;
const MOBILE_OPEN_WIDTH = 240;

function getSidebarWidth() {
  if (window.innerWidth < 900) {
    const mobileOpen = localStorage.getItem('opscale_mobile_sidebar_open') === 'true';
    return mobileOpen ? MOBILE_OPEN_WIDTH : MOBILE_CLOSED_WIDTH;
  }
  const collapsed = localStorage.getItem('opscale_sidebar_collapsed') === 'true';
  return collapsed ? DESKTOP_COLLAPSED_WIDTH : DESKTOP_EXPANDED_WIDTH;
}

function Layout({ children }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [sidebarWidth, setSidebarWidth] = useState(() => getSidebarWidth());

  useEffect(() => {
    const syncWidth = () => {
      if (window.innerWidth < 900) {
        const mobileOpen = localStorage.getItem('opscale_mobile_sidebar_open') === 'true';
        setSidebarWidth(mobileOpen ? MOBILE_OPEN_WIDTH : MOBILE_CLOSED_WIDTH);
        return;
      }
      const collapsed = localStorage.getItem('opscale_sidebar_collapsed') === 'true';
      setSidebarWidth(collapsed ? DESKTOP_COLLAPSED_WIDTH : DESKTOP_EXPANDED_WIDTH);
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

  useEffect(() => {
    // Recharts can keep a stale width after parent layout transitions (sidebar collapse/expand).
    // Emit resize signals during and after the margin transition so charts re-measure reliably.
    const emitResize = () => window.dispatchEvent(new Event('resize'));
    const rafId = window.requestAnimationFrame(emitResize);
    const t1 = window.setTimeout(emitResize, 120);
    const t2 = window.setTimeout(emitResize, 260);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [sidebarWidth, theme]);

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
            gridTemplateColumns: 'minmax(0, 1fr)',
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
