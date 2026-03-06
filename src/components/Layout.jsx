import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';
import { useLocation } from 'react-router-dom';

const DESKTOP_EXPANDED_WIDTH = 264;
const DESKTOP_COLLAPSED_WIDTH = 74;
const MOBILE_CLOSED_WIDTH = 60;
const MOBILE_OPEN_WIDTH = 240;
const LAYOUT_CUSTOM_STORAGE_KEY = 'opscale_layout_customizations_v1';
const LAYOUT_EDIT_MODE_KEY = 'opscale_layout_edit_mode';

function buildElementPath(el, root) {
  const segments = [];
  let current = el;
  while (current && current !== root) {
    const parent = current.parentElement;
    if (!parent) break;
    const index = Array.from(parent.children).indexOf(current);
    segments.unshift(index);
    current = parent;
  }
  return segments.join('.');
}

function getMovableElements(root) {
  if (!root) return [];
  const topLevel = Array.from(root.children).filter((node) => node instanceof HTMLElement);
  if (topLevel.length === 0) return [];

  let candidates = topLevel;
  if (topLevel.length === 1) {
    const nested = Array.from(topLevel[0].children).filter((node) => node instanceof HTMLElement);
    if (nested.length > 1) candidates = nested;
  }

  return candidates.filter((el) => {
    const tag = String(el.tagName || '').toLowerCase();
    if (['style', 'script', 'link', 'meta'].includes(tag)) return false;
    return true;
  });
}

