// Proposals service.
//
// State machine:
//   DRAFT       → PUBLISHED        (proposal.publish)
//   PUBLISHED   → NEGOTIATING      (counter from either side)
//   NEGOTIATING → NEGOTIATING      (further counters)
//   any         → ACCEPTED         (proposal.accept by the counterparty)
//   any         → REJECTED         (proposal.reject by the counterparty)
//   any         → WITHDRAWN        (proposal.withdraw by the author)
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

const TERMINAL_STATUSES = new Set(['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED']);

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

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
    version: p.version ?? 0,
    documents: (p.documents ?? []).map((d) => ({
      id: d.id,
      storage_key: d.storageKey,
      file_name: d.fileName,
      mime_type: d.mimeType,
      file_size: d.fileSize,
      created_at: d.createdAt?.toISOString?.() ?? d.createdAt,
    })),
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
    documents: body.documents ?? body.terms?.documents ?? [],
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
    include: { cluster: { select: { id: true, name: true, ownerId: true } }, targetUser: { select: { id: true, fullName: true } }, documents: true, ...(opts.include ?? {}) },
  });
  if (!p) throw new NotFoundError('Proposal not found');
  return p;
}

async function appendHistory(tx, { proposalId, actorId, action, details }) {
  await tx.proposalHistory.create({
    data: { proposalId, actorId, action, details: details ?? null },
  });
}

async function updateWithVersion(tx, proposalId, expectedVersion, data) {
  const result = await tx.proposal.updateMany({
    where: { id: proposalId, version: expectedVersion },
    data: { ...data, version: { increment: 1 } },
  });
  if (result.count === 0) {
    throw new ConflictError('Proposal was updated by another user. Please refresh and try again.');
  }
}

function resolveExpectedVersion(proposal, body) {
  const incoming = body?.expectedVersion ?? body?.version;
  return incoming ?? proposal.version ?? 0;
}

