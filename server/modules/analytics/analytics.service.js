// ============================================================================
// Analytics module — service layer
// ============================================================================
import { prisma } from '../../db/prisma.js';

/**
 * Get overall dashboard statistics.
 */
export async function getDashboardStats() {
  const [
    totalUsers,
    totalClusters,
    totalProposals,
    totalAgreements,
    totalPayments,
    activeProposals,
    activeAgreements,
  ] = await Promise.all([
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.cluster.count({ where: { status: 'ACTIVE' } }),
    prisma.proposal.count(),
    prisma.agreement.count(),
    prisma.payment.count(),
    prisma.proposal.count({ where: { status: { in: ['PUBLISHED', 'NEGOTIATING'] } } }),
    prisma.agreement.count({ where: { status: 'ACTIVE' } }),
  ]);

  // Get total payment volume
  const paymentAggregates = await prisma.payment.aggregate({
    where: { status: 'VERIFIED' },
    _sum: { amount: true },
  });

  return {
    users: {
      total: totalUsers,
    },
    clusters: {
      total: totalClusters,
    },
    proposals: {
      total: totalProposals,
      active: activeProposals,
    },
    agreements: {
      total: totalAgreements,
      active: activeAgreements,
    },
    payments: {
      total: totalPayments,
      totalVolume: paymentAggregates._sum.amount || 0,
    },
  };
}

/**
 * Get user statistics by role.
 */
export async function getUserStatsByRole() {
  const stats = await prisma.user.groupBy({
    by: ['role'],
    where: { status: 'ACTIVE' },
    _count: true,
  });

  return stats.map(s => ({
    role: s.role,
    count: s._count,
  }));
}

/**
 * Get proposal statistics by status.
 */
export async function getProposalStatsByStatus() {
  const stats = await prisma.proposal.groupBy({
    by: ['status'],
    _count: true,
  });

  return stats.map(s => ({
    status: s.status,
    count: s._count,
  }));
}

/**
 * Get payment statistics over time (monthly).
 */
export async function getPaymentStatsByMonth(months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const payments = await prisma.payment.findMany({
    where: {
      status: 'VERIFIED',
      paidAt: { gte: startDate },
    },
    select: {
      amount: true,
      paidAt: true,
      type: true,
    },
    orderBy: { paidAt: 'asc' },
  });

  // Group by month
  const monthlyData = {};
  payments.forEach(p => {
    if (!p.paidAt) return;
    const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[key]) {
      monthlyData[key] = { month: key, disbursement: 0, repayment: 0, fee: 0 };
    }
    if (p.type === 'DISBURSEMENT') monthlyData[key].disbursement += Number(p.amount);
    else if (p.type === 'REPAYMENT') monthlyData[key].repayment += Number(p.amount);
    else if (p.type === 'FEE') monthlyData[key].fee += Number(p.amount);
  });

  return Object.values(monthlyData);
}

/**
 * Get top clusters by proposal count.
 */
export async function getTopClustersByProposals(limit = 10) {
  const clusters = await prisma.cluster.findMany({
    where: { status: 'ACTIVE' },
    include: {
      _count: {
        select: { proposals: true },
      },
      owner: {
        select: { id: true, fullName: true, email: true },
      },
    },
    orderBy: {
      proposals: {
        _count: 'desc',
      },
    },
    take: limit,
  });

  return clusters.map(c => ({
    id: c.id,
    name: c.name,
    location: c.location,
    proposalCount: c._count.proposals,
    owner: c.owner,
  }));
}

/**
 * Get recent activity feed.
 */
export async function getActivityFeed(limit = 20) {
  const recentProposals = await prisma.proposal.findMany({
    take: Math.floor(limit / 2),
    orderBy: { createdAt: 'desc' },
    include: {
      investor: { select: { id: true, fullName: true } },
    },
  });

  const recentAgreements = await prisma.agreement.findMany({
    take: Math.floor(limit / 2),
    orderBy: { createdAt: 'desc' },
    include: {
      proposal: {
        select: { id: true, title, investorId: true },
      },
    },
  });

  const activities = [
    ...recentProposals.map(p => ({
      type: 'PROPOSAL',
      id: p.id,
      title: p.title,
      actor: p.investor.fullName,
      actorId: p.investor.id,
      status: p.status,
      createdAt: p.createdAt,
    })),
    ...recentAgreements.map(a => ({
      type: 'AGREEMENT',
      id: a.id,
      title: a.title,
      status: a.status,
      createdAt: a.createdAt,
    })),
  ];

  return activities.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}
