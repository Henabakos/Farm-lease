import React, { useState, useRef, useEffect } from 'react';
import { Message, Conversation, UserRole } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Phone, 
  Video, 
  User, 
  File, 
  Download, 
  X,
  Check,
  CheckCheck,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/src/contexts/RoleContext';

export function ChatWindow({ 
  conversation, 
  messages, 
  onSendMessage 
}: { 
  conversation: Conversation, 
  messages: Message[], 
  onSendMessage: (content: string, attachments?: any[]) => void 
}) {
  const { user } = useRole();
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; type: string; size: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;
    
    onSendMessage(newMessage, attachments);
    setNewMessage('');
    setAttachments([]);
  };

  const addAttachment = () => {
    // Mock attachment
    setAttachments([...attachments, { name: 'farm_report_v2.pdf', type: 'application/pdf', size: '2.4MB' }]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const otherParticipant = conversation.participants[0]; // Simplified for mock

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between bg-background/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border/50">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-none">{otherParticipant.name}</h3>
            <p className="text-[10px] text-emerald-500 font-medium mt-1 uppercase tracking-wider">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {messages.map((msg, i) => {
          const isMe = msg.senderId === user.id;
          const showAvatar = i === 0 || messages[i-1].senderId !== msg.senderId;

          return (
            <div 
              key={msg.id}
              className={cn(
                "flex gap-3 max-w-[85%]",
                isMe ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border/50",
                !showAvatar && "opacity-0"
              )}>
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className={cn("space-y-1", isMe ? "items-end" : "items-start")}>
                <div className={cn(
                  "p-3 rounded-2xl text-sm shadow-sm",
                  isMe 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-background border border-border/50 rounded-tl-none"
                )}>
                  <p className="leading-relaxed">{msg.content}</p>
                  
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.attachments.map((att, idx) => (
                        <div 
                          key={idx}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg border",
                            isMe ? "bg-primary-foreground/10 border-primary-foreground/20" : "bg-muted/50 border-border/50"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded flex items-center justify-center",
                            isMe ? "bg-primary-foreground/20" : "bg-primary/10"
                          )}>
                            <File className={cn("w-4 h-4", isMe ? "text-primary-foreground" : "text-primary")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold truncate">{att.name}</p>
                            <p className="text-[8px] opacity-70">{att.size}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && <CheckCheck className="w-3 h-3 text-primary" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50 bg-background/30">
        <form onSubmit={handleSend} className="space-y-4">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1 text-[10px] font-bold border border-primary/20">
                  <File className="w-3 h-3" />
                  <span>{att.name}</span>
                  <button type="button" onClick={() => removeAttachment(i)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={addAttachment}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <div className="relative flex-1">
              <Input 
                placeholder="Type your message..." 
                className="pr-10 bg-background/50 h-11 rounded-xl border-none shadow-inner"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-muted-foreground hover:text-primary"
              >
                <Smile className="w-5 h-5" />
              </Button>
            </div>
            <Button 
              type="submit" 
              size="icon" 
              className="h-11 w-11 rounded-xl shadow-lg shadow-primary/20"
              disabled={!newMessage.trim() && attachments.length === 0}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
