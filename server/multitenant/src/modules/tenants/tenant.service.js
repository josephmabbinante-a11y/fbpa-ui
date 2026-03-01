import { query } from '../../config/database.js';
import { AppError } from '../../utils/errorHandler.js';

const DEFAULT_FEATURES = [
  'internal_load_board',
  'bidding',
  'sms_notifications',
  'advanced_rate_logic',
];

export async function createTenant(name) {
  const result = await query(
    'INSERT INTO tenants (name) VALUES ($1) RETURNING *',
    [name]
  );
  const tenant = result.rows[0];

  await query('INSERT INTO tenant_settings (tenant_id) VALUES ($1)', [tenant.id]);

  for (const feature of DEFAULT_FEATURES) {
    await query(
      'INSERT INTO tenant_features (tenant_id, feature_name, enabled) VALUES ($1, $2, true)',
      [tenant.id, feature]
    );
  }

  return tenant;
}

export async function listTenants() {
  const result = await query('SELECT * FROM tenants ORDER BY created_at DESC');
  return result.rows;
}

export async function getTenant(id) {
  const result = await query('SELECT * FROM tenants WHERE id = $1', [id]);
  if (!result.rows[0]) throw new AppError('Tenant not found', 404, 'NOT_FOUND');
  return result.rows[0];
}

export async function updateTenantStatus(id, status) {
  const result = await query(
    'UPDATE tenants SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  if (!result.rows[0]) throw new AppError('Tenant not found', 404, 'NOT_FOUND');
  return result.rows[0];
}
