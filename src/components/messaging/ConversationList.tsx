import React from 'react';
import { Conversation, UserRole } from '@/src/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConversationList({ 
  conversations, 
  selectedId, 
  onSelect 
}: { 
  conversations: Conversation[], 
  selectedId?: string, 
  onSelect: (id: string) => void 
}) {
  const [search, setSearch] = React.useState('');

  const filtered = conversations.filter(c => 
    c.participants.some(p => p.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full border-r border-slate-200 bg-white">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Messages</h2>
          <Badge className="bg-primary/10 text-primary border-none font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
            {conversations.reduce((acc, curr) => acc + curr.unreadCount, 0)} New
          </Badge>
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
        {filtered.length > 0 ? (
          <div className="space-y-1">
            {filtered.map((conv) => {
              const otherParticipant = conv.participants[0]; // Simplified for mock
              const isActive = selectedId === conv.id;

              return (
                <div 
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    "p-3 cursor-pointer transition-all rounded-md flex gap-3 group relative active:scale-[0.98]",
                    isActive 
                      ? "bg-slate-100 shadow-sm" 
                      : "hover:bg-slate-50"
                  )}
                >
                  {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-full" />}
                  <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold truncate text-sm text-slate-900">{otherParticipant.name}</h3>
                      {conv.lastMessage && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] font-medium text-slate-500 truncate pr-4 leading-tight">
                        {conv.lastMessage?.content || "No messages yet"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Badge className="h-4 min-w-[16px] px-1 text-[9px] font-bold bg-primary text-white border-none rounded-sm">
                          {conv.unreadCount}
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
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
}
