// ============================================================================
// Contract templates module — input validation
// ============================================================================
import { z } from 'zod';

export const CLAUSE_CATEGORIES = [
  'PAYMENT',
  'TERMINATION',
  'DISPUTE',
  'CONFIDENTIALITY',
  'GENERAL',
  'CUSTOM',
];

export const TEMPLATE_TARGET_AUDIENCES = ['FARMER', 'INVESTOR', 'BOTH'];
export const TEMPLATE_CONTENT_TYPES = ['MARKDOWN', 'PDF'];

const variableSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['text', 'number', 'date', 'boolean']),
  description: z.string().optional(),
  required: z.boolean().default(false),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().optional(),
  targetAudience: z.enum(TEMPLATE_TARGET_AUDIENCES).default('BOTH'),
});

export const createTemplateVersionSchema = z.object({
  contentType: z.enum(TEMPLATE_CONTENT_TYPES).default('MARKDOWN'),
  body: z.string().optional(),
  pdfStorageKey: z.string().optional(),
  variables: z.array(variableSchema).optional(),
}).refine((data) => {
  if (data.contentType === 'MARKDOWN') {
    return data.body && data.body.length > 0;
  }
  if (data.contentType === 'PDF') {
    return data.pdfStorageKey && data.pdfStorageKey.length > 0;
  }
  return false;
}, {
  message: 'body is required for MARKDOWN, pdfStorageKey is required for PDF',
  path: ['body'],
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const listTemplatesSchema = z.object({
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const templateIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const versionParamsSchema = z.object({
  id: z.string().uuid(),
  versionId: z.string().uuid(),
});

export const templateClauseParamsSchema = z.object({
  id: z.string().uuid(),
  versionId: z.string().uuid(),
  templateClauseId: z.string().uuid(),
});

export const clauseIdParamsSchema = z.object({
  clauseId: z.string().uuid(),
});

export const compareVersionsSchema = z.object({
  version1: z.coerce.number().int().positive(),
  version2: z.coerce.number().int().positive(),
});

export const createClauseSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(CLAUSE_CATEGORIES),
  body: z.string().min(1),
});

export const updateClauseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.enum(CLAUSE_CATEGORIES).optional(),
  body: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const listClausesSchema = z.object({
  category: z.enum(CLAUSE_CATEGORIES).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export const clauseCategoryParamsSchema = z.object({
  category: z.enum(CLAUSE_CATEGORIES),
});

export const addTemplateClauseSchema = z.object({
  clauseId: z.string().uuid(),
  ordering: z.coerce.number().int().nonnegative(),
});

export const reorderTemplateClauseSchema = z.object({
  ordering: z.coerce.number().int().nonnegative(),
});
