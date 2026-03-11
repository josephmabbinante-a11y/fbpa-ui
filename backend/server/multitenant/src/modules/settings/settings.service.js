import { query } from '../../config/database.js';
import { AppError } from '../../utils/errorHandler.js';
import { logAdminActivity } from '../admin/admin.service.js';

export async function getSettings(tenantId) {
  const result = await query('SELECT * FROM tenant_settings WHERE tenant_id = $1', [tenantId]);
  if (!result.rows[0]) throw new AppError('Settings not found', 404, 'NOT_FOUND');
  return result.rows[0];
}

export async function updateSettings(tenantId, data, actorUserId) {
  const allowed = ['loadboard_enabled', 'bidding_enabled', 'bid_expiration_hours', 'email_notifications', 'sms_notifications'];
  const sets = [];
  const values = [];
  let i = 1;
  for (const key of allowed) {
    if (data[key] !== undefined) {
      sets.push(`${key} = $${i++}`);
      values.push(data[key]);
    }
  }
  if (!sets.length) throw new AppError('No valid fields to update', 400, 'VALIDATION_ERROR');
  sets.push('updated_at = NOW()');
  values.push(tenantId);

  const result = await query(
    `UPDATE tenant_settings SET ${sets.join(', ')} WHERE tenant_id = $${i} RETURNING *`,
    values
  );
  if (!result.rows[0]) throw new AppError('Settings not found', 404, 'NOT_FOUND');

  await logAdminActivity({ adminUserId: actorUserId, tenantId, action: 'UPDATE_SETTINGS', entity: 'tenant_settings', entityId: tenantId });
  return result.rows[0];
}
