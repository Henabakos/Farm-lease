import { z } from 'zod';

export const uuidParam = z.object({ id: z.string().uuid() });

const agreementBaseSchema = z.object({
  proposal_id: z.string().uuid().optional(),
  proposalId:  z.string().uuid().optional(),
  template_version_id: z.string().uuid().optional(),
  templateVersionId:   z.string().uuid().optional(),
  title: z.string().trim().min(2).max(255),
  start_date: z.string().date().or(z.string().datetime()),
  end_date:   z.string().date().or(z.string().datetime()),
  total_amount:        z.coerce.number().positive(),
  installment_amount:  z.coerce.number().positive().optional(),
  payment_frequency:   z.enum(['monthly', 'quarterly', 'annually', 'one_time']).default('monthly'),
  currency: z.string().length(3).optional(),
  terms: z.record(z.any()).optional(),
  clauses: z.array(z.object({
    title: z.string().min(1).max(255),
    body: z.string().min(1),
    isEditable: z.boolean().optional(),
  })).optional(),
});

export const createAgreementSchema = agreementBaseSchema.refine((v) => v.proposal_id || v.proposalId, {
  message: 'proposalId required',
  path: ['proposalId'],
});

export const updateAgreementSchema = agreementBaseSchema.partial();

export const signAgreementSchema = z.object({
  method: z.enum(['DRAWN', 'TYPED', 'UPLOADED']).default('TYPED'),
  signature_data: z.string().min(1).max(200_000),
});

export const listAgreementsQuery = z.object({
  status: z.enum(['DRAFT', 'PENDING_SIGNATURES', 'ACTIVE', 'COMPLETED', 'TERMINATED', 'DISPUTED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const terminateSchema = z.object({
  reason: z.string().trim().max(2000).optional(),
});
