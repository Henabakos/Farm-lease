// Centralized pino logger. Always use this instead of console.* so we get
// structured JSON logs in prod and pretty output in dev, plus automatic
// redaction of credentials.
import pino from 'pino';
import { env, isDev } from '../config/env.js';

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
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l', singleLine: false },
      }
    : undefined,
  base: { service: 'farm-lease-api' },
});

export const child = (bindings) => logger.child(bindings);
