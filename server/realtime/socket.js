// ============================================================================
// Socket.IO gateway.
//
// Responsibilities:
//   • TLS-equivalent: enforce JWT on connect via the `auth.token` handshake
//     field (clients pass it from localStorage; see frontend realtime.ts).
//   • Subscription authorization: before joining a room, verify the user is
//     allowed (e.g. participant of the conversation). This is the hot path
//     where Supabase RLS used to live — we replace it with explicit checks.
//   • Horizontal scaling: Redis adapter shares rooms across API instances so
//     `io.to('notifications:<id>').emit(...)` reaches the right socket no
//     matter which node it's connected to.
//
// Room contract preserved from the legacy server so the frontend doesn't
// have to change:
//   notifications:<userId>      — per-user notification stream
//   messages:<conversationId>   — per-conversation message stream
//   presence:<userId>           — per-user presence updates
// ============================================================================

import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from '../db/redis.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../db/prisma.js';

/** Initialize Socket.IO on the given http.Server. */
export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
    transports: ['websocket', 'polling'],
  });

  io.adapter(createAdapter(pubClient, subClient));

  // ---- Auth handshake --------------------------------------------------
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
      if (!token) return next(new Error('UNAUTHORIZED'));
      const claims = verifyAccessToken(token);
      if (claims.status !== 'ACTIVE') return next(new Error('ACCOUNT_INACTIVE'));
      socket.data.user = { id: claims.sub, role: claims.role };
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  // ---- Connection lifecycle -------------------------------------------
  io.on('connection', (socket) => {
    const userId = socket.data.user.id;
    logger.debug({ socketId: socket.id, userId }, 'socket connected');

    // Implicit per-user room — used by the notification broadcaster.
    socket.join(`user:${userId}`);
    socket.join(`notifications:${userId}`);
    socket.join(`presence:${userId}`);

    // Broadcast presence — other interested clients will see it.
    io.to(`presence:${userId}`).emit('user_online', { userId, online: true });

    // ---- Subscribe to a conversation (with authorization check) -------
    socket.on('subscribe_messages', async (conversationId, ack) => {
      try {
        if (typeof conversationId !== 'string') throw new Error('invalid conversationId');
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { user1Id: true, user2Id: true },
        });
        if (!conv) throw new Error('conversation not found');
        if (conv.user1Id !== userId && conv.user2Id !== userId) {
          throw new Error('forbidden');
        }
        socket.join(`messages:${conversationId}`);
        ack?.({ ok: true });
      } catch (err) {
        logger.warn({ err: err.message, userId, conversationId }, 'subscribe_messages denied');
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on('unsubscribe_messages', (conversationId) => {
      socket.leave(`messages:${conversationId}`);
    });

    // ---- Typing indicator (best-effort relay, no persistence) ---------
    // Client emits { conversationId, isTyping: boolean }. We re-broadcast to
    // the conversation room so the OTHER participant sees a transient
    // indicator. No-op if the sender isn't actually subscribed to the room.
    socket.on('typing', async (payload, ack) => {
      try {
        const { conversationId, isTyping } = payload || {};
        if (typeof conversationId !== 'string') throw new Error('invalid payload');
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { user1Id: true, user2Id: true },
        });
        if (!conv) throw new Error('conversation not found');
        if (conv.user1Id !== userId && conv.user2Id !== userId) throw new Error('forbidden');
        socket.to(`messages:${conversationId}`).emit('typing', {
          conversationId,
          userId,
          isTyping: !!isTyping,
        });
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    // ---- Read receipt relay -------------------------------------------
    // Client emits { conversationId, lastReadMessageId } AFTER the HTTP
    // mark-as-read call has succeeded. We just relay to the room so the
    // sender's UI can flip the double-check from sent->seen instantly.
    socket.on('messages_read', async (payload, ack) => {
      try {
        const { conversationId, lastReadMessageId } = payload || {};
        if (typeof conversationId !== 'string') throw new Error('invalid payload');
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { user1Id: true, user2Id: true },
        });
        if (!conv) throw new Error('conversation not found');
        if (conv.user1Id !== userId && conv.user2Id !== userId) throw new Error('forbidden');
        socket.to(`messages:${conversationId}`).emit('messages_read', {
          conversationId,
          readerId: userId,
          lastReadMessageId: lastReadMessageId ?? null,
          at: new Date().toISOString(),
        });
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    // Legacy events kept for frontend compatibility — current `realtime.ts`
    // emits these; we resolve them as no-ops since the per-user rooms are
    // already joined automatically above.
    socket.on('subscribe_notifications', (_id, ack) => ack?.({ ok: true }));
    socket.on('subscribe_user_presence',  (_id, ack) => ack?.({ ok: true }));

    socket.on('disconnect', (reason) => {
      logger.debug({ socketId: socket.id, userId, reason }, 'socket disconnected');
      io.to(`presence:${userId}`).emit('user_online', { userId, online: false });
    });
  });

  return io;
}
