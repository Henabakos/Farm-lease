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
    <div className="flex flex-col h-full border-r border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Messages</h2>
          <Badge variant="outline" className="bg-primary/10 text-primary border-none">
            {conversations.reduce((acc, curr) => acc + curr.unreadCount, 0)} New
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-9 bg-background/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length > 0 ? (
          filtered.map((conv) => {
            const otherParticipant = conv.participants[0]; // Simplified for mock
            const isActive = selectedId === conv.id;

            return (
              <div 
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "p-4 cursor-pointer transition-all border-l-4",
                  isActive 
                    ? "bg-primary/10 border-primary" 
                    : "hover:bg-muted/50 border-transparent"
                )}
              >
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border/50">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold truncate text-sm">{otherParticipant.name}</h3>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground truncate pr-4">
                        {conv.lastMessage?.content || "No messages yet"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Badge className="h-4 min-w-[16px] px-1 text-[10px] bg-primary">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No conversations found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
