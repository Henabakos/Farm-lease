// ============================================================================
// Feature flags module — input validation
// ============================================================================
import { z } from 'zod';

export const createFlagSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/),
  description: z.string().optional(),
  enabled: z.boolean().default(false),
  rolloutPercentage: z.number().int().min(0).max(100).default(0),
  userSegment: z.enum(['all', 'admins', 'investors', 'farmers', 'cluster_reps']).optional(),
});

export const updateFlagSchema = z.object({
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().int().min(0).max(100).optional(),
  userSegment: z.enum(['all', 'admins', 'investors', 'farmers', 'cluster_reps']).optional(),
});

export const listFlagsSchema = z.object({
  enabled: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const flagKeySchema = z.object({
  key: z.string(),
});
