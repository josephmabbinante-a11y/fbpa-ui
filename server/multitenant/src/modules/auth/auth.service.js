import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/database.js';
import { ENV } from '../../config/env.js';
import { AppError } from '../../utils/errorHandler.js';
import { logAdminActivity } from '../admin/admin.service.js';

export async function login(email, password) {
  const result = await query(
    'SELECT id, email, password_hash, tenant_id, role FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  const user = result.rows[0];
  if (!user) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenant_id: user.tenant_id || null,
  };

  const accessToken = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });
  return { accessToken, user: { id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id } };
}

export async function impersonate(adminUserId, targetTenantId) {
  const tenantResult = await query('SELECT id, name FROM tenants WHERE id = $1', [targetTenantId]);
  const tenant = tenantResult.rows[0];
  if (!tenant) throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');

  await logAdminActivity({
    adminUserId,
    tenantId: targetTenantId,
    action: 'IMPERSONATE',
    entity: 'tenant',
    entityId: targetTenantId,
  });

  return { tenantId: tenant.id, tenantName: tenant.name };
}
