import { createTenant, listTenants, getTenant, updateTenantStatus } from './tenant.service.js';
import { AppError } from '../../utils/errorHandler.js';

export async function handleCreateTenant(req, res, next) {
  try {
    const { name } = req.body || {};
    if (!name) throw new AppError('name required', 400, 'VALIDATION_ERROR');
    res.status(201).json(await createTenant(name));
  } catch (err) { next(err); }
}

export async function handleListTenants(req, res, next) {
  try { res.json(await listTenants()); } catch (err) { next(err); }
}

export async function handleGetTenant(req, res, next) {
  try { res.json(await getTenant(req.params.id)); } catch (err) { next(err); }
}

export async function handleUpdateTenantStatus(req, res, next) {
  try {
    const { status } = req.body || {};
    if (!status) throw new AppError('status required', 400, 'VALIDATION_ERROR');
    res.json(await updateTenantStatus(req.params.id, status));
  } catch (err) { next(err); }
}
