import { getSettings, updateSettings } from './settings.service.js';

export async function handleGetSettings(req, res, next) {
  try { res.json(await getSettings(req.tenantId)); } catch (err) { next(err); }
}

export async function handleUpdateSettings(req, res, next) {
  try { res.json(await updateSettings(req.tenantId, req.body || {}, req.user.sub)); } catch (err) { next(err); }
}