function readCustomizationStore() {
  try {
    const raw = localStorage.getItem(LAYOUT_CUSTOM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
    return {};
  } catch {
    return {};
  }
}

function getSidebarWidth() {
  if (window.innerWidth < 900) {
    const mobileOpen = localStorage.getItem('opscale_mobile_sidebar_open') === 'true';
    return mobileOpen ? MOBILE_OPEN_WIDTH : MOBILE_CLOSED_WIDTH;
  }
  const collapsed = localStorage.getItem('opscale_sidebar_collapsed') === 'true';
  return collapsed ? DESKTOP_COLLAPSED_WIDTH : DESKTOP_EXPANDED_WIDTH;
}

function Layout({ children }) {
  const { theme, settings, setAdvancedSetting } = useTheme();
  const t = theme;
  const location = useLocation();
  const pathname = String(location.pathname || '/');
  const pageRootRef = useRef(null);
  const dragRef = useRef(null);
  const customStoreRef = useRef(readCustomizationStore());
  const [sidebarWidth, setSidebarWidth] = useState(() => getSidebarWidth());
  const [layoutEditMode, setLayoutEditMode] = useState(() => {
    try {
      return localStorage.getItem(LAYOUT_EDIT_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [showViewControls, setShowViewControls] = useState(false);

  const fontScale = Number.isFinite(Number(settings?.fontScale)) ? Number(settings.fontScale) : 1;
  const fontWeight = Number.isFinite(Number(settings?.fontWeight)) ? Number(settings.fontWeight) : 600;
  const effectsStrength = Number.isFinite(Number(settings?.effectsStrength)) ? Number(settings.effectsStrength) : 1;

  const pageKey = useMemo(() => String(location.pathname || '/'), [location.pathname]);
  const hideGlobalViewControls = pathname.startsWith('/load-board') || pathname.startsWith('/loadcenter');

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

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_EDIT_MODE_KEY, String(layoutEditMode));
    } catch {
      // Ignore localStorage failures.
    }
  }, [layoutEditMode]);

  useEffect(() => {
    const root = pageRootRef.current;
    if (!root) return;

    const movable = getMovableElements(root);
    const pageCustom = customStoreRef.current?.[pageKey] || {};

    movable.forEach((el) => {
      const id = buildElementPath(el, root);
      const custom = pageCustom[id] || { x: 0, y: 0, hidden: false };
      const isEditing = layoutEditMode;
      el.setAttribute('data-layout-movable', '1');
      el.setAttribute('data-layout-id', id);
      el.style.transform = isEditing
        ? `translate(${Number(custom.x || 0)}px, ${Number(custom.y || 0)}px)`
        : 'translate(0px, 0px)';
      el.style.position = 'relative';
      el.style.transition = layoutEditMode ? 'none' : 'transform 160ms ease';
      el.style.zIndex = isEditing && custom.hidden ? '0' : '1';
      el.style.opacity = isEditing && custom.hidden ? '0.18' : '1';
      el.style.pointerEvents = isEditing && custom.hidden ? 'none' : '';
      el.style.userSelect = layoutEditMode ? 'none' : '';
      el.style.cursor = layoutEditMode ? 'grab' : '';
    });
  }, [children, layoutEditMode, pageKey, refreshCounter]);

  useEffect(() => {
    const root = pageRootRef.current;
    if (!root || !layoutEditMode) return undefined;

    const handleMouseDown = (event) => {
      const target = event.target instanceof HTMLElement ? event.target.closest('[data-layout-movable="1"]') : null;
      if (!target) return;
      if (!(target instanceof HTMLElement)) return;
      if (!event.shiftKey) return;

      const targetId = target.getAttribute('data-layout-id');
      if (!targetId) return;

      event.preventDefault();
      const existingTransform = customStoreRef.current?.[pageKey]?.[targetId] || { x: 0, y: 0 };
      dragRef.current = {
        element: target,
        id: targetId,
        startX: event.clientX,
        startY: event.clientY,
        initialX: Number(existingTransform.x || 0),
        initialY: Number(existingTransform.y || 0),
      };
      target.style.cursor = 'grabbing';
    };

    const handleMouseMove = (event) => {
      if (!dragRef.current) return;
      const nextX = dragRef.current.initialX + (event.clientX - dragRef.current.startX);
      const nextY = dragRef.current.initialY + (event.clientY - dragRef.current.startY);
      dragRef.current.element.style.transform = `translate(${nextX}px, ${nextY}px)`;
      dragRef.current.currentX = nextX;
      dragRef.current.currentY = nextY;
    };

    const persistStore = () => {
      try {
        localStorage.setItem(LAYOUT_CUSTOM_STORAGE_KEY, JSON.stringify(customStoreRef.current));
      } catch {
        // Ignore localStorage failures.
      }
    };

    const handleMouseUp = () => {
      if (!dragRef.current) return;
      const { id, currentX, currentY, initialX, initialY, element } = dragRef.current;
      const x = Number.isFinite(currentX) ? currentX : initialX;
      const y = Number.isFinite(currentY) ? currentY : initialY;

      customStoreRef.current = {
        ...customStoreRef.current,
        [pageKey]: {
          ...(customStoreRef.current?.[pageKey] || {}),
          [id]: {
            ...(customStoreRef.current?.[pageKey]?.[id] || {}),
            x,
            y,
          },
        },
      };

      persistStore();
      element.style.cursor = 'grab';
      dragRef.current = null;
    };

    const handleDoubleClick = (event) => {
      const target = event.target instanceof HTMLElement ? event.target.closest('[data-layout-movable="1"]') : null;
      if (!target || !(target instanceof HTMLElement) || !event.altKey) return;
      const targetId = target.getAttribute('data-layout-id');
      if (!targetId) return;

      const current = customStoreRef.current?.[pageKey]?.[targetId] || { x: 0, y: 0, hidden: false };
      customStoreRef.current = {
        ...customStoreRef.current,
        [pageKey]: {
          ...(customStoreRef.current?.[pageKey] || {}),
          [targetId]: {
            ...current,
            hidden: !current.hidden,
          },
        },
      };

      try {
        localStorage.setItem(LAYOUT_CUSTOM_STORAGE_KEY, JSON.stringify(customStoreRef.current));
      } catch {
        // Ignore localStorage failures.
      }

      setRefreshCounter((prev) => prev + 1);
    };

    root.addEventListener('mousedown', handleMouseDown);
    root.addEventListener('dblclick', handleDoubleClick);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      root.removeEventListener('mousedown', handleMouseDown);
      root.removeEventListener('dblclick', handleDoubleClick);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [layoutEditMode, pageKey]);

  const resetPageLayout = () => {
    customStoreRef.current = {
      ...customStoreRef.current,
      [pageKey]: {},
    };
    try {
      localStorage.setItem(LAYOUT_CUSTOM_STORAGE_KEY, JSON.stringify(customStoreRef.current));
    } catch {
      // Ignore localStorage failures.
    }
    setRefreshCounter((prev) => prev + 1);
  };

  const resetAllLayouts = () => {
    customStoreRef.current = {};
    try {
      localStorage.removeItem(LAYOUT_CUSTOM_STORAGE_KEY);
    } catch {
      // Ignore localStorage failures.
    }
    setRefreshCounter((prev) => prev + 1);
  };

  const gearButtonStyle = {
    width: 30,
    height: 30,
    borderRadius: 999,
    border: `1px solid ${t.border}`,
    background: t.surface,
    color: t.text,
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: '30px',
    textAlign: 'center',
    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
  };

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', color: t.text }}>
        <main
          style={{
            flex: 1,
            marginLeft: sidebarWidth,
            transition: 'margin-left 220ms ease',
            padding: '0 32px 32px 32px', // Standardized page padding
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          }}
        >
        <section
          ref={pageRootRef}
          className="card-surface page-shell"
          data-layout-edit-mode={layoutEditMode ? 'true' : 'false'}
            style={{
              minHeight: 'calc(100vh - 64px)',
              gridTemplateColumns: 'minmax(0, 1fr)',
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-primary)',
            }}
        >
          {children}
        </section>

        {!hideGlobalViewControls && (
          <div
            style={{
              position: 'fixed',
              right: 18,
              top: 14,
              zIndex: 1300,
              display: 'grid',
              justifyItems: 'end',
              gap: 8,
            }}
          >
            <button
              type="button"
              aria-label="Open text and view controls"
              title="Text and view controls"
              onClick={() => setShowViewControls((prev) => !prev)}
              style={gearButtonStyle}
            >
              ⚙
            </button>

            {showViewControls && (
              <div
                style={{
                  width: 220,
                  borderRadius: 10,
                  border: `1px solid ${t.border}`,
                  background: t.surface,
                  color: t.text,
                  padding: 10,
                  display: 'grid',
                  gap: 8,
                  boxShadow: '0 10px 24px rgba(0,0,0,0.24)',
                }}
              >
                <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.textSecondary }}>
                    <span>Text size</span>
                    <span>{Math.round(fontScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="90"
                    max="120"
                    step="5"
                    value={Math.round(fontScale * 100)}
                    onChange={(event) => setAdvancedSetting('fontScale', Number(event.target.value) / 100)}
                  />
                </div>

                <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.textSecondary }}>
                    <span>Text weight</span>
                    <span>{Math.round(fontWeight)}</span>
                  </div>
                  <input
                    type="range"
                    min="400"
                    max="700"
                    step="50"
                    value={Math.round(fontWeight)}
                    onChange={(event) => setAdvancedSetting('fontWeight', Number(event.target.value))}
                  />
                </div>

                <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.textSecondary }}>
                    <span>Page effects</span>
                    <span>{Math.round(effectsStrength * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={Math.round(effectsStrength * 100)}
                    onChange={(event) => setAdvancedSetting('effectsStrength', Number(event.target.value) / 100)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div
            style={{
              position: 'fixed',
              right: 14,
              bottom: 14,
              zIndex: 1200,
              display: 'grid',
              gap: 6,
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface-elevated)',
              color: 'var(--text-primary)',
              boxShadow: '0 8px 24px var(--modal-shadow, rgba(0,0,0,0.16))',
              padding: '16px',
              minWidth: 220,
            }}
        >
          <button
            type="button"
            onClick={() => setLayoutEditMode((prev) => !prev)}
            style={{
              minHeight: 34,
              borderRadius: 8,
              border: `1px solid ${layoutEditMode ? t.accent : t.border}`,
              background: layoutEditMode ? t.accent : t.bgAlt,
              color: layoutEditMode ? '#fff' : t.text,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {layoutEditMode ? 'Exit Layout Edit' : 'Customize Layout'}
          </button>

          {layoutEditMode && (
            <>
              <div style={{ fontSize: 11, color: t.textSecondary }}>
                Hold <strong>Shift</strong> + drag to move blocks. Alt + double-click to hide/show.
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={resetPageLayout}
                  style={{
                    flex: 1,
                    minHeight: 30,
                    borderRadius: 8,
                    border: `1px solid ${t.border}`,
                    background: t.bgAlt,
                    color: t.text,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  Reset Page
                </button>
                <button
                  type="button"
                  onClick={resetAllLayouts}
                  style={{
                    flex: 1,
                    minHeight: 30,
                    borderRadius: 8,
                    border: `1px solid ${t.border}`,
                    background: t.bgAlt,
                    color: t.text,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  Reset All
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Layout;
