import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageSquare, Plus, Search, User, X } from 'lucide-react';
import { messagesAPI, usersAPI } from '@/src/services/api';
import { uploadFile, type UploadedFile } from '@/src/services/files';
import {
  subscribeToMessages,
  subscribeToTyping,
  subscribeToReadReceipts,
  emitTyping,
  emitMessagesRead,
} from '@/src/services/realtime';
import { useAuth } from '@/src/contexts/AuthContext';
import { ConversationList, type ConversationDto } from './ConversationList';
import { ChatWindow, type ChatMessage } from './ChatWindow';
import { InvitationBadge } from './InvitationBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UserSearchResult {
  id: string;
  full_name: string;
  fullName?: string;
  email?: string;
  role: string;
  avatar_url?: string | null;
}

function userDisplayName(u: UserSearchResult): string {
  return u.full_name ?? u.fullName ?? u.email ?? 'Unknown';
}

export function MessagingPage() {
  const { user: authUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('conversation');

  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(null);
  const [newConvoOpen, setNewConvoOpen] = useState(false);
  const typingClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Load conversation list -----------------------------------------
  const fetchConversations = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const res = await messagesAPI.getConversations();
      const list: ConversationDto[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setConversations(list);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ---- Load messages for selected conversation ------------------------
  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await messagesAPI.getMessages(conversationId, 100, 0);
      const rows: ChatMessage[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setMessages(rows);
      // Mark all as read both via REST (persist) and socket (notify other party).
      await messagesAPI.markAllAsRead(conversationId).catch(() => undefined);
      const lastId = rows[rows.length - 1]?.id;
      emitMessagesRead(conversationId, lastId);
      // Locally zero out the unread count for this conversation.
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c)),
      );
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setOtherTyping(false);
      setOtherLastReadAt(null);
      return;
    }
    fetchMessages(selectedId);
  }, [selectedId, fetchMessages]);

  // ---- Real-time wiring -----------------------------------------------
  useEffect(() => {
    if (!selectedId) return;

    const unsubMsg = subscribeToMessages(selectedId, (msg: ChatMessage) => {
      if (msg.conversationId !== selectedId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Bump conversation to top with new last message.
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? {
                ...c,
                last_message: {
                  id: msg.id,
                  conversationId: msg.conversationId,
                  senderId: msg.senderId,
                  senderName: msg.senderName ?? '',
                  content: msg.content,
                  timestamp: msg.timestamp,
                },
                last_message_at: msg.timestamp,
              }
            : c,
        ),
      );
      // If the incoming message is from the other party and this conversation
      // is open, auto-mark as read.
      if (authUser && msg.senderId !== authUser.id) {
        messagesAPI.markAllAsRead(selectedId).catch(() => undefined);
        emitMessagesRead(selectedId, msg.id);
      }
    });

    const unsubTyping = subscribeToTyping((p) => {
      if (p.conversationId !== selectedId) return;
      if (authUser && p.userId === authUser.id) return;
      setOtherTyping(p.isTyping);
      if (typingClearTimer.current) clearTimeout(typingClearTimer.current);
      if (p.isTyping) {
        typingClearTimer.current = setTimeout(() => setOtherTyping(false), 4000);
      }
    });

    const unsubRead = subscribeToReadReceipts((p) => {
      if (p.conversationId !== selectedId) return;
      if (authUser && p.readerId === authUser.id) return;
      setOtherLastReadAt(p.at);
    });

    return () => {
      unsubMsg();
      unsubTyping();
      unsubRead();
      if (typingClearTimer.current) clearTimeout(typingClearTimer.current);
    };
  }, [selectedId, authUser]);

  // ---- Refresh conversation list whenever a new message arrives in any
  //      other conversation (for unread badge updates). Light approach:
  //      refetch list when a conversation row outside the selected one
  //      receives a message via the notification stream. The
  //      NotificationContext already toasts; we just refetch.
  useEffect(() => {
    const onFocus = () => fetchConversations();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchConversations]);

  // ---- Send message ---------------------------------------------------
  const handleSend = async (content: string, files: File[]) => {
    if (!selectedId) return;
    let attachments: Array<{ storage_key: string; file_name: string; mime_type: string; file_size: number }> = [];
    if (files.length > 0) {
      try {
        const uploads: UploadedFile[] = await Promise.all(
          files.map((f) => uploadFile(f, 'attachments')),
        );
        attachments = uploads.map((u) => ({
          storage_key: u.storage_key,
          file_name: u.file_name,
          mime_type: u.mime_type,
          file_size: u.file_size,
        }));
      } catch {
        toast.error('Attachment upload failed');
        return;
      }
    }
    try {
      const res = await messagesAPI.sendMessage({
        conversationId: selectedId,
        content,
        attachments,
      });
      const sent: ChatMessage = res.data;
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      // Stop typing indicator on send.
      emitTyping(selectedId, false);
    } catch {
      toast.error('Failed to send message');
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (selectedId) emitTyping(selectedId, isTyping);
  };

  // ---- New conversation ------------------------------------------------
  const handleStartConversation = async (otherUserId: string, greetingMessage?: string) => {
    try {
      await messagesAPI.sendInvitation({ receiverId: otherUserId, message: greetingMessage });
      setNewConvoOpen(false);
      toast.success('Message request sent! They\'ll be notified.');
    } catch (err: any) {
      const code = err.response?.data?.code;
      if (code === 'CONVERSATION_EXISTS') {
        toast.info('You already have a conversation with this user');
        setNewConvoOpen(false);
      } else if (code === 'INVITATION_PENDING') {
        toast.info('You already sent a request to this user');
        setNewConvoOpen(false);
      } else {
        toast.error(err.response?.data?.error || 'Failed to send request');
      }
    }
  };

  const handleConversationActivated = useCallback((conversationId: string) => {
    fetchConversations();
    setSearchParams({ conversation: conversationId });
  }, [fetchConversations, setSearchParams]);

  const selectedConvo = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-[calc(100vh-120px)] -m-6 overflow-hidden">
      <div className="w-80 shrink-0 flex flex-col h-full">
        <InvitationBadge onAccepted={handleConversationActivated} />
        <div className="flex-1 overflow-hidden">
          <ConversationList
            conversations={conversations}
            selectedId={selectedId ?? undefined}
            isLoading={isLoadingList}
            onSelect={(id) => setSearchParams({ conversation: id })}
            onNewConversation={() => setNewConvoOpen(true)}
          />
        </div>
      </div>
      <div className="flex-1">
        {selectedConvo && authUser ? (
          <ChatWindow
            conversation={selectedConvo}
            currentUserId={authUser.id}
            messages={messages}
            isLoading={isLoadingMessages}
            otherTyping={otherTyping}
            otherLastReadAt={otherLastReadAt}
            onSendMessage={handleSend}
            onTyping={handleTyping}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-6 bg-card/10 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Your Conversations</h2>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Select a conversation from the list or start a new one.
              </p>
            </div>
            <Button onClick={() => setNewConvoOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Start a conversation
            </Button>
          </div>
        )}
      </div>

      <NewConversationDialog
        open={newConvoOpen}
        onOpenChange={setNewConvoOpen}
        onSelect={handleStartConversation}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline dialog component for picking a user to chat with.
// ---------------------------------------------------------------------------
function NewConversationDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (userId: string, message?: string) => void;
}) {
  const { user: authUser } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [greetingMessage, setGreetingMessage] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelectedUser(null);
      setGreetingMessage('');
      return;
    }
    const handle = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await usersAPI.searchUsers(query || undefined);
        const rows = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setResults(rows.filter((u: UserSearchResult) => u.id !== authUser?.id));
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [open, query, authUser]);

  const handleSendRequest = () => {
    if (selectedUser) {
      onSelect(selectedUser.id, greetingMessage || undefined);
    }
  };

  const handleBack = () => {
    setSelectedUser(null);
    setGreetingMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-base font-bold">
            {selectedUser ? 'Send message request' : 'Start a new conversation'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {selectedUser
              ? `Send a message request to ${userDisplayName(selectedUser)}`
              : 'Search by name or email and pick a user to message.'}
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 space-y-3">
          {!selectedUser ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  autoFocus
                  placeholder="Search users..."
                  className="pl-9 h-9 text-sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    onClick={() => setQuery('')}
                    aria-label="Clear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto -mx-2">
                {isLoading ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Searching...
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                    No users found
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {results.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-left"
                        >
                          <div className="w-9 h-9 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{userDisplayName(u)}</p>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                              {u.role?.replace('_', ' ')}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="w-9 h-9 rounded-md bg-white border border-slate-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{userDisplayName(selectedUser)}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    {selectedUser.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Add a greeting message (optional)
                </label>
                <textarea
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  placeholder="Hi, I'd like to start a conversation..."
                  className="w-full min-h-[80px] p-3 text-sm border border-slate-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  maxLength={500}
                />
                <p className="text-[10px] text-slate-400 mt-1 text-right">
                  {greetingMessage.length}/500
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSendRequest}
                  className="flex-1"
                >
                  Send Request
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
