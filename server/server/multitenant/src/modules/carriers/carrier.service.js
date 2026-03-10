import { query } from '../../config/database.js';
import { AppError } from '../../utils/errorHandler.js';

export async function createCarrier(tenantId, data) {
  const { company_name, mc_number, insurance_status } = data;
  if (!company_name) throw new AppError('company_name required', 400, 'VALIDATION_ERROR');
  const result = await query(
    'INSERT INTO carriers (tenant_id, company_name, mc_number, insurance_status) VALUES ($1,$2,$3,$4) RETURNING *',
    [tenantId, company_name, mc_number || null, insurance_status || 'unknown']
  );
  return result.rows[0];
}

export async function approveCarrier(id, tenantId) {
  const result = await query(
    'UPDATE carriers SET approved = true WHERE id = $1 AND tenant_id = $2 RETURNING *',
    [id, tenantId]
  );
  if (!result.rows[0]) throw new AppError('Carrier not found', 404, 'NOT_FOUND');
  return result.rows[0];
}

export async function listCarriers(tenantId) {
  const result = await query('SELECT * FROM carriers WHERE tenant_id = $1 ORDER BY created_at DESC', [tenantId]);
  return result.rows;
}
