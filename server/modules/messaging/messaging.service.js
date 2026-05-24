// Messaging service.
//
// Conversation model: one row per (user1, user2, context, relatedId). Users
// are canonicalized so user1Id < user2Id at create time, guaranteeing that
// duplicate-create attempts upsert into the same row regardless of who
// initiated.
//
// Authorization: only the two participants can read or write. Verified at
// every query, never via row-level security.
//
// Emits `message.created` onto the outbox so the realtime broadcaster can
// push to the `messages:<conversationId>` Socket.IO room.
import { prisma } from '../../db/prisma.js';
import { ForbiddenError, NotFoundError, ValidationError, ConflictError } from '../../shared/errors.js';
import { paginate, paginated } from '../../shared/pagination.js';
import { recordOutbox, emitLocal } from '../../events/bus.js';

function canonicalPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

function convoDto(c, viewerId) {
  const other = c.user1Id === viewerId ? c.user2 : c.user1;
  return {
    id: c.id,
    context: c.context,
    related_id: c.relatedId,
    last_message_at: c.lastMessageAt?.toISOString?.() ?? null,
    participants: [
      {
        id: other.id,
        name: other.fullName,
        role: other.role,
        avatar: other.avatarUrl ?? null,
      },
    ],
    unread_count: c._unread ?? 0,
    last_message: c.messages?.[0]
      ? messageDto(c.messages[0])
      : undefined,
  };
}

function messageDto(m) {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    senderName: m.sender?.fullName ?? null,
    content: m.content,
    isSystem: m.isSystem,
    timestamp: m.createdAt.toISOString(),
    attachments: (m.attachments ?? []).map((a) => ({
      name: a.fileName,
      type: a.mimeType,
      size: String(a.fileSize),
      storage_key: a.storageKey,
    })),
  };
}

export async function listConversations(viewer) {
  const rows = await prisma.conversation.findMany({
    where: { OR: [{ user1Id: viewer.id }, { user2Id: viewer.id }] },
    include: {
      user1: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
      user2: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
      messages: { take: 1, orderBy: { createdAt: 'desc' }, include: { sender: { select: { fullName: true } }, attachments: true } },
      reads: { where: { userId: viewer.id }, select: { lastReadAt: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
  });
  // Compute unread counts in parallel (small N; one count per conversation).
  await Promise.all(rows.map(async (c) => {
    const lastReadAt = c.reads[0]?.lastReadAt ?? new Date(0);
    c._unread = await prisma.message.count({
      where: { conversationId: c.id, senderId: { not: viewer.id }, createdAt: { gt: lastReadAt } },
    });
  }));
  return rows.map((c) => convoDto(c, viewer.id));
}

export async function getOrCreate({ otherUserId, context = 'GENERAL', relatedId = null }, viewer) {
  if (!otherUserId || otherUserId === viewer.id) {
    throw new ValidationError('otherUserId required and must be different from current user');
  }
  const other = await prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true } });
  if (!other) throw new NotFoundError('Other user not found');

  const [u1, u2] = canonicalPair(viewer.id, otherUserId);
  const convo = await prisma.conversation.upsert({
    where: {
      user1Id_user2Id_context_relatedId: { user1Id: u1, user2Id: u2, context, relatedId: relatedId ?? null },
    },
    update: {},
    create: { user1Id: u1, user2Id: u2, context, relatedId: relatedId ?? null },
    include: {
      user1: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
      user2: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
    },
  });
  return convoDto(convo, viewer.id);
}

async function ensureParticipant(conversationId, viewerId) {
  const c = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!c) throw new NotFoundError('Conversation not found');
  if (c.user1Id !== viewerId && c.user2Id !== viewerId) {
    throw new ForbiddenError('Not a participant');
  }
  return c;
}

export async function listMessages(conversationId, { page, pageSize }, viewer) {
  await ensureParticipant(conversationId, viewer.id);
  const where = { conversationId };
  const [rows, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: { sender: { select: { fullName: true } }, attachments: true },
      orderBy: { createdAt: 'desc' },
      ...paginate({ page, pageSize }),
    }),
    prisma.message.count({ where }),
  ]);
  // Reverse so the oldest is first in the page (chat UX).
  return paginated(rows.reverse().map(messageDto), total, { page, pageSize });
}

export async function sendMessage({ conversationId, content, attachments }, viewer) {
  const convo = await ensureParticipant(conversationId, viewer.id);

  const message = await prisma.$transaction(async (tx) => {
    const m = await tx.message.create({
      data: {
        conversationId,
        senderId: viewer.id,
        content,
      },
      include: { sender: { select: { fullName: true } } },
    });
    if (Array.isArray(attachments) && attachments.length > 0) {
      await tx.messageAttachment.createMany({
        data: attachments.map((a) => ({
          messageId: m.id,
          storageKey: a.storage_key ?? a.storageKey,
          fileName: a.file_name ?? a.name,
          mimeType: a.mime_type ?? a.type,
          fileSize: a.file_size ?? a.size ?? 0,
        })),
      });
    }
    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: m.createdAt },
    });
    // Recipient notification is created by the realtime broadcaster reacting
    // to this outbox event — keeps notification fan-out in one place.
    await recordOutbox(tx, {
      eventType: 'message.created',
      aggregateType: 'Message',
      aggregateId: m.id,
      payload: {
        messageId: m.id,
        conversationId,
        senderId: viewer.id,
        recipientId: convo.user1Id === viewer.id ? convo.user2Id : convo.user1Id,
        preview: content.slice(0, 140),
      },
    });
    return m;
  });

  // Re-fetch with attachments to return full DTO.
  const full = await prisma.message.findUnique({
    where: { id: message.id },
    include: { sender: { select: { fullName: true } }, attachments: true },
  });
  return messageDto(full);
}

