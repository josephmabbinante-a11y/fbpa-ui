import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { AppError } from '../utils/errorHandler.js';

export function authenticate(req, _res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Missing or invalid authorization header', 401, 'UNAUTHORIZED'));
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, ENV.JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    return next(new AppError('Invalid or expired token', 401, 'TOKEN_INVALID'));
  }
}
