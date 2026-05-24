// Payments service.
//
// State machine:
//   PENDING  → SUBMITTED  (payer uploads receipt)
//   SUBMITTED → VERIFIED / REJECTED  (reviewer decision; only cluster rep / admin)
//   VERIFIED → REFUNDED  (admin only, with reason)
//
// Duplicate detection (Phase 5 hook; full pipeline lands in Phase 8 via OCR
// worker): on receipt submission we check whether a previously-uploaded
// receipt with the same `perceptual_hash` already exists. If so we flag the
// PaymentVerification record with `isDuplicate=true` and link to the original.
//
// Authorization:
//   • Create: cluster rep / admin (drafts an installment).
//   • Read:   payer, receiver, cluster owner, admin.
//   • Submit receipt: payer only.
//   • Verify:  receiver (cluster rep) or admin.
//   • Refund:  admin only.
import { prisma } from '../../db/prisma.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js';
import { isAdmin } from '../../shared/scope.js';
import { paginate, paginated } from '../../shared/pagination.js';
import { recordOutbox } from '../../events/bus.js';

function toDto(p) {
  if (!p) return null;
  return {
    id: p.id,
    agreement_id: p.agreementId,
    agreement_title: p.agreement?.title ?? null,
    payer_id: p.payerId,
    receiver_id: p.receiverId,
    payer_name: p.payer?.fullName ?? null,
    receiver_name: p.receiver?.fullName ?? null,
    amount: Number(p.amount),
    currency: p.currency,
    type: p.type,
    status: p.status.toLowerCase(),
    due_date: p.dueDate?.toISOString?.().slice(0, 10) ?? p.dueDate ?? null,
    paid_at: p.paidAt?.toISOString?.() ?? p.paidAt ?? null,
    notes: p.notes ?? null,
    receipts: (p.receipts ?? []).map((r) => ({
      id: r.id,
      storage_key: r.storageKey,
      file_name: r.fileName,
      mime_type: r.mimeType,
      file_size: r.fileSize,
      perceptual_hash: r.perceptualHash,
      created_at: r.createdAt.toISOString(),
    })),
    verification: p.verification
      ? {
          id: p.verification.id,
          decision: p.verification.decision,
          reviewer_id: p.verification.reviewerId,
          reviewer_notes: p.verification.reviewerNotes,
          is_duplicate: p.verification.isDuplicate,
          duplicate_of_id: p.verification.duplicateOfId,
          fraud_flags: p.verification.fraudFlags,
          reviewed_at: p.verification.reviewedAt?.toISOString?.() ?? null,
        }
      : null,
    created_at: p.createdAt?.toISOString?.() ?? p.createdAt,
  };
}

const INCLUDE = {
  agreement: {
    select: {
      id: true,
      title: true,
      clusterId: true,
      cluster: { select: { ownerId: true } },
      proposal: { select: { targetType: true, targetUserId: true } },
    },
  },
  payer:     { select: { id: true, fullName: true } },
  receiver:  { select: { id: true, fullName: true } },
  receipts:  { orderBy: { createdAt: 'desc' } },
  verification: true,
};

async function loadOrThrow(id) {
  const p = await prisma.payment.findUnique({ where: { id }, include: INCLUDE });
  if (!p) throw new NotFoundError('Payment not found');
  return p;
}

function canView(p, viewer) {
  if (isAdmin(viewer)) return true;
  if (viewer.id === p.payerId)    return true;
  if (viewer.id === p.receiverId) return true;
  if (viewer.id === p.agreement?.cluster?.ownerId) return true;
  return false;
}

export async function list(query, viewer) {
  const { page, pageSize, status } = query;
  const agreementId = query.agreementId ?? query.agreement_id;
  const where = {
    AND: [
      isAdmin(viewer)
        ? {}
        : { OR: [{ payerId: viewer.id }, { receiverId: viewer.id }, { agreement: { cluster: { ownerId: viewer.id } } }] },
      status ? { status } : {},
      agreementId ? { agreementId } : {},
    ],
  };
  const [rows, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
      ...paginate({ page, pageSize }),
    }),
    prisma.payment.count({ where }),
  ]);
  return paginated(rows.map(toDto), total, { page, pageSize });
}

export async function getById(id, viewer) {
  const p = await loadOrThrow(id);
  if (!canView(p, viewer)) throw new ForbiddenError();
  return toDto(p);
}

export async function create(body, viewer) {
  const agreementId = body.agreementId ?? body.agreement_id;
  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
    include: { proposal: true, cluster: { select: { ownerId: true } } },
  });
  if (!agreement) throw new NotFoundError('Agreement not found');
  const receiverId = agreement.proposal.targetType === 'FARMER'
    ? agreement.proposal.targetUserId
    : agreement.cluster?.ownerId;
  if (!receiverId) throw new ConflictError('Agreement has no payment receiver');
  // Payer = the proposing investor; receiver = cluster owner or target farmer.
  const payerId = agreement.proposal.investorId;
  // Either party (or admin) may initiate the payment record. The receiver
  // typically schedules repayments; the payer (investor) typically initiates
  // the initial DISBURSEMENT so they can immediately submit a receipt.
  if (viewer.id !== receiverId && viewer.id !== payerId && !isAdmin(viewer)) {
    throw new ForbiddenError('Only the agreement parties can schedule payments');
  }

  const payment = await prisma.payment.create({
    data: {
      agreementId,
      payerId,
      receiverId,
      amount: body.amount,
      currency: body.currency ?? agreement.currency ?? 'USD',
      type: body.type ?? 'REPAYMENT',
      dueDate: body.due_date ? new Date(body.due_date) : null,
      notes: body.notes ?? null,
      status: 'PENDING',
    },
  });
  return toDto(await loadOrThrow(payment.id));
}

