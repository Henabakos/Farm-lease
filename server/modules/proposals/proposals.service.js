// Proposals service.
//
// State machine:
//   DRAFT       → PUBLISHED        (proposal.publish)
//   PUBLISHED   → NEGOTIATING      (counter from either side)
//   NEGOTIATING → NEGOTIATING      (further counters)
//   any         → ACCEPTED         (proposal.accept by the counterparty)
//   any         → REJECTED         (proposal.reject by the counterparty)
//   any         → EXPIRED          (system, when expiresAt elapses)
//
// Each transition writes a row into `ProposalHistory` for audit and emits a
// domain event onto the outbox so the realtime broadcaster + notifications
// module can react.
//
// Authorization:
//   • CREATE: PROPOSAL_CREATE. The author becomes `investorId`.
//   • READ:   author, target user, cluster owner, cluster members, or admin.
//   • UPDATE: only the author, only while DRAFT.
//   • PUBLISH/ACCEPT/REJECT/NEGOTIATE: see per-method rules below.
import { prisma } from '../../db/prisma.js';
import {
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../shared/errors.js';
import { isAdmin } from '../../shared/scope.js';
import { paginate, paginated } from '../../shared/pagination.js';
import { recordOutbox } from '../../events/bus.js';

const TERMINAL_STATUSES = new Set(['ACCEPTED', 'REJECTED', 'EXPIRED']);

function toDto(p) {
  if (!p) return null;
  return {
    id: p.id,
    title: p.title,
    description: p.description ?? '',
    investor_id: p.investorId,
    target_type: p.targetType,
    cluster_id: p.clusterId,
    target_user_id: p.targetUserId,
    cluster_name: p.cluster?.name ?? null,
    target_user_name: p.targetUser?.fullName ?? null,
    proposed_price: p.proposedAmount != null ? Number(p.proposedAmount) : 0,
    currency: p.currency,
    lease_term_months: p.leaseTermMonths,
    roi: p.roi != null ? Number(p.roi) : null,
    location: p.location ?? null,
    terms: p.terms ?? {},
    status: p.status.toLowerCase(), // frontend mapper expects lowercase tokens
    expires_at: p.expiresAt?.toISOString?.() ?? p.expiresAt ?? null,
    created_at: p.createdAt?.toISOString?.() ?? p.createdAt,
    updated_at: p.updatedAt?.toISOString?.() ?? p.updatedAt,
  };
}

function pickInput(body) {
  return {
    title: body.title,
    description: body.description,
    targetType: body.targetType ?? body.target_type ?? 'CLUSTER',
    clusterId: body.clusterId ?? body.cluster_id,
    targetUserId: body.targetUserId ?? body.target_user_id,
    proposedAmount:
      body.proposedAmount ?? body.proposed_amount ?? body.amount ?? body.budget,
    currency: body.currency ?? 'USD',
    leaseTermMonths: body.leaseTermMonths ?? body.lease_term_months,
    roi: body.roi,
    location: body.location,
    terms: body.terms ?? {},
    expiresAt: body.expiresAt ?? body.expires_at ?? null,
  };
}

// Determine who is the "counterparty" (the side that can ACCEPT/REJECT).
// For CLUSTER-targeted proposals it's the cluster owner; for FARMER it's the
// target user. Admins can always act.
async function counterpartyOf(proposal) {
  if (proposal.targetType === 'FARMER') {
    return proposal.targetUserId;
  }
  // CLUSTER
  const cluster = await prisma.cluster.findUnique({
    where: { id: proposal.clusterId },
    select: { ownerId: true },
  });
  return cluster?.ownerId ?? null;
}

async function canRead(proposal, viewer) {
  if (isAdmin(viewer)) return true;
  if (proposal.investorId === viewer.id) return true;
  if (proposal.targetUserId === viewer.id) return true;
  if (proposal.clusterId) {
    const member = await prisma.clusterMembership.findUnique({
      where: { userId_clusterId: { userId: viewer.id, clusterId: proposal.clusterId } },
      select: { isActive: true },
    });
    if (member?.isActive) return true;
    const cluster = await prisma.cluster.findUnique({
      where: { id: proposal.clusterId },
      select: { ownerId: true },
    });
    if (cluster?.ownerId === viewer.id) return true;
  }
  return false;
}

async function loadOrThrow(id, opts = {}) {
  const p = await prisma.proposal.findUnique({
    where: { id },
    include: { cluster: { select: { id: true, name: true, ownerId: true } }, targetUser: { select: { id: true, fullName: true } }, ...(opts.include ?? {}) },
  });
  if (!p) throw new NotFoundError('Proposal not found');
  return p;
}

async function appendHistory(tx, { proposalId, actorId, action, details }) {
  await tx.proposalHistory.create({
    data: { proposalId, actorId, action, details: details ?? null },
  });
}

// ---------------------------------------------------------------- CRUD
export async function list(query, viewer) {
  const { page, pageSize, status, clusterId, cluster_id } = query;
  const cid = clusterId ?? cluster_id;
  const where = {
    AND: [
      isAdmin(viewer)
        ? {}
        : {
            OR: [
              { investorId: viewer.id },
              { targetUserId: viewer.id },
              { cluster: { ownerId: viewer.id } },
              { cluster: { memberships: { some: { userId: viewer.id, isActive: true } } } },
            ],
          },
      status ? { status } : {},
      cid ? { clusterId: cid } : {},
    ],
  };
  const [rows, total] = await Promise.all([
    prisma.proposal.findMany({
      where,
      include: { cluster: { select: { id: true, name: true } }, targetUser: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      ...paginate({ page, pageSize }),
    }),
    prisma.proposal.count({ where }),
  ]);
  return paginated(rows.map(toDto), total, { page, pageSize });
}

export async function getById(id, viewer) {
  const p = await loadOrThrow(id);
  if (!(await canRead(p, viewer))) throw new ForbiddenError('Cannot read this proposal');
  return toDto(p);
}

export async function create(body, viewer) {
  const data = pickInput(body);
  if (!data.proposedAmount) throw new ValidationError('proposedAmount is required');
  if (data.targetType === 'CLUSTER' && !data.clusterId) {
    throw new ValidationError('clusterId required when targetType=CLUSTER');
  }
  if (data.targetType === 'FARMER' && !data.targetUserId) {
    throw new ValidationError('targetUserId required when targetType=FARMER');
  }

  const proposal = await prisma.$transaction(async (tx) => {
    const created = await tx.proposal.create({
      data: { ...data, investorId: viewer.id, status: 'DRAFT' },
    });
    await appendHistory(tx, {
      proposalId: created.id,
      actorId: viewer.id,
      action: 'CREATED',
      details: { proposedAmount: data.proposedAmount },
    });
    await recordOutbox(tx, {
      eventType: 'proposal.created',
      aggregateType: 'Proposal',
      aggregateId: created.id,
      payload: { proposalId: created.id, investorId: viewer.id },
    });
    return created;
  });
  return toDto(await loadOrThrow(proposal.id));
}

export async function update(id, body, viewer) {
  const p = await loadOrThrow(id);
  if (p.investorId !== viewer.id && !isAdmin(viewer)) {
    throw new ForbiddenError('Only the proposal author can edit');
  }
  if (p.status !== 'DRAFT') {
    throw new ConflictError('Proposal can only be edited while in DRAFT');
  }
  const data = pickInput(body);
  for (const k of Object.keys(data)) if (data[k] === undefined) delete data[k];

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.proposal.update({ where: { id }, data });
    await appendHistory(tx, { proposalId: id, actorId: viewer.id, action: 'UPDATED', details: data });
    return u;
  });
  return toDto(await loadOrThrow(updated.id));
}

