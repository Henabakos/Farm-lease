import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { PERMISSIONS } from '../rbac/permissions.js';
import * as s from './proposals.service.js';
import * as v from './proposals.validators.js';

const router = Router();
router.use(requireAuth);

router.get('/',
  validate({ query: v.listProposalsQuery }),
  asyncHandler(async (req, res) => res.json(await s.list(req.query, req.user))),
);

router.get('/:id',
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.getById(req.params.id, req.user))),
);

router.get('/:id/history',
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.history(req.params.id, req.user))),
);

router.post('/',
  requirePermission(PERMISSIONS.PROPOSAL_CREATE),
  validate({ body: v.createProposalSchema }),
  asyncHandler(async (req, res) => res.status(201).json(await s.create(req.body, req.user))),
);

router.put('/:id',
  validate({ params: v.uuidParam, body: v.updateProposalSchema }),
  asyncHandler(async (req, res) => res.json(await s.update(req.params.id, req.body, req.user))),
);

router.post('/:id/publish',
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.publish(req.params.id, req.user))),
);

router.post('/:id/accept',
  requirePermission(PERMISSIONS.PROPOSAL_ACCEPT),
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.accept(req.params.id, req.user))),
);

router.post('/:id/reject',
  requirePermission(PERMISSIONS.PROPOSAL_REJECT),
  validate({ params: v.uuidParam, body: v.rejectSchema }),
  asyncHandler(async (req, res) => res.json(await s.reject(req.params.id, req.body, req.user))),
);

router.post('/:id/negotiate',
  requirePermission(PERMISSIONS.PROPOSAL_NEGOTIATE),
  validate({ params: v.uuidParam, body: v.negotiateSchema }),
  asyncHandler(async (req, res) => res.status(201).json(await s.negotiate(req.params.id, req.body, req.user))),
);

export default router;
