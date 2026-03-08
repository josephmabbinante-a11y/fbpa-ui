import { query } from '../config/database.js';
import { AppError } from '../utils/errorHandler.js';

export function requireFeature(featureName) {
  return async (req, _res, next) => {
    const tenantId = req.tenantId;
    if (!tenantId) return next(); // Super admin bypasses feature checks

    try {
      const result = await query(
        'SELECT enabled FROM tenant_features WHERE tenant_id = $1 AND feature_name = $2',
        [tenantId, featureName]
      );
      const row = result.rows[0];
      if (!row || !row.enabled) {
        return next(new AppError(`Feature '${featureName}' is not enabled for this tenant`, 403, 'FEATURE_DISABLED'));
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}
