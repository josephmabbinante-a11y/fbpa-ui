import { Pool } from 'pg';
import { env } from './env';

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

db.on('error', (error: Error) => {
  console.error('[postgres] error', error.message);
});

export async function ensureSchema(): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS lanes (
      id TEXT PRIMARY KEY,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      avg_actual_miles DOUBLE PRECISION,
      avg_billable_miles DOUBLE PRECISION,
      volatility_index DOUBLE PRECISION DEFAULT 0,
      capacity_score DOUBLE PRECISION DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS routes (
      id SERIAL PRIMARY KEY,
      lane_id TEXT REFERENCES lanes(id),
      actual_miles DOUBLE PRECISION,
      billable_miles DOUBLE PRECISION,
      duration_hours DOUBLE PRECISION,
      polyline TEXT,
      method TEXT DEFAULT 'here-truck',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}
