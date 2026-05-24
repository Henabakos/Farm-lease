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
  exportAuditLogsSchema,
  clearAuditLogsSchema,
  exportReportSchema,
  updateUserVerificationSchema,
  updateUserRoleSchema,
  unsuspendSchema,
  resetPasswordSchema,
} from './admin.validators.js';
import {
  updateUserStatus,
  approveUser,
  listUsers,
  listAuditLogs,
  exportAuditLogsCsv,
  clearAuditLogs,
  exportReport,
  getSystemStats,
  updateUserVerification,
  updateUserRole,
  unsuspendUser,
  resetUserPassword,
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

// GET /admin/audit-logs/export - Export audit logs as CSV
router.get(
  '/audit-logs/export',
  validate({ query: exportAuditLogsSchema }),
  async (req, res, next) => {
    try {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
      );

      for await (const chunk of exportAuditLogsCsv(req.query)) {
        res.write(chunk);
      }
      res.end();
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /admin/audit-logs - Clear audit logs before a date
router.delete(
  '/audit-logs',
  validate({ body: clearAuditLogsSchema }),
  async (req, res, next) => {
    try {
      const result = await clearAuditLogs(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /admin/report/export - Export report as CSV
router.get(
  '/report/export',
  validate({ query: exportReportSchema }),
  async (req, res, next) => {
    try {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${req.query.reportType.toLowerCase()}-report-${new Date().toISOString().split('T')[0]}.csv"`
      );

      for await (const chunk of exportReport(req.query)) {
        res.write(chunk);
      }
      res.end();
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

// PATCH /admin/users/:id/unsuspend - Unsuspend a suspended user
router.patch(
  '/users/:id/unsuspend',
  validate({ body: unsuspendSchema }),
  async (req, res, next) => {
    try {
      const { reason } = req.body;
      const user = await unsuspendUser(req.user.id, req.params.id, reason);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /admin/users/:id/password - Reset user password
router.patch(
  '/users/:id/password',
  validate({ body: resetPasswordSchema }),
  async (req, res, next) => {
    try {
      const { password } = req.body;
      const user = await resetUserPassword(req.user.id, req.params.id, password);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
