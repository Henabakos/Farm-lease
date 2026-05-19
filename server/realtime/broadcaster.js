// ============================================================================
// Realtime broadcaster.
//
// The single subscriber that turns DOMAIN events into:
//   1. Socket.IO room emissions (frontend reacts instantly when online).
//   2. Persistent Notification rows (so users see the event when they
//      reconnect / open another device).
//
// Why this lives in its own module:
//   • Keeps domain modules from importing Socket.IO directly — they only
//     know how to emit events onto the outbox/bus.
//   • Centralizes the mapping between event types and notification copy,
//     making the user-facing wording easy to audit and translate later.
//
// Wiring:
//   • For low-latency cases we subscribe to the IN-PROCESS event bus
//     (`emitLocal`) — fires immediately after the producing transaction
//     commits in the API node.
//   • For at-least-once delivery in distributed setups, the outbox
//     dispatcher also enqueues a BullMQ job onto the `notification` queue,
//     which a worker can consume to re-broadcast / send email even if the
//     producing node crashed before the in-process emission fired.
// ============================================================================

import { on as onLocal } from '../events/bus.js';
import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import * as notifications from '../modules/notifications/notifications.service.js';

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
// Notification helpers
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
        dedupeKey: null,
      });
    }
  });

  // -- Proposals --------------------------------------------------------
  onLocal('proposal.published', async ({ proposalId, targetType, clusterId, targetUserId }) => {
    const recipientIds = await resolveProposalAudience({ targetType, clusterId, targetUserId });
    for (const rid of recipientIds) {
      await pushNotification(rid, {
        type: 'PROPOSAL',
        title: 'New proposal received',
        body: 'A new lease proposal has been published.',
        relatedId: proposalId,
        relatedType: 'proposal',
        dedupeKey: `proposal.published:${proposalId}`,
        link: `/proposals/${proposalId}`,
      });
    }
  });
  onLocal('proposal.countered', async ({ proposalId, initiatorId }) => {
    const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal) return;
    const recipientId = initiatorId === proposal.investorId ? proposal.targetUserId : proposal.investorId;
    if (recipientId) {
      await pushNotification(recipientId, {
        type: 'PROPOSAL',
        title: 'Counter offer received',
        body: 'A counter offer was submitted on your proposal.',
        relatedId: proposalId,
        relatedType: 'proposal',
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
    void rejectedBy;
  });

  // -- Agreements -------------------------------------------------------
  onLocal('agreement.signed_by', async ({ agreementId, signerId }) => {
    const a = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: { proposal: true, cluster: { select: { ownerId: true } } },
    });
    if (!a) return;
    const counterparty = signerId === a.proposal.investorId ? a.cluster.ownerId : a.proposal.investorId;
    if (counterparty) {
      await pushNotification(counterparty, {
        type: 'AGREEMENT',
        title: 'Agreement signed',
        body: 'The counterparty has signed. The agreement is awaiting your signature.',
        relatedId: agreementId,
        relatedType: 'agreement',
        link: `/agreements/${agreementId}`,
      });
    }
  });
  onLocal('agreement.activated', async ({ agreementId }) => {
    const a = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: { proposal: true, cluster: { select: { ownerId: true } } },
    });
    if (!a) return;
    for (const uid of new Set([a.proposal.investorId, a.cluster.ownerId])) {
      if (!uid) continue;
      await pushNotification(uid, {
        type: 'AGREEMENT',
        title: 'Agreement active',
        body: 'All parties have signed. The agreement is now active.',
        relatedId: agreementId,
        relatedType: 'agreement',
        dedupeKey: `agreement.activated:${agreementId}`,
        link: `/agreements/${agreementId}`,
      });
    }
  });

  // -- Payments ---------------------------------------------------------
  onLocal('payment.receipt.uploaded', async ({ paymentId, receiverId, duplicateOf }) => {
    if (receiverId) {
      await pushNotification(receiverId, {
        type: 'PAYMENT',
        title: duplicateOf ? 'Receipt flagged: possible duplicate' : 'Payment receipt uploaded',
        body: duplicateOf
          ? 'A potentially duplicate receipt was uploaded. Please review.'
          : 'A payment receipt is awaiting your verification.',
        relatedId: paymentId,
        relatedType: 'payment',
        link: `/payments/${paymentId}`,
      });
      emit(`notifications:${receiverId}`, 'payment_received', { paymentId, duplicateOf: !!duplicateOf });
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