export async function markRead(messageId, viewer) {
  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  if (!msg) throw new NotFoundError();
  await ensureParticipant(msg.conversationId, viewer.id);
  await prisma.conversationRead.upsert({
    where: { conversationId_userId: { conversationId: msg.conversationId, userId: viewer.id } },
    update: { lastReadAt: new Date(), lastReadMessageId: messageId },
    create: { conversationId: msg.conversationId, userId: viewer.id, lastReadAt: new Date(), lastReadMessageId: messageId },
  });
  return { message: 'Marked read' };
}

export async function markAllRead(conversationId, viewer) {
  await ensureParticipant(conversationId, viewer.id);
  await prisma.conversationRead.upsert({
    where: { conversationId_userId: { conversationId, userId: viewer.id } },
    update: { lastReadAt: new Date() },
    create: { conversationId, userId: viewer.id, lastReadAt: new Date() },
  });
  return { message: 'All marked read' };
}

// ── Invitation helpers ─────────────────────────────────────────────────────

/**
 * SENDER: Send a conversation invitation to another user.
 * Rules:
 * - Cannot invite yourself.
 * - Cannot invite if a PENDING or ACCEPTED invitation already exists in either direction.
 * - Cannot invite if a conversation already exists between the two.
 */
export async function sendInvitation(senderId, { receiverId, message }) {
  if (senderId === receiverId) {
    throw new ValidationError('Cannot invite yourself');
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } });
  if (!receiver) throw new NotFoundError('User not found');

  // Check for existing invitation in either direction
  const existing = await prisma.conversationInvitation.findFirst({
    where: {
      status: { in: ['PENDING', 'ACCEPTED'] },
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  });
  if (existing?.status === 'ACCEPTED') {
    throw new ConflictError('A conversation already exists with this user', 'CONVERSATION_EXISTS');
  }
  if (existing?.status === 'PENDING') {
    throw new ConflictError('An invitation is already pending', 'INVITATION_PENDING');
  }

  const invitation = await prisma.conversationInvitation.create({
    data: { senderId, receiverId, message: message ?? null },
    include: {
      sender: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
    },
  });

  // Notify receiver via Socket.IO
  emitLocal('invitation.sent', {
    invitationId: invitation.id,
    receiverId,
    senderId,
    senderName: invitation.sender.fullName,
  });

  return invitation;
}

/**
 * RECEIVER: List pending invitations addressed to me.
 */
export async function listPendingInvitations(viewerId) {
  const rows = await prisma.conversationInvitation.findMany({
    where: { receiverId: viewerId, status: 'PENDING' },
    include: {
      sender: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return rows;
}

/**
 * RECEIVER: Accept a pending invitation → creates the conversation.
 */
export async function acceptInvitation(viewerId, invitationId) {
  const inv = await prisma.conversationInvitation.findUnique({ where: { id: invitationId } });
  if (!inv) throw new NotFoundError('Invitation not found');
  if (inv.receiverId !== viewerId) throw new ForbiddenError('Not your invitation');
  if (inv.status !== 'PENDING') throw new ConflictError('Invitation is no longer pending');

  // Accept + create conversation atomically
  let conversation;
  try {
    const [, convo] = await prisma.$transaction([
      prisma.conversationInvitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' },
      }),
      prisma.conversation.upsert({
        where: {
          user1Id_user2Id_context: {
            user1Id: inv.senderId < viewerId ? inv.senderId : viewerId,
            user2Id: inv.senderId < viewerId ? viewerId : inv.senderId,
            context: 'GENERAL',
          },
        },
        update: {},
        create: {
          user1Id: inv.senderId < viewerId ? inv.senderId : viewerId,
          user2Id: inv.senderId < viewerId ? viewerId : inv.senderId,
          context: 'GENERAL',
        },
      }),
    ]);
    conversation = convo;
  } catch (err) {
    console.error('Failed to accept invitation:', err);
    throw new ValidationError('Failed to create conversation');
  }

  // Fetch full conversation DTO for both parties
  const full = await prisma.conversation.findUnique({
    where: { id: conversation.id },
    include: {
      user1: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
      user2: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
    },
  });

  if (!full) {
    throw new NotFoundError('Conversation not found after creation');
  }

  // Notify sender that their invitation was accepted
  try {
    emitLocal('invitation.accepted', {
      invitationId,
      senderId: inv.senderId,
      receiverId: viewerId,
      conversationId: conversation.id,
    });
  } catch (err) {
    console.error('Failed to emit invitation.accepted event:', err);
    // Don't throw - the conversation was created successfully
  }

  return convoDto(full, viewerId);
}

/**
 * RECEIVER: Decline a pending invitation.
 */
export async function declineInvitation(viewerId, invitationId) {
  const inv = await prisma.conversationInvitation.findUnique({ where: { id: invitationId } });
  if (!inv) throw new NotFoundError('Invitation not found');
  if (inv.receiverId !== viewerId) throw new ForbiddenError('Not your invitation');
  if (inv.status !== 'PENDING') throw new ConflictError('Invitation is no longer pending');

  await prisma.conversationInvitation.update({
    where: { id: invitationId },
    data: { status: 'DECLINED' },
  });

  return { success: true };
}
