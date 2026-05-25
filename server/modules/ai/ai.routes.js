import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { requireAuth, requireEmailVerified } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { aiLimiter } from '../../middleware/rateLimit.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { PERMISSIONS } from '../rbac/permissions.js';
import * as s from './ai.service.js';

const router = Router();
router.use(requireAuth);
router.use(requireEmailVerified);

// In-memory multipart parser (10MB cap). Files flow API → service.upload →
// MinIO; we don't write to local disk so the API node stays stateless.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ---- schemas ---------------------------------------------------------------
const uuidParam = z.object({ id: z.string().uuid() });
const pageQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
const createKbSchema = z.object({
  name: z.string().trim().min(2).max(120),
  scope: z.enum(['GLOBAL', 'CLUSTER', 'USER']).default('GLOBAL'),
  cluster_id: z.string().uuid().optional(),
  description: z.string().trim().max(2000).optional(),
});
const chatSchema = z.object({
  message: z.string().trim().min(1).max(8000),
  chat_id: z.string().uuid().optional(),
  knowledge_base_ids: z.array(z.string().uuid()).optional(),
});
const retrieveSchema = z.object({
  query: z.string().trim().min(1).max(2000),
  knowledge_base_ids: z.array(z.string().uuid()).optional(),
  top_k: z.coerce.number().int().min(1).max(20).default(8),
});

const insightSchema = z.object({
  topic: z.string().trim().min(1).max(200).optional(),
  knowledge_base_ids: z.array(z.string().uuid()).optional(),
});

const advisorySchema = z.object({
  cluster_id: z.string().uuid(),
  focus: z.string().min(3),
  knowledge_base_ids: z.array(z.string().uuid()).optional(),
});

const predictionSchema = z.object({
  landSize: z.coerce.number().positive(),
  budget: z.coerce.number().positive(),
  region: z.string().min(2),
  knowledge_base_ids: z.array(z.string().uuid()).optional(),
});

// ---- Knowledge bases -------------------------------------------------------
router.get('/knowledge-bases',
  validate({ query: pageQuery }),
  asyncHandler(async (req, res) => res.json(await s.listKnowledgeBases(req.query, req.user))),
);

router.post('/knowledge-bases',
  requirePermission(PERMISSIONS.AI_KB_MANAGE),
  validate({ body: createKbSchema }),
  asyncHandler(async (req, res) => res.status(201).json(await s.createKnowledgeBase(req.body, req.user))),
);

router.delete('/knowledge-bases/:id',
  requirePermission(PERMISSIONS.AI_KB_MANAGE),
  validate({ params: uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.deleteKnowledgeBase(req.params.id, req.user))),
);

// ---- Documents -------------------------------------------------------------
router.get('/knowledge-bases/:id/documents',
  validate({ params: uuidParam, query: pageQuery }),
  asyncHandler(async (req, res) => res.json(await s.listDocuments(req.params.id, req.query, req.user))),
);

router.post('/knowledge-bases/:id/documents',
  requirePermission(PERMISSIONS.AI_KB_MANAGE),
  validate({ params: uuidParam }),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await s.uploadDocument(
        {
          kbId: req.params.id,
          file: req.file ?? null,
          title: req.body?.title ?? null,
          sourceUrl: req.body?.source_url ?? null,
        },
        req.user,
      ),
    );
  }),
);

router.delete('/documents/:id',
  requirePermission(PERMISSIONS.AI_KB_MANAGE),
  validate({ params: uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.deleteDocument(req.params.id, req.user))),
);

router.get('/documents/:id/download-url',
  validate({ params: uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.getDocumentDownloadUrl(req.params.id, req.user))),
);

// ---- Chat / Retrieval ------------------------------------------------------
router.post('/chat',
  requirePermission(PERMISSIONS.AI_CHAT),
  aiLimiter,
  validate({ body: chatSchema }),
  asyncHandler(async (req, res) =>
    res.json(
      await s.answerChat(
        {
          chatId: req.body.chat_id,
          message: req.body.message,
          knowledgeBaseIds: req.body.knowledge_base_ids,
        },
        req.user,
      ),
    ),
  ),
);

router.get('/chats',
  asyncHandler(async (req, res) => res.json(await s.listMyChats(req.user))),
);

router.get('/chats/:id',
  validate({ params: uuidParam }),
  asyncHandler(async (req, res) => res.json(await s.getChatHistory(req.params.id, req.user))),
);

router.post('/search',
  aiLimiter,
  validate({ body: retrieveSchema }),
  asyncHandler(async (req, res) =>
    res.json(
      await s.retrieve(
        { query: req.body.query, knowledgeBaseIds: req.body.knowledge_base_ids, topK: req.body.top_k },
        req.user,
      ),
    ),
  ),
);

router.post('/insights',
  aiLimiter,
  validate({ body: insightSchema }),
  asyncHandler(async (req, res) =>
    res.json(
      await s.getAiInsights(
        { userId: req.user.id, topic: req.body.topic, knowledgeBaseIds: req.body.knowledge_base_ids },
        req.user,
      ),
    ),
  ),
);

router.post('/trends',
  aiLimiter,
  validate({ body: z.object({ knowledge_base_ids: z.array(z.string().uuid()).optional() }) }),
  asyncHandler(async (req, res) =>
    res.json(await s.analyzeLeaseTrends({ knowledgeBaseIds: req.body.knowledge_base_ids }, req.user)),
  ),
);

router.post('/advisory',
  aiLimiter,
  validate({ body: advisorySchema }),
  asyncHandler(async (req, res) =>
    res.json(
      await s.getAdvisoryReport(
        { 
          clusterId: req.body.cluster_id, 
          focus: req.body.focus, 
          knowledgeBaseIds: req.body.knowledge_base_ids 
        }, 
        req.user
      )
    ),
  ),
);

router.get('/advisory/history/:clusterId',
  validate({ params: z.object({ clusterId: z.string().uuid() }) }),
  asyncHandler(async (req, res) =>
    res.json(await s.listAdvisoryHistory(req.params.clusterId, req.user))
  ),
);

router.post('/predictive-analytics',
  aiLimiter,
  validate({ body: predictionSchema }),
  asyncHandler(async (req, res) =>
    res.json(
      await s.getPredictiveAnalytics(
        { 
          landSize: req.body.landSize, 
          budget: req.body.budget, 
          region: req.body.region, 
          knowledgeBaseIds: req.body.knowledge_base_ids 
        }, 
        req.user
      )
    ),
  ),
);

export default router;
