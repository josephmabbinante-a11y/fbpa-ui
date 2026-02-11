import { createContext, useContext, useState } from 'react';

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
    bg: '#1a1a1a',
    bgAlt: '#242424',
    text: '#f0f0f0',
    textSecondary: '#a8a8a8',
    border: '#3a3a3a',
    borderLight: '#2a2a2a',
    surface: '#1f1f1f',
    accent: '#0066cc',
    success: '#4ade80',
    warning: '#f59e0b',
    error: '#ef4444',
    
    // Semantic
    positive: '#10b981', // savings
    negative: '#ef5350', // losses
    neutral: '#6b7280', // inactive
  },
  light: {
    bg: '#ffffff',
    bgAlt: '#f9fafb',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    surface: '#f3f4f6',
    accent: '#0066cc',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    
    // Semantic
    positive: '#10b981', // savings
    negative: '#ef5350', // losses
    neutral: '#9ca3af', // inactive
  },
};
