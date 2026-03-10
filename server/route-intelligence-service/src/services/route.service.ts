import { redis } from '../config/redis';
import { getTruckRoute } from '../providers/here.provider';
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

function toCacheKey(origin: string, destination: string): string {
  return `route:${origin}:${destination}`;
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

  const route = await getTruckRoute(origin, destination);
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
    method: 'here-truck',
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
    volatilityIndex: intelligence.volatilityIndex,
    capacityScore: intelligence.capacityScore,
  });

  await redis.set(cacheKey, JSON.stringify(response), 'EX', intelligence.cacheTtlSeconds);

  return response;
}
