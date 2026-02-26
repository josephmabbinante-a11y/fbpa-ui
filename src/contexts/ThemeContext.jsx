import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('opscale_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('opscale_theme', newTheme);
      } catch {
        // localStorage might not be available
      }
      return newTheme;
    });
  };

  useEffect(() => {
    const active = themes[theme];
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // Add smooth transition for theme changes
    root.style.transition = 'background-color 0.4s, color 0.4s';
    root.style.setProperty('--bg', active.bg);
    root.style.setProperty('--bg-alt', active.bgAlt);
    root.style.setProperty('--text', active.text);
    root.style.setProperty('--text-secondary', active.textSecondary);
    root.style.setProperty('--border', active.border);
    root.style.setProperty('--surface', active.surface);
    root.style.setProperty('--surface-strong', active.surfaceStrong);
    root.style.setProperty('--accent', active.accent);
    root.style.setProperty('--accent-2', active.accent2);
    root.style.setProperty('--success', active.success);
    root.style.setProperty('--warning', active.warning);
    root.style.setProperty('--error', active.error);
    root.style.setProperty('--glow', active.glow);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const themes = {
  dark: {
    bg: '#060a15',
    bgAlt: '#0b1327',
    text: '#e6efff',
    textSecondary: '#9cb0d3',
    border: '#1d2b4d',
    borderLight: '#142240',
    surface: '#0f1b36',
    surfaceStrong: '#132347',
    accent: '#18d2ff',
    accent2: '#5f8cff',
    success: '#4ade80',
    warning: '#f59e0b',
    error: '#ef4444',
    glow: '24, 210, 255',
    
    // Semantic
    positive: '#10b981', // savings
    negative: '#ef5350', // losses
    neutral: '#6b7280', // inactive
  },
  light: {
    bg: '#edf4ff',
    bgAlt: '#e2ecff',
    text: '#0f1f3d',
    textSecondary: '#38507e',
    border: '#bdd2ff',
    borderLight: '#d8e5ff',
    surface: '#f7faff',
    surfaceStrong: '#ecf3ff',
    accent: '#0a7cff',
    accent2: '#2f49ff',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    glow: '10, 124, 255',
    
    // Semantic
    positive: '#10b981', // savings
    negative: '#ef5350', // losses
    neutral: '#9ca3af', // inactive
  },
};
