// Agreements service.
//
// State machine:
//   DRAFT → PENDING_SIGNATURES → ACTIVE → COMPLETED
//                              ↘         ↘
//                                TERMINATED / DISPUTED
//
// Key invariants enforced inside transactions:
//   • An agreement may only be created from an ACCEPTED proposal.
//   • ACTIVE requires BOTH signatures present (investor + counterparty).
//   • Clauses are SNAPSHOTTED at create time (AgreementClause rows) so future
//     template edits do not mutate signed agreements.
//
// Each transition emits a domain event for the realtime broadcaster and the
// payments module (which schedules installments on activation).
import { prisma } from '../../db/prisma.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors.js';
import { isAdmin } from '../../shared/scope.js';
import { paginate, paginated } from '../../shared/pagination.js';
import { recordOutbox } from '../../events/bus.js';

function toDto(a) {
  if (!a) return null;
  return {
    id: a.id,
    proposal_id: a.proposalId,
    cluster_id: a.clusterId,
    template_version_id: a.templateVersionId,
    title: a.title,
    status: a.status.toLowerCase(),
    start_date: a.startDate?.toISOString?.().slice(0, 10) ?? a.startDate,
    end_date: a.endDate?.toISOString?.().slice(0, 10) ?? a.endDate,
    total_amount: Number(a.totalAmount),
    monthly_amount: a.installmentAmount != null ? Number(a.installmentAmount) : null,
    payment_frequency: a.paymentFrequency,
    currency: a.currency,
    terms: a.terms ?? {},
    document_url: a.pdfStorageKey ?? null,
    owner_name: a.cluster?.owner?.fullName ?? null,
    tenant_name: a.proposal?.investor?.fullName ?? null,
    signed_at: a.activatedAt?.toISOString?.() ?? a.activatedAt ?? null,
    completed_at: a.completedAt?.toISOString?.() ?? a.completedAt ?? null,
    clauses: (a.clauses ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      content: c.body,
      isEditable: c.isEditable,
    })),
    signatures: (a.signatures ?? []).map((s) => ({
      id: s.id,
      signer_id: s.signerId,
      method: s.method,
      signed_at: s.signedAt.toISOString(),
    })),
    created_at: a.createdAt?.toISOString?.() ?? a.createdAt,
    updated_at: a.updatedAt?.toISOString?.() ?? a.updatedAt,
  };
}

async function loadOrThrow(id) {
  const a = await prisma.agreement.findUnique({
    where: { id },
    include: {
      clauses: { orderBy: { ordering: 'asc' } },
      signatures: true,
      proposal: { include: { investor: { select: { fullName: true } } } },
      cluster: { include: { owner: { select: { fullName: true } } } },
    },
  });
  if (!a) throw new NotFoundError('Agreement not found');
  return a;
}

async function expectedSigners(agreement) {
  // Investor + cluster owner (CLUSTER target) or investor + target user (FARMER target).
  const signers = new Set([agreement.proposal.investorId]);
  if (agreement.proposal.targetType === 'FARMER' && agreement.proposal.targetUserId) {
    signers.add(agreement.proposal.targetUserId);
  } else if (agreement.cluster?.ownerId) {
    signers.add(agreement.cluster.ownerId);
  }
  return signers;
}

async function canRead(a, viewer) {
  if (isAdmin(viewer)) return true;
  const signers = await expectedSigners(a);
  if (signers.has(viewer.id)) return true;
  // Cluster members may read too.
  const m = await prisma.clusterMembership.findUnique({
    where: { userId_clusterId: { userId: viewer.id, clusterId: a.clusterId } },
    select: { isActive: true },
  });
  return Boolean(m?.isActive);
}

