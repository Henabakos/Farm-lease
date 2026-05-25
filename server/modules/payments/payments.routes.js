import { Router } from 'express';
import { requireAuth, requireEmailVerified } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { PERMISSIONS } from '../rbac/permissions.js';
import * as s from './payments.service.js';
import * as v from './payments.validators.js';

const router = Router();
router.use(requireAuth);
router.use(requireEmailVerified);

router.get('/',
  validate({ query: v.listPaymentsQuery }),
  asyncHandler(async (req, res) => res.json(await s.list(req.query, req.user))),
);

router.get('/stats',
  asyncHandler(async (req, res) => res.json(await s.getStats(req.user))),
);

router.get('/:id',
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.getById(req.params.id, req.user))),
);

router.post('/',
  validate({ body: v.createPaymentSchema }),
  asyncHandler(async (req, res) => res.status(201).json(await s.create(req.body, req.user))),
);

// Frontend legacy: POST /:id/process — interpret as submitting the receipt.
router.post('/:id/process',
  requirePermission(PERMISSIONS.PAYMENT_SUBMIT_RECEIPT),
  validate({ params: v.uuidParam, body: v.submitReceiptSchema }),
  asyncHandler(async (req, res) => res.json(await s.submitReceipt(req.params.id, req.body, req.user))),
);

router.post('/:id/receipts',
  requirePermission(PERMISSIONS.PAYMENT_SUBMIT_RECEIPT),
  validate({ params: v.uuidParam, body: v.submitReceiptSchema }),
  asyncHandler(async (req, res) => res.json(await s.submitReceipt(req.params.id, req.body, req.user))),
);

router.post('/:id/verify',
  requirePermission(PERMISSIONS.PAYMENT_VERIFY),
  validate({ params: v.uuidParam, body: v.verifySchema }),
  asyncHandler(async (req, res) => res.json(await s.verify(req.params.id, req.body, req.user))),
);

router.post('/:id/refund',
  requirePermission(PERMISSIONS.PAYMENT_REFUND),
  validate({ params: v.uuidParam, body: v.refundSchema }),
  asyncHandler(async (req, res) => res.json(await s.refund(req.params.id, req.body, req.user))),
);

export default router;
