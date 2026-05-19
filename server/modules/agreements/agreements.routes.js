import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { PERMISSIONS } from '../rbac/permissions.js';
import * as s from './agreements.service.js';
import * as v from './agreements.validators.js';

const router = Router();
router.use(requireAuth);

router.get('/',
  validate({ query: v.listAgreementsQuery }),
  asyncHandler(async (req, res) => res.json(await s.list(req.query, req.user))),
);

router.get('/:id',
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.getById(req.params.id, req.user))),
);

router.post('/',
  requirePermission(PERMISSIONS.AGREEMENT_DRAFT),
  validate({ body: v.createAgreementSchema }),
  asyncHandler(async (req, res) => res.status(201).json(await s.create(req.body, req.user))),
);

router.put('/:id',
  validate({ params: v.uuidParam, body: v.updateAgreementSchema }),
  asyncHandler(async (req, res) => res.json(await s.update(req.params.id, req.body, req.user))),
);

router.post('/:id/sign',
  requirePermission(PERMISSIONS.AGREEMENT_SIGN),
  validate({ params: v.uuidParam, body: v.signAgreementSchema }),
  asyncHandler(async (req, res) => res.json(await s.sign(req.params.id, req.body, req.user))),
);

router.post('/:id/terminate',
  requirePermission(PERMISSIONS.AGREEMENT_TERMINATE),
  validate({ params: v.uuidParam, body: v.terminateSchema }),
  asyncHandler(async (req, res) => res.json(await s.terminate(req.params.id, req.body, req.user))),
);

export default router;
