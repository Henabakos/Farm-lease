// ============================================================================
// Domain / application error hierarchy.
//
// Throw these from services and controllers — never raw Error. The global
// errorHandler middleware maps them to HTTP responses with a stable shape:
//   { error: string, code: string, details?: any }
//
// Adding a new error class? Set:
//   - `status`  : HTTP status code
//   - `code`    : machine-readable identifier (UPPER_SNAKE)
// ============================================================================

export class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
    this.expose = status < 500; // safe to send `message` to client
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details) {
    super(message, { status: 400, code: 'VALIDATION_ERROR', details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, { status: 401, code });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, { status: 403, code });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found', code = 'NOT_FOUND') {
    super(message, { status: 404, code });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT', details) {
    super(message, { status: 409, code, details });
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, { status: 429, code: 'RATE_LIMITED' });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, message = 'External service failed', details) {
    super(`${service}: ${message}`, { status: 502, code: 'EXTERNAL_SERVICE_ERROR', details });
  }
}
