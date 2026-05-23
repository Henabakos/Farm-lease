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
    owner_name: a.cluster?.owner?.fullName ?? a.proposal?.targetUser?.fullName ?? null,
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
      proposal: { include: { investor: { select: { fullName: true } }, targetUser: { select: { fullName: true } } } },
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
  if (!a.clusterId) return false;
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
        proposal: { include: { investor: { select: { fullName: true } }, targetUser: { select: { fullName: true } } } },
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
  if (!proposal.clusterId && !proposal.targetUserId) {
    throw new ValidationError('Proposal must target a cluster or farmer');
  }

  const cluster = proposal.clusterId
    ? await prisma.cluster.findUnique({ where: { id: proposal.clusterId } })
    : null;
  const counterpartyId = proposal.targetType === 'FARMER' ? proposal.targetUserId : cluster?.ownerId;
  if (![proposal.investorId, counterpartyId].includes(viewer.id) && !isAdmin(viewer)) {
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
        status: 'DRAFT',
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
    const newStatus = isComplete ? 'PENDING_SIGNATURES' : 'DRAFT';
    const updatedAgreement = await tx.agreement.update({
      where: { id },
      data: {
        status: newStatus,
        activatedAt: null,
      },
    });
    await recordOutbox(tx, {
      eventType: isComplete ? 'agreement.fully_signed' : 'agreement.signed_by',
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
  if (!['DRAFT', 'PENDING_SIGNATURES'].includes(a.status)) throw new ConflictError('Only draft agreements can be edited');
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

  await prisma.$transaction(async (tx) => {
    await tx.agreement.update({ where: { id }, data });

    const revisionNumber = (await tx.agreementRevision.count({ where: { agreementId: id } })) + 1;
    await tx.agreementRevision.create({
      data: {
        agreementId: id,
        revisionNumber,
        body: JSON.stringify({
          title: body.title ?? null,
          start_date: body.start_date ?? null,
          end_date: body.end_date ?? null,
          total_amount: body.total_amount ?? null,
          installment_amount: body.installment_amount ?? null,
          payment_frequency: body.payment_frequency ?? null,
          terms: body.terms ?? null,
          clauses: body.clauses ?? null,
        }),
        changedById: viewer.id,
      },
    });

    if (Array.isArray(body.clauses)) {
      await tx.agreementClause.deleteMany({ where: { agreementId: id } });
      if (body.clauses.length > 0) {
        await tx.agreementClause.createMany({
          data: body.clauses.map((c, i) => ({
            agreementId: id,
            title: c.title,
            body: c.body,
            isEditable: Boolean(c.isEditable),
            ordering: i,
          })),
        });
      }
    }

    await tx.signature.deleteMany({ where: { agreementId: id } });
    await tx.agreement.update({
      where: { id },
      data: { status: 'DRAFT', activatedAt: null },
    });

    await recordOutbox(tx, {
      eventType: 'agreement.updated',
      aggregateType: 'Agreement',
      aggregateId: id,
      payload: { agreementId: id, updatedBy: viewer.id },
    });
  });
  return toDto(await loadOrThrow(id));
}

export function generatePdfBuffer(agreement) {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.275 841.889] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 2000 >>
stream
BT
/F1 16 Tf
70 760 Td
(FARM LEASE AGREEMENT) Tj
/F1 12 Tf
0 -40 Td
(Agreement Title: ${agreement.title}) Tj
0 -20 Td
(Agreement ID: ${agreement.id}) Tj
0 -20 Td
(Status: ${agreement.status.toUpperCase()}) Tj
0 -35 Td
(Tenant: ${agreement.tenant_name || 'N/A'}) Tj
0 -20 Td
(Landowner: ${agreement.owner_name || 'N/A'}) Tj
0 -20 Td
(Lease Term: ${agreement.start_date} to ${agreement.end_date}) Tj
0 -20 Td
(Total Amount: ${agreement.total_amount} ${agreement.currency}) Tj
0 -20 Td
(Installment: ${agreement.monthly_amount || 'N/A'} - Frequency: ${agreement.payment_frequency}) Tj
0 -40 Td
(Terms & Clauses:) Tj
${(agreement.clauses || []).slice(0, 10).map((c) => `0 -15 Td\n(- ${c.title || 'Clause'}: ${String(c.content || '').slice(0, 50)}) Tj`).join('\n')}
0 -40 Td
(Signatures & Verification:) Tj
${(agreement.signatures || []).map((s) => `0 -20 Td\n(- Signer: ${s.signer_id} - Method: ${s.method} - Signed At: ${s.signed_at}) Tj`).join('\n')}
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000002294 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
2379
%%EOF`;
  return Buffer.from(content, 'utf-8');
}
