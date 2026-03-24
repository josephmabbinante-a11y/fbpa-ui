import { redis } from '../config/redis';
import { getTruckRoute } from '../providers/here.provider';
import { getGoogleRoute, isGoogleAvailable } from '../providers/google.provider';
import { RouteRecord } from '../models/Route';
import { extractZipToken, generateLaneId } from '../utils/hash.util';
import { normalizePolyline } from '../utils/polyline.util';
import { calculateBillableMiles } from './mileage.service';
import { deriveLaneIntelligence } from './intelligence.service';
import { persistLaneAndRoute } from './lane.service';

export interface BuildRouteInput {
  origin: string;
  destination: string;
  volatilityIndex?: number;
  capacityScore?: number;
}

interface ProviderResult {
  miles: number;
  durationHours: number;
  polyline: string;
  method: 'google-directions' | 'here-truck';
}

function toCacheKey(origin: string, destination: string): string {
  return `route:${origin}:${destination}`;
}

/**
 * Fetch route from Google Directions first; fall back to HERE truck routing.
 */
async function fetchRoute(origin: string, destination: string): Promise<ProviderResult> {
  if (isGoogleAvailable()) {
    try {
      const g = await getGoogleRoute(origin, destination);
      return { ...g, method: 'google-directions' };
    } catch {
      // Google failed — fall through to HERE
    }
  }

  const h = await getTruckRoute(origin, destination);
  return { ...h, method: 'here-truck' };
}

export async function buildRoute(input: BuildRouteInput): Promise<RouteRecord> {
  const origin = String(input.origin || '').trim();
  const destination = String(input.destination || '').trim();

  if (!origin || !destination) {
    throw new Error('origin and destination are required');
  }

  const cacheKey = toCacheKey(origin, destination);
  const cachedRaw = await redis.get(cacheKey);
  if (cachedRaw) {
    const parsed = JSON.parse(cachedRaw) as RouteRecord;
    return { ...parsed, cached: true };
  }

  const route = await fetchRoute(origin, destination);
  const intelligence = deriveLaneIntelligence(input.volatilityIndex, input.capacityScore);
  const billableMiles = calculateBillableMiles(route.miles, {
    volatilityIndex: intelligence.volatilityIndex,
    capacityScore: intelligence.capacityScore,
  });

  const laneId = generateLaneId(extractZipToken(origin), extractZipToken(destination));

  const response: RouteRecord = {
    laneId,
    origin,
    destination,
    actualMiles: Number(route.miles.toFixed(2)),
    billableMiles,
    durationHours: Number(route.durationHours.toFixed(2)),
    polyline: normalizePolyline(route.polyline),
    method: route.method,
    cached: false,
  };

  await persistLaneAndRoute({
    laneId: response.laneId,
    origin,
    destination,
    actualMiles: response.actualMiles,
    billableMiles: response.billableMiles,
    durationHours: response.durationHours,
    polyline: response.polyline,
    method: response.method,
    volatilityIndex: intelligence.volatilityIndex,
    capacityScore: intelligence.capacityScore,
  });

  await redis.set(cacheKey, JSON.stringify(response), 'EX', intelligence.cacheTtlSeconds);

  return response;
}
