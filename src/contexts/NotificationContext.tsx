import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { notificationsAPI } from '../services/api';
import { subscribeToNotifications } from '../services/realtime';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  user_id: string;
  actor_id?: string;
  type: 'proposal' | 'agreement' | 'payment' | 'message' | 'system' | 'negotiation';
  title: string;
  content?: string;
  related_to_id?: string;
  related_to_type?: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
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

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoading(true);
      const response = await notificationsAPI.getAll({
        unreadOnly: false,
        limit: 50,
        offset: 0
      });
      setNotifications(response.data);

      // Fetch unread count
      const countResponse = await notificationsAPI.getUnreadCount();
      setUnreadCount(countResponse.data.unreadCount);
    } catch (error) {
      console.error('[v0] Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[v0] Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('[v0] Failed to mark all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      await notificationsAPI.delete(id);
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('[v0] Failed to delete notification:', error);
    }
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Initial fetch
    fetchNotifications();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToNotifications(user.id, (data) => {
      console.log('[v0] Received notification:', data);
      // Refetch notifications when a new one arrives
      fetchNotifications();
    });

    return unsubscribe;
  }, [isAuthenticated, user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
