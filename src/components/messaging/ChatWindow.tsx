import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  MoreVertical,
  User,
  File as FileIcon,
  Download,
  X,
  Check,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getSignedDownloadUrl } from '@/src/services/files';
import type { ConversationDto } from './ConversationList';

export interface ChatAttachment {
  name: string;
  type: string;
  size: string;
  storage_key?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string | null;
  content: string;
  timestamp: string;
  isSystem?: boolean;
  attachments?: ChatAttachment[];
}

const ATTACHMENT_LIMIT_BYTES = 10 * 1024 * 1024; // 10 MB per file

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatWindow({
  conversation,
  currentUserId,
  messages,
  isLoading,
  otherTyping,
  otherLastReadAt,
  onSendMessage,
  onTyping,
}: {
  conversation: ConversationDto;
  currentUserId: string;
  messages: ChatMessage[];
  isLoading?: boolean;
  otherTyping?: boolean;
  otherLastReadAt?: string | null;
  onSendMessage: (content: string, files: File[]) => void;
  onTyping?: (isTyping: boolean) => void;
}) {
  const [newMessage, setNewMessage] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, otherTyping]);

  const other = conversation.participants[0];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && pendingFiles.length === 0) return;
    if (isSending) return;
    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim() || ' ', pendingFiles);
      setNewMessage('');
      setPendingFiles([]);
      onTyping?.(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleAttach = () => fileInputRef.current?.click();

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const accepted: File[] = [];
    for (const f of files) {
      if (f.size > ATTACHMENT_LIMIT_BYTES) {
        toast.error(`${f.name} exceeds the 10 MB attachment limit`);
        continue;
      }
      accepted.push(f);
    }
    setPendingFiles((prev) => [...prev, ...accepted]);
    // Reset so the same file can be re-selected later.
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePending = (i: number) =>
    setPendingFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    onTyping?.(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTyping?.(false), 2000);
  };

  const handleDownload = async (att: ChatAttachment) => {
    if (!att.storage_key) return;
    try {
      const url = await getSignedDownloadUrl(att.storage_key);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Failed to fetch download link');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-primary shadow-sm">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              {other?.name ?? 'Conversation'}
            </h3>
            <div className="flex items-center gap-1.5">
              {otherTyping ? (
                <span className="text-[10px] text-primary font-bold uppercase tracking-wider animate-pulse">
                  Typing...
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {other?.role?.replace('_', ' ') ?? ''}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md hover:bg-slate-50 hover:text-primary transition-all"
            aria-label="More"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-slate-400">
            <p className="text-xs font-bold uppercase tracking-wider">No messages yet</p>
            <p className="text-[11px]">Send the first message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === currentUserId;
            const showAvatar = i === 0 || messages[i - 1].senderId !== msg.senderId;
            const wasSeenByOther =
              isMe && otherLastReadAt && new Date(msg.timestamp) <= new Date(otherLastReadAt);

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 max-w-[85%]',
                  isMe ? 'ml-auto flex-row-reverse' : 'mr-auto',
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-md flex items-center justify-center shrink-0 shadow-sm text-[10px] font-bold uppercase',
                    isMe
                      ? 'bg-primary text-white border border-primary'
                      : 'bg-white text-slate-400 border border-slate-200',
                    !showAvatar && 'opacity-0',
                  )}
                >
                  {(msg.senderName ?? '?').charAt(0)}
                </div>
                <div className={cn('space-y-1', isMe ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'p-3 rounded-md text-sm shadow-sm leading-relaxed',
                      isMe
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 rounded-tl-none',
                    )}
                  >
                    {msg.content.trim().length > 0 && (
                      <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className={cn('space-y-2', msg.content.trim().length > 0 && 'mt-3')}>
                        {msg.attachments.map((att, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleDownload(att)}
                            className={cn(
                              'flex items-center gap-3 p-2 rounded-md border text-xs group cursor-pointer transition-all active:scale-[0.98] w-full text-left',
                              isMe
                                ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-primary/30',
                            )}
                          >
                            <div
                              className={cn(
                                'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
                                isMe ? 'bg-white/20' : 'bg-slate-50 border border-slate-100',
                              )}
                            >
                              <FileIcon className={cn('w-4 h-4', isMe ? 'text-white' : 'text-primary')} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold truncate uppercase tracking-wider">
                                {att.name}
                              </p>
                              <p
                                className={cn(
                                  'text-[9px] font-medium opacity-60',
                                  isMe ? 'text-white' : 'text-slate-400',
                                )}
                              >
                                {att.size}
                              </p>
                            </div>
                            <Download className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe &&
                      (wasSeenByOther ? (
                        <CheckCheck className="w-3 h-3 text-primary" />
                      ) : (
                        <Check className="w-3 h-3 text-slate-300" />
                      ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <form onSubmit={handleSend} className="space-y-4">
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pendingFiles.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-2 bg-slate-50 text-primary rounded-md px-3 py-1.5 text-[10px] font-bold border border-slate-200 shadow-sm"
                >
                  <FileIcon className="w-3 h-3" />
                  <span className="uppercase tracking-wider truncate max-w-[160px]">
                    {f.name} ({humanSize(f.size)})
                  </span>
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    className="hover:text-destructive transition-colors"
                    aria-label="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-md text-slate-400 hover:text-primary hover:bg-slate-50 transition-all shrink-0 border border-transparent hover:border-slate-200"
              onClick={handleAttach}
              aria-label="Attach files"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <div className="relative flex-1 group">
              <Input
                placeholder="Type your message..."
                className="pr-3 bg-slate-50 border-slate-200 focus-visible:ring-primary/20 h-10 rounded-md text-sm transition-all"
                value={newMessage}
                onChange={handleInputChange}
              />
            </div>
            <Button
              type="submit"
              className="h-10 w-10 rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95 shrink-0"
              disabled={(!newMessage.trim() && pendingFiles.length === 0) || isSending}
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
