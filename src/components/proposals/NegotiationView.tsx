import React, { useState, useRef, useEffect } from 'react';
import { Proposal, Message } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Send, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  History,
  Info,
  ArrowRight,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const MOCK_MESSAGES: Message[] = [
  { id: 'm1', conversationId: 'conv-negotiation', senderId: 'u1', senderName: 'Alex Johnson', content: 'Hi Sarah, I\'ve sent over the initial proposal for the organic fertilizer pilot. Let me know what you think.', timestamp: '2024-03-15T10:00:00Z' },
  { id: 'm2', conversationId: 'conv-negotiation', senderId: 'u2', senderName: 'Sarah Miller', content: 'Thanks Alex! The proposal looks great, but I\'m concerned about the interest rate. 8% is a bit high for a pilot program.', timestamp: '2024-03-16T14:30:00Z' },
  { id: 'm3', conversationId: 'conv-negotiation', senderId: 'system', senderName: 'System', content: 'Sarah Miller has requested a revision to the interest rate.', timestamp: '2024-03-16T14:31:00Z', isSystem: true },
  { id: 'm4', conversationId: 'conv-negotiation', senderId: 'u1', senderName: 'Alex Johnson', content: 'I understand. What rate were you thinking of?', timestamp: '2024-03-17T09:15:00Z' },
  { id: 'm5', conversationId: 'conv-negotiation', senderId: 'u2', senderName: 'Sarah Miller', content: 'Could we do 5%? Given the sustainability focus, I think it\'s more aligned with the long-term goals.', timestamp: '2024-03-17T11:45:00Z' },
];

