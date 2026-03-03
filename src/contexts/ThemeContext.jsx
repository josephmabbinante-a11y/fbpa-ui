import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { themePackages } from './themePackages';
import { getThemeTokens } from './ThemeTokens';

const ThemeContext = createContext();
const THEME_STORAGE_KEY = 'opscale_theme_state';
const LEGACY_THEME_STORAGE_KEY = 'opscale_theme';
const TRANSITION_CLASS = 'theme-transition';
const REDUCE_MOTION_CLASS = 'reduce-motion-theme';
const TRANSITION_MS = 220;

const DATA_HEAVY_PATHS = ['/dashboard', '/fleet', '/loadcenter', '/load-board', '/loads', '/reports', '/invoices'];

const PALETTES = [
  {
    id: 'executive-black',
    label: 'Executive Black',
    light: {
      bg: '#F4F6F8',
      surface: '#FFFFFF',
      text: '#111827',
      accent: '#1D4ED8',
      border: '#D8DEE7',
      success: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
      secondary: '#2563EB',
      bannerBg: 'linear-gradient(90deg, #FFFFFF 0%, #F7FAFF 100%)',
      bannerAccent: 'rgba(29, 78, 216, 0.45)',
      bannerGlow: 'none',
    },
    dark: {
      bg: '#0F1115',
      surface: '#171A21',
      text: '#F3F4F6',
      accent: '#3A86FF',
      border: '#303748',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      secondary: '#60A5FA',
      bannerBg: 'linear-gradient(90deg, #12151D 0%, #0E1118 100%)',
      bannerAccent: 'rgba(58, 134, 255, 0.36)',
      bannerGlow: '0 0 20px rgba(58, 134, 255, 0.18)',
    },
  },
  {
    id: 'opscale-blue',
    label: 'Opscale Blue',
    light: {
      bg: '#F6F8FB',
      surface: '#FFFFFF',
      text: '#111827',
      accent: '#2563EB',
      border: '#D6E0F0',
      success: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
      secondary: '#3B82F6',
      bannerBg: 'linear-gradient(110deg, #F8FBFF 0%, #E7F0FF 100%)',
      bannerAccent: 'rgba(37, 99, 235, 0.35)',
      bannerGlow: 'none',
    },
    dark: {
      bg: '#0B1220',
      surface: '#111827',
      text: '#E5E7EB',
      accent: '#3B82F6',
      border: '#273549',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#F87171',
      secondary: '#60A5FA',
      bannerBg: 'linear-gradient(110deg, #0A1630 0%, #10213E 100%)',
      bannerAccent: 'rgba(59, 130, 246, 0.3)',
      bannerGlow: '0 0 18px rgba(59, 130, 246, 0.15)',
    },
  },
  {
    id: 'tactical-slate',
    label: 'Tactical Slate',
    light: {
      bg: '#E5E7EB',
      surface: '#FFFFFF',
      text: '#1F2937',
      accent: '#B45309',
      border: '#C8CDD6',
      success: '#15803D',
      warning: '#B45309',
      error: '#B91C1C',
      secondary: '#A16207',
      bannerBg: 'linear-gradient(90deg, #F4F5F7 0%, #E8EBF0 100%)',
      bannerAccent: 'rgba(180, 83, 9, 0.22)',
      bannerGlow: 'none',
    },
    dark: {
      bg: '#1E2328',
      surface: '#2A3138',
      text: '#E5E7EB',
      accent: '#FBBF24',
      border: '#3B454F',
      success: '#22C55E',
      warning: '#FBBF24',
      error: '#F87171',
      secondary: '#F59E0B',
      bannerBg: 'linear-gradient(90deg, #252C33 0%, #20262D 100%)',
      bannerAccent: 'rgba(251, 191, 36, 0.28)',
      bannerGlow: '0 0 16px rgba(251, 191, 36, 0.14)',
    },
  },
  {
    id: 'industrial-steel',
    label: 'Industrial Steel',
    light: {
      bg: '#F3F4F6',
      surface: '#FFFFFF',
      text: '#1F2937',
      accent: '#374151',
      border: '#D1D5DB',
      success: '#15803D',
      warning: '#B45309',
      error: '#DC2626',
      secondary: '#DC2626',
      bannerBg: 'linear-gradient(110deg, #F8F9FB 0%, #EEF1F4 100%)',
      bannerAccent: 'rgba(55, 65, 81, 0.25)',
      bannerGlow: 'none',
    },
    dark: {
      bg: '#1F2937',
      surface: '#2C3440',
      text: '#E5E7EB',
      accent: '#9CA3AF',
      border: '#46505E',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      secondary: '#EF4444',
      bannerBg: 'linear-gradient(110deg, #262F3C 0%, #202937 100%)',
      bannerAccent: 'rgba(156, 163, 175, 0.22)',
      bannerGlow: '0 0 12px rgba(156, 163, 175, 0.12)',
    },
  },
  {
    id: 'neon-freight',
    label: 'Neon Freight',
    light: {
      bg: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#1F2937',
      accent: '#7C3AED',
      border: '#DCE3F3',
      success: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
      secondary: '#06B6D4',
      bannerBg: 'linear-gradient(90deg, #FFFFFF 0%, #F7F2FF 100%)',
      bannerAccent: 'rgba(124, 58, 237, 0.34)',
      bannerGlow: 'none',
    },
    dark: {
      bg: '#0D1117',
      surface: '#161B22',
      text: '#E5E7EB',
      accent: '#8B5CF6',
      border: '#2B3342',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#F87171',
      secondary: '#22D3EE',
      bannerBg: 'linear-gradient(110deg, #151525 0%, #122131 100%)',
      bannerAccent: 'rgba(139, 92, 246, 0.35)',
      bannerGlow: '0 0 18px rgba(34, 211, 238, 0.16)',
    },
  },
  {
    id: 'minimal-white',
    label: 'Minimal White',
    light: {
      bg: '#FFFFFF',
      surface: '#FAFAFA',
      text: '#111827',
      accent: '#111827',
      border: '#E5E7EB',
      success: '#16A34A',
      warning: '#B45309',
      error: '#DC2626',
      secondary: '#374151',
      bannerBg: 'linear-gradient(90deg, #FFFFFF 0%, #FCFCFC 100%)',
      bannerAccent: 'rgba(17, 24, 39, 0.2)',
      bannerGlow: 'none',
    },
    dark: {
      bg: '#111827',
      surface: '#1F2937',
      text: '#E5E7EB',
      accent: '#D1D5DB',
      border: '#374151',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#F87171',
      secondary: '#9CA3AF',
      bannerBg: 'linear-gradient(90deg, #1A2435 0%, #141D2C 100%)',
      bannerAccent: 'rgba(209, 213, 219, 0.2)',
      bannerGlow: 'none',
    },
  },
  {
    id: 'oldschool-windows',
    label: 'Oldschool Windows',
    light: {
      bg: '#C0C0C0',
      surface: '#ECE9D8',
      text: '#000000',
      accent: '#000080',
      border: '#808080',
      success: '#008000',
      warning: '#B8860B',
      error: '#800000',
      secondary: '#0054E3',
      bannerBg: 'linear-gradient(90deg, #ECE9D8 0%, #D4D0C8 100%)',
      bannerAccent: 'rgba(0, 0, 128, 0.28)',
      bannerGlow: 'none',
    },
    dark: {
      bg: '#1F2430',
      surface: '#2B3242',
      text: '#E6E9EF',
      accent: '#7AA2F7',
      border: '#4C566A',
      success: '#8FBC8F',
      warning: '#EBCB8B',
      error: '#BF616A',
      secondary: '#88C0D0',
      bannerBg: 'linear-gradient(90deg, #2B3242 0%, #242B38 100%)',
      bannerAccent: 'rgba(122, 162, 247, 0.22)',
      bannerGlow: '0 0 10px rgba(122, 162, 247, 0.12)',
    },
  },
  {
    id: 'futuristic-neon',
    label: 'Futuristic Neon',
    light: {
      bg: '#F5F8FF',
      surface: '#FFFFFF',
      text: '#0B1020',
      accent: '#00B8FF',
      border: '#CFE5FF',
      success: '#00C853',
      warning: '#FF9100',
      error: '#FF1744',
      secondary: '#7C4DFF',
      bannerBg: 'linear-gradient(110deg, #F7FBFF 0%, #EEF4FF 100%)',
      bannerAccent: 'rgba(0, 184, 255, 0.24)',
      bannerGlow: 'none',
    },
    dark: {
      bg: '#050814',
      surface: '#0B1328',
      text: '#E6F4FF',
      accent: '#00E5FF',
      border: '#1F2C4D',
      success: '#00E676',
      warning: '#FFC400',
      error: '#FF3D71',
      secondary: '#7C4DFF',
      bannerBg: 'linear-gradient(110deg, #071026 0%, #0B1638 100%)',
      bannerAccent: 'rgba(0, 229, 255, 0.3)',
      bannerGlow: '0 0 22px rgba(0, 229, 255, 0.2)',
    },
  },
  {
    id: 'high-contrast-accessibility',
    label: 'High-Contrast Accessibility',
    light: {
      bg: '#FFFFFF',
      surface: '#FFFFFF',
      text: '#000000',
      accent: '#0000FF',
      border: '#111111',
      success: '#047857',
      warning: '#92400E',
      error: '#B91C1C',
      secondary: '#111111',
      bannerBg: '#FFFFFF',
      bannerAccent: '#0000FF',
      bannerGlow: 'none',
    },
    dark: {
      bg: '#000000',
      surface: '#111111',
      text: '#FFFFFF',
      accent: '#FFD700',
      border: '#FFFFFF',
      success: '#22C55E',
      warning: '#FBBF24',
      error: '#F87171',
      secondary: '#FFFFFF',
      bannerBg: '#000000',
      bannerAccent: '#FFD700',
      bannerGlow: 'none',
    },
  },
  {
    id: 'dispatch-2003',
    label: 'Dispatch 2003',
    light: {
      bg: '#F3F3EF', // CRT off-white
      surface: '#E7E7DE', // Panel background
      text: '#222222', // Main text
      accent: '#003399', // Windows blue
      border: '#B5B5B5', // Classic border
      success: '#228B22', // Status green
      warning: '#B8860B', // Status amber
      error: '#B22222', // Status red
      secondary: '#006699', // Toolbar blue
      bannerBg: 'linear-gradient(90deg, #E7E7DE 0%, #F3F3EF 100%)',
      bannerAccent: 'rgba(0, 51, 153, 0.18)',
      bannerGlow: 'none',
    },
    dark: {
      bg: '#23272C', // CRT shadow
      surface: '#2E3238', // Panel background
      text: '#E0E0E0', // Main text
      accent: '#3399FF', // Windows blue (bright)
      border: '#5A5A5A', // Classic border
      success: '#7CFC00', // Status green
      warning: '#FFD700', // Status amber
      error: '#FF6347', // Status red
      secondary: '#3399FF', // Toolbar blue
      bannerBg: 'linear-gradient(90deg, #2E3238 0%, #23272C 100%)',
      bannerAccent: 'rgba(51, 153, 255, 0.18)',
      bannerGlow: '0 0 10px rgba(51, 153, 255, 0.10)',
    },
  },
  {
    id: 'slimline',
    label: 'Slimline',
    light: {
      bg: '#F8F9FA',
      surface: '#FFFFFF',
      text: '#22223B',
      accent: '#3A86FF',
      border: '#E0E0E0',
      success: '#43AA8B',
      warning: '#F9C74F',
      error: '#F94144',
      secondary: '#4361EE',
      bannerBg: 'linear-gradient(90deg, #F8F9FA 0%, #E9ECEF 100%)',
      bannerAccent: 'rgba(58, 134, 255, 0.22)',
      bannerGlow: 'none',
    },
    dark: {
      bg: '#181926',
      surface: '#232946',
      text: '#EDEDED',
      accent: '#3A86FF',
      border: '#2E2F3E',
      success: '#43AA8B',
      warning: '#F9C74F',
      error: '#F94144',
      secondary: '#4361EE',
      bannerBg: 'linear-gradient(90deg, #232946 0%, #181926 100%)',
      bannerAccent: 'rgba(58, 134, 255, 0.32)',
      bannerGlow: '0 0 14px rgba(58, 134, 255, 0.14)',
    },
  },
];

