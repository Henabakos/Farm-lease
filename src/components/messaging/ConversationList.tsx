import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

// Matches the server DTO in messaging.service.js#convoDto.
export interface ConversationParticipant {
  id: string;
  name: string;
  role: string;
  avatar?: string | null;
}

export interface ConversationLastMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface ConversationDto {
  id: string;
  context?: string;
  related_id?: string | null;
  last_message_at?: string | null;
  participants: ConversationParticipant[];
  unread_count: number;
  last_message?: ConversationLastMessage;
}

export function ConversationList({
  conversations,
  selectedId,
  isLoading,
  onSelect,
  onNewConversation,
}: {
  conversations: ConversationDto[];
  selectedId?: string;
  isLoading?: boolean;
  onSelect: (id: string) => void;
  onNewConversation?: () => void;
}) {
  const [search, setSearch] = React.useState('');

  const filtered = conversations.filter((c) =>
    c.participants.some((p) => p.name.toLowerCase().includes(search.toLowerCase())),
  );

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count ?? 0), 0);

  return (
    <div className="flex flex-col h-full border-r border-slate-200 bg-white">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Messages</h2>
          <div className="flex items-center gap-2">
            {totalUnread > 0 && (
              <Badge className="bg-primary/10 text-primary border-none font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                {totalUnread} New
              </Badge>
            )}
            {onNewConversation && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200"
                onClick={onNewConversation}
                title="New conversation"
                aria-label="New conversation"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-primary/20 h-9 rounded-md text-xs transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-1">
            {filtered.map((conv) => {
              const other = conv.participants[0];
              const isActive = selectedId === conv.id;
              const preview = conv.last_message?.content ?? 'No messages yet';
              const timestamp = conv.last_message?.timestamp ?? conv.last_message_at ?? null;

              return (
                <div
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    'p-3 cursor-pointer transition-all rounded-md flex gap-3 group relative active:scale-[0.98]',
                    isActive ? 'bg-slate-100 shadow-sm' : 'hover:bg-slate-50',
                  )}
                >
                  {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-full" />}
                  <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold truncate text-sm text-slate-900">{other?.name ?? 'Unknown'}</h3>
                      {timestamp && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {new Date(timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className="text-[11px] font-medium text-slate-500 truncate pr-4 leading-tight">
                        {preview}
                      </p>
                      {conv.unread_count > 0 && (
                        <Badge className="h-4 min-w-[16px] px-1 text-[9px] font-bold bg-primary text-white border-none rounded-sm">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              No conversations found
            </p>
            {onNewConversation && (
              <Button size="sm" variant="outline" className="gap-2" onClick={onNewConversation}>
                <Plus className="w-3.5 h-3.5" />
                Start one
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
