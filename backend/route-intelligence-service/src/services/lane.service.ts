import { db } from '../config/database';

export interface PersistRouteInput {
  laneId: string;
  origin: string;
  destination: string;
  actualMiles: number;
  billableMiles: number;
  durationHours: number;
  polyline: string;
  method: string;
  volatilityIndex: number;
  capacityScore: number;
}

export async function persistLaneAndRoute(input: PersistRouteInput): Promise<void> {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `
      INSERT INTO lanes (
        id,
        origin,
        destination,
        avg_actual_miles,
        avg_billable_miles,
        volatility_index,
        capacity_score
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (id)
      DO UPDATE SET
        avg_actual_miles = ((lanes.avg_actual_miles + EXCLUDED.avg_actual_miles) / 2),
        avg_billable_miles = ((lanes.avg_billable_miles + EXCLUDED.avg_billable_miles) / 2),
        volatility_index = EXCLUDED.volatility_index,
        capacity_score = EXCLUDED.capacity_score
      `,
      [
        input.laneId,
        input.origin,
        input.destination,
        input.actualMiles,
        input.billableMiles,
        input.volatilityIndex,
        input.capacityScore,
      ]
    );

    await client.query(
      `
      INSERT INTO routes (
        lane_id,
        actual_miles,
        billable_miles,
        duration_hours,
        polyline,
        method
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        input.laneId,
        input.actualMiles,
        input.billableMiles,
        input.durationHours,
        input.polyline,
        input.method,
      ]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