export async function submitReceipt(id, body, viewer) {
  const p = await loadOrThrow(id);
  if (viewer.id !== p.payerId && !isAdmin(viewer)) {
    throw new ForbiddenError('Only the payer can submit a receipt');
  }
  if (!['PENDING', 'SUBMITTED'].includes(p.status)) {
    throw new ConflictError(`Cannot submit receipt from ${p.status}`);
  }
  // Duplicate detection: any prior receipt with the same perceptual hash?
  let duplicateOf = null;
  if (body.perceptual_hash) {
    const dup = await prisma.paymentReceipt.findFirst({
      where: {
        perceptualHash: body.perceptual_hash,
        paymentId: { not: id },
      },
      select: { paymentId: true },
    });
    if (dup) duplicateOf = dup.paymentId;
  }

  await prisma.$transaction(async (tx) => {
    await tx.paymentReceipt.create({
      data: {
        paymentId: id,
        storageKey: body.storage_key,
        fileName: body.file_name,
        mimeType: body.mime_type,
        fileSize: body.file_size,
        perceptualHash: body.perceptual_hash ?? null,
        extractedFields: body.extracted_fields ?? null,
        uploadedById: viewer.id,
      },
    });
    await tx.payment.update({
      where: { id },
      data: { status: 'SUBMITTED', paidAt: new Date() },
    });
    await tx.paymentVerification.upsert({
      where: { paymentId: id },
      update: { isDuplicate: !!duplicateOf, duplicateOfId: duplicateOf, fraudFlags: duplicateOf ? ['duplicate_hash'] : [] },
      create: {
        paymentId: id,
        decision: 'PENDING',
        isDuplicate: !!duplicateOf,
        duplicateOfId: duplicateOf,
        fraudFlags: duplicateOf ? ['duplicate_hash'] : [],
      },
    });
    await recordOutbox(tx, {
      eventType: 'payment.receipt.uploaded',
      aggregateType: 'Payment',
      aggregateId: id,
      payload: { paymentId: id, payerId: p.payerId, receiverId: p.receiverId, duplicateOf },
    });
  });
  return toDto(await loadOrThrow(id));
}

export async function verify(id, body, viewer) {
  const p = await loadOrThrow(id);
  if (viewer.id !== p.receiverId && !isAdmin(viewer)) {
    throw new ForbiddenError('Only the receiver or an admin can verify');
  }
  if (p.status !== 'SUBMITTED') {
    throw new ConflictError(`Cannot verify from ${p.status}`);
  }
  const decision = body.decision ?? 'APPROVED';
  const newStatus = decision === 'APPROVED' ? 'VERIFIED' : decision === 'REJECTED' ? 'REJECTED' : 'SUBMITTED';

  await prisma.$transaction(async (tx) => {
    await tx.paymentVerification.update({
      where: { paymentId: id },
      data: {
        decision,
        reviewerId: viewer.id,
        reviewerNotes: body.reviewer_notes ?? null,
        reviewedAt: new Date(),
      },
    });
    await tx.payment.update({ where: { id }, data: { status: newStatus } });
    await recordOutbox(tx, {
      eventType: decision === 'APPROVED' ? 'payment.verified' : decision === 'REJECTED' ? 'payment.rejected' : 'payment.escalated',
      aggregateType: 'Payment',
      aggregateId: id,
      payload: { paymentId: id, reviewerId: viewer.id, decision },
    });

    if (decision === 'APPROVED' && p.agreementId) {
      await tx.agreement.update({
        where: { id: p.agreementId },
        data: {
          status: 'ACTIVE',
          activatedAt: new Date(),
        },
      });
      await recordOutbox(tx, {
        eventType: 'agreement.activated',
        aggregateType: 'Agreement',
        aggregateId: p.agreementId,
        payload: { agreementId: p.agreementId },
      });
    }
  });
  return toDto(await loadOrThrow(id));
}

export async function refund(id, body, viewer) {
  if (!isAdmin(viewer)) throw new ForbiddenError('Only admin can issue refunds');
  const p = await loadOrThrow(id);
  if (p.status !== 'VERIFIED') throw new ConflictError(`Cannot refund from ${p.status}`);
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id }, data: { status: 'REFUNDED' } });
    await recordOutbox(tx, {
      eventType: 'payment.refunded',
      aggregateType: 'Payment',
      aggregateId: id,
      payload: { paymentId: id, reason: body?.reason ?? null },
    });
  });
  return toDto(await loadOrThrow(id));
}
