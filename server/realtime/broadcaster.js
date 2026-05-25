// ============================================================================
// Realtime broadcaster.
//
// The single subscriber that turns DOMAIN events into:
//   1. Socket.IO room emissions (frontend reacts instantly when online).
//   2. Persistent Notification rows (so users see the event when they
//      reconnect / open another device).
//   3. Async email notifications enqueued to the BullMQ email queue.
// ============================================================================

import { on as onLocal } from '../events/bus.js';
import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import * as notifications from '../modules/notifications/notifications.service.js';
import { enqueue } from '../queues/index.js';

let io = null;

export function attachBroadcaster(socketIoInstance) {
  io = socketIoInstance;
  registerSubscribers();
  logger.info('realtime broadcaster attached');
}

function emit(room, event, payload) {
  if (!io) return;
  io.to(room).emit(event, payload);
}

// ----------------------------------------------------------------------------
// Notification & Email helpers
// ----------------------------------------------------------------------------
async function pushNotification(recipientId, partial, broadcastEvent = 'notification') {
  try {
    const row = await notifications.create({ recipientId, ...partial });
    emit(`notifications:${recipientId}`, broadcastEvent, {
      id: row.id,
      title: row.title,
      body: row.body,
      type: row.type,
      relatedId: row.relatedId,
      relatedType: row.relatedType,
      link: row.link,
      timestamp: row.createdAt,
    });
  } catch (err) {
    logger.error({ err, recipientId, partial }, 'pushNotification failed');
  }
}

async function sendEmailNotification(userId, subject, html, text) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });
    if (user?.email) {
      await enqueue.email({
        to: user.email,
        subject,
        html,
        text: text || subject,
      });
      logger.info({ userId, email: user.email, subject }, 'Enqueued email notification');
    }
  } catch (err) {
    logger.error({ err, userId }, 'sendEmailNotification failed');
  }
}

function agreementPartyIds(agreement) {
  const counterpartyId = agreement.proposal?.targetType === 'FARMER'
    ? agreement.proposal?.targetUserId
    : agreement.cluster?.ownerId;
  return new Set([agreement.proposal?.investorId, counterpartyId].filter(Boolean));
}

