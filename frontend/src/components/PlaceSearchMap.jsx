import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-places-sdk';

function loadGoogleMapsScript(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }
    if (document.getElementById(GOOGLE_MAPS_SCRIPT_ID)) {
      const wait = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(wait);
          resolve();
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps SDK'));
    document.head.appendChild(script);
  });
}

export default function PlaceSearchMap({
  onPlaceSelected,
  placeholder = 'Search address or place name…',
  label = 'Search',
}) {
  const { theme } = useTheme();
  const t = theme || {};
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_KEY;

  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [sdkReady, setSdkReady] = useState(!!window.google?.maps?.places);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [inputValue, setInputValue] = useState('');

  // Load the Google Maps JS SDK once
  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    loadGoogleMapsScript(apiKey).then(() => {
      if (!cancelled) setSdkReady(true);
    });
    return () => { cancelled = true; };
  }, [apiKey]);

  // Attach autocomplete to input
  useEffect(() => {
    if (!sdkReady || !inputRef.current || autocompleteRef.current) return;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment', 'geocode'],
      fields: ['name', 'formatted_address', 'address_components', 'geometry'],
    });

    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place?.geometry) return;

      const comps = place.address_components || [];
      const get = (type) => comps.find((c) => c.types.includes(type))?.long_name || '';
      const getShort = (type) => comps.find((c) => c.types.includes(type))?.short_name || '';

      const streetNumber = get('street_number');
      const route = get('route');
      const street = [streetNumber, route].filter(Boolean).join(' ');

      const detail = {
        name: place.name || '',
        address: street || place.formatted_address || '',
        city: get('locality') || get('sublocality_level_1') || get('administrative_area_level_2') || '',
        state: getShort('administrative_area_level_1'),
        zip: get('postal_code'),
        country: getShort('country'),
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        formattedAddress: place.formatted_address || '',
      };

      setSelectedPlace(detail);
      setInputValue(detail.formattedAddress);

      if (onPlaceSelected) onPlaceSelected(detail);
    });

    autocompleteRef.current = ac;
  }, [sdkReady, onPlaceSelected]);

  // Styles consistent with the app's theme
  const sectionStyle = {
    border: `1px solid ${t.border}`,
    borderRadius: 12,
    background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`,
    overflow: 'hidden',
  };

  const headerStyle = {
    padding: '10px 12px',
    borderBottom: `1px solid ${t.border}`,
    background: t.bgAlt,
    fontSize: 14,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const bodyStyle = {
    padding: 12,
    display: 'grid',
    gap: 12,
  };

  const inputStyle = {
    minHeight: 36,
    borderRadius: 10,
    border: `1px solid ${t.border}`,
    background: t.bgAlt,
    color: t.text,
    padding: '7px 10px',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: t.textSecondary,
  };

  if (!apiKey) {
    return (
      <section style={sectionStyle}>
        <div style={headerStyle}>� {label}</div>
        <div style={bodyStyle}>
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your environment to enable address search.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>🔍 {label}</div>
      <div style={bodyStyle}>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={labelStyle}>Address / Place Search</span>
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={sdkReady ? placeholder : 'Loading…'}
            disabled={!sdkReady}
            style={inputStyle}
          />
        </label>

        {selectedPlace && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: t.text }}>
            {selectedPlace.name && selectedPlace.name !== selectedPlace.address && (
              <span><strong>Name:</strong> {selectedPlace.name}</span>
            )}
            {selectedPlace.address && <span><strong>Address:</strong> {selectedPlace.address}</span>}
            {selectedPlace.city && <span><strong>City:</strong> {selectedPlace.city}</span>}
            {selectedPlace.state && <span><strong>State:</strong> {selectedPlace.state}</span>}
            {selectedPlace.zip && <span><strong>Zip:</strong> {selectedPlace.zip}</span>}
          </div>
        )}
      </div>
    </section>
  );
}
