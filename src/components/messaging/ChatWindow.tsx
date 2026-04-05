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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-primary shadow-sm">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">{otherParticipant.name}</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-slate-50 hover:text-primary transition-all">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-slate-50 hover:text-primary transition-all">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-slate-50 hover:text-primary transition-all">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-slate-50 hover:text-primary transition-all">
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
                "w-8 h-8 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm text-[10px] font-bold uppercase",
                isMe ? "bg-primary text-white border-primary" : "bg-white text-slate-400 border-slate-200",
                !showAvatar && "opacity-0"
              )}>
                {msg.senderName.charAt(0)}
              </div>
              <div className={cn("space-y-1", isMe ? "items-end" : "items-start")}>
                <div className={cn(
                  "p-3 rounded-md text-sm shadow-sm leading-relaxed",
                  isMe 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-slate-50 text-slate-700 border border-slate-200 rounded-tl-none"
                )}>
                  <p className="leading-relaxed">{msg.content}</p>
                  
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.attachments.map((att, idx) => (
                        <div 
                          key={idx}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-md border text-xs group cursor-pointer transition-all active:scale-[0.98]",
                            isMe ? "bg-white/10 border-white/20 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-primary/30"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                            isMe ? "bg-white/20" : "bg-slate-50 border border-slate-100"
                          )}>
                            <File className={cn("w-4 h-4", isMe ? "text-white" : "text-primary")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold truncate uppercase tracking-wider">{att.name}</p>
                            <p className={cn("text-[9px] font-medium opacity-60", isMe ? "text-white" : "text-slate-400")}>{att.size}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white border border-transparent hover:border-slate-200">
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && <CheckCheck className="w-3 h-3 text-primary" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <form onSubmit={handleSend} className="space-y-4">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 text-primary rounded-md px-3 py-1.5 text-[10px] font-bold border border-slate-200 shadow-sm">
                  <File className="w-3 h-3" />
                  <span className="uppercase tracking-wider">{att.name}</span>
                  <button type="button" onClick={() => removeAttachment(i)} className="hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-md text-slate-400 hover:text-primary hover:bg-slate-50 transition-all shrink-0 border border-transparent hover:border-slate-200"
              onClick={addAttachment}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <div className="relative flex-1 group">
              <Input 
                placeholder="Type your message..." 
                className="pr-10 bg-slate-50 border-slate-200 focus-visible:ring-primary/20 h-10 rounded-md text-sm transition-all"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-primary rounded-md"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              type="submit" 
              className="h-10 w-10 rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95 shrink-0"
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
