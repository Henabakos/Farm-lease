import React, { useEffect, useMemo, useState } from 'react';
import { Proposal } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Send,
  DollarSign,
  History,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Loader2,
  Check,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProposals, type NegotiationEntry } from '@/src/hooks/useProposals';
import { useAuth } from '@/src/contexts/AuthContext';

function formatNegotiationDetails(entry: NegotiationEntry) {
  const details: Array<{ label: string; value: string }> = [];
  if (entry.proposed_amount != null) {
    details.push({ label: 'Amount', value: `$${Number(entry.proposed_amount).toLocaleString()}` });
  }
  const terms = entry.proposed_terms || {};
  if (terms.interestRate != null || terms.interest_rate != null) {
    details.push({
      label: 'Interest',
      value: `${Number(terms.interestRate ?? terms.interest_rate).toFixed(1)}%`,
    });
  }
  if (terms.repaymentPeriod || terms.repayment_period) {
    details.push({ label: 'Repayment', value: String(terms.repaymentPeriod ?? terms.repayment_period) });
  }
  return details;
}

function formatNegotiationBody(entry: NegotiationEntry) {
  const details = formatNegotiationDetails(entry);
  const chunks = details.map((detail) => `${detail.label}: ${detail.value}`);
  if (entry.message?.trim()) chunks.push(entry.message.trim());
  return chunks.join('\n');
}

