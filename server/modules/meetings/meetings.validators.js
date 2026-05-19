// ============================================================================
// Meetings module — input validation
// ============================================================================
import { z } from 'zod';

export const createMeetingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().default(30),
  provider: z.enum(['zoom', 'google', 'none']),
  attendeeEmails: z.array(z.string().email()).optional(),
  proposalId: z.string().uuid().optional(),
  agreementId: z.string().uuid().optional(),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().positive().optional(),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']).optional(),
});

export const listMeetingsSchema = z.object({
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']).optional(),
  platform: z.enum(['zoom', 'google', 'none']).optional(),
  proposalId: z.string().uuid().optional(),
  agreementId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const meetingIdSchema = z.object({
  id: z.string().uuid(),
});
