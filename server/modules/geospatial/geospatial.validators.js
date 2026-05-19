// ============================================================================
// Geospatial module — input validation
// ============================================================================
import { z } from 'zod';

export const createBoundarySchema = z.object({
  clusterId: z.string().uuid(),
  geojson: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number()))),
  }),
  notes: z.string().optional(),
});

export const updateBoundarySchema = z.object({
  geojson: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number()))),
  }).optional(),
  verificationStatus: z.enum(['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED']).optional(),
  notes: z.string().optional(),
});

export const listBoundariesSchema = z.object({
  clusterId: z.string().uuid().optional(),
  verificationStatus: z.enum(['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const boundaryIdSchema = z.object({
  id: z.string().uuid(),
});
