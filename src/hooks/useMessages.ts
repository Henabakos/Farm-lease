import { useState, useCallback, useEffect } from 'react';
import { messagesAPI } from '../services/api';
import { subscribeToMessages } from '../services/realtime';
import { toast } from 'sonner';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  conversation_id?: string;
  content: string;
  attachment_url?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export const useMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await messagesAPI.getConversations();
      setConversations(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch conversations';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await messagesAPI.getMessages(conversationId);
      setMessages(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch messages';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOrCreateConversation = useCallback(async (data: any) => {
    try {
      setIsLoading(true);
      const response = await messagesAPI.getOrCreateConversation(data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to get/create conversation';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (data: any) => {
    try {
      const response = await messagesAPI.sendMessage(data);
      setMessages(prev => [...prev, response.data]);
      toast.success('Message sent');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to send message';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await messagesAPI.markAsRead(messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_read: true } : m));
    } catch (err: any) {
      console.error('[v0] Failed to mark as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async (conversationId: string) => {
    try {
      await messagesAPI.markAllAsRead(conversationId);
      setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
    } catch (err: any) {
      console.error('[v0] Failed to mark all as read:', err);
    }
  }, []);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!messages.length) return;

    const conversationId = messages[0].conversation_id;
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages(conversationId, (newMessage: Message) => {
      setMessages(prev => [...prev, newMessage]);
    });

    return unsubscribe;
  }, [messages.length]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    messages,
    isLoading,
    error,
    fetchConversations,
    getMessages,
    getOrCreateConversation,
    sendMessage,
    markAsRead,
    markAllAsRead
  };
};
