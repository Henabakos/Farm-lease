import { z } from 'zod';

export const uuidParam = z.object({ id: z.string().uuid() });

export const KYC_DOCUMENT_TYPES = ['photo', 'national_id', 'passport', 'drivers_license', 'address_proof'];

export const submitDocumentSchema = z.object({
  document_type: z.enum(KYC_DOCUMENT_TYPES),
  storage_key: z.string().min(1).max(1024),
  file_name: z.string().min(1).max(255),
  mime_type: z.string().min(1).max(120),
  file_size: z.coerce.number().int().nonnegative(),
});

export const reviewDocumentSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().trim().max(2000).optional(),
});

export const listDocumentsQuery = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  user_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
