// ============================================================================
// Contract templates module — input validation
// ============================================================================
import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().optional(),
});

export const createTemplateVersionSchema = z.object({
  templateId: z.string().uuid(),
  body: z.string().min(1),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'number', 'date', 'boolean']),
    description: z.string().optional(),
    required: z.boolean().default(false),
  })).optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const publishVersionSchema = z.object({
  versionId: z.string().uuid(),
});

export const listTemplatesSchema = z.object({
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const templateIdSchema = z.object({
  id: z.string().uuid(),
});
