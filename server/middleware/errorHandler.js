// Single point of error → HTTP translation.
// Contract preserved from the frontend's expectation: `{ error: string }`,
// with additional non-breaking fields (`code`, `details`, `requestId`).
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../shared/errors.js';
import { logger } from '../utils/logger.js';
import { isProd } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found', code: 'ROUTE_NOT_FOUND' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // ---- Map known error shapes to AppError -------------------------------
  let normalized = err;

  if (err instanceof ZodError) {
    normalized = new ValidationError(
      'Validation failed',
      err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    );
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      normalized = new AppError('Resource already exists', {
        status: 409,
        code: 'UNIQUE_VIOLATION',
        details: err.meta,
      });
    } else if (err.code === 'P2025') {
      normalized = new AppError('Resource not found', { status: 404, code: 'NOT_FOUND' });
    } else if (err.code === 'P2003') {
      normalized = new AppError('Foreign key constraint failed', {
        status: 409,
        code: 'FK_VIOLATION',
        details: err.meta,
      });
    }
  } else if (!(err instanceof AppError)) {
    // Unknown error — wrap. Never leak the original message in prod.
    normalized = new AppError(isProd ? 'Internal server error' : err.message, {
      status: 500,
      code: 'INTERNAL_ERROR',
    });
  }

  const { status, code, message, details, expose } = normalized;
  const statusCode = status || 500; // Fallback to 500 if status is undefined

  // ---- Log -------------------------------------------------------------
  const logPayload = {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    status: statusCode,
    code,
    userId: req.user?.id,
  };
  if (statusCode >= 500) {
    logger.error({ ...logPayload, err }, 'request failed');
  } else {
    logger.warn(logPayload, 'request rejected');
  }

  // ---- Respond ---------------------------------------------------------
  res.status(statusCode).json({
    error: expose ? message : 'Internal server error',
    code: code || 'INTERNAL_ERROR',
    ...(details !== undefined ? { details } : {}),
    requestId: req.id,
  });
}