export function NegotiationView({ 
  proposal, 
  onBack, 
  onUpdateProposal 
}: { 
  proposal: Proposal, 
  onBack: () => void,
  onUpdateProposal: (updated: Partial<Proposal>) => void
}) {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [revisedTerms, setRevisedTerms] = useState({ ...proposal.terms });
  const [isEditing, setIsEditing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg: Message = {
      id: `m${Date.now()}`,
      conversationId: 'conv-negotiation',
      senderId: 'u1',
      senderName: 'Alex Johnson',
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, msg]);
    setNewMessage('');
  };

  const handleUpdateTerms = () => {
    onUpdateProposal({
      terms: revisedTerms,
      status: 'NEGOTIATING',
      history: [
        ...proposal.history,
        { 
          date: new Date().toISOString(), 
          action: 'Terms Revised', 
          user: 'Alex Johnson', 
          details: `Interest rate changed to ${revisedTerms.interestRate}%` 
        }
      ]
    });
    setIsEditing(false);
    
    // Add system message
    const systemMsg: Message = {
      id: `s${Date.now()}`,
      conversationId: 'conv-negotiation',
      senderId: 'system',
      senderName: 'System',
      content: 'Alex Johnson has updated the proposal terms.',
      timestamp: new Date().toISOString(),
      isSystem: true
    };
    setMessages([...messages, systemMsg]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-md hover:bg-slate-100 transition-all active:scale-95">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Negotiation: {proposal.title}</h1>
          <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Discuss and refine the terms of your investment offer.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
          <Card className="flex-1 flex flex-col border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9 border border-slate-200 shadow-sm">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${proposal.targetName}`} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{proposal.targetName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">{proposal.targetName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{proposal.targetType}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">Active Chat</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative bg-slate-50/30">
              <ScrollArea className="h-full p-6" ref={scrollRef}>
                <div className="space-y-6">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex flex-col max-w-[80%]",
                        msg.senderId === 'u1' ? "ml-auto items-end" : "mr-auto items-start",
                        msg.isSystem && "mx-auto items-center max-w-full w-full"
                      )}
                    >
                      {msg.isSystem ? (
                        <div className="bg-white text-slate-500 text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
                          <Info className="w-3 h-3 text-primary" />
                          {msg.content}
                        </div>
                      ) : (
                        <>
                          <div className={cn(
                            "p-4 rounded-xl text-xs font-medium leading-relaxed shadow-sm transition-all",
                            msg.senderId === 'u1' 
                              ? "bg-primary text-white rounded-tr-none" 
                              : "bg-white border border-slate-200 text-slate-700 rounded-tl-none"
                          )}>
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 px-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <div className="p-4 border-t border-slate-100 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                  placeholder="Type your message..." 
                  className="h-10 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-4"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button type="submit" size="icon" className="h-10 w-10 rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold tracking-tight">Proposal Terms</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary h-7 text-[10px] font-bold uppercase tracking-wider hover:bg-primary/5 rounded-md transition-all active:scale-95"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit Terms'}
                </Button>
              </div>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Current and revised financial parameters.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Interest Rate (%)</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 rounded-md bg-slate-50 border border-slate-100 shadow-sm">
                      <p className="text-xs font-bold text-slate-900">{proposal.terms.interestRate}%</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Original</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <div className={cn(
                      "flex-1 p-3 rounded-md border transition-all shadow-sm",
                      isEditing ? "bg-white border-primary ring-2 ring-primary/10" : "bg-slate-50 border-slate-100"
                    )}>
                      {isEditing ? (
                        <Input 
                          type="number" 
                          className="h-7 p-1 text-xs font-bold bg-transparent border-none focus-visible:ring-0"
                          value={revisedTerms.interestRate}
                          onChange={(e) => setRevisedTerms({ ...revisedTerms, interestRate: Number(e.target.value) })}
                        />
                      ) : (
                        <p className={cn(
                          "text-xs font-bold",
                          revisedTerms.interestRate !== proposal.terms.interestRate ? "text-primary" : "text-slate-900"
                        )}>
                          {revisedTerms.interestRate}%
                        </p>
                      )}
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Revised</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Repayment Period</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 rounded-md bg-slate-50 border border-slate-100 shadow-sm">
                      <p className="text-xs font-bold text-slate-900">{proposal.terms.repaymentPeriod}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Original</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <div className={cn(
                      "flex-1 p-3 rounded-md border transition-all shadow-sm",
                      isEditing ? "bg-white border-primary ring-2 ring-primary/10" : "bg-slate-50 border-slate-100"
                    )}>
                      {isEditing ? (
                        <Input 
                          className="h-7 p-1 text-xs font-bold bg-transparent border-none focus-visible:ring-0"
                          value={revisedTerms.repaymentPeriod}
                          onChange={(e) => setRevisedTerms({ ...revisedTerms, repaymentPeriod: e.target.value })}
                        />
                      ) : (
                        <p className={cn(
                          "text-xs font-bold",
                          revisedTerms.repaymentPeriod !== proposal.terms.repaymentPeriod ? "text-primary" : "text-slate-900"
                        )}>
                          {revisedTerms.repaymentPeriod}
                        </p>
                      )}
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Revised</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Budget (USD)</Label>
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-between shadow-sm">
                    <p className="text-xs font-bold text-slate-900">${proposal.budget.toLocaleString()}</p>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-white border-slate-200 text-slate-400 px-1.5 py-0 rounded-sm">Locked</Badge>
                  </div>
                </div>
              </div>

              {isEditing && (
                <Button className="w-full h-9 gap-2 text-[10px] font-bold uppercase tracking-wider rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95 mt-4" onClick={handleUpdateTerms}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Apply Revised Terms
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold tracking-tight">Negotiation History</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-5">
                {proposal.history.filter(h => h.action.includes('Revised') || h.action.includes('Counter')).map((h, i) => (
                  <div key={i} className="flex gap-3 group">
                    <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center shrink-0 border border-primary/5 group-hover:scale-110 transition-transform">
                      <History className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-700 leading-tight">{h.action}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(h.date).toLocaleDateString()}</p>
                      {h.details && <p className="text-[11px] text-slate-500 mt-1.5 italic leading-relaxed bg-slate-50 p-2 rounded-md border border-slate-100">"{h.details}"</p>}
                    </div>
                  </div>
                ))}
                {proposal.history.filter(h => h.action.includes('Revised') || h.action.includes('Counter')).length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No history yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="p-5 rounded-lg bg-primary/5 border border-primary/10 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Safe Negotiation</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              All negotiations are recorded and legally binding once both parties accept the final terms.
            </p>
            <Button className="w-full h-10 gap-2 text-[11px] font-bold uppercase tracking-wider rounded-md bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 transition-all active:scale-95" variant="outline">
              <MessageSquare className="w-4 h-4" />
              Finalize & Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
