// ============================================================================
// Admin module — input validation
// ============================================================================
import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']),
  reason: z.string().optional(),
});

export const approveUserSchema = z.object({
  userId: z.string().uuid(),
});

export const listUsersSchema = z.object({
  status: z.enum(['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  role: z.enum(['ADMIN', 'INVESTOR', 'CLUSTER_REP', 'FARMER']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const listAuditLogsSchema = z.object({
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
