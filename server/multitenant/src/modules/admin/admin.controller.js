import { setFeature, getFeatures } from '../features/feature.service.js';
import { updateSettings } from '../settings/settings.service.js';
import { getActivityLog, getAllActivityLog, logAdminActivity } from './admin.service.js';
import { AppError } from '../../utils/errorHandler.js';

export async function handleToggleFeature(req, res, next) {
  try {
    const { featureName, enabled } = req.body || {};
    if (!featureName || enabled === undefined) throw new AppError('featureName and enabled required', 400, 'VALIDATION_ERROR');
    const feature = await setFeature(req.params.tenantId, featureName, enabled);
    await logAdminActivity({
      adminUserId: req.user.sub,
      tenantId: req.params.tenantId,
      action: enabled ? 'ENABLE_FEATURE' : 'DISABLE_FEATURE',
      entity: 'tenant_features',
      entityId: req.params.tenantId,
    });
    res.json(feature);
  } catch (err) { next(err); }
}

export async function handleAdminUpdateSettings(req, res, next) {
  try {
    res.json(await updateSettings(req.params.tenantId, req.body || {}, req.user.sub));
  } catch (err) { next(err); }
}

export async function handleGetFeatures(req, res, next) {
  try { res.json(await getFeatures(req.params.tenantId)); } catch (err) { next(err); }
}

export async function handleGetActivityLog(req, res, next) {
  try {
    const { tenantId } = req.params;
    res.json(tenantId ? await getActivityLog(tenantId) : await getAllActivityLog());
  } catch (err) { next(err); }
}