export function NegotiationView({
  proposal,
  onBack,
  onUpdateProposal,
}: {
  proposal: Proposal;
  onBack: () => void;
  onUpdateProposal: (updated: Partial<Proposal>) => void;
}) {
  const { user } = useAuth();
  const { negotiateProposal, getNegotiations } = useProposals();

  const [proposedAmount, setProposedAmount] = useState<string>(String(proposal.budget));
  const [proposedInterestRate, setProposedInterestRate] = useState<string>(
    proposal.terms.interestRate ? String(proposal.terms.interestRate) : '',
  );
  const [proposedRepaymentPeriod, setProposedRepaymentPeriod] = useState<string>(
    proposal.terms.repaymentPeriod ?? '',
  );
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [history, setHistory] = useState<NegotiationEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const currentUserName = user?.full_name ?? 'You';
  const counterpartyName = proposal.targetName || 'Counterparty';
  const threadTitle = proposal.targetType === 'CLUSTER' ? 'Cluster negotiation' : 'Farmer negotiation';

  const threadMessages = useMemo(
    () =>
      history.map((entry) => {
        const isMe = entry.initiator_id === user?.id;
        return {
          id: entry.id,
          isMe,
          senderName: isMe ? currentUserName : entry.initiator_name ?? counterpartyName,
          timestamp: entry.created_at,
          body: formatNegotiationBody(entry),
          entry,
        };
      }),
    [history, user?.id, currentUserName, counterpartyName],
  );

  const refreshHistory = React.useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const rows = await getNegotiations(proposal.id);
      setHistory(rows);
    } catch {
      // history is non-critical
    } finally {
      setIsLoadingHistory(false);
    }
  }, [getNegotiations, proposal.id]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(proposedAmount);
    if (!amount || amount <= 0) return;
    setIsSubmitting(true);
    try {
      const updated = await negotiateProposal(proposal.id, {
        proposedAmount: amount,
        proposedTerms: {
          interestRate: proposedInterestRate ? Number(proposedInterestRate) : undefined,
          repaymentPeriod: proposedRepaymentPeriod || undefined,
        },
        message: message.trim() || undefined,
      }, proposal.version);
      // Notify parent that the proposal moved to NEGOTIATING.
      onUpdateProposal({ ...updated, status: 'NEGOTIATING', apiStatus: 'negotiating' });
      setMessage('');
      await refreshHistory();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 h-[calc(100vh-140px)] min-h-190">
      <Card className="flex flex-col overflow-hidden border border-slate-200 shadow-sm bg-white rounded-lg min-h-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-md hover:bg-slate-100 transition-all active:scale-95 shrink-0">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
            <Avatar className="w-10 h-10 rounded-md border border-slate-200 shadow-sm shrink-0">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${counterpartyName}`} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {counterpartyName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg lg:text-xl font-bold tracking-tight text-slate-900 truncate">
                  {threadTitle}: {proposal.title}
                </h1>
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                  {proposal.apiStatus === 'negotiating' ? 'Negotiating' : 'Counter-offer thread'}
                </Badge>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5 truncate">
                {counterpartyName} · {proposal.targetType}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your current draft</p>
              <p className="text-xs font-bold text-slate-900">${Number(proposedAmount || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.02),transparent_45%)]">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : threadMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-slate-400">
              <div className="w-12 h-12 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider">No counter-offers yet</p>
              <p className="text-[11px]">Start the negotiation with a message and updated terms.</p>
            </div>
          ) : (
            threadMessages.map((item, index) => {
              const showAvatar = index === 0 || threadMessages[index - 1].senderName !== item.senderName;
              return (
                <div
                  key={item.id}
                  className={cn('flex gap-3 max-w-[88%]', item.isMe ? 'ml-auto flex-row-reverse' : 'mr-auto')}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-md flex items-center justify-center shrink-0 shadow-sm text-[10px] font-bold uppercase',
                      item.isMe
                        ? 'bg-primary text-white border border-primary'
                        : 'bg-white text-slate-400 border border-slate-200',
                      !showAvatar && 'opacity-0',
                    )}
                  >
                    {item.senderName.charAt(0)}
                  </div>
                  <div className={cn('space-y-1', item.isMe ? 'items-end' : 'items-start')}>
                    <div
                      className={cn(
                        'p-3 rounded-md text-sm shadow-sm leading-relaxed',
                        item.isMe
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-slate-50 text-slate-700 border border-slate-200 rounded-tl-none',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 truncate">
                          {item.isMe ? currentUserName : item.senderName}
                        </p>
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {item.body.trim().length > 0 ? (
                        <div className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">
                          {item.body}
                        </div>
                      ) : (
                        <p className="text-sm opacity-80">Counter-offer updated</p>
                      )}
                      <div className={cn('mt-3 grid gap-2', item.isMe ? 'text-white/90' : 'text-slate-600')}>
                        {formatNegotiationDetails(item.entry).map((detail) => (
                          <div
                            key={detail.label}
                            className={cn(
                              'flex items-center justify-between gap-3 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-wider border',
                              item.isMe ? 'bg-white/10 border-white/15' : 'bg-white border-slate-200',
                            )}
                          >
                            <span>{detail.label}</span>
                            <span>{detail.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        {item.isMe ? 'You' : item.senderName}
                      </span>
                      {item.isMe && <CheckCheck className="w-3 h-3 text-primary" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-slate-100 bg-white p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                  Proposed Amount
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={proposedAmount}
                    onChange={(e) => setProposedAmount(e.target.value)}
                    className="h-10 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="interestRate" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                  Interest Rate (%)
                </Label>
                <Input
                  id="interestRate"
                  type="number"
                  min="0"
                  step="0.1"
                  value={proposedInterestRate}
                  onChange={(e) => setProposedInterestRate(e.target.value)}
                  className="h-10 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="repayment" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                  Repayment Period
                </Label>
                <Input
                  id="repayment"
                  value={proposedRepaymentPeriod}
                  onChange={(e) => setProposedRepaymentPeriod(e.target.value)}
                  placeholder="e.g., 18 months"
                  className="h-10 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                Message
              </Label>
              <Textarea
                id="message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain the rationale for your counter-offer..."
                className="bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium p-3 resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                This sends a new negotiation entry for {counterpartyName}.
              </p>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 gap-2 text-[11px] font-bold uppercase tracking-wider rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Counter-Offer
              </Button>
            </div>
          </form>
        </div>
      </Card>

      <div className="space-y-6 min-h-0">
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base font-bold tracking-tight">Current vs Proposed</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              Live preview of your counter-offer.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {[
              { label: 'Amount', original: `$${proposal.budget.toLocaleString()}`, proposed: `$${Number(proposedAmount || 0).toLocaleString()}` },
              { label: 'Interest Rate', original: proposal.terms.interestRate ? `${proposal.terms.interestRate}%` : '—', proposed: proposedInterestRate ? `${proposedInterestRate}%` : '—' },
              { label: 'Repayment', original: proposal.terms.repaymentPeriod, proposed: proposedRepaymentPeriod || '—' },
            ].map((row) => {
              const changed = row.original !== row.proposed;
              return (
                <div key={row.label} className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    {row.label}
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 rounded-md bg-slate-50 border border-slate-100 shadow-sm">
                      <p className="text-xs font-bold text-slate-900">{row.original}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Current</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <div className={cn(
                      'flex-1 p-3 rounded-md border transition-all shadow-sm',
                      changed ? 'bg-white border-primary ring-2 ring-primary/10' : 'bg-slate-50 border-slate-100',
                    )}>
                      <p className={cn('text-xs font-bold', changed ? 'text-primary' : 'text-slate-900')}>
                        {row.proposed}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Proposed</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden flex-1 min-h-0">
          <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base font-bold tracking-tight">Negotiation History</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {history.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center py-4">
                No counter-offers yet
              </p>
            ) : (
              <div className="space-y-5">
                {history.map((h) => (
                  <div key={h.id} className="flex gap-3 group">
                    <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center shrink-0 border border-primary/5 group-hover:scale-110 transition-transform">
                      <History className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-slate-700 leading-tight truncate">
                        {h.initiator_name ? `${h.initiator_name} countered` : 'Counter-offer'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {new Date(h.created_at).toLocaleString()}
                      </p>
                      {(h.message || h.proposed_terms || h.proposed_amount != null) && (
                        <div className="mt-1.5 space-y-1.5">
                          <div className="flex flex-wrap gap-2">
                            {formatNegotiationDetails(h).map((detail) => (
                              <span
                                key={detail.label}
                                className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-slate-600"
                              >
                                {detail.label}: {detail.value}
                              </span>
                            ))}
                          </div>
                          {h.message && (
                            <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-wrap">
                              {h.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="p-5 rounded-lg bg-primary/5 border border-primary/10 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Audited</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Every counter-offer is recorded in the proposal's immutable history.
          </p>
          <Separator className="bg-primary/10" />
          <Button
            type="button"
            variant="outline"
            className="w-full h-9 gap-2 text-[10px] font-bold uppercase tracking-wider rounded-md bg-white border-primary/20 text-primary"
            onClick={onBack}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Back to Proposal
          </Button>
        </div>
      </div>
    </div>
  );
}
