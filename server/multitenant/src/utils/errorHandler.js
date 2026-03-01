import { logger } from './logger.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }
  logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.originalUrl });
  return res.status(500).json({ error: 'Internal server error' });
}
