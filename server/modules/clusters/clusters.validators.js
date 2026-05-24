import { z } from 'zod';

export const uuidParam = z.object({ id: z.string().uuid() });

export const createClusterSchema = z.object({
  name: z.string().trim().min(2).max(200),
  location: z.string().trim().min(2).max(255),
  region: z.string().trim().max(120).optional(),
  area_hectares: z.coerce.number().positive().max(1_000_000).optional(),
  areaHectares:  z.coerce.number().positive().max(1_000_000).optional(),
  description: z.string().trim().max(5000).optional(),
  image_url: z.string().url().max(2048).optional(),
  imageUrl:  z.string().url().max(2048).optional(),
  center_latitude:  z.coerce.number().min(-90).max(90).optional(),
  centerLatitude:   z.coerce.number().min(-90).max(90).optional(),
  center_longitude: z.coerce.number().min(-180).max(180).optional(),
  centerLongitude:  z.coerce.number().min(-180).max(180).optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateClusterSchema = createClusterSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
});

export const assignRepresentativeSchema = z.object({
  userId: z.string().uuid(),
});

export const listClustersQuery = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  region: z.string().trim().max(120).optional(),
  ownerId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
