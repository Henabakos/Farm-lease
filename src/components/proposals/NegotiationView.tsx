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
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Negotiation: {proposal.title}</h1>
          <p className="text-muted-foreground">Discuss and refine the terms of your investment offer.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-250px)]">
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
          <Card className="flex-1 flex flex-col border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${proposal.targetName}`} />
                    <AvatarFallback>{proposal.targetName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold">{proposal.targetName}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{proposal.targetType}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-none">Active Chat</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
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
                        <div className="bg-muted/50 text-muted-foreground text-xs px-4 py-1.5 rounded-full border border-border/50 flex items-center gap-2">
                          <Info className="w-3 h-3" />
                          {msg.content}
                        </div>
                      ) : (
                        <>
                          <div className={cn(
                            "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                            msg.senderId === 'u1' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none"
                          )}>
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1 px-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <div className="p-4 border-t bg-muted/20">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                  placeholder="Type your message..." 
                  className="bg-background/50"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button type="submit" size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        <div className="space-y-6 h-full overflow-y-auto pr-2">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Proposal Terms</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary h-8"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit Terms'}
                </Button>
              </div>
              <CardDescription>Current and revised financial parameters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Interest Rate (%)</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-sm font-bold">{proposal.terms.interestRate}%</p>
                      <p className="text-[10px] text-muted-foreground">Original</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className={cn(
                      "flex-1 p-3 rounded-lg border",
                      isEditing ? "bg-background border-primary shadow-sm" : "bg-muted/30 border-border/50"
                    )}>
                      {isEditing ? (
                        <Input 
                          type="number" 
                          className="h-8 p-1 text-sm font-bold"
                          value={revisedTerms.interestRate}
                          onChange={(e) => setRevisedTerms({ ...revisedTerms, interestRate: Number(e.target.value) })}
                        />
                      ) : (
                        <p className={cn(
                          "text-sm font-bold",
                          revisedTerms.interestRate !== proposal.terms.interestRate && "text-primary"
                        )}>
                          {revisedTerms.interestRate}%
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">Revised</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Repayment Period</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-sm font-bold">{proposal.terms.repaymentPeriod}</p>
                      <p className="text-[10px] text-muted-foreground">Original</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className={cn(
                      "flex-1 p-3 rounded-lg border",
                      isEditing ? "bg-background border-primary shadow-sm" : "bg-muted/30 border-border/50"
                    )}>
                      {isEditing ? (
                        <Input 
                          className="h-8 p-1 text-sm font-bold"
                          value={revisedTerms.repaymentPeriod}
                          onChange={(e) => setRevisedTerms({ ...revisedTerms, repaymentPeriod: e.target.value })}
                        />
                      ) : (
                        <p className={cn(
                          "text-sm font-bold",
                          revisedTerms.repaymentPeriod !== proposal.terms.repaymentPeriod && "text-primary"
                        )}>
                          {revisedTerms.repaymentPeriod}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">Revised</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Budget (USD)</Label>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between">
                    <p className="text-sm font-bold">${proposal.budget.toLocaleString()}</p>
                    <Badge variant="outline" className="text-[10px]">Locked</Badge>
                  </div>
                </div>
              </div>

              {isEditing && (
                <Button className="w-full gap-2" onClick={handleUpdateTerms}>
                  <CheckCircle2 className="w-4 h-4" />
                  Apply Revised Terms
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Negotiation History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proposal.history.filter(h => h.action.includes('Revised') || h.action.includes('Counter')).map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <History className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{h.action}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(h.date).toLocaleDateString()}</p>
                      {h.details && <p className="text-xs text-muted-foreground mt-1 italic">"{h.details}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm font-bold">Safe Negotiation</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All negotiations are recorded and legally binding once both parties accept the final terms.
            </p>
            <Button className="w-full h-10 gap-2" variant="outline">
              <MessageSquare className="w-4 h-4" />
              Finalize & Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
