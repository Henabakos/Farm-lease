import { z } from 'zod';

export const uuidParam = z.object({ id: z.string().uuid() });

export const createPaymentSchema = z.object({
  agreement_id: z.string().uuid().optional(),
  agreementId:  z.string().uuid().optional(),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).optional(),
  type: z.enum(['DISBURSEMENT', 'REPAYMENT', 'FEE']).default('REPAYMENT'),
  due_date: z.string().date().or(z.string().datetime()).optional(),
  notes: z.string().trim().max(2000).optional(),
}).refine((v) => v.agreement_id || v.agreementId, {
  message: 'agreementId required',
  path: ['agreementId'],
});

export const submitReceiptSchema = z.object({
  storage_key: z.string().min(1).max(1024),
  file_name:   z.string().min(1).max(255),
  mime_type:   z.string().min(1).max(120),
  file_size:   z.coerce.number().int().nonnegative(),
  perceptual_hash: z.string().min(8).max(128).optional(),
  extracted_fields: z.record(z.any()).optional(),
  bank_reference: z.string().trim().max(120).optional(),
  bankReference:  z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const verifySchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'ESCALATED']).default('APPROVED'),
  reviewer_notes: z.string().trim().max(2000).optional(),
});

export const refundSchema = z.object({
  reason: z.string().trim().max(2000).optional(),
});

export const listPaymentsQuery = z.object({
  status: z.enum(['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED', 'REFUNDED']).optional(),
  agreementId: z.string().uuid().optional(),
  agreement_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
