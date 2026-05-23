// Persistent notification replay for domain events delivered through BullMQ.
// Socket fan-out still happens in the API process; this worker gives the
// outbox path an at-least-once persisted notification fallback.
import { prisma } from '../db/prisma.js';
import * as notifications from '../modules/notifications/notifications.service.js';
import { logger } from '../utils/logger.js';

async function push(recipientId, partial) {
  if (!recipientId) return;
  await notifications.create({ recipientId, ...partial });
}

async function proposalAudience({ targetType, clusterId, targetUserId }) {
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

async function agreementParties(agreementId) {
  const agreement = await prisma.agreement.findUnique({
    where: { id: agreementId },
    include: { proposal: true, cluster: { select: { ownerId: true } } },
  });
  if (!agreement) return [];
  const counterpartyId = agreement.proposal.targetType === 'FARMER'
    ? agreement.proposal.targetUserId
    : agreement.cluster?.ownerId;
  return [...new Set([agreement.proposal.investorId, counterpartyId].filter(Boolean))];
}

export async function processNotification(job) {
  const eventType = job.data?.eventType ?? job.name;
  const payload = job.data?.payload ?? job.data ?? {};

  switch (eventType) {
    case 'message.created':
      if (payload.recipientId && payload.recipientId !== payload.senderId) {
        await push(payload.recipientId, {
          type: 'MESSAGE',
          title: 'New message',
          body: payload.preview,
          relatedId: payload.conversationId,
          relatedType: 'conversation',
          link: `/messages?conversation=${payload.conversationId}`,
          dedupeKey: `message.created:${payload.messageId}`,
        });
      }
      break;
    case 'proposal.submitted':
      for (const id of await proposalAudience(payload)) {
        await push(id, {
          type: 'PROPOSAL',
          title: 'New proposal submitted',
          body: 'A new lease proposal has been submitted.',
          relatedId: payload.proposalId,
          relatedType: 'proposal',
          link: `/proposals/${payload.proposalId}`,
          dedupeKey: `proposal.submitted:${payload.proposalId}`,
        });
      }
      break;
    case 'proposal.reviewed':
      await push(payload.investorId, {
        type: 'PROPOSAL',
        title: 'Proposal reviewed',
        body: 'Your proposal has been reviewed by the counterparty.',
        relatedId: payload.proposalId,
        relatedType: 'proposal',
        link: `/proposals/${payload.proposalId}`,
        dedupeKey: `proposal.reviewed:${payload.proposalId}`,
      });
      break;
    case 'proposal.countered': {
      const proposal = await prisma.proposal.findUnique({
        where: { id: payload.proposalId },
        include: { cluster: { select: { ownerId: true } } },
      });
      if (!proposal) break;
      const counterpartyId = proposal.targetType === 'FARMER' ? proposal.targetUserId : proposal.cluster?.ownerId;
      const recipientId = payload.initiatorId === proposal.investorId ? counterpartyId : proposal.investorId;
      await push(recipientId, {
        type: 'PROPOSAL',
        title: 'Counter offer received',
        body: 'A counter offer was submitted on your proposal.',
        relatedId: payload.proposalId,
        relatedType: 'proposal',
        link: `/proposals/${payload.proposalId}`,
        dedupeKey: `proposal.countered:${payload.negotiationId}`,
      });
      break;
    }
    case 'proposal.withdrawn':
      for (const id of await proposalAudience(payload)) {
        await push(id, {
          type: 'PROPOSAL',
          title: 'Proposal withdrawn',
          body: payload.reason ?? 'A proposal was withdrawn.',
          relatedId: payload.proposalId,
          relatedType: 'proposal',
          link: `/proposals/${payload.proposalId}`,
          dedupeKey: `proposal.withdrawn:${payload.proposalId}`,
        });
      }
      break;
    case 'proposal.accepted':
      await push(payload.investorId, {
        type: 'PROPOSAL',
        title: 'Proposal accepted',
        body: 'Your proposal has been accepted. You can now draft the agreement.',
        relatedId: payload.proposalId,
        relatedType: 'proposal',
        link: `/proposals/${payload.proposalId}`,
        dedupeKey: `proposal.accepted:${payload.proposalId}`,
      });
      break;
    case 'proposal.rejected': {
      const proposal = await prisma.proposal.findUnique({ where: { id: payload.proposalId } });
      await push(proposal?.investorId, {
        type: 'PROPOSAL',
        title: 'Proposal rejected',
        body: payload.reason ?? 'Your proposal was rejected.',
        relatedId: payload.proposalId,
        relatedType: 'proposal',
        dedupeKey: `proposal.rejected:${payload.proposalId}`,
      });
      break;
    }
    case 'agreement.drafted':
    case 'agreement.updated':
    case 'agreement.signed_by':
    case 'agreement.fully_signed':
    case 'agreement.activated':
    case 'agreement.terminated': {
      const copy = {
        'agreement.drafted': ['Agreement draft ready', 'An agreement draft has been generated for your review.'],
        'agreement.updated': ['Agreement updated', 'The agreement draft has been updated. Please review the latest version.'],
        'agreement.signed_by': ['Agreement signed', 'The counterparty has signed. The agreement is awaiting your signature.'],
        'agreement.fully_signed': ['Agreement fully signed', 'All parties have signed the agreement. Please upload payment receipt.'],
        'agreement.activated': ['Agreement active', 'All signatures and payments verified. The agreement is now active.'],
        'agreement.terminated': ['Agreement cancelled', payload.reason ?? 'An agreement was cancelled.'],
      }[eventType];
      for (const id of await agreementParties(payload.agreementId)) {
        await push(id, {
          type: 'AGREEMENT',
          title: copy[0],
          body: copy[1],
          relatedId: payload.agreementId,
          relatedType: 'agreement',
          link: `/agreements/${payload.agreementId}`,
          dedupeKey: `${eventType}:${payload.agreementId}`,
        });
      }
      break;
    }
    case 'payment.receipt.uploaded': {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' }, select: { id: true } });
      for (const id of new Set([payload.receiverId, ...admins.map((u) => u.id)].filter(Boolean))) {
        await push(id, {
          type: 'PAYMENT',
          title: payload.duplicateOf ? 'Receipt flagged: possible duplicate' : 'Payment receipt uploaded',
          body: payload.duplicateOf ? 'A potentially duplicate receipt was uploaded. Please review.' : 'A payment receipt is awaiting your verification.',
          relatedId: payload.paymentId,
          relatedType: 'payment',
          link: `/payments/${payload.paymentId}`,
          dedupeKey: `payment.receipt.uploaded:${payload.paymentId}`,
        });
      }
      break;
    }
    case 'payment.verified':
    case 'payment.rejected': {
      const payment = await prisma.payment.findUnique({ where: { id: payload.paymentId } });
      await push(payment?.payerId, {
        type: 'PAYMENT',
        title: eventType === 'payment.verified' ? 'Payment verified' : 'Payment rejected',
        body: eventType === 'payment.verified' ? 'Your payment has been verified.' : 'Your payment receipt was rejected. Please review and resubmit.',
        relatedId: payload.paymentId,
        relatedType: 'payment',
        dedupeKey: `${eventType}:${payload.paymentId}`,
      });
      break;
    }
    default:
      logger.debug({ eventType }, 'notification worker skipped event');
  }

  return { ok: true, eventType };
}
