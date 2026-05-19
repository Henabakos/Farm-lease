import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import * as s from './notifications.service.js';

const router = Router();
router.use(requireAuth);

const uuidParam = z.object({ id: z.string().uuid() });
const listQuery = z.object({
  unread: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

router.get('/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => res.json(await s.list(req.query, req.user))),
);

router.get('/unread/count',
  asyncHandler(async (req, res) => res.json(await s.unreadCount(req.user))),
);

router.get('/:id',
  validate({ params: uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.getById(req.params.id, req.user))),
);

router.put('/:id/read',
  validate({ params: uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.markRead(req.params.id, req.user))),
);

router.put('/read-all/bulk',
  asyncHandler(async (req, res) => res.json(await s.markAllRead(req.user))),
);

router.delete('/:id',
  validate({ params: uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.remove(req.params.id, req.user))),
);

router.delete('/read/all',
  asyncHandler(async (req, res) => res.json(await s.deleteAllRead(req.user))),
);

export default router;
