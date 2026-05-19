// ============================================================================
// Resources module — service layer
// ============================================================================
import { prisma } from '../../db/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';

/**
 * Create a new resource.
 */
export async function createResource(userId, data) {
  const { title, category, provider, description, priceRange, rating, cropTypes, imageUrl, contactEmail, websiteUrl } = data;

  // Only admins can create resources
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'ADMIN') {
    throw new ForbiddenError('Only administrators can create resources');
  }

  const resource = await prisma.resource.create({
    data: {
      title,
      category,
      provider,
      description,
      priceRange,
      rating,
      cropTypes,
      imageUrl,
      contactEmail,
      websiteUrl,
    },
  });

  return resource;
}

/**
 * Get all resources with optional filtering.
 */
export async function getResources(filters = {}) {
  const { category, cropType, search } = filters;

  const where = {
    isActive: true,
    ...(category && { category }),
    ...(cropType && { cropTypes: { has: cropType } }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { provider: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const resources = await prisma.resource.findMany({
    where,
    orderBy: { rating: 'desc' },
  });

  return resources;
}

/**
 * Get a resource by ID.
 */
export async function getResourceById(resourceId) {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
  });

  if (!resource) {
    throw new NotFoundError('Resource not found');
  }

  return resource;
}

/**
 * Update a resource.
 */
export async function updateResource(userId, resourceId, updates) {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
  });

  if (!resource) {
    throw new NotFoundError('Resource not found');
  }

  // Only admins can update resources
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'ADMIN') {
    throw new ForbiddenError('Only administrators can update resources');
  }

  const updated = await prisma.resource.update({
    where: { id: resourceId },
    data: updates,
  });

  return updated;
}

/**
 * Delete a resource.
 */
export async function deleteResource(userId, resourceId) {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
  });

  if (!resource) {
    throw new NotFoundError('Resource not found');
  }

  // Only admins can delete resources
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'ADMIN') {
    throw new ForbiddenError('Only administrators can delete resources');
  }

  await prisma.resource.delete({ where: { id: resourceId } });

  return { success: true };
}