function hexToRgb(hex) {
  const normalized = String(hex || '').replace('#', '');
  if (normalized.length !== 6) return '99, 102, 241';
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function withAlpha(hex, alpha) {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb}, ${alpha})`;
}

function createThemeMode(paletteId, mode, base) {
  const isDark = mode === 'dark';
  const accent2 = base.secondary || base.accent;
  const bgAlt = isDark ? withAlpha(base.surface, 0.92) : withAlpha(base.bg, 0.9);
  const surfaceStrong = isDark ? withAlpha(base.surface, 0.95) : withAlpha(base.surface, 0.98);
  const bgMid = isDark ? withAlpha(base.bg, 0.86) : withAlpha(base.bg, 0.92);
  const bgDeep = isDark ? withAlpha(base.bg, 0.74) : withAlpha(base.bg, 0.84);
  const headerEmphasis = isDark ? '#C7D7FE' : '#1E3A8A';
  const criticalHeader = isDark ? '#FDE68A' : '#92400E';
  const criticalValue = isDark ? '#FCD34D' : '#B45309';
  const criticalFieldBg = isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.10)';
  const criticalFieldBorder = isDark ? 'rgba(245, 158, 11, 0.38)' : 'rgba(180, 83, 9, 0.34)';

  return {
    id: `${paletteId}-${mode}`,
    mode,
    paletteId,
    bg: base.bg,
    bgAlt,
    text: base.text,
    textSecondary: isDark ? withAlpha(base.text, 0.72) : withAlpha(base.text, 0.64),
    border: base.border,
    borderLight: isDark ? withAlpha(base.border, 0.85) : withAlpha(base.border, 0.75),
    surface: base.surface,
    surfaceStrong,
    bgMid,
    bgDeep,
    auraPrimary: hexToRgb(base.accent),
    auraSecondary: hexToRgb(accent2),
    pageGlass: isDark ? withAlpha(base.surface, 0.64) : withAlpha(base.surface, 0.78),
    accent: base.accent,
    accent2,
    success: base.success,
    warning: base.warning,
    error: base.error,
    glow: hexToRgb(base.accent),
    positive: base.success,
    negative: base.error,
    neutral: isDark ? '#9CA3AF' : '#6B7280',
    chartPrimary: base.accent,
    chartSecondary: accent2,
    chartTertiary: base.success,
    headerEmphasis,
    criticalHeader,
    criticalValue,
    criticalFieldBg,
    criticalFieldBorder,
    tableStripe: isDark ? withAlpha(base.surface, 0.58) : withAlpha(base.bg, 0.68),
    alertBrightness: isDark ? '0.92' : '1',
    hoverGlow: isDark ? withAlpha(base.accent, 0.18) : withAlpha(base.accent, 0.14),
    shadowSoft: isDark ? '0 8px 24px rgba(0,0,0,0.42)' : '0 8px 24px rgba(15,23,42,0.08)',
    bannerBg: base.bannerBg,
    bannerAccent: base.bannerAccent,
    bannerGlow: base.bannerGlow,
  };
}

const generatedThemes = PALETTES.reduce((acc, palette) => {
  acc[`${palette.id}-light`] = createThemeMode(palette.id, 'light', palette.light);
  acc[`${palette.id}-dark`] = createThemeMode(palette.id, 'dark', palette.dark);
  return acc;
}, {});

export const themes = {
  ...generatedThemes,
  dark: generatedThemes['opscale-blue-dark'],
  light: generatedThemes['opscale-blue-light'],
};

function getSystemTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

function readPathname() {
  if (typeof window === 'undefined') return '/';
  return String(window.location?.pathname || '/').toLowerCase();
}

function inDarkSchedule(startHour, endHour) {
  const now = new Date();
  const h = now.getHours();
  if (startHour === endHour) return true;
  if (startHour < endHour) {
    return h >= startHour && h < endHour;
  }
  return h >= startHour || h < endHour;
}

function getDefaultState() {
  return {
    palette: 'opscale-blue',
    modePreference: 'auto',
    scheduleEnabled: false,
    scheduleStartHour: 19,
    scheduleEndHour: 7,
    forceDarkDataPages: false,
    reduceAnimationInDark: true,
    fontScale: 1,
    fontWeight: 600,
    effectsStrength: 1,
  };
}

function readStoredState() {
  const defaults = getDefaultState();

  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaults,
        ...parsed,
      };
    }
  } catch {
    // Ignore malformed persisted theme payload.
  }

  try {
    const legacy = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (legacy === 'dark' || legacy === 'light') {
      return {
        ...defaults,
        modePreference: legacy,
      };
    }
  } catch {
    // Ignore legacy key read errors.
  }

  return defaults;
}

export const ThemeProvider = ({ children }) => {
  const previousThemeRef = useRef(null);
  const transitionTimerRef = useRef(null);

  const [settings, setSettings] = useState(() => readStoredState());
  const [systemMode, setSystemMode] = useState(() => getSystemTheme());
  const [pathname, setPathname] = useState(() => readPathname());

  useEffect(() => {
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => setSystemMode(getSystemTheme());

    darkQuery.addEventListener('change', listener);
    return () => darkQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const updatePathname = () => setPathname(readPathname());

    const nativePushState = window.history.pushState;
    const nativeReplaceState = window.history.replaceState;

    window.history.pushState = function patchedPushState(...args) {
      nativePushState.apply(this, args);
      updatePathname();
    };
    window.history.replaceState = function patchedReplaceState(...args) {
      nativeReplaceState.apply(this, args);
      updatePathname();
    };

    window.addEventListener('popstate', updatePathname);
    window.addEventListener('hashchange', updatePathname);

    return () => {
      window.history.pushState = nativePushState;
      window.history.replaceState = nativeReplaceState;
      window.removeEventListener('popstate', updatePathname);
      window.removeEventListener('hashchange', updatePathname);
    };
  }, []);

  useEffect(() => {
    if (!settings.scheduleEnabled) return undefined;
    const timer = window.setInterval(() => {
      setSettings((current) => ({ ...current }));
    }, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [settings.scheduleEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage might be unavailable.
    }
  }, [settings]);

  useEffect(() => {
    const syncTheme = (event) => {
      if (event.key !== THEME_STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue);
        setSettings((current) => ({ ...current, ...parsed }));
      } catch {
        // Ignore malformed synced payload.
      }
    };

    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  const effectiveMode = useMemo(() => {
    const isDataHeavy = DATA_HEAVY_PATHS.some((path) => pathname.startsWith(path));

    if (settings.forceDarkDataPages && isDataHeavy) return 'dark';

    if (settings.modePreference === 'light' || settings.modePreference === 'dark') {
      return settings.modePreference;
    }

    if (settings.scheduleEnabled && inDarkSchedule(settings.scheduleStartHour, settings.scheduleEndHour)) {
      return 'dark';
    }

    return systemMode;
  }, [pathname, settings.forceDarkDataPages, settings.modePreference, settings.scheduleEnabled, settings.scheduleEndHour, settings.scheduleStartHour, systemMode]);

  const themeKey = `${settings.palette}-${effectiveMode}`;
  const theme = themes[themeKey] || themes['opscale-blue-dark'];

  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const fontScale = Number.isFinite(Number(settings.fontScale)) ? Math.min(1.2, Math.max(0.9, Number(settings.fontScale))) : 1;
    const fontWeight = Number.isFinite(Number(settings.fontWeight)) ? Math.min(700, Math.max(400, Number(settings.fontWeight))) : 600;
    const effectsStrengthRaw = Number.isFinite(Number(settings.effectsStrength)) ? Math.min(1.5, Math.max(0.5, Number(settings.effectsStrength))) : 1;
    const effectsNormalized = (effectsStrengthRaw - 0.5) / 1;
    const effectsStrength = 0.25 + Math.pow(Math.max(0, Math.min(1, effectsNormalized)), 1.65) * 2.55;
    const tintStrength = Math.max(0, Math.min(1, effectsNormalized));
    const headerTintAlpha = 0.02 + (0.12 * tintStrength);
    const bannerTintAlpha = 0.06 + (0.18 * tintStrength);
    const bannerGlowAlpha = 0.04 + (0.14 * tintStrength);
    const bannerGlowSize = Math.round(8 + (14 * tintStrength));
    const tableHeaderTintAlpha = 0.04 + (0.14 * tintStrength);

    root.setAttribute('data-theme-mode', effectiveMode);
    root.setAttribute('data-theme-palette', settings.palette);

    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--bg-alt', theme.bgAlt);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--text-secondary', theme.textSecondary);
    root.style.setProperty('--border', theme.border);
    root.style.setProperty('--surface', theme.surface);
    root.style.setProperty('--surface-strong', theme.surfaceStrong);
    root.style.setProperty('--bg-mid', theme.bgMid);
    root.style.setProperty('--bg-deep', theme.bgDeep);
    root.style.setProperty('--aura-primary', theme.auraPrimary);
    root.style.setProperty('--aura-secondary', theme.auraSecondary);
    root.style.setProperty('--page-glass', theme.pageGlass);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-2', theme.accent2);
    root.style.setProperty('--success', theme.success);
    root.style.setProperty('--warning', theme.warning);
    root.style.setProperty('--error', theme.error);
    root.style.setProperty('--glow', theme.glow);
    root.style.setProperty('--banner-bg', theme.bannerBg);
    root.style.setProperty('--banner-accent', theme.bannerAccent);
    root.style.setProperty('--banner-glow', theme.bannerGlow);
    root.style.setProperty('--chart-primary', theme.chartPrimary);
    root.style.setProperty('--chart-secondary', theme.chartSecondary);
    root.style.setProperty('--chart-tertiary', theme.chartTertiary);
    root.style.setProperty('--header-emphasis', theme.headerEmphasis);
    root.style.setProperty('--critical-header', theme.criticalHeader);
    root.style.setProperty('--critical-value', theme.criticalValue);
    root.style.setProperty('--critical-field-bg', theme.criticalFieldBg);
    root.style.setProperty('--critical-field-border', theme.criticalFieldBorder);
    root.style.setProperty('--table-stripe', theme.tableStripe);
    root.style.setProperty('--alert-brightness', theme.alertBrightness);
    root.style.setProperty('--hover-glow', theme.hoverGlow);
    root.style.setProperty('--shadow-soft', theme.shadowSoft);
    root.style.setProperty('--app-font-scale', String(fontScale));
    root.style.setProperty('--app-font-weight', String(Math.round(fontWeight)));
    root.style.setProperty('--effects-strength-raw', String(effectsStrengthRaw));
    root.style.setProperty('--effects-strength', String(effectsStrength));
    root.style.setProperty('--header-tint', `rgba(${theme.glow}, ${headerTintAlpha.toFixed(3)})`);
    root.style.setProperty('--header-tint-strong', `rgba(${theme.glow}, ${(headerTintAlpha * 1.35).toFixed(3)})`);
    root.style.setProperty('--banner-tint', `rgba(${theme.glow}, ${bannerTintAlpha.toFixed(3)})`);
    root.style.setProperty('--banner-glow-dynamic', `0 0 ${bannerGlowSize}px rgba(${theme.glow}, ${bannerGlowAlpha.toFixed(3)})`);
    root.style.setProperty('--table-header-tint', `rgba(${theme.glow}, ${tableHeaderTintAlpha.toFixed(3)})`);

    root.style.setProperty('--color-bg', theme.bg);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-border', theme.border);

    root.style.setProperty('color-scheme', effectiveMode === 'dark' ? 'dark' : 'light');
    body.style.setProperty('color-scheme', effectiveMode === 'dark' ? 'dark' : 'light');

    const shouldAnimate =
      previousThemeRef.current !== null &&
      previousThemeRef.current !== themeKey &&
      !(settings.reduceAnimationInDark && effectiveMode === 'dark') &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (settings.reduceAnimationInDark && effectiveMode === 'dark') {
      body.classList.add(REDUCE_MOTION_CLASS);
    } else {
      body.classList.remove(REDUCE_MOTION_CLASS);
    }

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

    previousThemeRef.current = themeKey;

    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      body.classList.remove(TRANSITION_CLASS);
    };
  }, [effectiveMode, settings.effectsStrength, settings.fontScale, settings.fontWeight, settings.palette, settings.reduceAnimationInDark, theme, themeKey]);

  const toggleTheme = () => {
    setSettings((current) => ({
      ...current,
      modePreference: effectiveMode === 'dark' ? 'light' : 'dark',
    }));
  };

  const setModePreference = (modePreference) => {
    setSettings((current) => ({ ...current, modePreference }));
  };

  const setPalette = (palette) => {
    setSettings((current) => ({ ...current, palette }));
  };

  const setTheme = (nextTheme) => {
    const value = String(nextTheme || '').toLowerCase();
    if (value === 'light' || value === 'dark' || value === 'auto') {
      setModePreference(value);
      return;
    }

    const matchedPalette = PALETTES.find((entry) => entry.id === value);
    if (matchedPalette) {
      setPalette(matchedPalette.id);
      return;
    }

    const [maybePalette, maybeMode] = value.split('-').length > 1
      ? [value.replace(/-(light|dark)$/, ''), value.endsWith('-dark') ? 'dark' : value.endsWith('-light') ? 'light' : null]
      : [null, null];

    if (maybePalette && PALETTES.some((entry) => entry.id === maybePalette)) {
      setPalette(maybePalette);
      if (maybeMode) setModePreference(maybeMode);
    }
  };

  const setAdvancedSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const availablePalettes = useMemo(() => PALETTES.map((palette) => ({ id: palette.id, label: palette.label })), []);

  const [themePackageKey, setThemePackageKey] = useState(() => {
    const stored = localStorage.getItem('themePackageKey');
    return stored || 'sentinelDark';
  });

  useEffect(() => {
    localStorage.setItem('themePackageKey', themePackageKey);
  }, [themePackageKey]);

  const themeTokens = useMemo(() => getThemeTokens(themePackageKey), [themePackageKey]);

  return (
    <ThemeContext.Provider
      value={{
        theme: themeTokens,
        themePackageKey,
        setThemePackageKey,
        settings,
        setSettings,
        themes,
        availablePalettes,
        toggleTheme,
        setTheme,
        setModePreference,
        setPalette,
        setAdvancedSetting,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const useThemeTokens = () => {
  const ctx = useContext(ThemeContext);
  return ctx?.theme || themePackages.sentinelDark;
};
