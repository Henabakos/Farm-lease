import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const initializeSocket = () => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('[v0] Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('[v0] Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('[v0] Socket error:', error);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Notification listeners
export const subscribeToNotifications = (userId: string, callback: (data: any) => void) => {
  if (!socket) initializeSocket();

  socket?.emit('subscribe_notifications', userId);
  socket?.on('notification', callback);
  socket?.on('payment_received', callback);
  socket?.on('meeting_scheduled', callback);

  return () => {
    socket?.off('notification', callback);
    socket?.off('payment_received', callback);
    socket?.off('meeting_scheduled', callback);
  };
};

// Message listeners
export const subscribeToMessages = (conversationId: string, callback: (message: any) => void) => {
  if (!socket) initializeSocket();

  socket?.emit('subscribe_messages', conversationId);
  socket?.on('new_message', callback);

  return () => {
    socket?.off('new_message', callback);
  };
};

// Presence listeners
export const subscribeToPresence = (userId: string, callback: (data: any) => void) => {
  if (!socket) initializeSocket();

  socket?.emit('subscribe_user_presence', userId);
  socket?.on('user_online', callback);

  return () => {
    socket?.off('user_online', callback);
  };
};

export const emitEvent = (eventName: string, data: any) => {
  if (!socket) initializeSocket();
  socket?.emit(eventName, data);
};
