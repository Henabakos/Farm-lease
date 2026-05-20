// Centralized pino logger. Always use this instead of console.* so we get
// structured JSON logs in prod. Redacts credentials automatically.
import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.refreshToken',
      '*.accessToken',
      '*.token',
      '*.apiKey',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
  base: { service: 'farm-lease-api' },
});

export const child = (bindings) => logger.child(bindings);
