// ============================================================================
// Admin module — service layer
// ============================================================================
import { prisma } from '../../db/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';
import { paginate } from '../../shared/pagination.js';

/**
 * Update user status (approve, suspend, delete).
 */
export async function updateUserStatus(adminUserId, userId, status, reason) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  // Cannot delete yourself
  if (userId === adminUserId) {
    throw new ForbiddenError('Cannot modify your own status');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status },
    include: {
      _count: {
        select: {
          proposalsAsInvestor: true,
          clusters: true,
        },
      },
    },
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: `USER_${status}`,
      entityType: 'User',
      entityId: userId,
      changes: { reason, previousStatus: user.status },
    },
  });

  return updated;
}

/**
 * Approve a pending user.
 */
export async function approveUser(adminUserId, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new NotFoundError('User not found');
  if (user.status !== 'PENDING_APPROVAL') {
    throw new ForbiddenError('User is not pending approval');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    },
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'USER_APPROVED',
      entityType: 'User',
      entityId: userId,
    },
  });

  return updated;
}

/**
 * List users with filtering.
 */
export async function listUsers(filters) {
  const { status, role, page, limit } = filters;

  const where = {
    ...(status && { status }),
    ...(role && { role }),
  };

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        verificationStatus: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
      ...paginate({ page, pageSize: limit }),
    }),
  ]);

  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

/**
 * List audit logs with filtering.
 */
export async function listAuditLogs(filters) {
  const { userId, action, entityType, page, limit } = filters;

  const where = {
    ...(userId && { userId }),
    ...(action && { action }),
    ...(entityType && { entityType }),
  };

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...paginate({ page, limit }),
    }),
  ]);

  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

/**
 * Get system statistics for admin dashboard.
 */
export async function getSystemStats() {
  const [
    totalUsers,
    pendingUsers,
    suspendedUsers,
    totalClusters,
    totalProposals,
    totalAgreements,
    totalPayments,
    recentLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.user.count({ where: { status: 'SUSPENDED' } }),
    prisma.cluster.count(),
    prisma.proposal.count(),
    prisma.agreement.count(),
    prisma.payment.count(),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
    }),
  ]);

  return {
    users: {
      total: totalUsers,
      pending: pendingUsers,
      suspended: suspendedUsers,
    },
    clusters: totalClusters,
    proposals: totalProposals,
    agreements: totalAgreements,
    payments: totalPayments,
    recentActivity: recentLogs,
  };
}
