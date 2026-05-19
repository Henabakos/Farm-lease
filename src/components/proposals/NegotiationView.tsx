import React, { useEffect, useState } from 'react';
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
  CheckCircle2,
  History,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProposals, type ProposalHistoryEntry } from '@/src/hooks/useProposals';

export function NegotiationView({
  proposal,
  onBack,
  onUpdateProposal,
}: {
  proposal: Proposal;
  onBack: () => void;
  onUpdateProposal: (updated: Partial<Proposal>) => void;
}) {
  const { negotiateProposal, getHistory } = useProposals();

  const [proposedAmount, setProposedAmount] = useState<string>(String(proposal.budget));
  const [proposedInterestRate, setProposedInterestRate] = useState<string>(
    proposal.terms.interestRate ? String(proposal.terms.interestRate) : '',
  );
  const [proposedRepaymentPeriod, setProposedRepaymentPeriod] = useState<string>(
    proposal.terms.repaymentPeriod ?? '',
  );
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [history, setHistory] = useState<ProposalHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const refreshHistory = React.useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const rows = await getHistory(proposal.id);
      setHistory(rows);
    } catch {
      // history is non-critical
    } finally {
      setIsLoadingHistory(false);
    }
  }, [getHistory, proposal.id]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const counterEntries = history.filter((h) => h.action === 'COUNTERED' || h.action === 'NEGOTIATED');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(proposedAmount);
    if (!amount || amount <= 0) return;
    setIsSubmitting(true);
    try {
      await negotiateProposal(proposal.id, {
        proposedAmount: amount,
        proposedTerms: {
          interestRate: proposedInterestRate ? Number(proposedInterestRate) : undefined,
          repaymentPeriod: proposedRepaymentPeriod || undefined,
        },
        message: message.trim() || undefined,
      });
      // Notify parent that the proposal moved to NEGOTIATING.
      onUpdateProposal({ status: 'NEGOTIATING', apiStatus: 'negotiating' });
      setMessage('');
      await refreshHistory();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-md hover:bg-slate-100 transition-all active:scale-95">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Negotiate: {proposal.title}</h1>
          <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">
            Send a counter-offer with revised terms. The other party will be notified.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9 border border-slate-200 shadow-sm">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${proposal.targetName}`} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {proposal.targetName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">{proposal.targetName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{proposal.targetType}</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                  {proposal.apiStatus === 'negotiating' ? 'Negotiating' : 'Counter-offer'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-9"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Original: ${proposal.budget.toLocaleString()}
                    </p>
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
                      className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3"
                    />
                    <p className="text-[10px] text-slate-400">
                      Original: {proposal.terms.interestRate || '—'}%
                    </p>
                  </div>
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
                    className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3"
                  />
                  <p className="text-[10px] text-slate-400">Original: {proposal.terms.repaymentPeriod}</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Message (Optional)
                  </Label>
                  <Textarea
                    id="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Explain the rationale for your counter-offer..."
                    className="bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium p-3 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 gap-2 text-[11px] font-bold uppercase tracking-wider rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Counter-Offer
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
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

          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold tracking-tight">Negotiation History</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingHistory ? (
                <div className="py-6 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                </div>
              ) : counterEntries.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center py-4">
                  No counter-offers yet
                </p>
              ) : (
                <div className="space-y-5">
                  {counterEntries.map((h) => (
                    <div key={h.id} className="flex gap-3 group">
                      <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center shrink-0 border border-primary/5 group-hover:scale-110 transition-transform">
                        <History className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-700 leading-tight">Counter-offer</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {new Date(h.created_at).toLocaleString()}
                        </p>
                        {h.details && (
                          <pre className="text-[11px] text-slate-500 mt-1.5 leading-relaxed bg-slate-50 p-2 rounded-md border border-slate-100 font-mono whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(h.details, null, 2)}
                          </pre>
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
    </div>
  );
}
