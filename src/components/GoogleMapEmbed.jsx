import { useMemo } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

export default function GoogleMapEmbed({ origin, destination, height = 200 }) {
  const { theme } = useTheme();
  const t = themes[theme];
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const src = useMemo(() => {
    if (!apiKey || !origin || !destination) return null;
    const base = 'https://www.google.com/maps/embed/v1/directions';
    const params = new URLSearchParams({
      key: apiKey,
      origin,
      destination,
    });
    return `${base}?${params.toString()}`;
  }, [apiKey, origin, destination]);

  if (!apiKey) {
    return (
      <div
        style={{
          height,
          borderRadius: 6,
          border: `1px solid ${t.borderLight}`,
          backgroundColor: t.bgAlt,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: t.textSecondary,
          fontSize: 12,
        }}
      >
        Add `VITE_GOOGLE_MAPS_API_KEY` to enable maps.
      </div>
    );
  }

  if (!src) {
    return (
      <div
        style={{
          height,
          borderRadius: 6,
          border: `1px solid ${t.borderLight}`,
          backgroundColor: t.bgAlt,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: t.textSecondary,
          fontSize: 12,
        }}
      >
        Map data unavailable.
      </div>
    );
  }

  return (
    <div
      style={{
        height,
        borderRadius: 6,
        overflow: 'hidden',
        border: `1px solid ${t.borderLight}`,
        backgroundColor: t.bgAlt,
      }}
    >
      {import.meta.env.VITE_SHOW_MAP_DEBUG === 'true' && (
        <div
          style={{
            padding: '6px 8px',
            fontSize: 11,
            color: t.textSecondary,
            borderBottom: `1px solid ${t.borderLight}`,
            backgroundColor: t.bgAlt,
          }}
        >
          Map key loaded: {apiKey ? 'yes' : 'no'}
        </div>
      )}
      <iframe
        title="Route map"
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 0 }}
        referrerPolicy="no-referrer-when-downgrade"
        src={src}
        allowFullScreen
      />
    </div>
  );
}
