import { query } from '../config/database.js';
import { AppError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';

export async function startImpersonation(req, _res, next) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') return next();

  const tenantId = req.headers['x-impersonate-tenant'];
  if (!tenantId) return next();

  try {
    const result = await query('SELECT id FROM tenants WHERE id = $1', [tenantId]);
    if (!result.rows[0]) {
      return next(new AppError('Tenant not found for impersonation', 404, 'TENANT_NOT_FOUND'));
    }
    req.impersonatedTenantId = tenantId;
    logger.info('Super admin impersonation', { adminId: req.user.sub, tenantId });
    return next();
  } catch (err) {
    return next(err);
  }
}