// ---------------------------------------------------------------- CRUD
export async function list(query, viewer) {
  const { page, pageSize, status } = query;
  const where = {
    AND: [
      isAdmin(viewer)
        ? {}
        : {
            OR: [
              { proposal: { investorId: viewer.id } },
              { proposal: { targetUserId: viewer.id } },
              { cluster: { ownerId: viewer.id } },
              { cluster: { memberships: { some: { userId: viewer.id, isActive: true } } } },
            ],
          },
      status ? { status } : {},
    ],
  };
  const [rows, total] = await Promise.all([
    prisma.agreement.findMany({
      where,
      include: {
        clauses: { orderBy: { ordering: 'asc' } },
        signatures: true,
        proposal: { include: { investor: { select: { fullName: true } } } },
        cluster: { include: { owner: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      ...paginate({ page, pageSize }),
    }),
    prisma.agreement.count({ where }),
  ]);
  return paginated(rows.map(toDto), total, { page, pageSize });
}

export async function getById(id, viewer) {
  const a = await loadOrThrow(id);
  if (!(await canRead(a, viewer))) throw new ForbiddenError();
  return toDto(a);
}

export async function create(body, viewer) {
  const proposalId = body.proposalId ?? body.proposal_id;
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new NotFoundError('Proposal not found');
  if (proposal.status !== 'ACCEPTED') {
    throw new ConflictError('Agreement can only be created from an ACCEPTED proposal');
  }
  if (!proposal.clusterId) throw new ValidationError('Proposal must be cluster-scoped');

  // Only the proposal author or the cluster owner (or admin) can draft.
  const cluster = await prisma.cluster.findUnique({ where: { id: proposal.clusterId } });
  if (![proposal.investorId, cluster?.ownerId].includes(viewer.id) && !isAdmin(viewer)) {
    throw new ForbiddenError();
  }

  // Reject duplicates — proposal has a one-to-one with agreement.
  const existing = await prisma.agreement.findUnique({ where: { proposalId } });
  if (existing) throw new ConflictError('Agreement already exists for this proposal');

  const agreement = await prisma.$transaction(async (tx) => {
    const created = await tx.agreement.create({
      data: {
        proposalId,
        clusterId: proposal.clusterId,
        templateVersionId: body.templateVersionId ?? body.template_version_id ?? null,
        title: body.title,
        startDate: new Date(body.start_date),
        endDate:   new Date(body.end_date),
        totalAmount: body.total_amount,
        installmentAmount: body.installment_amount,
        paymentFrequency: body.payment_frequency ?? 'monthly',
        currency: body.currency ?? proposal.currency ?? 'USD',
        terms: body.terms ?? {},
        status: 'PENDING_SIGNATURES',
      },
    });
    // Snapshot clauses if provided inline.
    if (Array.isArray(body.clauses) && body.clauses.length > 0) {
      await tx.agreementClause.createMany({
        data: body.clauses.map((c, i) => ({
          agreementId: created.id,
          title: c.title,
          body: c.body,
          isEditable: Boolean(c.isEditable),
          ordering: i,
        })),
      });
    }
    await recordOutbox(tx, {
      eventType: 'agreement.drafted',
      aggregateType: 'Agreement',
      aggregateId: created.id,
      payload: { agreementId: created.id, proposalId },
    });
    return created;
  });
  return toDto(await loadOrThrow(agreement.id));
}

export async function sign(id, body, viewer) {
  const a = await loadOrThrow(id);
  const signers = await expectedSigners(a);
  if (!signers.has(viewer.id) && !isAdmin(viewer)) {
    throw new ForbiddenError('Only the parties to this agreement can sign');
  }
  if (!['PENDING_SIGNATURES', 'DRAFT'].includes(a.status)) {
    throw new ConflictError(`Cannot sign from ${a.status}`);
  }
  // Idempotent: one signature per signer.
  const already = a.signatures.find((s) => s.signerId === viewer.id);
  if (already) return toDto(a);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.signature.create({
      data: {
        agreementId: id,
        signerId: viewer.id,
        method: body.method ?? 'TYPED',
        signatureData: body.signature_data,
        ipAddress: null,
        userAgent: null,
      },
    });
    const sigCount = await tx.signature.count({ where: { agreementId: id } });
    const isComplete = sigCount >= signers.size;
    const newStatus = isComplete ? 'ACTIVE' : 'PENDING_SIGNATURES';
    const updatedAgreement = await tx.agreement.update({
      where: { id },
      data: {
        status: newStatus,
        activatedAt: isComplete ? new Date() : null,
      },
    });
    await recordOutbox(tx, {
      eventType: isComplete ? 'agreement.activated' : 'agreement.signed_by',
      aggregateType: 'Agreement',
      aggregateId: id,
      payload: { agreementId: id, signerId: viewer.id, status: newStatus },
    });
    return updatedAgreement;
  });
  return toDto(await loadOrThrow(updated.id));
}

export async function terminate(id, body, viewer) {
  const a = await loadOrThrow(id);
  const signers = await expectedSigners(a);
  if (!signers.has(viewer.id) && !isAdmin(viewer)) throw new ForbiddenError();
  if (['COMPLETED', 'TERMINATED'].includes(a.status)) {
    throw new ConflictError(`Already in terminal status: ${a.status}`);
  }
  await prisma.$transaction(async (tx) => {
    await tx.agreement.update({
      where: { id },
      data: { status: 'TERMINATED', completedAt: new Date() },
    });
    await recordOutbox(tx, {
      eventType: 'agreement.terminated',
      aggregateType: 'Agreement',
      aggregateId: id,
      payload: { agreementId: id, terminatedBy: viewer.id, reason: body?.reason ?? null },
    });
  });
  return toDto(await loadOrThrow(id));
}

export async function update(id, body, viewer) {
  const a = await loadOrThrow(id);
  if (a.status !== 'DRAFT') throw new ConflictError('Only DRAFT agreements can be edited');
  const signers = await expectedSigners(a);
  if (!signers.has(viewer.id) && !isAdmin(viewer)) throw new ForbiddenError();
  const data = {};
  if (body.title) data.title = body.title;
  if (body.start_date) data.startDate = new Date(body.start_date);
  if (body.end_date)   data.endDate   = new Date(body.end_date);
  if (body.total_amount != null) data.totalAmount = body.total_amount;
  if (body.installment_amount != null) data.installmentAmount = body.installment_amount;
  if (body.payment_frequency)    data.paymentFrequency = body.payment_frequency;
  if (body.terms) data.terms = body.terms;
  await prisma.agreement.update({ where: { id }, data });
  return toDto(await loadOrThrow(id));
}
