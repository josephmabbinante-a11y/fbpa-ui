import { query } from '../../config/database.js';
import { AppError } from '../../utils/errorHandler.js';
import { createNotificationsForLoadPosted } from '../notifications/notification.service.js';

export async function createLoad(tenantId, data) {
  const { reference_number, origin, destination, equipment_type, pickup_date, delivery_date, target_rate, bidding_enabled } = data;
  if (!origin || !destination) throw new AppError('origin and destination required', 400, 'VALIDATION_ERROR');
  const result = await query(
    `INSERT INTO loads (tenant_id, reference_number, origin, destination, equipment_type, pickup_date, delivery_date, target_rate, bidding_enabled)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [tenantId, reference_number || null, origin, destination, equipment_type || null, pickup_date || null, delivery_date || null, target_rate || null, bidding_enabled !== false]
  );
  return result.rows[0];
}

export async function listLoads(tenantId) {
  const result = await query('SELECT * FROM loads WHERE tenant_id = $1 ORDER BY created_at DESC', [tenantId]);
  return result.rows;
}

export async function getLoad(id, tenantId) {
  const result = await query('SELECT * FROM loads WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  if (!result.rows[0]) throw new AppError('Load not found', 404, 'NOT_FOUND');
  return result.rows[0];
}

export async function updateLoad(id, tenantId, data) {
  const load = await getLoad(id, tenantId);
  if (load.status === 'awarded' || load.status === 'covered') {
    throw new AppError('Cannot update awarded or covered load', 400, 'INVALID_STATE');
  }
  const { origin, destination, equipment_type, pickup_date, delivery_date, target_rate, reference_number } = data;
  const result = await query(
    `UPDATE loads SET
      origin = COALESCE($1, origin),
      destination = COALESCE($2, destination),
      equipment_type = COALESCE($3, equipment_type),
      pickup_date = COALESCE($4, pickup_date),
      delivery_date = COALESCE($5, delivery_date),
      target_rate = COALESCE($6, target_rate),
      reference_number = COALESCE($7, reference_number)
     WHERE id = $8 AND tenant_id = $9 RETURNING *`,
    [origin, destination, equipment_type, pickup_date, delivery_date, target_rate, reference_number, id, tenantId]
  );
  return result.rows[0];
}

export async function postLoad(id, tenantId) {
  const load = await getLoad(id, tenantId);
  if (load.status !== 'draft') throw new AppError('Only draft loads can be posted', 400, 'INVALID_STATE');
  const result = await query(
    "UPDATE loads SET status = 'posted' WHERE id = $1 AND tenant_id = $2 RETURNING *",
    [id, tenantId]
  );
  const updated = result.rows[0];
  await createNotificationsForLoadPosted(updated);
  return updated;
}

export async function awardLoad(id, tenantId, carrierId, bidId) {
  const result = await query(
    "UPDATE loads SET status = 'awarded' WHERE id = $1 AND tenant_id = $2 AND status = 'posted' RETURNING *",
    [id, tenantId]
  );
  if (!result.rows[0]) throw new AppError('Load not found or not in posted state', 400, 'INVALID_STATE');
  return result.rows[0];
}