async function autoDraftAgreement(tx, proposal) {
  if (!proposal.clusterId && !proposal.targetUserId) return null;

  const existing = await tx.agreement.findUnique({
    where: { proposalId: proposal.id },
    select: { id: true },
  });
  if (existing) return existing;

  const terms = proposal.terms && typeof proposal.terms === 'object' ? proposal.terms : {};
  const startDate = terms.startDate ? new Date(terms.startDate) : new Date();
  const leaseMonths = proposal.leaseTermMonths ?? Number(terms.durationMonths ?? terms.leaseTermMonths ?? 12);
  const endDate = terms.endDate ? new Date(terms.endDate) : addMonths(startDate, leaseMonths);
  const totalAmount = proposal.proposedAmount;
  const installmentAmount =
    terms.installmentAmount ??
    (leaseMonths > 0 ? Number(proposal.proposedAmount) / leaseMonths : Number(proposal.proposedAmount));

  const agreement = await tx.agreement.create({
    data: {
      proposalId: proposal.id,
      clusterId: proposal.clusterId,
      title: `${proposal.title} Agreement`,
      startDate,
      endDate,
      totalAmount,
      installmentAmount,
      paymentFrequency: terms.paymentFrequency ?? 'monthly',
      currency: proposal.currency ?? 'USD',
      terms,
      status: 'DRAFT',
    },
  });

  const clauses = [
    {
      title: 'Lease Scope',
      body: proposal.description || 'The parties agree to the agricultural lease terms captured in this agreement.',
      ordering: 0,
      isEditable: true,
    },
    {
      title: 'Payment Verification',
      body: 'The agreement becomes active only after required signatures and payment receipt verification.',
      ordering: 1,
      isEditable: false,
    },
  ];
  await tx.agreementClause.createMany({
    data: clauses.map((c) => ({ ...c, agreementId: agreement.id })),
  });

  await recordOutbox(tx, {
    eventType: 'agreement.drafted',
    aggregateType: 'Agreement',
    aggregateId: agreement.id,
    payload: { agreementId: agreement.id, proposalId: proposal.id },
  });

  return agreement;
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
      include: { cluster: { select: { id: true, name: true } }, targetUser: { select: { id: true, fullName: true } }, documents: true },
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
    const { documents, ...proposalData } = data;
    const created = await tx.proposal.create({
      data: { ...proposalData, investorId: viewer.id, status: 'DRAFT' },
    });
    const docs = Array.isArray(documents) ? documents : [];
    if (docs.length > 0) {
      await tx.proposalDocument.createMany({
        data: docs.map((doc) => ({
          proposalId: created.id,
          storageKey: doc.storage_key ?? doc.storageKey,
          fileName: doc.file_name ?? doc.fileName ?? 'proposal-document',
          mimeType: doc.mime_type ?? doc.mimeType ?? 'application/octet-stream',
          fileSize: doc.file_size ?? doc.fileSize ?? 0,
        })),
      });
    }
    await appendHistory(tx, {
      proposalId: created.id,
      actorId: viewer.id,
      action: 'CREATED',
      details: { proposedAmount: data.proposedAmount, documents: docs.length },
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
  const expectedVersion = resolveExpectedVersion(p, body);

  const updated = await prisma.$transaction(async (tx) => {
    await updateWithVersion(tx, id, expectedVersion, data);
    await appendHistory(tx, { proposalId: id, actorId: viewer.id, action: 'UPDATED', details: data });
    return id;
  });
  return toDto(await loadOrThrow(updated));
}

// ---------------------------------------------------------------- FSM
export async function publish(id, viewer, body = {}) {
  const p = await loadOrThrow(id);
  if (p.investorId !== viewer.id && !isAdmin(viewer)) throw new ForbiddenError();
  if (p.status !== 'DRAFT') throw new ConflictError(`Cannot publish from ${p.status}`);
  const expectedVersion = resolveExpectedVersion(p, body);

  await prisma.$transaction(async (tx) => {
    await updateWithVersion(tx, id, expectedVersion, { status: 'PUBLISHED' });
    await appendHistory(tx, { proposalId: id, actorId: viewer.id, action: 'PUBLISHED' });
    await recordOutbox(tx, {
      eventType: 'proposal.submitted',
      aggregateType: 'Proposal',
      aggregateId: id,
      payload: { proposalId: id, targetType: p.targetType, clusterId: p.clusterId, targetUserId: p.targetUserId },
    });
  });
  return toDto(await loadOrThrow(id));
}

export async function review(id, viewer, body = {}) {
  const p = await loadOrThrow(id);
  const counterparty = await counterpartyOf(p);
  if (viewer.id !== counterparty && !isAdmin(viewer)) {
    throw new ForbiddenError('Only the counterparty can review');
  }
  if (TERMINAL_STATUSES.has(p.status) || p.status === 'DRAFT') {
    throw new ConflictError(`Cannot review from ${p.status}`);
  }
  const expectedVersion = resolveExpectedVersion(p, body);

  await prisma.$transaction(async (tx) => {
    await updateWithVersion(tx, id, expectedVersion, { reviewedAt: new Date() });
    await appendHistory(tx, { proposalId: id, actorId: viewer.id, action: 'REVIEWED' });
    await recordOutbox(tx, {
      eventType: 'proposal.reviewed',
      aggregateType: 'Proposal',
      aggregateId: id,
      payload: { proposalId: id, reviewedBy: viewer.id, investorId: p.investorId },
    });
  });
  return toDto(await loadOrThrow(id));
}

export async function accept(id, viewer, body = {}) {
  const p = await loadOrThrow(id);
  const counterparty = await counterpartyOf(p);
  if (viewer.id !== counterparty && !isAdmin(viewer)) {
    throw new ForbiddenError('Only the counterparty can accept');
  }
  if (TERMINAL_STATUSES.has(p.status) || p.status === 'DRAFT') {
    throw new ConflictError(`Cannot accept from ${p.status}`);
  }
  const expectedVersion = resolveExpectedVersion(p, body);
  await prisma.$transaction(async (tx) => {
    await updateWithVersion(tx, id, expectedVersion, { status: 'ACCEPTED' });
    await appendHistory(tx, { proposalId: id, actorId: viewer.id, action: 'ACCEPTED' });
    await autoDraftAgreement(tx, p);
    await recordOutbox(tx, {
      eventType: 'proposal.accepted',
      aggregateType: 'Proposal',
      aggregateId: id,
      payload: { proposalId: id, acceptedBy: viewer.id, investorId: p.investorId },
    });
  });
  return toDto(await loadOrThrow(id));
}

export async function reject(id, body, viewer) {
  const p = await loadOrThrow(id);
  const counterparty = await counterpartyOf(p);
  if (viewer.id !== counterparty && !isAdmin(viewer)) {
    throw new ForbiddenError('Only the counterparty can reject');
  }
  if (TERMINAL_STATUSES.has(p.status)) throw new ConflictError(`Cannot reject from ${p.status}`);
  const expectedVersion = resolveExpectedVersion(p, body);
  const reason = body?.reason;

  await prisma.$transaction(async (tx) => {
    await updateWithVersion(tx, id, expectedVersion, { status: 'REJECTED' });
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
  const expectedVersion = resolveExpectedVersion(p, body);
  const proposedAmount = body.proposedAmount ?? body.proposed_amount ?? p.proposedAmount;
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
    await updateWithVersion(tx, id, expectedVersion, { status: 'NEGOTIATING' });
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

export async function withdraw(id, body, viewer) {
  const p = await loadOrThrow(id);
  if (p.investorId !== viewer.id && !isAdmin(viewer)) {
    throw new ForbiddenError('Only the proposal author can withdraw');
  }
  if (TERMINAL_STATUSES.has(p.status)) {
    throw new ConflictError(`Cannot withdraw from ${p.status}`);
  }
  const expectedVersion = resolveExpectedVersion(p, body);
  const reason = body?.reason;

  await prisma.$transaction(async (tx) => {
    await updateWithVersion(tx, id, expectedVersion, { status: 'WITHDRAWN' });
    await appendHistory(tx, { proposalId: id, actorId: viewer.id, action: 'WITHDRAWN', details: { reason } });
    await recordOutbox(tx, {
      eventType: 'proposal.withdrawn',
      aggregateType: 'Proposal',
      aggregateId: id,
      payload: {
        proposalId: id,
        withdrawnBy: viewer.id,
        reason,
        targetType: p.targetType,
        clusterId: p.clusterId,
        targetUserId: p.targetUserId,
      },
    });
  });
  return toDto(await loadOrThrow(id));
}

export async function negotiations(id, viewer) {
  const p = await loadOrThrow(id);
  if (!(await canRead(p, viewer))) throw new ForbiddenError();
  const rows = await prisma.negotiation.findMany({
    where: { proposalId: id },
    orderBy: { createdAt: 'asc' },
    include: { initiator: { select: { id: true, fullName: true, role: true } } },
  });
  return rows.map((n) => ({
    id: n.id,
    proposal_id: n.proposalId,
    initiator_id: n.initiatorId,
    initiator_name: n.initiator?.fullName ?? null,
    initiator_role: n.initiator?.role ?? null,
    proposed_amount: Number(n.proposedAmount),
    proposed_terms: n.proposedTerms,
    message: n.message,
    status: n.status,
    created_at: n.createdAt.toISOString(),
    updated_at: n.updatedAt.toISOString(),
  }));
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
