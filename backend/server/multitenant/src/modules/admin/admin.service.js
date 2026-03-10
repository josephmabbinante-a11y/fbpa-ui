import { query } from '../../config/database.js';

export async function logAdminActivity({ adminUserId, tenantId, action, entity, entityId }) {
  await query(
    'INSERT INTO admin_activity_log (admin_user_id, tenant_id, action, entity, entity_id) VALUES ($1,$2,$3,$4,$5)',
    [adminUserId, tenantId || null, action, entity || null, entityId || null]
  );
}

export async function getActivityLog(tenantId) {
  const result = await query(
    'SELECT * FROM admin_activity_log WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 200',
    [tenantId]
  );
  return result.rows;
}

export async function getAllActivityLog() {
  const result = await query('SELECT * FROM admin_activity_log ORDER BY created_at DESC LIMIT 500');
  return result.rows;
}
