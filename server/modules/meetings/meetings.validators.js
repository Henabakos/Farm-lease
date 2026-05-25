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
  joinUrl: z.string().url().optional(),
  participantIds: z.array(z.string().uuid()).optional(),
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

export const createAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format'),
  endTime:   z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format'),
}).refine(d => d.startTime < d.endTime, { message: 'startTime must be before endTime' });

export const updateAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format').optional(),
  endTime:   z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format').optional(),
  isActive: z.boolean().optional(),
}).refine(d => {
  if (d.startTime && d.endTime && d.startTime >= d.endTime) {
    return false;
  }
  return true;
}, { message: 'startTime must be before endTime when both are provided' });

export const availabilityIdSchema = z.object({ id: z.string().uuid() });

export const availabilityUserSchema = z.object({ userId: z.string().uuid() });

export const bookSlotSchema = z.object({
  hostId:         z.string().uuid(),           // the CLUSTER_REP being booked
  slotDate:       z.string().date(),           // "YYYY-MM-DD" — which specific date
  availabilityId: z.string().uuid(),           // which Availability row defines the slot
  durationMinutes: z.number().int().positive().default(30),
  notes:          z.string().max(1000).optional(),
});
