// ============================================================================
// Contract templates module — routes
// ============================================================================
import express from 'express';
import { requireAuth, requireEmailVerified } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import {
  createTemplateSchema,
  createTemplateVersionSchema,
  updateTemplateSchema,
  listTemplatesSchema,
  templateIdParamsSchema,
  versionParamsSchema,
  templateClauseParamsSchema,
  clauseIdParamsSchema,
  compareVersionsSchema,
  createClauseSchema,
  updateClauseSchema,
  listClausesSchema,
  clauseCategoryParamsSchema,
  addTemplateClauseSchema,
  reorderTemplateClauseSchema,
} from './contract-templates.validators.js';
import * as s from './contract-templates.service.js';

const router = express.Router();
router.use(requireAuth);
router.use(requireEmailVerified);

// ============================================================================
// Clauses (catalog) — defined BEFORE /:id to avoid route collisions.
// ============================================================================

router.get(
  '/clauses/list/all',
  requireAuth,
  validate({ query: listClausesSchema }),
  asyncHandler(async (req, res) => res.json(await s.listClauses(req.query))),
);

router.get(
  '/clauses/category/:category',
  requireAuth,
  validate({ params: clauseCategoryParamsSchema }),
  asyncHandler(async (req, res) =>
    res.json(await s.listClausesByCategory(req.params.category)),
  ),
);

router.post(
  '/clauses',
  requireAuth,
  requireRole('ADMIN'),
  validate({ body: createClauseSchema }),
  asyncHandler(async (req, res) =>
    res.status(201).json(await s.createClause(req.user.id, req.body)),
  ),
);

router.patch(
  '/clauses/:clauseId',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: clauseIdParamsSchema, body: updateClauseSchema }),
  asyncHandler(async (req, res) =>
    res.json(await s.updateClause(req.user.id, req.params.clauseId, req.body)),
  ),
);

router.delete(
  '/clauses/:clauseId',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: clauseIdParamsSchema }),
  asyncHandler(async (req, res) =>
    res.json(await s.deleteClause(req.user.id, req.params.clauseId)),
  ),
);

// ============================================================================
// Templates
// ============================================================================

router.get(
  '/',
  requireAuth,
  validate({ query: listTemplatesSchema }),
  asyncHandler(async (req, res) => res.json(await s.listTemplates(req.query))),
);

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate({ body: createTemplateSchema }),
  asyncHandler(async (req, res) =>
    res.status(201).json(await s.createTemplate(req.user.id, req.body)),
  ),
);

router.get(
  '/:id',
  requireAuth,
  validate({ params: templateIdParamsSchema }),
  asyncHandler(async (req, res) =>
    res.json(await s.getTemplateById(req.user.id, req.params.id)),
  ),
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: templateIdParamsSchema, body: updateTemplateSchema }),
  asyncHandler(async (req, res) =>
    res.json(await s.updateTemplate(req.user.id, req.params.id, req.body)),
  ),
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: templateIdParamsSchema }),
  asyncHandler(async (req, res) =>
    res.json(await s.deleteTemplate(req.user.id, req.params.id)),
  ),
);

// ============================================================================
// Versions (nested under template)
// ============================================================================

router.post(
  '/:id/versions',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: templateIdParamsSchema, body: createTemplateVersionSchema }),
  asyncHandler(async (req, res) =>
    res
      .status(201)
      .json(await s.createTemplateVersion(req.user.id, req.params.id, req.body)),
  ),
);

router.get(
  '/:id/versions/:versionId',
  requireAuth,
  validate({ params: versionParamsSchema }),
  asyncHandler(async (req, res) =>
    res.json(
      await s.getVersionById(req.user.id, req.params.id, req.params.versionId),
    ),
  ),
);

router.post(
  '/:id/versions/:versionId/publish',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: versionParamsSchema }),
  asyncHandler(async (req, res) =>
    res.json(
      await s.publishVersion(req.user.id, req.params.id, req.params.versionId),
    ),
  ),
);

// Compare two versions of a template by version number.
router.post(
  '/:id/compare-versions',
  requireAuth,
  validate({ params: templateIdParamsSchema, body: compareVersionsSchema }),
  asyncHandler(async (req, res) =>
    res.json(
      await s.compareVersions(
        req.params.id,
        req.body.version1,
        req.body.version2,
      ),
    ),
  ),
);

// ============================================================================
// Template-version clauses (join)
// ============================================================================

router.get(
  '/:id/versions/:versionId/clauses',
  requireAuth,
  validate({ params: versionParamsSchema }),
  asyncHandler(async (req, res) =>
    res.json(
      await s.listTemplateClauses(req.params.id, req.params.versionId),
    ),
  ),
);

router.post(
  '/:id/versions/:versionId/clauses',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: versionParamsSchema, body: addTemplateClauseSchema }),
  asyncHandler(async (req, res) =>
    res
      .status(201)
      .json(
        await s.addTemplateClause(
          req.params.id,
          req.params.versionId,
          req.body,
        ),
      ),
  ),
);

router.patch(
  '/:id/versions/:versionId/clauses/:templateClauseId',
  requireAuth,
  requireRole('ADMIN'),
  validate({
    params: templateClauseParamsSchema,
    body: reorderTemplateClauseSchema,
  }),
  asyncHandler(async (req, res) =>
    res.json(
      await s.updateTemplateClause(
        req.params.id,
        req.params.versionId,
        req.params.templateClauseId,
        req.body,
      ),
    ),
  ),
);

router.delete(
  '/:id/versions/:versionId/clauses/:templateClauseId',
  requireAuth,
  requireRole('ADMIN'),
  validate({ params: templateClauseParamsSchema }),
  asyncHandler(async (req, res) =>
    res.json(
      await s.removeTemplateClause(
        req.params.id,
        req.params.versionId,
        req.params.templateClauseId,
      ),
    ),
  ),
);

export default router;
