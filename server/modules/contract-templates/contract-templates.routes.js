// ============================================================================
// Contract templates module — routes
// ============================================================================
import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import {
  createTemplateSchema,
  createTemplateVersionSchema,
  updateTemplateSchema,
  publishVersionSchema,
  listTemplatesSchema,
  templateIdSchema,
} from './contract-templates.validators.js';
import {
  createTemplate,
  createTemplateVersion,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  publishVersion,
  listTemplates,
  getVersionById,
} from './contract-templates.service.js';

const router = express.Router();

// POST /contract-templates - Create a new template
router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate({ body: createTemplateSchema }),
  async (req, res, next) => {
    try {
      const template = await createTemplate(req.user.id, req.body);
      res.status(201).json(template);
    } catch (err) {
      next(err);
    }
  }
);

// GET /contract-templates - List templates
router.get(
  '/',
  requireAuth,
  validate({ query: listTemplatesSchema }),
  async (req, res, next) => {
    try {
      const result = await listTemplates(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /contract-templates/:id - Get template by ID
router.get(
  '/:id',
  requireAuth,
  validate({ params: templateIdSchema }),
  async (req, res, next) => {
    try {
      const template = await getTemplateById(req.user.id, req.params.id);
      res.json(template);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /contract-templates/:id - Update template
router.patch(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: templateIdSchema, body: updateTemplateSchema }),
  async (req, res, next) => {
    try {
      const template = await updateTemplate(req.user.id, req.params.id, req.body);
      res.json(template);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /contract-templates/:id - Delete template
router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: templateIdSchema }),
  async (req, res, next) => {
    try {
      await deleteTemplate(req.user.id, req.params.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /contract-templates/versions - Create a new version
router.post(
  '/versions',
  requireAuth,
  requireRole('ADMIN'),
  validate({ body: createTemplateVersionSchema }),
  async (req, res, next) => {
    try {
      const version = await createTemplateVersion(req.user.id, req.body);
      res.status(201).json(version);
    } catch (err) {
      next(err);
    }
  }
);

// POST /contract-templates/versions/:id/publish - Publish a version
router.post(
  '/versions/:id/publish',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: { id: 'string' } }),
  async (req, res, next) => {
    try {
      const version = await publishVersion(req.user.id, req.params.id);
      res.json(version);
    } catch (err) {
      next(err);
    }
  }
);

// GET /contract-templates/versions/:id - Get version by ID
router.get(
  '/versions/:id',
  requireAuth,
  validate({ params: { id: 'string' } }),
  async (req, res, next) => {
    try {
      const version = await getVersionById(req.user.id, req.params.id);
      res.json(version);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
