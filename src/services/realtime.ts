// ============================================================================
// Socket.IO client wrapper.
//
// Why this layer exists:
//   - Auth: the gateway requires a JWT in the `auth.token` handshake field.
//     The previous implementation never sent it -> every socket was rejected
//     and the entire real-time layer was silently dead.
//   - URL: the HTTP API client lives at `${BASE}/api`, but Socket.IO must
//     connect to the BARE origin. We strip a trailing `/api` if present.
//   - Token rotation: the access token can change at any time (refresh
//     interceptor in api.ts). `reconnectWithToken()` re-binds the new token
//     and forces a reconnect so subsequent rooms authorize with the new JWT.
// ============================================================================
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

function resolveSocketUrl(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)
    ?? (import.meta.env.VITE_SOCKET_URL as string | undefined)
    ?? 'http://localhost:3001';
  return raw.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

let socket: Socket | null = null;

/**
 * Initialise the singleton socket. Idempotent: returns the existing instance
 * if one is already connected. Pulls the access token at connect-time so it
 * always uses the freshest value.
 */
export function initializeSocket(): Socket | null {
  if (socket && socket.connected) return socket;
  if (socket && !socket.connected) socket.connect();
  if (socket) return socket;

  const token = getAccessToken();
  if (!token) return null; // No auth yet — skip; AuthContext will reconnect later.

  socket = io(resolveSocketUrl(), {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    auth: { token },
  });

  socket.on('connect_error', (err) => {
    // eslint-disable-next-line no-console
    console.warn('[socket] connect_error', err.message);
  });

  return socket;
}

/**
 * Force the socket to reconnect with the current access token. Call this
 * after a successful login or after the API interceptor rotates the token.
 */
export function reconnectWithToken(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  initializeSocket();
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnect(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
/** Subscribe to live notifications for a user. Returns an unsubscribe fn. */
export function subscribeToNotifications(
  _userId: string,
  callback: (data: any) => void,
): () => void {
  const s = initializeSocket();
  if (!s) return () => undefined;
  s.on('notification', callback);
  s.on('payment_received', callback);
  s.on('meeting_scheduled', callback);
  return () => {
    s.off('notification', callback);
    s.off('payment_received', callback);
    s.off('meeting_scheduled', callback);
  };
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------
/** Join the per-conversation room and listen for new messages. */
export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: any) => void,
): () => void {
  const s = initializeSocket();
  if (!s) return () => undefined;
  s.emit('subscribe_messages', conversationId);
  s.on('new_message', onMessage);
  return () => {
    s.off('new_message', onMessage);
    s.emit('unsubscribe_messages', conversationId);
  };
}

/** Subscribe to typing indicators inside a conversation. */
export function subscribeToTyping(
  onTyping: (payload: { conversationId: string; userId: string; isTyping: boolean }) => void,
): () => void {
  const s = initializeSocket();
  if (!s) return () => undefined;
  s.on('typing', onTyping);
  return () => s.off('typing', onTyping);
}

export function emitTyping(conversationId: string, isTyping: boolean): void {
  const s = initializeSocket();
  s?.emit('typing', { conversationId, isTyping });
}

/** Subscribe to read receipts for a conversation (the OTHER party reading). */
export function subscribeToReadReceipts(
  onRead: (payload: {
    conversationId: string;
    readerId: string;
    lastReadMessageId: string | null;
    at: string;
  }) => void,
): () => void {
  const s = initializeSocket();
  if (!s) return () => undefined;
  s.on('messages_read', onRead);
  return () => s.off('messages_read', onRead);
}

export function emitMessagesRead(conversationId: string, lastReadMessageId?: string): void {
  const s = initializeSocket();
  s?.emit('messages_read', { conversationId, lastReadMessageId: lastReadMessageId ?? null });
}

// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------
export function subscribeToPresence(
  _userId: string,
  callback: (data: { userId: string; online: boolean }) => void,
): () => void {
  const s = initializeSocket();
  if (!s) return () => undefined;
  s.on('user_online', callback);
  return () => s.off('user_online', callback);
}

export function emitEvent(eventName: string, data: any): void {
  const s = initializeSocket();
  s?.emit(eventName, data);
}

export function subscribeToInvitationEvents(
  handler: (event: {
    type: 'invitation_received' | 'invitation_accepted';
    invitationId: string;
    senderId?: string;
    senderName?: string;
    conversationId?: string;
    acceptedByUserId?: string;
  }) => void,
): () => void {
  const s = initializeSocket();
  if (!s) return () => {};

  const onReceived = (payload: any) =>
    handler({ type: 'invitation_received', ...payload });
  const onAccepted = (payload: any) =>
    handler({ type: 'invitation_accepted', ...payload });

  s.on('invitation_received', onReceived);
  s.on('invitation_accepted', onAccepted);

  return () => {
    s.off('invitation_received', onReceived);
    s.off('invitation_accepted', onAccepted);
  };
}
