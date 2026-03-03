import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
});

redis.on('error', (error) => {
  console.error('[redis] error', error.message);
});
