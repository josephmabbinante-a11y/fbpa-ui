import { AppError } from '../utils/errorHandler.js';

export function resolveTenant(req, _res, next) {
  const user = req.user;
  if (!user) return next(new AppError('User not authenticated', 401, 'UNAUTHORIZED'));

  if (user.role === 'SUPER_ADMIN' && req.impersonatedTenantId) {
    req.tenantId = req.impersonatedTenantId;
  } else if (user.role === 'SUPER_ADMIN') {
    req.tenantId = null;
  } else {
    if (!user.tenant_id) {
      return next(new AppError('User has no tenant assigned', 403, 'NO_TENANT'));
    }
    req.tenantId = user.tenant_id;
  }
  return next();
}

export function requireTenant(req, _res, next) {
  if (!req.tenantId) {
    return next(new AppError('Tenant context required. Use impersonation or log in as tenant user.', 403, 'NO_TENANT_CONTEXT'));
  }
  return next();
}
