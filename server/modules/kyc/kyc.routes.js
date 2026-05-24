import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import * as s from './kyc.service.js';
import * as v from './kyc.validators.js';

const router = Router();
router.use(requireAuth);

// ----- User-facing -----
router.get('/me',
  asyncHandler(async (req, res) => res.json(await s.getMine(req.user))),
);

router.post('/documents',
  validate({ body: v.submitDocumentSchema }),
  asyncHandler(async (req, res) => res.status(201).json(await s.submitDocument(req.body, req.user))),
);

router.delete('/documents/:id',
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.deleteMine(req.params.id, req.user))),
);

// ----- Admin-facing -----
router.get('/documents',
  validate({ query: v.listDocumentsQuery }),
  asyncHandler(async (req, res) => res.json(await s.list(req.query, req.user))),
);

router.post('/documents/:id/review',
  validate({ params: v.uuidParam, body: v.reviewDocumentSchema }),
  asyncHandler(async (req, res) => res.json(await s.review(req.params.id, req.body, req.user))),
);

export default router;
