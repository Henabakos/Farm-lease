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

    // When fully signed, auto-create the initial disbursement payment so the
    // investor has a record to upload a receipt against. Idempotent: only
    // create if no DISBURSEMENT payment exists yet for this agreement.
    if (isComplete) {
      const existingDisbursement = await tx.payment.findFirst({
        where: { agreementId: id, type: 'DISBURSEMENT' },
        select: { id: true },
      });
      if (!existingDisbursement) {
        const payerId = a.proposal.investorId;
        const receiverId = a.proposal.targetType === 'FARMER'
          ? a.proposal.targetUserId
          : a.cluster?.ownerId;
        if (payerId && receiverId) {
          await tx.payment.create({
            data: {
              agreementId: id,
              payerId,
              receiverId,
              amount: a.totalAmount,
              currency: a.currency ?? 'USD',
              type: 'DISBURSEMENT',
              status: 'PENDING',
              dueDate: a.startDate ?? null,
              notes: 'Initial lease disbursement — upload your payment receipt to activate the agreement.',
            },
          });
        }
      }
    }

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

export async function generatePdfBuffer(agreement) {
  const PDFDocument = (await import('pdfkit')).default;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60, bufferPages: true });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ─── Helpers ──────────────────────────────────────────────────────────────
    const W = doc.page.width - 120; // usable width (60px margin each side)

    const h1 = (text) => {
      doc.font('Helvetica-Bold').fontSize(13).text(text, { align: 'center' }).moveDown(0.4);
    };
    const h2 = (text) => {
      doc.font('Helvetica-Bold').fontSize(11).text(text).moveDown(0.25);
    };
    const body = (text) => {
      doc.font('Helvetica').fontSize(10).text(text, { align: 'justify', lineGap: 2 }).moveDown(0.5);
    };
    const label = (key, val) => {
      doc.font('Helvetica-Bold').fontSize(10).text(`${key}: `, { continued: true })
         .font('Helvetica').text(val ?? 'N/A').moveDown(0.15);
    };
    const rule = () => {
      doc.moveTo(60, doc.y).lineTo(60 + W, doc.y).strokeColor('#CCCCCC').lineWidth(0.5).stroke().moveDown(0.4);
    };
    const article = (num, title, content) => {
      if (doc.y > doc.page.height - 160) doc.addPage();
      h2(`Article ${num}`);
      doc.font('Helvetica-Bold').fontSize(10).text(title).moveDown(0.2);
      body(content);
      rule();
    };

    // ─── Computed values ───────────────────────────────────────────────────────
    const lessor   = agreement.owner_name  || 'Lessor (Ministry of Agriculture and Rural Development)';
    const lessee   = agreement.tenant_name || 'Lessee';
    const title    = agreement.title       || 'Farm Lease Agreement';
    const startFmt = agreement.start_date  ? new Date(agreement.start_date).toLocaleDateString('en-GB') : 'N/A';
    const endFmt   = agreement.end_date    ? new Date(agreement.end_date).toLocaleDateString('en-GB')   : 'N/A';
    const total    = Number(agreement.total_amount || 0).toLocaleString();
    const monthly  = Number(agreement.monthly_amount || 0).toLocaleString();
    const currency = agreement.currency    || 'USD';
    const freq     = (agreement.payment_frequency || 'monthly').charAt(0).toUpperCase()
                   + (agreement.payment_frequency || 'monthly').slice(1);
    const agreementId = agreement.id;
    const status      = (agreement.status || 'DRAFT').toUpperCase();

    // ─── Any extra DB clauses beyond the 2 seed rows ─────────────────────────
    const dbClauses = (agreement.clauses || []);
    const extraClauses = dbClauses.filter(
      (c) => !['Lease Scope', 'Payment Verification'].includes(c.title)
    );

    // ══════════════════════════════════════════════════════════════════════════
    // PAGE 1 — HEADER + PREAMBLE
    // ══════════════════════════════════════════════════════════════════════════
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#888888')
       .text('UNOFFICIAL TRANSLATION', { align: 'center' }).moveDown(0.5);

    doc.fillColor('#000000');
    h1('FARM LAND LEASE AGREEMENT');
    h1(title.toUpperCase());

    rule();

    doc.font('Helvetica-Bold').fontSize(10).text('Contractual Agreement ID:', { continued: true })
       .font('Helvetica').text(`  ${agreementId}`).moveDown(0.15);
    doc.font('Helvetica-Bold').fontSize(10).text('Status:', { continued: true })
       .font('Helvetica').text(`  ${status}`).moveDown(0.5);

    rule();

    // Preamble parties
    doc.font('Helvetica').fontSize(10).text(
      `This land lease contractual agreement is made between`, { align: 'justify' }
    ).moveDown(0.3);

    doc.font('Helvetica-Bold').fontSize(10).text(lessor, { align: 'center' }).moveDown(0.2);
    doc.font('Helvetica').fontSize(10).text('(hereinafter referred to as the "Lessor")', { align: 'center' }).moveDown(0.4);

    doc.font('Helvetica').fontSize(10).text('and', { align: 'center' }).moveDown(0.4);

    doc.font('Helvetica-Bold').fontSize(10).text(lessee, { align: 'center' }).moveDown(0.2);
    doc.font('Helvetica').fontSize(10).text(
      '(hereinafter referred to as the "Lessee"). The term Lessee may also include successors/beneficiaries and/or representatives assigned accordingly.',
      { align: 'center' }
    ).moveDown(0.6);

    rule();

    body(
      `Whereas, the Lessee is a business entity established to engage in agricultural development under applicable law and requires sufficient land for production purposes;\n\n` +
      `Whereas, the Lessor is willing to provide the needed land in accordance with the terms and conditions stated within this agreement;\n\n` +
      `Now therefore, the parties have executed this land lease contractual agreement according to the terms and conditions indicated below.`
    );

    rule();

    // Effective dates summary
    label('Lease Start Date', startFmt);
    label('Lease End Date',   endFmt);
    label('Total Amount',     `${currency} ${total}`);
    label(`${freq} Installment`, `${currency} ${monthly}`);
    doc.moveDown(0.5);

    // ══════════════════════════════════════════════════════════════════════════
    // LEASE SCOPE (from DB clause)
    // ══════════════════════════════════════════════════════════════════════════
    const scopeClause = dbClauses.find((c) => c.title === 'Lease Scope');
    if (scopeClause) {
      rule();
      h2('Lease Scope');
      body(scopeClause.body || scopeClause.content || '');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ARTICLES 1–20
    // ══════════════════════════════════════════════════════════════════════════
    doc.addPage();

    article('1', 'Scope of Agreement',
      `1.1 The scope of this lease agreement is to establish a long-term land lease for agricultural farming. The land is leased with all rights of easements of amenities, fittings, fixtures, structures, installations, property, or establishments standing thereon to the Lessee for the purposes mentioned herein.\n\n` +
      `1.2 This lease agreement shall be applicable to the "lease land" which allows full and exclusive use of the rural land and to make rental payments as stated in Article 2.`
    );

    article('2', 'Period of the Land Lease and the Rate',
      `2.1 This land lease shall be in effect for the period stated (from ${startFmt} to ${endFmt}). Upon mutual agreement of both parties, it may be renewed for additional year(s).\n\n` +
      `2.2 Payment Procedure:\n` +
      `   2.2.1 From the date this lease is signed, there shall be a grace period as agreed. Unpaid rent during the grace period shall be prorated over the remaining years and paid with the regular annual payment.\n` +
      `   2.2.2 The annual payment shall be ${currency} ${monthly} (${freq}) and the total amount of payment for the lease period shall be ${currency} ${total}.\n` +
      `   2.2.3 Upon payment of rent, a receipt shall be issued immediately to the Lessee.\n` +
      `   2.2.4 There shall be a prepayment (down payment) of one period's rent as stated above.\n` +
      `   2.2.5 The Lessor reserves the right to revise and change the lease rate and inform the Lessee accordingly.`
    );

    article('3', 'Rights of the Lessee',
      `The Lessee shall have the right to:\n\n` +
      `3.1 Develop and administer the land in accordance with the terms of this agreement.\n` +
      `3.2 Build, when deemed appropriate, infrastructure such as irrigation systems, roads, offices, and residential buildings, by submitting permit requests to concerned authorities.\n` +
      `3.3 Develop or administer the leased land by itself or through a legally represented individual or entity (a person or institution with power of attorney).\n` +
      `3.4 Develop and cultivate the leased land and collect the harvest by employing modern machinery and other appropriate methods.\n` +
      `3.5 Obtain additional land based on the performance, achievement, and need of the company.\n` +
      `3.6 Terminate the land lease contractual agreement subject to at least six (6) months prior written notice with convincing reason and good cause.`
    );

    article('4', 'Obligations of the Lessee',
      `4.1 The Lessee shall provide good care and conservation of the leased land and natural resources thereon, including:\n` +
      `   a) Conserving trees not cleared during land preparation.\n` +
      `   b) Utilizing methods appropriate to prevent soil erosion, especially in sloped areas.\n` +
      `   c) Respecting and implementing legislation relating to natural resource conservation.\n` +
      `   d) Conducting an environmental impact assessment within four (4) months of execution.\n\n` +
      `4.2 The Lessee shall start developing the land within six (6) months from signing, provided all licenses are issued.\n` +
      `4.3 The Lessee shall develop one-third (1/3) of the leased land within one year and the entire leased land within three (3) years from signing.\n` +
      `4.4 Upon termination or expiry, the Lessee shall remove installed assets and hand over the land within six (6) months.\n` +
      `4.5 The Lessee shall provide accurate data and report investment activities upon request.\n` +
      `4.6 When the grace period ends, the Lessee shall settle the annual rent per the predetermined lease rate.\n` +
      `4.7 The Lessee shall submit an action plan regarding utilization of the leased land upon entering into this agreement.\n` +
      `4.8 Without written consent of the Lessor, the Lessee shall not use the land for any purpose other than stated in Article 3.\n` +
      `4.9 The Lessee has no right to transfer the land unless 75% of the land is developed.\n` +
      `4.10 Upon developing 75% and obtaining the Lessor's permission, the Lessee may transfer the land. The Lessor shall respond promptly.`
    );

    article('5', 'Rights of the Lessor',
      `The Lessor has exclusive rights to:\n\n` +
      `5.1 Control and follow up that the Lessee is executing all obligations diligently.\n` +
      `5.2 Take over undeveloped areas of the leased land in accordance with sub-article 4.3, upon expiry of the one-year limit, if the Lessee fails to correct such failure within one year after a six-month warning notice.\n` +
      `5.3 Exercise the right mentioned under Article 5.1 without causing hindrances to the Lessee's work and activities.\n` +
      `5.4 Terminate the lease agreement, with convincing and justifiable good reason, subject to six (6) months prior notice.\n` +
      `5.5 Amend the land rent pursuant to this lease agreement.`
    );

    article('6', 'Obligations of the Lessor',
      `6.1 The Lessor shall hand over the leased land within one (1) month from the date of signing, free from any obstructions.\n` +
      `6.2 The Lessor shall provide special privileges, such as applicable tax exemptions and incentives, in accordance with the governing laws.\n` +
      `6.3 The Lessor shall ensure there are no legal or other limitations that may restrict the Lessee from executing its duties under this agreement.\n` +
      `6.4 The Lessor shall arrange access to applicable government research centers for soil testing and surveying.\n` +
      `6.5 If the Lessee fails to develop the land within stated time limits, causes damage to natural resources, or becomes unable to pay rent, the Lessor may terminate the lease with six (6) months prior warning; absent such notice, the Lessor may extend the time limit for another six (6) months.\n` +
      `6.6 The Lessor shall cooperate in providing adequate security, free of charge, so the Lessee may develop the land peacefully, except in cases of force majeure.`
    );

    article('7', 'Delivery of the Leased Land',
      `7.1 The Lessor shall deliver to the Lessee the land plan, title certificate, and other certificates within thirty (30) days from the signing of this agreement.\n` +
      `7.2 If the delivery cannot be actualized due to reasons caused by the Lessor, the Lessor shall bear responsibility for such failure.\n` +
      `7.3 Delivery of the leased land shall be effected once the initial prepayment is completed in accordance with Article 2.2.4.\n` +
      `7.4 The land shall be handed over within fifteen (15) days of the signing of this agreement.`
    );

    article('8', 'Amendment and Renewal of the Contract',
      `8.1 This land lease agreement shall be renewable on similar contractual terms and conditions.\n` +
      `8.2 If the Lessee wishes to renew the agreement, it shall notify the Lessor at least six (6) months before the expiration of the contract period.`
    );

    article('9', 'Grounds for Termination of the Contract',
      `This land lease agreement may be terminated for the following reasons:\n\n` +
      `9.1 When the land lease contract period expires.\n` +
      `9.2 When the Lessor is unable to deliver the land due to causes beyond reasonable control (force majeure).\n` +
      `9.3 When the Lessor fails to fulfill any obligations even after the Lessee has submitted a six-month prior written notice.\n` +
      `9.4 When the Lessee fails to make annual rental and other payments for two (2) consecutive years.\n` +
      `9.5 When the Lessee fails to perform contractual obligations after the Lessor has given six months prior notice.\n` +
      `9.6 When the Lessor, by giving a six-month prior notice, has good reasons to terminate as indicated in sub-article 5.4.\n` +
      `9.7 When the Lessee, by giving a six-month prior notice, has good reasons to terminate as indicated in sub-article 3.6.`
    );

    article('10', 'Results of Contract Termination',
      `10.1 Upon termination, the Lessee shall return the leased land to the Lessor within six (6) months from the date of termination.\n` +
      `10.2 When this agreement is terminated by the Lessee per Article 9.3 or by the Lessor per Article 9.6, the Lessor shall pay the Lessee the value of improvements and expenditures at market rate after deducting outstanding dues.\n` +
      `10.3 If this agreement is terminated for reasons stated in Articles 9.4, 9.5, or 9.7, the Lessor shall not be obliged to make any payments to the Lessee.\n` +
      `10.4 Upon termination, the Lessor has priority to negotiate and purchase properties on the land; if not interested, the Lessee has the right to detach and take its property.`
    );

    article('11', 'Registration',
      `This land lease agreement shall be subject to registration with the appropriate designated authority. Copies of this agreement shall be sent to the Lessor, the Lessee, and all relevant offices with a covering letter provided by the Lessor.`
    );

    article('12', 'Governing Law',
      `The applicable law of the jurisdiction in which the land is situated shall govern operations under this agreement.`
    );

    article('13', 'Force Majeure',
      `Regarding matters of conditions that pertain to forces of majeure (acts of God, war, natural disasters, or government action beyond the control of the parties), neither party shall be held liable for failure to perform obligations caused thereby. The affected party shall notify the other within fifteen (15) days of the occurrence.`
    );

    article('14', 'Covenant for Peaceful Possession/Usage',
      `The Lessor guarantees that the Lessee has full right to use the land leased under this agreement. The Lessor confirms that the leased land shall remain under peaceful possession and the Lessee shall make use of it without any problem.`
    );

    article('15', 'Calendar',
      `The Gregorian calendar shall be used as the primary calendar for the purposes of this agreement, unless otherwise stated.`
    );

    article('16', 'Annexes to the Agreement',
      `The following items are annexed and shall be considered as part of this agreement:\n\n` +
      `16.1 The site plan of the leased land.\n` +
      `16.2 Photocopy of valid identification document or passport of the Lessee.\n` +
      `16.3 Photocopy of the Memorandum and Articles of Association (or equivalent constituting document) of the Lessee.`
    );

    article('17', 'Settlement of Disputes',
      `When a dispute arises between the Lessor and the Lessee in connection with or arising out of this land lease agreement, both parties shall endeavor to resolve the dispute peacefully and to the mutual benefit of both parties. If the dispute cannot be resolved accordingly, it shall be referred to arbitration or the competent court of jurisdiction.`
    );

    article('18', 'Language',
      `This agreement has been signed between the contracting parties in English. In the event of any discrepancy between translations, the English version shall prevail.`
    );

    article('19', 'Notices and Establishing Offices',
      `19.1 The Lessee shall establish and maintain a registered address for service of notices and shall notify the Lessor accordingly.\n` +
      `19.2 All communications and notices between the parties shall be in writing. Such notices shall be delivered in person, by registered mail, or electronic means to the addresses registered by each party.`
    );

    article('20', 'Effective Date of this Contract',
      `This land lease agreement shall remain in effect for the agreed term starting ${startFmt} and coming to expiry on ${endFmt}, unless earlier terminated pursuant to the provisions of this agreement.`
    );

    // ─── Additional / custom clauses (from DB) ────────────────────────────────
    if (extraClauses.length > 0) {
      doc.addPage();
      h2('Additional Provisions');
      rule();
      extraClauses.forEach((c, i) => {
        h2(`Addendum ${i + 1}: ${c.title}`);
        body(c.body || c.content || '');
        rule();
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PAYMENT VERIFICATION CLAUSE (from DB)
    // ──────────────────────────────────────────────────────────────────────────
    const pvClause = dbClauses.find((c) => c.title === 'Payment Verification');
    if (pvClause) {
      if (doc.y > doc.page.height - 120) doc.addPage();
      h2('Payment Verification');
      body(pvClause.body || pvClause.content || '');
      rule();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SIGNATURE PAGE
    // ══════════════════════════════════════════════════════════════════════════
    doc.addPage();

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#888888')
       .text('UNOFFICIAL TRANSLATION', { align: 'center' }).moveDown(0.5);
    doc.fillColor('#000000');
    h1('EXECUTION / SIGNATURE PAGE');
    rule();

    body(
      `IN WITNESS WHEREOF, the parties have executed this Farm Land Lease Agreement as of the date first written above.`
    );

    // Signature table – two columns
    const colW = (W - 20) / 2;
    const sigY = doc.y + 10;

    // Lessor column
    doc.font('Helvetica-Bold').fontSize(10)
       .text('LESSOR', 60, sigY, { width: colW });
    doc.font('Helvetica').fontSize(10)
       .text(lessor, 60, sigY + 18, { width: colW });
    doc.font('Helvetica').fontSize(9).fillColor('#555')
       .text('Name: _____________________________', 60, sigY + 50, { width: colW })
       .text('Title: _____________________________', 60, sigY + 70, { width: colW })
       .text('Signature: ________________________', 60, sigY + 90, { width: colW })
       .text('Date: _____________________________', 60, sigY + 110, { width: colW });

    // Lessee column
    const col2X = 60 + colW + 20;
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10)
       .text('LESSEE', col2X, sigY, { width: colW });
    doc.font('Helvetica').fontSize(10)
       .text(lessee, col2X, sigY + 18, { width: colW });
    doc.font('Helvetica').fontSize(9).fillColor('#555')
       .text('Name: _____________________________', col2X, sigY + 50, { width: colW })
       .text('Title: _____________________________', col2X, sigY + 70, { width: colW })
       .text('Signature: ________________________', col2X, sigY + 90, { width: colW })
       .text('Date: _____________________________', col2X, sigY + 110, { width: colW });

    doc.fillColor('#000000').moveDown(8);
    rule();

    // Signatures already recorded
    const sigs = agreement.signatures || [];
    if (sigs.length > 0) {
      h2('Recorded Digital Signatures');
      sigs.forEach((s) => {
        doc.font('Helvetica').fontSize(9)
           .text(`• Signer: ${s.signer_id || s.signerUserId || 'N/A'}  |  Method: ${s.method || 'N/A'}  |  Signed: ${s.signed_at || s.signedAt || 'N/A'}`)
           .moveDown(0.2);
      });
      rule();
    }

    // Witnesses
    doc.moveDown(0.5);
    h2('Witnesses');
    doc.font('Helvetica').fontSize(9).fillColor('#555');
    [1, 2, 3].forEach((n) => {
      doc.text(`${n}. Name: _________________________    Signature: _______________    Date: ____________`).moveDown(0.5);
    });

    doc.fillColor('#000000').moveDown(1);
    rule();

    // Footer note
    doc.font('Helvetica').fontSize(8).fillColor('#888888').text(
      `This document is an auto-generated draft based on the agreed proposal terms. It must be reviewed and signed by all parties to become legally binding. Agreement ID: ${agreementId}`,
      { align: 'center' }
    );

    // Page numbers
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.font('Helvetica').fontSize(8).fillColor('#AAAAAA')
         .text(`Page ${i + 1} of ${totalPages}`, 60, doc.page.height - 40, {
           align: 'center', width: W
         });
    }

    doc.end();
  });
}



