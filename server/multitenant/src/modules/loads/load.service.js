import { Load } from './load.model.js';
import { AppError } from '../../utils/errorHandler.js';
import { createNotificationsForLoadPosted } from '../notifications/notification.service.js';

export async function createLoad(tenantId, data) {
  const { reference_number, origin, destination, equipment_type, pickup_date, delivery_date, target_rate, bidding_enabled } = data;
  if (!origin || !destination) throw new AppError('origin and destination required', 400, 'VALIDATION_ERROR');
  const load = new Load({
    tenant_id: tenantId,
    reference_number,
    origin,
    destination,
    equipment_type,
    pickup_date,
    delivery_date,
    target_rate,
    bidding_enabled: bidding_enabled !== false
  });
  await load.save();
  return load;
}

export async function listLoads(tenantId) {
  return await Load.find({ tenant_id: tenantId }).sort({ created_at: -1 });
}

export async function getLoad(id, tenantId) {
  const load = await Load.findOne({ _id: id, tenant_id: tenantId });
  if (!load) throw new AppError('Load not found', 404, 'NOT_FOUND');
  return load;
}

export async function updateLoad(id, tenantId, data) {
  const load = await getLoad(id, tenantId);
  if (load.status === 'awarded' || load.status === 'covered') {
    throw new AppError('Cannot update awarded or covered load', 400, 'INVALID_STATE');
  }
  const updates = {};
  ['origin', 'destination', 'equipment_type', 'pickup_date', 'delivery_date', 'target_rate', 'reference_number'].forEach(field => {
    if (data[field] !== undefined) updates[field] = data[field];
  });
  Object.assign(load, updates);
  await load.save();
  return load;
}

export async function postLoad(id, tenantId) {
  const load = await getLoad(id, tenantId);
  if (load.status !== 'draft') throw new AppError('Only draft loads can be posted', 400, 'INVALID_STATE');
  load.status = 'posted';
  await load.save();
  await createNotificationsForLoadPosted(load);
  return load;
}

export async function awardLoad(id, tenantId, carrierId, bidId) {
  const result = await query(
    "UPDATE loads SET status = 'awarded' WHERE id = $1 AND tenant_id = $2 AND status = 'posted' RETURNING *",
    [id, tenantId]
  );
  if (!result.rows[0]) throw new AppError('Load not found or not in posted state', 400, 'INVALID_STATE');
  return result.rows[0];
}
