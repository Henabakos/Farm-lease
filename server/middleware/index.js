// ============================================================================
// DEPRECATED — Supabase-era middleware barrel.
//
// This module previously instantiated `supabase.auth.getUser(token)` on every
// request and hard-coupled middleware to Supabase. The Supabase backend has
// been removed; new middleware lives in dedicated files under `./` and is
// re-exported here for backwards compatibility with the legacy route files
// that still import `authMiddleware` / `errorHandler` / `auditLogger` /
// `rbacMiddleware` from this path.
//
// The legacy route files themselves are being rewritten module-by-module in
// Phase 5. Once that's complete, route imports should switch to the explicit
// per-file imports (`from './auth.js'` etc.) and this barrel can be deleted.
// ============================================================================

import { requireAuth, optionalAuth } from './auth.js';
import { requireRole, requirePermission } from './rbac.js';
import { auditLogger as auditLoggerFactory } from './auditLogger.js';
import { errorHandler as newErrorHandler, notFoundHandler } from './errorHandler.js';
import { validate } from './validate.js';

// Legacy names — keep export shape identical to the old module so existing
// imports continue to resolve until route files are migrated.
export const authMiddleware = requireAuth;
export const rbacMiddleware = (allowedRoles = []) => requireRole(...allowedRoles);
// Older callsites invoked `auditLogger(supabase)` and expected a middleware
// function back. We ignore the legacy `supabase` argument and return our
// Prisma-backed implementation.
export const auditLogger = () => auditLoggerFactory();
export const errorHandler = newErrorHandler;
export const validateRequest = (schema) =>
  validate({ body: schema?.body ?? schema });

export { requireAuth, optionalAuth, requireRole, requirePermission, notFoundHandler };
