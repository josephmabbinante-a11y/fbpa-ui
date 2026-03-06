import { env } from '../config/env';

export interface LaneIntelligence {
  volatilityIndex: number;
  capacityScore: number;
  cacheTtlSeconds: number;
}

export function deriveLaneIntelligence(volatilityIndex = 0, capacityScore = 0): LaneIntelligence {
  const normalizedVolatility = Math.max(0, Number(volatilityIndex || 0));
  const normalizedCapacity = Math.max(0, Number(capacityScore || 0));
  const highVolatility = normalizedVolatility >= 65;
  const ttl = highVolatility
    ? Math.max(900, Math.floor(env.ROUTE_CACHE_TTL_SECONDS / 4))
    : env.ROUTE_CACHE_TTL_SECONDS;

  return {
    volatilityIndex: normalizedVolatility,
    capacityScore: normalizedCapacity,
    cacheTtlSeconds: ttl,
  };
}
