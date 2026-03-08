import bcrypt from 'bcryptjs';
import { query } from '../../config/database.js';
import { AppError } from '../../utils/errorHandler.js';

export async function createUser({ email, password, role, tenantId }) {
  if (role !== 'SUPER_ADMIN' && !tenantId) {
    throw new AppError('tenant_id required for non-super-admin users', 400, 'VALIDATION_ERROR');
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows[0]) throw new AppError('Email already in use', 409, 'CONFLICT');

  const password_hash = await bcrypt.hash(password, 12);
  const result = await query(
    'INSERT INTO users (email, password_hash, tenant_id, role) VALUES ($1, $2, $3, $4) RETURNING id, email, tenant_id, role, created_at',
    [email.toLowerCase(), password_hash, tenantId || null, role]
  );
  return result.rows[0];
}

export async function listUsers(tenantId) {
  const result = await query(
    'SELECT id, email, tenant_id, role, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId]
  );
  return result.rows;
}

export async function getUser(id, tenantId) {
  const result = await query(
    'SELECT id, email, tenant_id, role, created_at FROM users WHERE id = $1 AND tenant_id = $2',
    [id, tenantId]
  );
  if (!result.rows[0]) throw new AppError('User not found', 404, 'NOT_FOUND');
  return result.rows[0];
}
