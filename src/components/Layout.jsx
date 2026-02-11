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

    // Listen for storage changes (in case sidebar is toggled in another tab)
    window.addEventListener('storage', checkSidebarWidth);
    
    // Check periodically (fallback for same-tab changes)
    const interval = setInterval(checkSidebarWidth, 100);

    return () => {
      window.removeEventListener('storage', checkSidebarWidth);
      clearInterval(interval);
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
