import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

function Layout({ children }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const [sidebarWidth, setSidebarWidth] = useState(240);

  const checkSidebarWidth = useCallback(() => {
    const collapsed = localStorage.getItem('opscale_sidebar_collapsed') === 'true';
    setSidebarWidth(collapsed ? 64 : 240);
  }, []);

  useEffect(() => {
    checkSidebarWidth();
    window.addEventListener('storage', checkSidebarWidth);
    const interval = setInterval(checkSidebarWidth, 100);

    return () => {
      window.removeEventListener('storage', checkSidebarWidth);
      clearInterval(interval);
    };
  }, [checkSidebarWidth]);

  const containerStyle = useMemo(() => ({
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: t.bg,
    color: t.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  }), [t.bg, t.text]);

  const mainStyle = useMemo(() => ({
    flex: 1,
    marginLeft: sidebarWidth,
    transition: 'margin-left 0.3s ease',
    backgroundColor: t.bg,
  }), [sidebarWidth, t.bg]);

  return (
    <div style={containerStyle}>
      <main style={mainStyle}>
        {children}
      </main>
    </div>
  );
}

export default Layout;
