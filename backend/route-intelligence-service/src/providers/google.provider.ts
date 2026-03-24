import axios from 'axios';
import { env } from '../config/env';

export interface GoogleRouteResult {
  miles: number;
  durationHours: number;
  polyline: string;
}

/**
 * Returns true when a Google Maps API key is configured.
 */
export function isGoogleAvailable(): boolean {
  return Boolean(env.GOOGLE_MAPS_API_KEY);
}

/**
 * Geocode a free-text address to lat/lng via the Google Geocoding API.
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
  if (!isGoogleAvailable()) return null;

  const { data } = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: {
      address,
      key: env.GOOGLE_MAPS_API_KEY,
    },
    timeout: 8000,
  });

  const result = data?.results?.[0];
  if (!result?.geometry?.location) return null;

  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address || address,
  };
}

/**
 * Get driving route between two locations using Google Directions API.
 * Returns miles, hours, and an encoded polyline — same shape as the HERE provider.
 */
export async function getGoogleRoute(origin: string, destination: string): Promise<GoogleRouteResult> {
  const { data } = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
    params: {
      origin,
      destination,
      mode: 'driving',
      key: env.GOOGLE_MAPS_API_KEY,
    },
    timeout: 10000,
  });

  const route = data?.routes?.[0];
  if (!route?.legs?.[0]) {
    throw new Error('Google Directions response missing route leg');
  }

  const leg = route.legs[0];

  return {
    miles: (leg.distance?.value || 0) / 1609.34,
    durationHours: (leg.duration?.value || 0) / 3600,
    polyline: route.overview_polyline?.points || '',
  };
}
