import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { notificationsAPI } from '../services/api';
import { subscribeToNotifications } from '../services/realtime';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Field names below match the backend DTO emitted by
// `server/modules/notifications/notifications.service.js#toDto`:
//   { id, type, title, message, link, related_id, related_type, actor_id,
//     read, read_at, timestamp }
export interface Notification {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'PROPOSAL' | 'AGREEMENT' | 'PAYMENT' | 'MESSAGE' | 'MEETING' | 'SYSTEM';
  title: string;
  message: string;
  link?: string | null;
  related_id?: string | null;
  related_type?: string | null;
  actor_id?: string | null;
  read: boolean;
  read_at?: string | null;
  timestamp: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function normaliseIncoming(raw: any): Notification {
  // Real-time payload from `pushNotification` in broadcaster.js uses
  // `{ id, title, body, type, relatedId, relatedType, link, timestamp }`.
  // The REST DTO uses `{ message, related_id, related_type, read }`. We
  // canonicalise to the REST shape used by the rest of the UI.
  return {
    id: raw.id,
    type: (raw.type ?? 'INFO').toUpperCase(),
    title: raw.title ?? '',
    message: raw.message ?? raw.body ?? '',
    link: raw.link ?? null,
    related_id: raw.related_id ?? raw.relatedId ?? null,
    related_type: raw.related_type ?? raw.relatedType ?? null,
    actor_id: raw.actor_id ?? raw.actorId ?? null,
    read: raw.read ?? false,
    read_at: raw.read_at ?? null,
    timestamp: raw.timestamp ?? raw.createdAt ?? new Date().toISOString(),
  };
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      setIsLoading(true);
      const [listRes, countRes] = await Promise.all([
        notificationsAPI.getAll({ page: 1, pageSize: 50 }),
        notificationsAPI.getUnreadCount(),
      ]);
      // List endpoint returns { data, pagination } (paginated envelope).
      const rows = Array.isArray(listRes.data) ? listRes.data : listRes.data?.data ?? [];
      setNotifications(rows.map(normaliseIncoming));
      // Unread count endpoint returns { count }.
      setUnreadCount(countRes.data?.count ?? countRes.data?.unreadCount ?? 0);
    } catch (error) {
      // Silent fail — surfaced elsewhere; never break the rest of the UI.
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.read) setUnreadCount((u) => Math.max(0, u - 1));
        return prev.filter((n) => n.id !== id);
      });
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  // Initial fetch + real-time subscription.
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    const unsubscribe = subscribeToNotifications(user.id, (raw) => {
      const n = normaliseIncoming(raw);
      setNotifications((prev) => {
        if (prev.some((p) => p.id === n.id)) return prev;
        return [n, ...prev];
      });
      setUnreadCount((c) => c + 1);
      // Lightweight in-app toast — sonner positioned top-right via App.tsx.
      toast(n.title, { description: n.message });
    });

    return unsubscribe;
  }, [isAuthenticated, user, fetchNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
