// ============================================================================
// Feature flags module — routes
// ============================================================================
import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  createFlagSchema,
  updateFlagSchema,
  listFlagsSchema,
  flagKeySchema,
} from './feature-flags.validators.js';
import {
  createFlag,
  updateFlag,
  deleteFlag,
  listFlags,
  getFlagByKey,
  isFlagEnabled,
} from './feature-flags.service.js';

const router = express.Router();

// GET /feature-flags/check/:key - Check if a flag is enabled for current user
router.get(
  '/check/:key',
  requireAuth,
  validate({ params: flagKeySchema }),
  async (req, res, next) => {
    try {
      const enabled = await isFlagEnabled(req.params.key, req.user);
      res.json({ key: req.params.key, enabled });
    } catch (err) {
      next(err);
    }
  }
);

// GET /feature-flags - List all flags (admin only)
router.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate({ query: listFlagsSchema }),
  async (req, res, next) => {
    try {
      const result = await listFlags(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /feature-flags/:key - Get specific flag (admin only)
router.get(
  '/:key',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: flagKeySchema }),
  async (req, res, next) => {
    try {
      const flag = await getFlagByKey(req.params.key);
      if (!flag) {
        return res.status(404).json({ error: 'Flag not found' });
      }
      res.json(flag);
    } catch (err) {
      next(err);
    }
  }
);

// POST /feature-flags - Create a new flag (admin only)
router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate({ body: createFlagSchema }),
  async (req, res, next) => {
    try {
      const flag = await createFlag(req.user.id, req.body);
      res.status(201).json(flag);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /feature-flags/:key - Update a flag (admin only)
router.patch(
  '/:key',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: flagKeySchema, body: updateFlagSchema }),
  async (req, res, next) => {
    try {
      const flag = await updateFlag(req.user.id, req.params.key, req.body);
      res.json(flag);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /feature-flags/:key - Delete a flag (admin only)
router.delete(
  '/:key',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: flagKeySchema }),
  async (req, res, next) => {
    try {
      await deleteFlag(req.user.id, req.params.key);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
