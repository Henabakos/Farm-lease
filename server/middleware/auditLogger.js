// Lightweight request-level audit logger.
//
// Records every state-mutating HTTP request (non-GET) with a successful (2xx)
// response. Fine-grained domain events (e.g. "AGREEMENT_SIGNED") are written
// from within the relevant service via the audit module — this middleware is
// only the coarse fallback so nothing slips through.
//
// Writes are fire-and-forget; failure to audit never blocks the response.
import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';

const SKIP_PATHS = new Set(['/api/health', '/healthz', '/readyz']);

export function auditLogger() {
  return (req, res, next) => {
    if (req.method === 'GET' || SKIP_PATHS.has(req.path)) return next();

    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      const userId = req.user?.id ?? null;
      // Strip secrets from the captured body before persistence.
      const safeBody = sanitize(req.body);

      prisma.auditLog
        .create({
          data: {
            userId,
            action: `${req.method} ${req.route?.path ?? req.path}`,
            entityType: req.path.split('/')[2] ?? null,
            changes: safeBody,
            ipAddress: req.ip,
            userAgent: req.get('user-agent') ?? null,
          },
        })
        .catch((err) => logger.error({ err }, 'audit log write failed'));
    });

    next();
  };
}

const REDACT_KEYS = ['password', 'token', 'refreshToken', 'accessToken', 'secret', 'apiKey'];

function sanitize(value) {
  if (value == null || typeof value !== 'object') return value ?? null;
  if (Array.isArray(value)) return value.map(sanitize);
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = REDACT_KEYS.includes(k) ? '[REDACTED]' : sanitize(v);
  }
  return out;
}
