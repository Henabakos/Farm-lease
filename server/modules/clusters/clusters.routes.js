import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { PERMISSIONS } from '../rbac/permissions.js';
import * as s from './clusters.service.js';
import * as v from './clusters.validators.js';

const router = Router();
router.use(requireAuth);

router.get('/',
  validate({ query: v.listClustersQuery }),
  asyncHandler(async (req, res) => res.json(await s.list(req.query, req.user))),
);

router.get('/:id',
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.getById(req.params.id, req.user))),
);

router.post('/',
  requirePermission(PERMISSIONS.CLUSTER_CREATE),
  validate({ body: v.createClusterSchema }),
  asyncHandler(async (req, res) => res.status(201).json(await s.create(req.body, req.user))),
);

router.put('/:id',
  validate({ params: v.uuidParam, body: v.updateClusterSchema }),
  asyncHandler(async (req, res) => res.json(await s.update(req.params.id, req.body, req.user))),
);

router.delete('/:id',
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.remove(req.params.id, req.user))),
);

router.post('/:id/join',
  requirePermission(PERMISSIONS.CLUSTER_JOIN),
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.join(req.params.id, req.user))),
);

router.post('/:id/leave',
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.leave(req.params.id, req.user))),
);

router.get('/:id/members',
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.listMembers(req.params.id, req.user))),
);

router.delete('/:id/members/:userId', 
  asyncHandler(async (req, res) =>
    res.json(await s.removeMember(req.params.id, req.params.userId, req.user))),
);

router.post('/:id/members/invite',
  asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    if (!email) throw new Error('Email is required');
    res.json(await s.inviteMember(req.params.id, email, role || 'FARMER', req.user));
  }),
);

router.patch('/:id/members/:userId/role',
  asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!role) throw new Error('Role is required');
    res.json(await s.updateMemberRole(req.params.id, req.params.userId, role, req.user));
  }),
);

router.patch('/:id/representative',
  validate({ params: v.uuidParam, body: v.assignRepresentativeSchema }),
  asyncHandler(async (req, res) =>
    res.json(await s.assignRepresentative(req.params.id, req.body.userId, req.user)),
  ),
);

router.post('/:id/verify',
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.adminVerify(req.params.id, req.user))),
);

router.post('/:id/unverify',
  validate({ params: v.uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.adminUnverify(req.params.id, req.user))),
);

export default router;
