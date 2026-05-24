import { z } from 'zod';

export const uuidParam = z.object({ id: z.string().uuid() });

const baseTerms = z.object({
  interestRate: z.coerce.number().min(0).max(100).optional(),
  repaymentPeriod: z.string().max(120).optional(),
  collateral: z.string().max(2000).optional(),
  roi: z.coerce.number().min(0).max(1000).optional(),
  cropType: z.string().trim().max(120).optional(),
  crop_type: z.string().trim().max(120).optional(),
  landArea: z.coerce.number().positive().optional(),
  land_area: z.coerce.number().positive().optional(),
  landAreaUnit: z.string().trim().max(20).optional(),
  land_area_unit: z.string().trim().max(20).optional(),
  revenueShare: z.coerce.number().min(0).max(100).optional(),
  revenue_share: z.coerce.number().min(0).max(100).optional(),
  expectedStartDate: z.string().date().or(z.string().datetime()).optional(),
  expected_start_date: z.string().date().or(z.string().datetime()).optional(),
}).passthrough();

const documentSchema = z.object({
  storage_key: z.string().min(1).max(512).optional(),
  storageKey: z.string().min(1).max(512).optional(),
  file_name: z.string().min(1).max(255).optional(),
  fileName: z.string().min(1).max(255).optional(),
  mime_type: z.string().min(1).max(255).optional(),
  mimeType: z.string().min(1).max(255).optional(),
  file_size: z.coerce.number().int().nonnegative().optional(),
  fileSize: z.coerce.number().int().nonnegative().optional(),
}).passthrough();

const versionSchema = z.object({
  expectedVersion: z.coerce.number().int().nonnegative().optional(),
}).passthrough();

export const createProposalSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(10_000).optional(),
  target_type: z.enum(['CLUSTER', 'FARMER']).optional(),
  targetType:  z.enum(['CLUSTER', 'FARMER']).optional(),
  cluster_id: z.string().uuid().optional(),
  clusterId:  z.string().uuid().optional(),
  target_user_id: z.string().uuid().optional(),
  targetUserId:   z.string().uuid().optional(),
  proposed_amount: z.coerce.number().positive().optional(),
  proposedAmount:  z.coerce.number().positive().optional(),
  budget:          z.coerce.number().positive().optional(),
  amount:          z.coerce.number().positive().optional(),
  currency: z.string().length(3).optional(),
  lease_term_months: z.coerce.number().int().positive().optional(),
  leaseTermMonths:   z.coerce.number().int().positive().optional(),
  roi: z.coerce.number().min(0).max(1000).optional(),
  location: z.string().trim().max(255).optional(),
  terms: baseTerms.optional(),
  documents: z.array(documentSchema).max(20).optional(),
  expires_at: z.string().datetime().optional(),
  expiresAt:  z.string().datetime().optional(),
  expectedVersion: z.coerce.number().int().nonnegative().optional(),
});

export const updateProposalSchema = createProposalSchema.partial();

export const listProposalsQuery = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED']).optional(),
  clusterId: z.string().uuid().optional(),
  cluster_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const negotiateSchema = z.object({
  proposed_amount: z.coerce.number().positive().optional(),
  proposedAmount:  z.coerce.number().positive().optional(),
  proposedTerms: baseTerms.optional(),
  message: z.string().trim().max(5000).optional(),
  expectedVersion: z.coerce.number().int().nonnegative().optional(),
}).refine((v) => v.proposed_amount != null || v.proposedAmount != null || Boolean(v.message), {
  message: 'proposedAmount or message is required',
  path: ['message'],
});

export const rejectSchema = z.object({
  reason: z.string().trim().max(2000).optional(),
  expectedVersion: z.coerce.number().int().nonnegative().optional(),
});

export const withdrawSchema = z.object({
  reason: z.string().trim().max(2000).optional(),
  expectedVersion: z.coerce.number().int().nonnegative().optional(),
});

export const versionOnlySchema = versionSchema;
