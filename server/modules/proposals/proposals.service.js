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
  const startDate = terms.startDate
    ? new Date(terms.startDate)
    : terms.expectedStartDate
      ? new Date(terms.expectedStartDate)
      : terms.expected_start_date
        ? new Date(terms.expected_start_date)
        : new Date();
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

  // const terms     = proposal.terms && typeof proposal.terms === 'object' ? proposal.terms : {};
  const lessor = terms.lessorName || 'Lessor';
  const lessee = terms.lesseeName || proposal.investor?.fullName || 'Lessee';
  const startFmt = startDate.toLocaleDateString('en-GB');
  const endFmt = endDate.toLocaleDateString('en-GB');
  const currency = proposal.currency || 'USD';
  const totalFmt = Number(totalAmount).toLocaleString();
  const instFmt = Number(installmentAmount).toLocaleString();
  const freq = (terms.paymentFrequency ?? 'monthly');

  const clauses = [
    {
      title: 'Preamble and Parties',
      body:
        `This land lease contractual agreement is made between ${lessor} (the "Lessor") and ${lessee} (the "Lessee"). ` +
        `The term Lessee may also include successors/beneficiaries and/or representatives assigned accordingly.\n\n` +
        `Whereas the Lessee is a business entity established to engage in agricultural development and requires sufficient land for production purposes;\n` +
        `Whereas the Lessor is willing to provide the needed land in accordance with the terms and conditions stated within this agreement;\n\n` +
        `Now therefore, the parties have executed this land lease contractual agreement on ${startFmt} according to the terms and conditions indicated below.`,
      ordering: 0,
      isEditable: false,
    },
    {
      title: 'Article 1 – Scope of Agreement',
      body:
        `1.1 The scope of this lease agreement is to establish a long-term land lease for agricultural farming. ` +
        `The land is leased with all rights of easements, amenities, fittings, fixtures, structures, installations, property, or establishments standing thereon to the Lessee for the purposes mentioned herein.\n\n` +
        `1.2 This agreement applies to the "lease land" and grants full and exclusive use of the rural land, subject to rental payments stated in Article 2.\n\n` +
        (proposal.description ? `Description: ${proposal.description}` : ''),
      ordering: 1,
      isEditable: true,
    },
    {
      title: 'Article 2 – Period of the Land Lease and the Rate',
      body:
        `2.1 This land lease shall be in effect from ${startFmt} to ${endFmt}. Upon mutual agreement, it may be renewed for additional year(s).\n\n` +
        `2.2 Payment Procedure:\n` +
        `   2.2.1 A grace period applies as agreed. Unpaid rent during the grace period shall be prorated over the remaining term.\n` +
        `   2.2.2 The ${freq} payment shall be ${currency} ${instFmt} and the total payment for the lease period shall be ${currency} ${totalFmt}.\n` +
        `   2.2.3 Upon payment of rent, a receipt shall be issued immediately to the Lessee.\n` +
        `   2.2.4 There shall be a prepayment (down payment) of one period's rent.\n` +
        `   2.2.5 The Lessor reserves the right to revise the lease rate and inform the Lessee accordingly.`,
      ordering: 2,
      isEditable: false,
    },
    {
      title: 'Article 3 – Rights of the Lessee',
      body:
        `The Lessee shall have the right to:\n` +
        `3.1 Develop and administer the land in accordance with the terms of this agreement.\n` +
        `3.2 Build infrastructure such as irrigation systems, roads, offices, and residential buildings, subject to relevant permits.\n` +
        `3.3 Develop or administer the leased land by itself or through a legally represented individual or entity.\n` +
        `3.4 Develop, cultivate, and harvest the leased land using modern machinery and appropriate methods.\n` +
        `3.5 Obtain additional land based on performance, achievement, and need.\n` +
        `3.6 Terminate the agreement with at least six (6) months prior written notice, with convincing reason and good cause.`,
      ordering: 3,
      isEditable: false,
    },
    {
      title: 'Article 4 – Obligations of the Lessee',
      body:
        `4.1 The Lessee shall provide good care and conservation of the leased land and natural resources, including:\n` +
        `   a) Conserving trees not cleared during land preparation.\n` +
        `   b) Utilizing methods to prevent soil erosion, especially in sloped areas.\n` +
        `   c) Respecting and implementing legislation relating to natural resource conservation.\n` +
        `   d) Conducting an environmental impact assessment within four (4) months of execution.\n` +
        `4.2 The Lessee shall start developing the land within six (6) months from signing.\n` +
        `4.3 The Lessee shall develop one-third (1/3) of the leased land within one year and the entire land within three (3) years from signing.\n` +
        `4.4 Upon termination or expiry, the Lessee shall remove installed assets and hand over the land within six (6) months.\n` +
        `4.5 The Lessee shall provide accurate data and report investment activities upon request.\n` +
        `4.6 When the grace period ends, the Lessee shall settle annual rent per the predetermined lease rate.\n` +
        `4.7 The Lessee shall submit an action plan regarding utilization of the leased land upon entering this agreement.\n` +
        `4.8 Without written consent of the Lessor, the Lessee shall not use the land for any purpose other than stated in Article 3.\n` +
        `4.9 The Lessee may not transfer the land unless 75% is developed.\n` +
        `4.10 Upon developing 75% and obtaining the Lessor's permission, the Lessee may transfer the land; the Lessor shall respond promptly.`,
      ordering: 4,
      isEditable: false,
    },
    {
      title: 'Article 5 – Rights of the Lessor',
      body:
        `The Lessor has exclusive rights to:\n` +
        `5.1 Control and follow up that the Lessee executes all obligations diligently.\n` +
        `5.2 Take over undeveloped areas per sub-article 4.3 if the Lessee fails to correct within one year after a six-month warning notice.\n` +
        `5.3 Exercise rights under 5.1 without hindering the Lessee's activities.\n` +
        `5.4 Terminate the lease with convincing and justifiable good reason, subject to six (6) months prior notice.\n` +
        `5.5 Amend the land rent pursuant to this agreement.`,
      ordering: 5,
      isEditable: false,
    },
    {
      title: 'Article 6 – Obligations of the Lessor',
      body:
        `6.1 The Lessor shall hand over the leased land within one (1) month from signing, free from any obstructions.\n` +
        `6.2 The Lessor shall provide applicable tax exemptions and incentives in accordance with governing laws.\n` +
        `6.3 The Lessor shall ensure there are no legal limitations that may restrict the Lessee's duties under this agreement.\n` +
        `6.4 The Lessor shall arrange access to applicable research centers for soil testing and surveying.\n` +
        `6.5 If the Lessee fails to develop the land within stated time limits or becomes unable to pay rent, the Lessor may terminate with six (6) months prior warning, or extend the time limit for another six (6) months.\n` +
        `6.6 The Lessor shall cooperate in providing adequate security free of charge, except in cases of force majeure.`,
      ordering: 6,
      isEditable: false,
    },
    {
      title: 'Article 7 – Delivery of the Leased Land',
      body:
        `7.1 The Lessor shall deliver the land plan, title certificate, and other certificates within thirty (30) days from signing.\n` +
        `7.2 If delivery cannot be actualized due to reasons caused by the Lessor, the Lessor shall bear responsibility for such failure.\n` +
        `7.3 Delivery shall be effected once the initial prepayment is completed per Article 2.2.4.\n` +
        `7.4 The land shall be handed over within fifteen (15) days of signing.`,
      ordering: 7,
      isEditable: false,
    },
    {
      title: 'Article 8 – Amendment and Renewal of the Contract',
      body:
        `8.1 This agreement may be renewed on similar contractual terms and conditions.\n` +
        `8.2 If the Lessee wishes to renew, it shall notify the Lessor at least six (6) months before expiration.`,
      ordering: 8,
      isEditable: false,
    },
    {
      title: 'Article 9 – Grounds for Termination',
      body:
        `This agreement may be terminated for the following reasons:\n` +
        `9.1 When the lease period expires.\n` +
        `9.2 When the Lessor is unable to deliver the land due to force majeure.\n` +
        `9.3 When the Lessor fails to fulfill obligations after a six-month prior written notice from the Lessee.\n` +
        `9.4 When the Lessee fails to make payments for two (2) consecutive years.\n` +
        `9.5 When the Lessee fails to perform obligations after six months prior notice from the Lessor.\n` +
        `9.6 When the Lessor terminates with good reason after six months prior notice per sub-article 5.4.\n` +
        `9.7 When the Lessee terminates with good reason after six months prior notice per sub-article 3.6.`,
      ordering: 9,
      isEditable: false,
    },
    {
      title: 'Article 10 – Results of Contract Termination',
      body:
        `10.1 Upon termination, the Lessee shall return the leased land within six (6) months.\n` +
        `10.2 If terminated by the Lessee per 9.3 or by the Lessor per 9.6, the Lessor shall pay the Lessee the value of improvements at market rate after deducting outstanding dues.\n` +
        `10.3 If terminated for reasons in 9.4, 9.5, or 9.7, the Lessor is not obliged to make payments to the Lessee.\n` +
        `10.4 Upon termination, the Lessor has priority to negotiate and purchase properties on the land; if not interested, the Lessee may detach and take its property.`,
      ordering: 10,
      isEditable: false,
    },
    {
      title: 'Article 11 – Registration',
      body:
        `This agreement shall be subject to registration with the appropriate designated authority. Copies shall be sent to all relevant parties with a covering letter provided by the Lessor.`,
      ordering: 11,
      isEditable: false,
    },
    {
      title: 'Article 12 – Governing Law',
      body: `The applicable law of the jurisdiction in which the land is situated shall govern operations under this agreement.`,
      ordering: 12,
      isEditable: false,
    },
    {
      title: 'Article 13 – Force Majeure',
      body:
        `Neither party shall be held liable for failure to perform obligations caused by force majeure (acts of God, war, natural disasters, or government action beyond their control). ` +
        `The affected party shall notify the other within fifteen (15) days of the occurrence.`,
      ordering: 13,
      isEditable: false,
    },
    {
      title: 'Article 14 – Covenant for Peaceful Possession',
      body:
        `The Lessor guarantees that the Lessee has full right to use the land leased under this agreement. ` +
        `The Lessor confirms that the leased land shall remain under peaceful possession and the Lessee may use it without any problem.`,
      ordering: 14,
      isEditable: false,
    },
    {
      title: 'Article 15 – Calendar',
      body: `The Gregorian calendar shall be the primary calendar for the purposes of this agreement, unless otherwise stated.`,
      ordering: 15,
      isEditable: false,
    },
    {
      title: 'Article 16 – Annexes to the Agreement',
      body:
        `The following items are annexed and shall be considered part of this agreement:\n` +
        `16.1 The site plan of the leased land.\n` +
        `16.2 Photocopy of valid identification document or passport of the Lessee.\n` +
        `16.3 Photocopy of the Memorandum and Articles of Association (or equivalent constituting document) of the Lessee.`,
      ordering: 16,
      isEditable: false,
    },
    {
      title: 'Article 17 – Settlement of Disputes',
      body:
        `When a dispute arises, both parties shall endeavor to resolve it peacefully and to the mutual benefit of both parties. ` +
        `If the dispute cannot be resolved, it shall be referred to arbitration or the competent court of jurisdiction.`,
      ordering: 17,
      isEditable: false,
    },
    {
      title: 'Article 18 – Language',
      body: `This agreement has been executed between the contracting parties in English. In the event of any discrepancy between translations, the English version shall prevail.`,
      ordering: 18,
      isEditable: false,
    },
    {
      title: 'Article 19 – Notices and Offices',
      body:
        `19.1 The Lessee shall maintain a registered address for service of notices and shall notify the Lessor accordingly.\n` +
        `19.2 All communications and notices shall be in writing, delivered in person, by registered mail, or by electronic means to the addresses registered by each party.`,
      ordering: 19,
      isEditable: false,
    },
    {
      title: 'Article 20 – Effective Date',
      body:
        `This land lease agreement shall remain in effect from ${startFmt} to ${endFmt}, unless earlier terminated pursuant to the provisions of this agreement.`,
      ordering: 20,
      isEditable: false,
    },
    {
      title: 'Payment Verification',
      body: 'The agreement becomes active only after required signatures from both parties and successful verification of the initial payment receipt by the authorized representative.',
      ordering: 21,
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
