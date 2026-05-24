// ============================================================================
// Admin module — service layer
// ============================================================================
import { prisma } from '../../db/prisma.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors.js';
import { paginate } from '../../shared/pagination.js';
import { hashPassword } from '../../utils/crypto.js';

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
 * Build where clause for audit log queries.
 */
function buildAuditWhere(filters) {
  const { userId, action, entityType, role, search, createdAfter, createdBefore } = filters;
  const where = {};

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (role) where.user = { role };
  if (createdAfter || createdBefore) {
    where.createdAt = {};
    if (createdAfter) where.createdAt.gte = createdAfter;
    if (createdBefore) where.createdAt.lte = createdBefore;
  }
  if (search) {
    // Only search by action - user field filtering not supported in where clause
    where.action = { contains: search, mode: 'insensitive' };
  }

  return where;
}

/**
 * List audit logs with filtering.
 */
export async function listAuditLogs(filters) {
  const { page, limit } = filters;
  const where = buildAuditWhere(filters);

  try {
    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, fullName: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        ...paginate({ page, pageSize: limit }),
      }),
    ]);

    return {
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    // If the table doesn't exist, return empty results
    if (error.code === 'P2021') {
      return {
        items: [],
        pagination: { page, limit, total: 0, pages: 0 },
      };
    }
    throw error;
  }
}

/**
 * Export audit logs as CSV.
 */
export async function* exportAuditLogsCsv(filters) {
  const where = buildAuditWhere(filters);
  const MAX_ROWS = 10000;

  // Header row
  yield 'id,createdAt,userId,userEmail,userFullName,userRole,action,entityType,entityId,ipAddress,userAgent,changes\n';

  let cursor = null;
  let count = 0;

  while (count < MAX_ROWS) {
    const items = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, fullName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });

    if (items.length === 0) break;

    for (const log of items) {
      if (count >= MAX_ROWS) break;

      const row = [
        log.id,
        log.createdAt.toISOString(),
        log.user?.id ?? '',
        escapeCsv(log.user?.email ?? ''),
        escapeCsv(log.user?.fullName ?? ''),
        log.user?.role ?? '',
        escapeCsv(log.action),
        escapeCsv(log.entityType ?? ''),
        log.entityId ?? '',
        log.ipAddress ?? '',
        escapeCsv(log.userAgent ?? ''),
        escapeCsv(log.changes ? JSON.stringify(log.changes) : ''),
      ].join(',');

      yield row + '\n';
      count++;
      cursor = log.id;
    }
  }
}

/**
 * Clear audit logs before a specific date.
 */
export async function clearAuditLogs({ beforeDate }) {
  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: beforeDate,
      },
    },
  });

  return { deleted: result.count };
}

/**
 * Export report as CSV based on report type.
 */
export async function* exportReport({ reportType, startDate, endDate }) {
  const where = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  if (reportType === 'USERS') {
    yield 'id,email,fullName,role,status,verificationStatus,createdAt,lastLoginAt\n';
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    for (const user of users) {
      const row = [
        user.id,
        escapeCsv(user.email),
        escapeCsv(user.fullName || ''),
        user.role,
        user.status,
        user.verificationStatus,
        user.createdAt?.toISOString() || '',
        user.lastLoginAt?.toISOString() || '',
      ].join(',');
      yield row + '\n';
    }
  } else if (reportType === 'CLUSTERS') {
    yield 'id,name,location,region,verificationStatus,createdAt\n';
    const clusters = await prisma.cluster.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    for (const cluster of clusters) {
      const row = [
        cluster.id,
        escapeCsv(cluster.name),
        escapeCsv(cluster.location || ''),
        escapeCsv(cluster.region || ''),
        cluster.verificationStatus,
        cluster.createdAt?.toISOString() || '',
      ].join(',');
      yield row + '\n';
    }
  } else if (reportType === 'PAYMENTS') {
    yield 'id,amount,currency,type,status,agreementId,createdAt\n';
    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    for (const payment of payments) {
      const row = [
        payment.id,
        payment.amount,
        payment.currency,
        payment.type,
        payment.status,
        payment.agreementId || '',
        payment.createdAt?.toISOString() || '',
      ].join(',');
      yield row + '\n';
    }
  } else if (reportType === 'AUDIT_LOGS') {
    yield 'id,createdAt,userId,action,entityType,entityId\n';
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    for (const log of logs) {
      const row = [
        log.id,
        log.createdAt?.toISOString() || '',
        log.userId || '',
        escapeCsv(log.action),
        escapeCsv(log.entityType || ''),
        log.entityId || '',
      ].join(',');
      yield row + '\n';
    }
  }
}

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Update user verification status.
 */
export async function updateUserVerification(adminUserId, userId, verificationStatus, reason) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  if (userId === adminUserId) {
    throw new ForbiddenError('Cannot modify your own verification status');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { verificationStatus },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: `USER_${verificationStatus}`,
      entityType: 'User',
      entityId: userId,
      changes: { reason, previousStatus: user.verificationStatus },
    },
  });

  return updated;
}

/**
 * Update user role.
 */
export async function updateUserRole(adminUserId, userId, newRole) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  if (userId === adminUserId) {
    throw new ForbiddenError('Cannot modify your own role');
  }

  if (user.role === newRole) {
    throw new ForbiddenError('User already has this role');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'USER_ROLE_CHANGED',
      entityType: 'User',
      entityId: userId,
      changes: { previousRole: user.role, newRole },
    },
  });

  return updated;
}

/**
 * Unsuspend a suspended user.
 */
export async function unsuspendUser(adminUserId, userId, reason) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  if (userId === adminUserId) {
    throw new ForbiddenError('Cannot modify your own status');
  }

  if (user.status !== 'SUSPENDED') {
    throw new ForbiddenError('User is not suspended');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: 'ACTIVE' },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'USER_UNSUSPENDED',
      entityType: 'User',
      entityId: userId,
      changes: { reason, previousStatus: user.status },
    },
  });

  return updated;
}

/**
 * Reset user password.
 */
export async function resetUserPassword(adminUserId, userId, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  if (userId === adminUserId) {
    throw new ForbiddenError('Cannot reset your own password');
  }

  const passwordHash = await hashPassword(newPassword);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'USER_PASSWORD_RESET',
      entityType: 'User',
      entityId: userId,
      changes: { note: 'Password reset by admin' },
    },
  });

  return updated;
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
