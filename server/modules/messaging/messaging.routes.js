import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { PERMISSIONS } from '../rbac/permissions.js';
import * as s from './messaging.service.js';
import {
  sendInvitation,
  listPendingInvitations,
  acceptInvitation,
  declineInvitation,
} from './messaging.service.js';

const router = Router();
router.use(requireAuth);

const uuidParam = z.object({ id: z.string().uuid() });
const convParam = z.object({ id: z.string().uuid() });

const messagesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});

const createConversationSchema = z.object({
  other_user_id: z.string().uuid().optional(),
  otherUserId:   z.string().uuid().optional(),
  context: z.enum(['GENERAL', 'PROPOSAL', 'AGREEMENT', 'PAYMENT']).optional(),
  related_id: z.string().uuid().optional(),
  relatedId:  z.string().uuid().optional(),
});

const sendMessageSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  conversationId:  z.string().uuid().optional(),
  content: z.string().min(1).max(20_000),
  attachments: z.array(z.object({
    storage_key: z.string(),
    file_name: z.string(),
    mime_type: z.string(),
    file_size: z.coerce.number().int().nonnegative().optional(),
  })).optional(),
});

const sendInvitationSchema = z.object({
  receiverId: z.string().uuid(),
  message: z.string().max(500).optional(),
});

router.get('/conversations',
  asyncHandler(async (req, res) => res.json(await s.listConversations(req.user))),
);

router.post('/conversation',
  validate({ body: createConversationSchema }),
  asyncHandler(async (req, res) => {
    const result = await s.getOrCreate(
      {
        otherUserId: req.body.otherUserId ?? req.body.other_user_id,
        context: req.body.context,
        relatedId: req.body.relatedId ?? req.body.related_id,
      },
      req.user,
    );
    res.status(201).json(result);
  }),
);

router.get('/conversation/:id',
  validate({ params: convParam, query: messagesQuery }),
  asyncHandler(async (req, res) => res.json(await s.listMessages(req.params.id, req.query, req.user))),
);

router.post('/',
  requirePermission(PERMISSIONS.MESSAGE_SEND),
  validate({ body: sendMessageSchema }),
  asyncHandler(async (req, res) => {
    const conversationId = req.body.conversationId ?? req.body.conversation_id;
    res.status(201).json(
      await s.sendMessage(
        { conversationId, content: req.body.content, attachments: req.body.attachments },
        req.user,
      ),
    );
  }),
);

router.put('/:id/read',
  validate({ params: uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.markRead(req.params.id, req.user))),
);

router.put('/conversation/:id/read-all',
  validate({ params: convParam }),
  asyncHandler(async (req, res) => res.json(await s.markAllRead(req.params.id, req.user))),
);

// ── Invitation routes ──────────────────────────────────────────────────────

// POST /messages/invitations — send an invitation
router.post('/invitations',
  validate({ body: sendInvitationSchema }),
  asyncHandler(async (req, res) => {
    const inv = await sendInvitation(req.user.id, req.body);
    res.status(201).json(inv);
  }),
);

// GET /messages/invitations/pending — list pending invitations addressed to me
router.get('/invitations/pending',
  asyncHandler(async (req, res) => {
    const invitations = await listPendingInvitations(req.user.id);
    res.json(invitations);
  }),
);

// POST /messages/invitations/:id/accept
router.post('/invitations/:id/accept',
  validate({ params: uuidParam }),
  asyncHandler(async (req, res) => {
    const conversation = await acceptInvitation(req.user.id, req.params.id);
    res.json(conversation);
  }),
);

// POST /messages/invitations/:id/decline
router.post('/invitations/:id/decline',
  validate({ params: uuidParam }),
  asyncHandler(async (req, res) => {
    const result = await declineInvitation(req.user.id, req.params.id);
    res.json(result);
  }),
);

export default router;