// ---------------------------------------------------------------- FSM
export async function publish(id, viewer) {
  const p = await loadOrThrow(id);
  if (p.investorId !== viewer.id && !isAdmin(viewer)) throw new ForbiddenError();
  if (p.status !== 'DRAFT') throw new ConflictError(`Cannot publish from ${p.status}`);

  await prisma.$transaction(async (tx) => {
    await tx.proposal.update({ where: { id }, data: { status: 'PUBLISHED' } });
    await appendHistory(tx, { proposalId: id, actorId: viewer.id, action: 'PUBLISHED' });
    await recordOutbox(tx, {
      eventType: 'proposal.published',
      aggregateType: 'Proposal',
      aggregateId: id,
      payload: { proposalId: id, targetType: p.targetType, clusterId: p.clusterId, targetUserId: p.targetUserId },
    });
  });
  return toDto(await loadOrThrow(id));
}

export async function accept(id, viewer) {
  const p = await loadOrThrow(id);
  const counterparty = await counterpartyOf(p);
  if (viewer.id !== counterparty && !isAdmin(viewer)) {
    throw new ForbiddenError('Only the counterparty can accept');
  }
  if (TERMINAL_STATUSES.has(p.status) || p.status === 'DRAFT') {
    throw new ConflictError(`Cannot accept from ${p.status}`);
  }
  await prisma.$transaction(async (tx) => {
    await tx.proposal.update({ where: { id }, data: { status: 'ACCEPTED' } });
    await appendHistory(tx, { proposalId: id, actorId: viewer.id, action: 'ACCEPTED' });
    await recordOutbox(tx, {
      eventType: 'proposal.accepted',
      aggregateType: 'Proposal',
      aggregateId: id,
      payload: { proposalId: id, acceptedBy: viewer.id, investorId: p.investorId },
    });
  });
  return toDto(await loadOrThrow(id));
}

