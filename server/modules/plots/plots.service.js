// ============================================================================
// Plots module — service layer
// ============================================================================
import { prisma } from '../../db/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';

/**
 * Create a new plot for a cluster.
 */
export async function createPlot(userId, data) {
  const { clusterId, location, size, status, latitude, longitude } = data;

  // Verify cluster exists
  const cluster = await prisma.cluster.findUnique({ where: { id: clusterId } });
  if (!cluster) throw new NotFoundError('Cluster not found');

  // Check user has permission (owner or cluster rep)
  const membership = await prisma.clusterMembership.findFirst({
    where: {
      clusterId,
      userId,
      role: 'REPRESENTATIVE',
      isActive: true,
    },
  });

  if (cluster.ownerId !== userId && !membership) {
    throw new ForbiddenError('You do not have permission to add plots to this cluster');
  }

  const plot = await prisma.plot.create({
    data: {
      clusterId,
      location,
      size,
      status,
      latitude: latitude || null,
      longitude: longitude || null,
    },
  });

  return plot;
}

/**
 * Get plots for a cluster.
 */
export async function getClusterPlots(userId, clusterId) {
  // Verify cluster exists and user has access
  const cluster = await prisma.cluster.findUnique({ where: { id: clusterId } });
  if (!cluster) throw new NotFoundError('Cluster not found');

  const membership = await prisma.clusterMembership.findFirst({
    where: {
      clusterId,
      userId,
      isActive: true,
    },
  });

  const hasAccess =
    cluster.ownerId === userId ||
    membership?.role === 'REPRESENTATIVE' ||
    membership?.role === 'CLUSTER_REP' ||
    membership?.role === 'FARMER';

  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this cluster');
  }

  const plots = await prisma.plot.findMany({
    where: { clusterId },
    orderBy: { createdAt: 'desc' },
  });

  return plots;
}

/**
 * Update a plot.
 */
export async function updatePlot(userId, plotId, updates) {
  const plot = await prisma.plot.findUnique({ where: { id: plotId } });
  if (!plot) throw new NotFoundError('Plot not found');

  // Check permission (owner or cluster rep)
  const cluster = await prisma.cluster.findUnique({ where: { id: plot.clusterId } });
  const membership = await prisma.clusterMembership.findFirst({
    where: {
      clusterId: plot.clusterId,
      userId,
      role: 'REPRESENTATIVE',
      isActive: true,
    },
  });

  if (cluster.ownerId !== userId && !membership) {
    throw new ForbiddenError('You do not have permission to update this plot');
  }

  const updated = await prisma.plot.update({
    where: { id: plotId },
    data: updates,
  });

  return updated;
}

/**
 * Delete a plot.
 */
export async function deletePlot(userId, plotId) {
  const plot = await prisma.plot.findUnique({ where: { id: plotId } });
  if (!plot) throw new NotFoundError('Plot not found');

  // Check permission (owner or cluster rep)
  const cluster = await prisma.cluster.findUnique({ where: { id: plot.clusterId } });
  const membership = await prisma.clusterMembership.findFirst({
    where: {
      clusterId: plot.clusterId,
      userId,
      role: 'REPRESENTATIVE',
      isActive: true,
    },
  });

  if (cluster.ownerId !== userId && !membership) {
    throw new ForbiddenError('You do not have permission to delete this plot');
  }

  await prisma.plot.delete({ where: { id: plotId } });

  return { success: true };
}
