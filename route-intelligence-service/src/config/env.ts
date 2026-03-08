import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: toNumber(process.env.PORT, 4010),
  HERE_API_KEY: requireEnv('HERE_API_KEY', 'demo-key'),
  REDIS_URL: requireEnv('REDIS_URL', 'redis://localhost:6379'),
  DATABASE_URL: requireEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/route_intelligence'),
  ROUTE_CACHE_TTL_SECONDS: toNumber(process.env.ROUTE_CACHE_TTL_SECONDS, 86400),
  RATE_LIMIT_WINDOW_MS: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  RATE_LIMIT_MAX_REQUESTS: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 120),
};