export async function reject(id, { reason }, viewer) {
  const p = await loadOrThrow(id);
  const counterparty = await counterpartyOf(p);
  if (viewer.id !== counterparty && !isAdmin(viewer)) {
    throw new ForbiddenError('Only the counterparty can reject');
  }
  if (TERMINAL_STATUSES.has(p.status)) throw new ConflictError(`Cannot reject from ${p.status}`);

  await prisma.$transaction(async (tx) => {
    await tx.proposal.update({ where: { id }, data: { status: 'REJECTED' } });
    await appendHistory(tx, { proposalId: id, actorId: viewer.id, action: 'REJECTED', details: { reason } });
    await recordOutbox(tx, {
      eventType: 'proposal.rejected',
      aggregateType: 'Proposal',
      aggregateId: id,
      payload: { proposalId: id, rejectedBy: viewer.id, reason },
    });
  });
  return toDto(await loadOrThrow(id));
}

export async function negotiate(id, body, viewer) {
  const p = await loadOrThrow(id);
  if (!(await canRead(p, viewer))) throw new ForbiddenError();
  if (TERMINAL_STATUSES.has(p.status) || p.status === 'DRAFT') {
    throw new ConflictError(`Cannot negotiate from ${p.status}`);
  }
  const proposedAmount = body.proposedAmount ?? body.proposed_amount;
  const proposedTerms = body.proposedTerms ?? {};

  const negotiation = await prisma.$transaction(async (tx) => {
    const n = await tx.negotiation.create({
      data: {
        proposalId: id,
        initiatorId: viewer.id,
        proposedAmount,
        proposedTerms,
        message: body.message ?? null,
        status: 'OPEN',
      },
    });
    await tx.proposal.update({ where: { id }, data: { status: 'NEGOTIATING' } });
    await appendHistory(tx, {
      proposalId: id,
      actorId: viewer.id,
      action: 'COUNTERED',
      details: { proposedAmount, proposedTerms },
    });
    await recordOutbox(tx, {
      eventType: 'proposal.countered',
      aggregateType: 'Proposal',
      aggregateId: id,
      payload: { proposalId: id, negotiationId: n.id, initiatorId: viewer.id, proposedAmount },
    });
    return n;
  });
  return {
    id: negotiation.id,
    proposal_id: id,
    initiator_id: viewer.id,
    proposed_amount: Number(negotiation.proposedAmount),
    proposed_terms: negotiation.proposedTerms,
    message: negotiation.message,
    created_at: negotiation.createdAt.toISOString(),
  };
}

export async function history(id, viewer) {
  const p = await loadOrThrow(id);
  if (!(await canRead(p, viewer))) throw new ForbiddenError();
  const rows = await prisma.proposalHistory.findMany({
    where: { proposalId: id },
    orderBy: { createdAt: 'desc' },
    include: { /* actor relation not modeled; resolve names via separate query if needed */ },
  });
  return rows.map((h) => ({
    id: h.id,
    actor_id: h.actorId,
    action: h.action,
    details: h.details ?? null,
    created_at: h.createdAt.toISOString(),
  }));
}