// ----------------------------------------------------------------------------
// Event subscribers
// ----------------------------------------------------------------------------
function registerSubscribers() {
  // -- Messaging --------------------------------------------------------
  onLocal('message.created', async ({ messageId, conversationId, senderId, recipientId, preview }) => {
    // 1. Realtime fan-out into the per-conversation room with the FULL
    //    message DTO so subscribed clients can render without a refetch.
    const full = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: { select: { fullName: true } },
        attachments: true,
      },
    });
    if (full) {
      emit(`messages:${conversationId}`, 'new_message', {
        id: full.id,
        conversationId: full.conversationId,
        senderId: full.senderId,
        senderName: full.sender?.fullName ?? null,
        content: full.content,
        isSystem: full.isSystem,
        timestamp: full.createdAt.toISOString(),
        attachments: (full.attachments ?? []).map((a) => ({
          name: a.fileName,
          type: a.mimeType,
          size: String(a.fileSize),
          storage_key: a.storageKey,
        })),
      });
    }
    // 2. Persistent notification for the recipient.
    if (recipientId && recipientId !== senderId) {
      await pushNotification(recipientId, {
        type: 'MESSAGE',
        title: 'New message',
        body: preview,
        relatedId: conversationId,
        relatedType: 'conversation',
        link: `/messages?conversation=${conversationId}`,
        dedupeKey: `message.created:${messageId}`,
      });
    }
  });

  // Invitation sent — notify the receiver in real-time
  onLocal('invitation.sent', async ({ invitationId, receiverId, senderId, senderName }) => {
    try {
      emit(`notifications:${receiverId}`, 'invitation_received', {
        invitationId,
        senderId,
        senderName,
      });
      // Also persist a notification row so they see it after reload
      await pushNotification(receiverId, {
        type: 'MESSAGE',
        title: 'New message request',
        body: `${senderName} wants to start a conversation`,
        link: `/messages`,
        actorId: senderId,
        relatedId: invitationId,
        relatedType: 'invitation',
      });
    } catch (err) {
      logger.error({ err }, 'invitation.sent broadcaster failed');
    }
  });

  // Invitation accepted — notify the original sender in real-time
  onLocal('invitation.accepted', async ({ invitationId, senderId, receiverId, conversationId }) => {
    try {
      emit(`notifications:${senderId}`, 'invitation_accepted', {
        invitationId,
        conversationId,
        acceptedByUserId: receiverId,
      });
    } catch (err) {
      logger.error({ err }, 'invitation.accepted broadcaster failed');
    }
  });

  // -- Proposals --------------------------------------------------------
  onLocal('proposal.submitted', async ({ proposalId, targetType, clusterId, targetUserId }) => {
    const recipientIds = await resolveProposalAudience({ targetType, clusterId, targetUserId });
    for (const rid of recipientIds) {
      await pushNotification(rid, {
        type: 'PROPOSAL',
        title: 'New proposal submitted',
        body: 'A new lease proposal has been submitted.',
        relatedId: proposalId,
        relatedType: 'proposal',
        dedupeKey: `proposal.submitted:${proposalId}`,
        link: `/proposals/${proposalId}`,
      });

      await sendEmailNotification(
        rid,
        'New Lease Proposal Submitted',
        `<h2>New Lease Proposal Submitted</h2>
        <p>A new lease proposal has been submitted for your cluster/farm.</p>
        <p><strong>Proposal ID:</strong> ${proposalId}</p>
        <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/proposals/${proposalId}">View Proposal Details</a></p>`,
        `A new lease proposal has been submitted. View details: ${process.env.CLIENT_URL || 'http://localhost:3000'}/proposals/${proposalId}`
      );
    }
  });

  onLocal('proposal.reviewed', async ({ proposalId, investorId }) => {
    await pushNotification(investorId, {
      type: 'PROPOSAL',
      title: 'Proposal reviewed',
      body: 'Your proposal has been reviewed by the counterparty.',
      relatedId: proposalId,
      relatedType: 'proposal',
      link: `/proposals/${proposalId}`,
      dedupeKey: `proposal.reviewed:${proposalId}`,
    });
  });

  onLocal('proposal.countered', async ({ proposalId, negotiationId, initiatorId, proposedAmount }) => {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { cluster: { select: { ownerId: true } } },
    });
    if (!proposal) return;
    const counterpartyId = proposal.targetType === 'FARMER' ? proposal.targetUserId : proposal.cluster?.ownerId;
    const recipientId = initiatorId === proposal.investorId ? counterpartyId : proposal.investorId;
    if (recipientId) {
      await pushNotification(recipientId, {
        type: 'PROPOSAL',
        title: 'Counter offer received',
        body: 'A counter offer was submitted on your proposal.',
        relatedId: proposalId,
        relatedType: 'proposal',
        link: `/proposals/${proposalId}`,
        dedupeKey: `proposal.countered:${negotiationId ?? `${proposalId}:${initiatorId}:${proposedAmount ?? ''}`}`,
      });

      await sendEmailNotification(
        recipientId,
        'Counter Offer Received',
        `<h2>Counter Offer Received</h2>
        <p>A counter offer has been submitted for your proposal.</p>
        <p><strong>Proposed Amount:</strong> $${proposedAmount || proposal.proposedAmount}</p>
        <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/proposals/${proposalId}">View Negotiation Details</a></p>`,
        `A counter offer was submitted. View details: ${process.env.CLIENT_URL || 'http://localhost:3000'}/proposals/${proposalId}`
      );
    }
  });

  onLocal('proposal.withdrawn', async ({ proposalId, targetType, clusterId, targetUserId, reason }) => {
    const recipientIds = await resolveProposalAudience({ targetType, clusterId, targetUserId });
    for (const rid of recipientIds) {
      await pushNotification(rid, {
        type: 'PROPOSAL',
        title: 'Proposal withdrawn',
        body: reason ?? 'A proposal was withdrawn.',
        relatedId: proposalId,
        relatedType: 'proposal',
        dedupeKey: `proposal.withdrawn:${proposalId}`,
        link: `/proposals/${proposalId}`,
      });
    }
  });

  onLocal('proposal.accepted', async ({ proposalId, investorId }) => {
    await pushNotification(investorId, {
      type: 'PROPOSAL',
      title: 'Proposal accepted',
      body: 'Your proposal has been accepted. You can now draft the agreement.',
      relatedId: proposalId,
      relatedType: 'proposal',
      dedupeKey: `proposal.accepted:${proposalId}`,
      link: `/proposals/${proposalId}`,
    });

    await sendEmailNotification(
      investorId,
      'Lease Proposal Accepted!',
      `<h2>Lease Proposal Accepted!</h2>
      <p>Great news! Your lease proposal has been accepted.</p>
      <p>The next step is to draft and sign the agreement.</p>
      <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/proposals/${proposalId}">View Proposal Details</a></p>`,
      `Your lease proposal has been accepted. View details: ${process.env.CLIENT_URL || 'http://localhost:3000'}/proposals/${proposalId}`
    );
  });

  onLocal('proposal.rejected', async ({ proposalId, rejectedBy, reason }) => {
    const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal) return;
    await pushNotification(proposal.investorId, {
      type: 'PROPOSAL',
      title: 'Proposal rejected',
      body: reason ?? 'Your proposal was rejected.',
      relatedId: proposalId,
      relatedType: 'proposal',
      dedupeKey: `proposal.rejected:${proposalId}`,
    });

    await sendEmailNotification(
      proposal.investorId,
      'Lease Proposal Update',
      `<h2>Lease Proposal Update</h2>
      <p>Your lease proposal was rejected.</p>
      <p><strong>Reason:</strong> ${reason ?? 'No reason provided'}</p>`,
      `Your lease proposal was rejected. Reason: ${reason ?? 'No reason provided'}`
    );
    void rejectedBy;
  });

  // -- Agreements -------------------------------------------------------
  onLocal('agreement.drafted', async ({ agreementId, proposalId }) => {
    const a = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: { proposal: true, cluster: { select: { ownerId: true } } },
    });
    if (!a) return;
    const parties = agreementPartyIds(a);
    for (const uid of parties) {
      if (!uid) continue;
      await pushNotification(uid, {
        type: 'AGREEMENT',
        title: 'Agreement draft ready',
        body: 'An agreement draft has been generated for your review.',
        relatedId: agreementId,
        relatedType: 'agreement',
        link: `/agreements/${agreementId}`,
        dedupeKey: `agreement.drafted:${agreementId}`,
      });

      await sendEmailNotification(
        uid,
        'Agreement Draft Ready for Review',
        `<h2>Agreement Draft Ready</h2>
        <p>An agreement draft has been generated for "${a.title}" and is ready for your review and signature.</p>
        <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/agreements/${agreementId}">Review & Sign Agreement</a></p>`,
        `An agreement draft is ready for review. View: ${process.env.CLIENT_URL || 'http://localhost:3000'}/agreements/${agreementId}`
      );
    }
  });

  onLocal('agreement.updated', async ({ agreementId, updatedBy }) => {
    const a = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: { proposal: true, cluster: { select: { ownerId: true } } },
    });
    if (!a) return;
    for (const uid of agreementPartyIds(a)) {
      if (!uid || uid === updatedBy) continue;
      await pushNotification(uid, {
        type: 'AGREEMENT',
        title: 'Agreement updated',
        body: 'The draft agreement has been updated. Please review the latest version.',
        relatedId: agreementId,
        relatedType: 'agreement',
        link: `/agreements/${agreementId}`,
        dedupeKey: `agreement.updated:${agreementId}:${updatedBy}`,
      });
    }
  });

  onLocal('agreement.signed_by', async ({ agreementId, signerId }) => {
    const a = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: { proposal: true, cluster: { select: { ownerId: true } } },
    });
    if (!a) return;
    const counterparty = signerId === a.proposal.investorId
      ? [...agreementPartyIds(a)].find((id) => id !== a.proposal.investorId)
      : a.proposal.investorId;
    if (counterparty) {
      await pushNotification(counterparty, {
        type: 'AGREEMENT',
        title: 'Agreement signed',
        body: 'The counterparty has signed. The agreement is awaiting your signature.',
        relatedId: agreementId,
        relatedType: 'agreement',
        link: `/agreements/${agreementId}`,
        dedupeKey: `agreement.signed_by:${agreementId}:${signerId}`,
      });

      await sendEmailNotification(
        counterparty,
        'Agreement Signed by Counterparty',
        `<h2>Agreement Signed by Counterparty</h2>
        <p>The counterparty has signed the agreement. It is now awaiting your signature.</p>
        <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/agreements/${agreementId}">Sign Agreement</a></p>`,
        `The agreement has been signed by the counterparty and is awaiting your signature: ${process.env.CLIENT_URL || 'http://localhost:3000'}/agreements/${agreementId}`
      );
    }
  });

  onLocal('agreement.fully_signed', async ({ agreementId }) => {
    const a = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: { proposal: true, cluster: { select: { ownerId: true } } },
    });
    if (!a) return;
    const parties = agreementPartyIds(a);
    for (const uid of parties) {
      if (!uid) continue;
      await pushNotification(uid, {
        type: 'AGREEMENT',
        title: 'Agreement fully signed',
        body: 'All parties have signed the agreement. Please upload payment receipt.',
        relatedId: agreementId,
        relatedType: 'agreement',
        link: `/agreements/${agreementId}`,
        dedupeKey: `agreement.fully_signed:${agreementId}`,
      });

      await sendEmailNotification(
        uid,
        'Agreement Fully Signed - Action Required',
        `<h2>Agreement Fully Signed</h2>
        <p>All parties have signed the lease agreement "${a.title}". To activate it, please upload your proof of payment receipt.</p>
        <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/agreements/${agreementId}">Upload Payment Receipt</a></p>`,
        `All parties have signed the agreement. Please upload payment receipt: ${process.env.CLIENT_URL || 'http://localhost:3000'}/agreements/${agreementId}`
      );
    }
  });

  onLocal('agreement.activated', async ({ agreementId }) => {
    const a = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: { proposal: true, cluster: { select: { ownerId: true } } },
    });
    if (!a) return;
    for (const uid of agreementPartyIds(a)) {
      if (!uid) continue;
      await pushNotification(uid, {
        type: 'AGREEMENT',
        title: 'Agreement active',
        body: 'All signatures and payments verified. The agreement is now active.',
        relatedId: agreementId,
        relatedType: 'agreement',
        dedupeKey: `agreement.activated:${agreementId}`,
        link: `/agreements/${agreementId}`,
      });

      await sendEmailNotification(
        uid,
        'Lease Agreement ACTIVE!',
        `<h2>Lease Agreement ACTIVE!</h2>
        <p>Excellent! Your payment receipt has been verified, and the lease agreement "${a.title}" is now active.</p>
        <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/agreements/${agreementId}">View Active Agreement</a></p>`,
        `Lease agreement is now active: ${process.env.CLIENT_URL || 'http://localhost:3000'}/agreements/${agreementId}`
      );
    }
  });

  onLocal('agreement.terminated', async ({ agreementId, reason }) => {
    const a = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: { proposal: true, cluster: { select: { ownerId: true } } },
    });
    if (!a) return;
    for (const uid of agreementPartyIds(a)) {
      if (!uid) continue;
      await pushNotification(uid, {
        type: 'AGREEMENT',
        title: 'Agreement cancelled',
        body: reason ?? 'An agreement was cancelled.',
        relatedId: agreementId,
        relatedType: 'agreement',
        dedupeKey: `agreement.terminated:${agreementId}`,
        link: `/agreements/${agreementId}`,
      });

      await sendEmailNotification(
        uid,
        'Lease Agreement Cancelled',
        `<h2>Lease Agreement Cancelled</h2>
        <p>The lease agreement "${a.title}" was cancelled.</p>
        <p><strong>Reason:</strong> ${reason ?? 'No reason provided'}</p>`,
        `The lease agreement "${a.title}" was cancelled. Reason: ${reason ?? 'No reason provided'}`
      );
    }
  });

  // -- Payments ---------------------------------------------------------
  onLocal('payment.receipt.uploaded', async ({ paymentId, receiverId, duplicateOf }) => {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });
    const recipientIds = new Set([receiverId, ...admins.map((u) => u.id)].filter(Boolean));
    for (const recipientId of recipientIds) {
      await pushNotification(recipientId, {
        type: 'PAYMENT',
        title: duplicateOf ? 'Receipt flagged: possible duplicate' : 'Payment receipt uploaded',
        body: duplicateOf
          ? 'A potentially duplicate receipt was uploaded. Please review.'
          : 'A payment receipt is awaiting your verification.',
        relatedId: paymentId,
        relatedType: 'payment',
        link: `/payments/${paymentId}`,
        dedupeKey: `payment.receipt.uploaded:${paymentId}`,
      });
      emit(`notifications:${recipientId}`, 'payment_received', { paymentId, duplicateOf: !!duplicateOf });

      await sendEmailNotification(
        recipientId,
        duplicateOf ? 'Receipt flagged: possible duplicate' : 'Payment receipt uploaded',
        `<h2>Payment Receipt Uploaded</h2>
        <p>A new payment receipt has been uploaded and requires your verification.</p>
        <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/payments/${paymentId}">Verify Payment Receipt</a></p>`,
        `A payment receipt has been uploaded and is awaiting verification: ${process.env.CLIENT_URL || 'http://localhost:3000'}/payments/${paymentId}`
      );
    }
  });

  onLocal('payment.verified', async ({ paymentId }) => {
    const p = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!p) return;
    await pushNotification(p.payerId, {
      type: 'PAYMENT',
      title: 'Payment verified',
      body: 'Your payment has been verified.',
      relatedId: paymentId,
      relatedType: 'payment',
      dedupeKey: `payment.verified:${paymentId}`,
    });

    await sendEmailNotification(
      p.payerId,
      'Payment Receipt Verified',
      `<h2>Payment Receipt Verified</h2>
      <p>Your payment receipt has been successfully verified.</p>`,
      `Your payment receipt has been successfully verified.`
    );
  });

  onLocal('payment.rejected', async ({ paymentId }) => {
    const p = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!p) return;
    await pushNotification(p.payerId, {
      type: 'PAYMENT',
      title: 'Payment rejected',
      body: 'Your payment receipt was rejected. Please review and resubmit.',
      relatedId: paymentId,
      relatedType: 'payment',
      dedupeKey: `payment.rejected:${paymentId}`,
    });

    await sendEmailNotification(
      p.payerId,
      'Payment Receipt Rejected',
      `<h2>Payment Receipt Rejected</h2>
      <p>Your payment receipt was rejected. Please review and resubmit correct proof of payment.</p>`,
      `Your payment receipt was rejected. Please review and resubmit.`
    );
  });

  // -- Meetings (future) -------------------------------------------------
  onLocal('meeting.scheduled', async ({ meetingId, participantIds }) => {
    for (const uid of participantIds ?? []) {
      await pushNotification(uid, {
        type: 'MEETING',
        title: 'Meeting scheduled',
        body: 'A new meeting has been scheduled.',
        relatedId: meetingId,
        relatedType: 'meeting',
        link: `/meetings/${meetingId}`,
      });
      emit(`notifications:${uid}`, 'meeting_scheduled', { meetingId });
    }
  });
}

// Resolve which users should be notified when a proposal is published.
async function resolveProposalAudience({ targetType, clusterId, targetUserId }) {
  if (targetType === 'FARMER' && targetUserId) return [targetUserId];
  if (targetType === 'CLUSTER' && clusterId) {
    const cluster = await prisma.cluster.findUnique({
      where: { id: clusterId },
      select: { ownerId: true },
    });
    return cluster?.ownerId ? [cluster.ownerId] : [];
  }
  return [];
}
