import axios from 'axios';
import { env } from '../config/env';

export interface HereRouteResult {
  miles: number;
  durationHours: number;
  polyline: string;
}

export async function getTruckRoute(origin: string, destination: string): Promise<HereRouteResult> {
  const response = await axios.get('https://router.hereapi.com/v8/routes', {
    params: {
      transportMode: 'truck',
      origin,
      destination,
      return: 'summary,polyline',
      apiKey: env.HERE_API_KEY,
    },
    timeout: 12000,
  });

  const section = response.data?.routes?.[0]?.sections?.[0];
  if (!section?.summary) {
    throw new Error('HERE response missing route summary');
  }

  return {
    miles: Number(section.summary.length || 0) / 1609.34,
    durationHours: Number(section.summary.duration || 0) / 3600,
    polyline: String(section.polyline || ''),
  };
}
