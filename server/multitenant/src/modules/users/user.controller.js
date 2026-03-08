import { createUser, listUsers, getUser } from './user.service.js';
import { AppError } from '../../utils/errorHandler.js';

export async function handleCreateUser(req, res, next) {
  try {
    const { email, password, role } = req.body || {};
    if (!email || !password || !role) throw new AppError('email, password, role required', 400, 'VALIDATION_ERROR');
    res.status(201).json(await createUser({ email, password, role, tenantId: req.tenantId }));
  } catch (err) { next(err); }
}

export async function handleListUsers(req, res, next) {
  try { res.json(await listUsers(req.tenantId)); } catch (err) { next(err); }
}

export async function handleGetUser(req, res, next) {
  try { res.json(await getUser(req.params.id, req.tenantId)); } catch (err) { next(err); }
}
