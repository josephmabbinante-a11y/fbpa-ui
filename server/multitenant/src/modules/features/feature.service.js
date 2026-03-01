import { query } from '../../config/database.js';

export async function getFeatures(tenantId) {
  const result = await query('SELECT * FROM tenant_features WHERE tenant_id = $1', [tenantId]);
  return result.rows;
}

export async function setFeature(tenantId, featureName, enabled) {
  const result = await query(
    `INSERT INTO tenant_features (tenant_id, feature_name, enabled)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, feature_name) DO UPDATE SET enabled = EXCLUDED.enabled
     RETURNING *`,
    [tenantId, featureName, enabled]
  );
  return result.rows[0];
}
