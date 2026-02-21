import { useEffect, useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

function Layout({ children }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [sidebarWidth, setSidebarWidth] = useState(240);

  // Monitor sidebar collapse state
  useEffect(() => {
    const checkSidebarWidth = () => {
      const collapsed = localStorage.getItem('opscale_sidebar_collapsed') === 'true';
      setSidebarWidth(collapsed ? 64 : 240);
    };

    checkSidebarWidth();

    // Listen for storage changes (for changes in other tabs)
    window.addEventListener('storage', checkSidebarWidth);

    // Listen for a custom event for same-tab changes to avoid polling.
    // The component that toggles the sidebar should dispatch this event.
    window.addEventListener('opscale-sidebar-toggle', checkSidebarWidth);

    return () => {
      window.removeEventListener('storage', checkSidebarWidth);
      window.removeEventListener('opscale-sidebar-toggle', checkSidebarWidth);
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: t.bg,
        color: t.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      }}
    >
      <main
        style={{
          flex: 1,
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.3s ease',
          backgroundColor: t.bg,
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default Layout;
