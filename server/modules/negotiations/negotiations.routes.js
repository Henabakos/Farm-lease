import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { PERMISSIONS } from '../rbac/permissions.js';
import * as proposals from '../proposals/proposals.service.js';
import { negotiateSchema } from '../proposals/proposals.validators.js';

const router = Router();
router.use(requireAuth);

const proposalParam = z.object({ proposalId: z.string().uuid() });

router.get('/:proposalId/messages',
  validate({ params: proposalParam }),
  asyncHandler(async (req, res) => res.json(await proposals.negotiations(req.params.proposalId, req.user))),
);

router.post('/:proposalId/messages',
  requirePermission(PERMISSIONS.PROPOSAL_NEGOTIATE),
  validate({ params: proposalParam, body: negotiateSchema }),
  asyncHandler(async (req, res) => res.status(201).json(await proposals.negotiate(req.params.proposalId, req.body, req.user))),
);

export default router;
