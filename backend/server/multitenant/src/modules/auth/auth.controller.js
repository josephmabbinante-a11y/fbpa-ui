import { login, impersonate } from './auth.service.js';
import { AppError } from '../../utils/errorHandler.js';

export async function handleLogin(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) throw new AppError('Email and password required', 400, 'VALIDATION_ERROR');
    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleImpersonate(req, res, next) {
  try {
    const { tenantId } = req.body || {};
    if (!tenantId) throw new AppError('tenantId required', 400, 'VALIDATION_ERROR');
    const result = await impersonate(req.user.sub, tenantId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
