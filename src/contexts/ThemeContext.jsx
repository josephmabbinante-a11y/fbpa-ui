import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

const ThemeContext = createContext();
const THEME_STORAGE_KEY = 'opscale_theme';
const TRANSITION_CLASS = 'theme-transition';
const TRANSITION_MS = 220;

export const ThemeProvider = ({ children }) => {
  const previousThemeRef = useRef(null);
  const transitionTimerRef = useRef(null);

  const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  };
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || getSystemTheme();
    } catch {
      return getSystemTheme();
    }
  });
  useEffect(() => {
    const systemThemeListener = (e) => {
      if (e.matches) {
        setTheme(getSystemTheme());
      }
    };
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', systemThemeListener);
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', systemThemeListener);
    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', systemThemeListener);
      window.matchMedia('(prefers-color-scheme: light)').removeEventListener('change', systemThemeListener);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // localStorage might not be available.
      }
      return next;
    });
  };

  useLayoutEffect(() => {
    const active = themes[theme] || themes.dark;
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-theme', theme);
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

    const shouldAnimate =
      previousThemeRef.current !== null &&
      previousThemeRef.current !== theme &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (shouldAnimate) {
      body.classList.add(TRANSITION_CLASS);
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
      transitionTimerRef.current = window.setTimeout(() => {
        body.classList.remove(TRANSITION_CLASS);
        transitionTimerRef.current = null;
      }, TRANSITION_MS);
    }

    previousThemeRef.current = theme;

    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      body.classList.remove(TRANSITION_CLASS);
    };
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event) => {
      if (event.key !== THEME_STORAGE_KEY || !event.newValue) return;
      if (event.newValue === 'dark' || event.newValue === 'light') {
        setTheme(event.newValue);
      }
    };

    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
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
    positive: '#10b981',
    negative: '#ef5350',
    neutral: '#6b7280',
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
    positive: '#10b981',
    negative: '#ef5350',
    neutral: '#9ca3af',
  },
};
