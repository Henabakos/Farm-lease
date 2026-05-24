// ============================================================================
// KYC (Know Your Customer) verification module.
//
// Users upload identity documents (selfie photo + national ID, etc.) via
// /files/upload, then call POST /kyc/documents with the storage_key to
// register the document for admin review. Admins approve or reject each
// document. When the user has both an approved 'photo' and 'national_id'
// the user's `verificationStatus` flips to VERIFIED.
// ============================================================================
import { prisma } from '../../db/prisma.js';
import { ForbiddenError, NotFoundError, ConflictError } from '../../shared/errors.js';
import { isAdmin } from '../../shared/scope.js';
import { paginate, paginated } from '../../shared/pagination.js';

const REQUIRED_TYPES_FOR_VERIFIED = ['photo', 'national_id'];

function toDto(doc) {
  return {
    id: doc.id,
    user_id: doc.userId,
    user_name: doc.user?.fullName ?? null,
    user_email: doc.user?.email ?? null,
    document_type: doc.documentType,
    storage_key: doc.storageKey,
    file_name: doc.fileName,
    mime_type: doc.mimeType,
    file_size: doc.fileSize,
    status: doc.status,
    reviewer_id: doc.reviewedById ?? null,
    reviewed_at: doc.reviewedAt?.toISOString?.() ?? doc.reviewedAt ?? null,
    review_notes: doc.reviewNotes ?? null,
    created_at: doc.createdAt?.toISOString?.() ?? doc.createdAt,
    updated_at: doc.updatedAt?.toISOString?.() ?? doc.updatedAt,
  };
}

async function loadOrThrow(id) {
  const doc = await prisma.kycDocument.findUnique({
    where: { id },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  });
  if (!doc) throw new NotFoundError('KYC document not found');
  return doc;
}

/** Recompute the user's verificationStatus from their approved documents. */
async function recomputeUserVerification(tx, userId) {
  const approved = await tx.kycDocument.findMany({
    where: { userId, status: 'APPROVED' },
    select: { documentType: true },
  });
  const approvedTypes = new Set(approved.map((d) => d.documentType));
  const hasAllRequired = REQUIRED_TYPES_FOR_VERIFIED.every((t) => approvedTypes.has(t));

  const anyPending = await tx.kycDocument.count({
    where: { userId, status: 'PENDING' },
  });

  let nextStatus;
  if (hasAllRequired) {
    nextStatus = 'VERIFIED';
  } else if (anyPending > 0 || approvedTypes.size > 0) {
    nextStatus = 'PENDING';
  } else {
    nextStatus = 'UNVERIFIED';
  }
  await tx.user.update({
    where: { id: userId },
    data: { verificationStatus: nextStatus },
  });
  return nextStatus;
}

// ----------------------------------------------------------------------------
// User-facing operations
// ----------------------------------------------------------------------------

export async function submitDocument(body, viewer) {
  // Re-submitting the same type replaces the previous one if it was rejected
  // or pending; an APPROVED document cannot be silently overwritten.
  const existing = await prisma.kycDocument.findFirst({
    where: { userId: viewer.id, documentType: body.document_type },
    orderBy: { createdAt: 'desc' },
  });
  if (existing && existing.status === 'APPROVED') {
    throw new ConflictError('This document type is already approved');
  }

  const created = await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.kycDocument.delete({ where: { id: existing.id } });
    }
    const doc = await tx.kycDocument.create({
      data: {
        userId: viewer.id,
        documentType: body.document_type,
        storageKey: body.storage_key,
        fileName: body.file_name,
        mimeType: body.mime_type,
        fileSize: body.file_size,
        status: 'PENDING',
      },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
    await recomputeUserVerification(tx, viewer.id);
    return doc;
  });
  return toDto(created);
}

export async function getMine(viewer) {
  const [user, docs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: viewer.id },
      select: { verificationStatus: true },
    }),
    prisma.kycDocument.findMany({
      where: { userId: viewer.id },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return {
    verification_status: (user?.verificationStatus ?? 'UNVERIFIED').toLowerCase(),
    required_document_types: REQUIRED_TYPES_FOR_VERIFIED,
    documents: docs.map(toDto),
  };
}

export async function deleteMine(id, viewer) {
  const doc = await loadOrThrow(id);
  if (doc.userId !== viewer.id && !isAdmin(viewer)) {
    throw new ForbiddenError('Cannot delete this document');
  }
  if (doc.status === 'APPROVED' && !isAdmin(viewer)) {
    throw new ConflictError('Approved documents cannot be deleted by the owner');
  }
  await prisma.$transaction(async (tx) => {
    await tx.kycDocument.delete({ where: { id } });
    await recomputeUserVerification(tx, doc.userId);
  });
  return { ok: true };
}

// ----------------------------------------------------------------------------
// Admin-facing operations
// ----------------------------------------------------------------------------

export async function list(query, viewer) {
  if (!isAdmin(viewer)) throw new ForbiddenError('Admin only');
  const { page, pageSize, status, user_id } = query;
  const where = {
    ...(status ? { status } : {}),
    ...(user_id ? { userId: user_id } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.kycDocument.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      ...paginate({ page, pageSize }),
    }),
    prisma.kycDocument.count({ where }),
  ]);
  return paginated(rows.map(toDto), total, { page, pageSize });
}

export async function review(id, body, viewer) {
  if (!isAdmin(viewer)) throw new ForbiddenError('Admin only');
  const doc = await loadOrThrow(id);
  if (doc.status !== 'PENDING') {
    throw new ConflictError(`Cannot review a document already ${doc.status.toLowerCase()}`);
  }
  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.kycDocument.update({
      where: { id },
      data: {
        status: body.decision,
        reviewedById: viewer.id,
        reviewedAt: new Date(),
        reviewNotes: body.notes ?? null,
      },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
    await recomputeUserVerification(tx, doc.userId);
    return next;
  });
  return toDto(updated);
}
