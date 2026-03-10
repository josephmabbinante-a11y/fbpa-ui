import { AppError } from '../utils/errorHandler.js';

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('Not authenticated', 401, 'UNAUTHORIZED'));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Access denied. Required role: ${roles.join(' or ')}`, 403, 'FORBIDDEN'));
    }
    return next();
  };
}

export const isSuperAdmin = requireRole('SUPER_ADMIN');
export const isTenantAdmin = requireRole('SUPER_ADMIN', 'TENANT_ADMIN');
export const isOpsOrAbove = requireRole('SUPER_ADMIN', 'TENANT_ADMIN', 'OPS');
