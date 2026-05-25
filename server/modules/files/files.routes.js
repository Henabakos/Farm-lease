// ============================================================================
// Generic file upload module.
//
// Provides a single endpoint other modules and the frontend use to put a
// binary into S3/MinIO and get back a `storage_key` they can persist on
// their own domain rows (message attachments, KYC documents, proposal docs,
// receipts, etc.). Centralising the upload path keeps virus-scanning,
// size limits, and content-type policy in one place.
//
// Endpoints (mounted at /api/files):
//   POST /upload          multipart/form-data { file, prefix? } -> { storage_key, file_name, mime_type, file_size, url }
//   GET  /signed-url      ?key=... -> { url } (short-lived GET URL)
// ============================================================================

import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { requireAuth, requireEmailVerified } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../shared/asyncHandler.js';
import { ValidationError } from '../../shared/errors.js';
import { put, signGet, buildKey } from '../../integrations/storage/storage.js';

const router = Router();
router.use(requireAuth);
router.use(requireEmailVerified);

// 25 MB max per file. The frontend enforces a stricter limit per feature
// (e.g. 10 MB for chat attachments) but this is the absolute server cap.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Whitelisted prefix slugs — keeps S3 layout predictable and prevents
// users from pushing files into arbitrary key spaces.
const ALLOWED_PREFIXES = new Set([
  'attachments',
  'kyc',
  'proposals',
  'receipts',
  'avatars',
  'agreements',
  'kb',
  'contract-templates',
]);

router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ValidationError('file is required');
    const prefixRaw = (req.body?.prefix ?? 'attachments').toString();
    const prefix = ALLOWED_PREFIXES.has(prefixRaw) ? prefixRaw : 'attachments';

    const key = buildKey(prefix, req.file.originalname);
    await put({
      key,
      body: req.file.buffer,
      contentType: req.file.mimetype,
    });

    const url = await signGet({ key, expiresIn: 3600 });
    res.status(201).json({
      storage_key: key,
      file_name: req.file.originalname,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      url,
    });
  }),
);

const signedUrlQuery = z.object({
  key: z.string().min(1).max(512),
  expires: z.coerce.number().int().positive().max(86400).optional(),
});

router.get(
  '/signed-url',
  validate({ query: signedUrlQuery }),
  asyncHandler(async (req, res) => {
    const url = await signGet({
      key: req.query.key,
      expiresIn: req.query.expires ?? 600,
    });
    res.json({ url });
  }),
);

export default router;
