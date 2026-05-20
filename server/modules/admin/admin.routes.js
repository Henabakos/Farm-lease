// ============================================================================
// Admin module — routes
// ============================================================================
import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  updateUserStatusSchema,
  approveUserSchema,
  listUsersSchema,
  listAuditLogsSchema,
  updateUserVerificationSchema,
  updateUserRoleSchema,
  updateUserActivationSchema,
} from './admin.validators.js';
import {
  updateUserStatus,
  approveUser,
  listUsers,
  listAuditLogs,
  getSystemStats,
  updateUserVerification,
  updateUserRole,
  updateUserActivation,
} from './admin.service.js';

const router = express.Router();

// All admin routes require ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

// GET /admin/stats - System statistics
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await getSystemStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// GET /admin/users - List users with filtering
router.get(
  '/users',
  validate({ query: listUsersSchema }),
  async (req, res, next) => {
    try {
      const result = await listUsers(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /admin/users/:id/status - Update user status
router.patch(
  '/users/:id/status',
  validate({ body: updateUserStatusSchema }),
  async (req, res, next) => {
    try {
      const { status, reason } = req.body;
      const user = await updateUserStatus(req.user.id, req.params.id, status, reason);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

// POST /admin/users/:id/approve - Approve a pending user
router.post(
  '/users/:id/approve',
  async (req, res, next) => {
    try {
      const user = await approveUser(req.user.id, req.params.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

// GET /admin/audit-logs - List audit logs
router.get(
  '/audit-logs',
  validate({ query: listAuditLogsSchema }),
  async (req, res, next) => {
    try {
      const result = await listAuditLogs(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /admin/users/:id/verification - Update user verification status
router.patch(
  '/users/:id/verification',
  validate({ body: updateUserVerificationSchema }),
  async (req, res, next) => {
    try {
      const { verificationStatus, reason } = req.body;
      const user = await updateUserVerification(req.user.id, req.params.id, verificationStatus, reason);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /admin/users/:id/role - Update user role
router.patch(
  '/users/:id/role',
  validate({ body: updateUserRoleSchema }),
  async (req, res, next) => {
    try {
      const { role } = req.body;
      const user = await updateUserRole(req.user.id, req.params.id, role);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /admin/users/:id/activation - Activate or deactivate user
router.patch(
  '/users/:id/activation',
  validate({ body: updateUserActivationSchema }),
  async (req, res, next) => {
    try {
      const { activate } = req.body;
      const user = await updateUserActivation(req.user.id, req.params.id, activate);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
