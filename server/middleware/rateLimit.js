// Redis-backed rate limiters. Horizontally consistent across API instances.
//
//   • globalLimiter  — coarse per-IP cap on all `/api/*` traffic.
//   • authLimiter    — strict per-IP+email cap on login/register/reset.
//   • aiLimiter      — per-user cap on /ai/chat and ingestion endpoints.
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../db/redis.js';
import { env } from '../config/env.js';

function build({ windowMs, max, keyPrefix, keyGenerator }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator,
    store: new RedisStore({
      // ioredis is compatible with rate-limit-redis's `sendCommand` interface.
      sendCommand: (...args) => redis.call(...args),
      prefix: `rl:${keyPrefix}:`,
    }),
    message: { error: 'Too many requests', code: 'RATE_LIMITED' },
  });
}

export const globalLimiter = build({
  windowMs: 60_000,
  max: env.RATE_LIMIT_GLOBAL_RPM,
  keyPrefix: 'global',
  keyGenerator: (req) => req.ip,
});

export const authLimiter = build({
  windowMs: 60_000,
  max: env.RATE_LIMIT_AUTH_RPM,
  keyPrefix: 'auth',
  // Key by IP + (optional) email so credential-stuffing across IPs still gets
  // throttled per-account.
  keyGenerator: (req) => `${req.ip}:${(req.body?.email ?? '').toLowerCase()}`,
});

export const aiLimiter = build({
  windowMs: 60_000,
  max: env.RATE_LIMIT_AI_RPM,
  keyPrefix: 'ai',
  keyGenerator: (req) => req.user?.id ?? req.ip,
});
