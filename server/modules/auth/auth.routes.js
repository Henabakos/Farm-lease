// Auth router. Mounted at /api/v1/auth (and /api/auth for legacy alias).
//
// Authenticated routes use requireAuth; unauthenticated routes are protected
// by the stricter authLimiter rate-limit bucket so credential-stuffing
// attempts are bounded per IP+email regardless of which endpoint is targeted.
import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import * as v from './auth.validators.js';
import * as c from './auth.controller.js';

const router = Router();

router.post('/register',         authLimiter, validate({ body: v.registerSchema }),               c.register);
router.post('/login',            authLimiter, validate({ body: v.loginSchema }),                  c.login);
router.post('/refresh',          authLimiter, validate({ body: v.refreshSchema }),                c.refresh);
router.post('/logout',                                                                            c.logout);
router.get( '/me',               requireAuth,                                                     c.me);

router.post('/verify-email',         authLimiter, validate({ body: v.verifyEmailSchema }),            c.verifyEmail);
router.post('/resend-verification',  authLimiter, validate({ body: v.requestPasswordResetSchema }), c.resendVerification);
router.post('/forgot-password',  authLimiter, validate({ body: v.requestPasswordResetSchema }),   c.requestPasswordReset);
router.post('/reset-password',   authLimiter, validate({ body: v.resetPasswordSchema }),          c.resetPassword);
router.post('/change-password',  requireAuth, validate({ body: v.changePasswordSchema }),        c.changePassword);

export default router;
