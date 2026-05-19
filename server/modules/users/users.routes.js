import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { PERMISSIONS } from '../rbac/permissions.js';
import * as service from './users.service.js';
import * as v from './users.validators.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  validate({ query: v.listUsersQuery }),
  asyncHandler(async (req, res) => res.json(await service.search(req.query, req.user))),
);

router.get(
  '/:id',
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) =>
    res.json(await service.getById({ targetId: req.params.id, viewer: req.user })),
  ),
);

router.put(
  '/:id',
  validate({ params: v.uuidParam, body: v.updateProfileSchema }),
  asyncHandler(async (req, res) =>
    res.json(
      await service.updateProfile({
        targetId: req.params.id,
        viewer: req.user,
        patch: req.body,
      }),
    ),
  ),
);

router.post(
  '/:id/verify',
  requirePermission(PERMISSIONS.USER_VERIFY),
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) =>
    res.json(await service.verify({ targetId: req.params.id, viewer: req.user })),
  ),
);

export default router;
