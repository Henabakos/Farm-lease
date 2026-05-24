import React, { useEffect, useState } from 'react';
import { Proposal, ProposalStatus } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileText,
  History,
  DollarSign,
  Calendar,
  ShieldCheck,
  TrendingUp,
  Users,
  Sprout,
  Send,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProposals, type ProposalHistoryEntry } from '@/src/hooks/useProposals';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

function StatusBadge({ status }: { status: ProposalStatus }) {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
          <Clock className="w-3 h-3" /> Pending
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
          <CheckCircle2 className="w-3 h-3" /> Accepted
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/10 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
          <XCircle className="w-3 h-3" /> Rejected
        </Badge>
      );
    case 'NEGOTIATING':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
          <MessageSquare className="w-3 h-3" /> Negotiating
        </Badge>
      );
    default:
      return null;
  }
}

function formatHistoryAction(action: string): string {
  const labels: Record<string, string> = {
    CREATED: 'Created proposal',
    UPDATED: 'Updated proposal',
    PUBLISHED: 'Submitted proposal',
    REVIEWED: 'Reviewed proposal',
    ACCEPTED: 'Accepted proposal',
    REJECTED: 'Rejected proposal',
    COUNTERED: 'Sent counter-offer',
    WITHDRAWN: 'Withdrawn proposal',
    EXPIRED: 'Expired proposal',
  };

  return labels[action] ?? action.replace(/_/g, ' ').toLowerCase();
}

function formatHistorySummary(details: ProposalHistoryEntry['details']): string | null {
  if (!details) return null;
  if (typeof details === 'string') return details;
  if (typeof details !== 'object') return String(details);

  const parts: string[] = [];
  const proposedAmount = (details as any).proposedAmount ?? (details as any).proposed_amount;
  if (proposedAmount != null) parts.push(`Amount: $${Number(proposedAmount).toLocaleString()}`);

  const reason = (details as any).reason;
  if (reason) parts.push(`Reason: ${String(reason)}`);

  const proposedTerms = (details as any).proposedTerms ?? (details as any).proposed_terms;
  if (proposedTerms && typeof proposedTerms === 'object') {
    const interestRate = proposedTerms.interestRate ?? proposedTerms.interest_rate;
    const repaymentPeriod = proposedTerms.repaymentPeriod ?? proposedTerms.repayment_period;
    if (interestRate != null) parts.push(`Interest: ${Number(interestRate)}%`);
    if (repaymentPeriod) parts.push(`Repayment: ${String(repaymentPeriod)}`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

function humanizeHistoryKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatHistoryValue(value: unknown): string {
  if (value == null || value === '') return 'Not provided';
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString() : 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length > 0 ? value.map((item) => formatHistoryValue(item)).join(', ') : 'None';
  if (typeof value === 'object') return 'See nested details';
  return String(value);
}

function renderHistoryDetails(details: ProposalHistoryEntry['details']) {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return null;

  const entries = Object.entries(details as Record<string, unknown>).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (entries.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-slate-100 bg-slate-50/70">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Details</p>
          <p className="text-[11px] text-slate-500">Structured summary of the action.</p>
        </div>
        <Badge variant="outline" className="bg-white text-slate-500 border-slate-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
          {entries.length} fields
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-100">
        {entries.map(([key, value]) => {
          const isNested = value && typeof value === 'object' && !Array.isArray(value);
          return (
            <div key={key} className="bg-white px-3 py-3 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{humanizeHistoryKey(key)}</p>
              {isNested ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(value as Record<string, unknown>)
                    .filter(([, nestedValue]) => nestedValue !== undefined && nestedValue !== null && nestedValue !== '')
                    .map(([nestedKey, nestedValue]) => (
                      <div key={nestedKey} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{humanizeHistoryKey(nestedKey)}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-900 wrap-break-word">{formatHistoryValue(nestedValue)}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="mt-1 text-sm font-semibold text-slate-900 wrap-break-word">{formatHistoryValue(value)}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProposalDetail({
  proposal,
  onBack,
  onNegotiate,
  onUpdateProposal,
}: {
  proposal: Proposal;
  onBack: () => void;
  onNegotiate: () => void;
  onUpdateProposal: (updated: Partial<Proposal>) => void;
}) {
  const { user } = useAuth();
  const { acceptProposal, rejectProposal, withdrawProposal, publishProposal, reviewProposal, getHistory } = useProposals();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'history'>('overview');
  const [history, setHistory] = useState<ProposalHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoadingHistory(true);
      try {
        const rows = await getHistory(proposal.id);
        if (!cancelled) setHistory(rows);
      } catch {
        // history is non-critical
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [proposal.id, getHistory]);

  // Permission model (mirrors backend rules):
  //  - The counterparty (target farmer OR cluster owner) can accept / reject.
  //  - The investor can publish (if draft) and negotiate at any non-terminal stage.
  //  - Any party can negotiate (until terminal).
  const isInvestor = user?.id === (proposal as any).investorId || user?.role === 'INVESTOR';
  const isCounterparty =
    proposal.targetType === 'FARMER'
      ? user?.id === proposal.targetId
      : user?.role === 'CLUSTER_REP' || user?.role === 'ADMIN';

  const apiStatus = proposal.apiStatus ?? 'published';
  const isDraft = apiStatus === 'draft';
  const isTerminal = apiStatus === 'accepted' || apiStatus === 'rejected' || apiStatus === 'withdrawn' || apiStatus === 'expired';

  const canPublish = isDraft && isInvestor;
  const canWithdraw = !isDraft && !isTerminal && isInvestor;
  const canActOnProposal = !isDraft && !isTerminal && isCounterparty;
  const canNegotiate = !isDraft && !isTerminal && (isInvestor || isCounterparty);

  const handleAccept = async () => {
    setIsActing(true);
    try {
      const updated = await acceptProposal(proposal.id, proposal.version);
      onUpdateProposal(updated);
    } finally {
      setIsActing(false);
    }
  };

  const handlePublish = async () => {
    setIsActing(true);
    try {
      const updated = await publishProposal(proposal.id, proposal.version);
      onUpdateProposal(updated);
    } finally {
      setIsActing(false);
    }
  };

  const handleReview = async () => {
    setIsActing(true);
    try {
      const updated = await reviewProposal(proposal.id, proposal.version);
      onUpdateProposal(updated);
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    setIsActing(true);
    try {
      const updated = await rejectProposal(proposal.id, rejectReason.trim() || undefined, proposal.version);
      onUpdateProposal(updated);
      setShowRejectModal(false);
      setRejectReason('');
    } finally {
      setIsActing(false);
    }
  };

  const handleWithdraw = async () => {
    setIsActing(true);
    try {
      const updated = await withdrawProposal(proposal.id, withdrawReason.trim() || undefined, proposal.version);
      onUpdateProposal(updated);
      setShowWithdrawModal(false);
      setWithdrawReason('');
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-md border border-slate-200 bg-white shadow-sm transition-all active:scale-95">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{proposal.title}</h1>
              <StatusBadge status={proposal.status} />
              {isDraft && (
                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
                  Draft
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-1">
              {proposal.targetType === 'CLUSTER' ? <Users className="w-3 h-3" /> : <Sprout className="w-3 h-3" />}
              <span>Target: <span className="text-slate-900">{proposal.targetName}</span></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canPublish && (
            <Button
              onClick={handlePublish}
              disabled={isActing}
              className="gap-2 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95"
            >
              {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Submit</span>
            </Button>
          )}
          {canNegotiate && (
            <Button
              variant="outline"
              className="gap-2 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider border-slate-200 bg-white shadow-sm transition-all active:scale-95"
              onClick={onNegotiate}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Negotiate</span>
            </Button>
          )}
          {canWithdraw && (
            <Button
              variant="outline"
              disabled={isActing}
              className="text-slate-600 hover:bg-slate-50 border-slate-200 gap-2 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95"
              onClick={() => setShowWithdrawModal(true)}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Withdraw</span>
            </Button>
          )}
          {canActOnProposal && (
            <>
              <Button
                variant="outline"
                disabled={isActing}
                className="gap-2 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider border-slate-200 bg-white shadow-sm transition-all active:scale-95"
                onClick={handleReview}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Counter-offer</span>
              </Button>
              <Button
                variant="outline"
                disabled={isActing}
                className="text-destructive hover:bg-destructive/5 border-destructive/10 gap-2 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95"
                onClick={() => setShowRejectModal(true)}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </Button>
              <Button
                disabled={isActing}
                onClick={handleAccept}
                className="gap-2 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95"
              >
                {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Accept</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-1 border-b border-slate-100 pb-2 overflow-x-auto">
            <Button
              variant="ghost"
              className={cn(
                'gap-2 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all',
                activeTab === 'overview' ? 'bg-slate-100 text-primary' : 'text-slate-500 hover:bg-slate-50',
              )}
              onClick={() => setActiveTab('overview')}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Overview</span>
            </Button>
            <Button
              variant="ghost"
              className={cn(
                'gap-2 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all',
                activeTab === 'documents' ? 'bg-slate-100 text-primary' : 'text-slate-500 hover:bg-slate-50',
              )}
              onClick={() => setActiveTab('documents')}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Documents</span>
            </Button>
            <Button
              variant="ghost"
              className={cn(
                'gap-2 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all',
                activeTab === 'history' ? 'bg-slate-100 text-primary' : 'text-slate-500 hover:bg-slate-50',
              )}
              onClick={() => setActiveTab('history')}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </Button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{proposal.description || 'No description provided.'}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Budget</p>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3 text-primary" />
                        <span className="font-bold text-base text-slate-900">${proposal.budget.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Timeline</p>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-primary" />
                        <span className="font-bold text-xs text-slate-900">{proposal.timeline}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Interest Rate</p>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-primary" />
                        <span className="font-bold text-xs text-slate-900">
                          {proposal.terms.interestRate ? `${proposal.terms.interestRate}%` : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Repayment</p>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-primary" />
                        <span className="font-bold text-xs text-slate-900">{proposal.terms.repaymentPeriod}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Financial Terms</CardTitle>
                  <CardDescription className="text-xs">Detailed breakdown of the investment structure.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Repayment Period</p>
                      <p className="text-xs font-bold text-slate-900">{proposal.terms.repaymentPeriod}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Interest Rate</p>
                      <p className="text-xs font-bold text-slate-900">
                        {proposal.terms.interestRate ? `${proposal.terms.interestRate}% Annually` : '—'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Collateral</p>
                      <p className="text-xs font-bold text-slate-900">{proposal.terms.collateral || 'No collateral required'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ROI</p>
                      <p className="text-xs font-bold text-slate-900">{proposal.roi ? `${proposal.roi}%` : '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Revenue Share</p>
                      <p className="text-xs font-bold text-slate-900">
                        {proposal.terms.revenueShare != null ? `${proposal.terms.revenueShare}% to cluster` : '—'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expected Start</p>
                      <p className="text-xs font-bold text-slate-900">
                        {proposal.terms.expectedStartDate
                          ? new Date(proposal.terms.expectedStartDate).toLocaleDateString()
                          : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Farming Plan</CardTitle>
                  <CardDescription className="text-xs">Crop and land area committed by the investor.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Crop Type</p>
                      <p className="text-xs font-bold text-slate-900">{proposal.terms.cropType || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Land Area</p>
                      <p className="text-xs font-bold text-slate-900">
                        {proposal.terms.landArea
                          ? `${proposal.terms.landArea} ${proposal.terms.landAreaUnit ?? 'hectares'}`
                          : '—'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Location</p>
                      <p className="text-xs font-bold text-slate-900">{proposal.location || '—'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'documents' && (
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Supporting Documents</CardTitle>
                <CardDescription className="text-xs">Files attached to this proposal.</CardDescription>
              </CardHeader>
              <CardContent>
                {proposal.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {proposal.documents.map((doc, i) => (
                      <div key={i} className="p-3 rounded-md border border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-slate-900 truncate max-w-40">{doc.name}</p>
                            <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">{doc.size} • {doc.type}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                    No documents attached
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'history' && (
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Proposal History</CardTitle>
                <CardDescription className="text-xs">Timeline of all actions on this proposal.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="py-10 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                    No history yet
                  </div>
                ) : (
                  <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
                    {history.map((h) => (
                      <div key={h.id} className="relative flex items-start gap-4 pl-10">
                        <div className="absolute left-0 mt-1 w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center z-10 shadow-sm">
                          <History className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900">{formatHistoryAction(h.action)}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              {new Date(h.created_at).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {formatHistoryAction(h.action)} recorded in the proposal timeline.
                          </p>
                          {formatHistorySummary(h.details) && (
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {formatHistorySummary(h.details)}
                            </p>
                          )}
                          {renderHistoryDetails(h.details)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Target</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-md flex items-center justify-center">
                  {proposal.targetType === 'CLUSTER' ? <Users className="w-4 h-4 text-primary" /> : <Sprout className="w-4 h-4 text-primary" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{proposal.targetName}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">{proposal.targetType}</p>
                </div>
              </div>
              <Separator className="bg-slate-100" />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Secure Transaction</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  All actions on this proposal are recorded in an immutable audit log.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject this proposal?</DialogTitle>
            <DialogDescription>
              Optionally include a reason. The investor will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Reason (optional)
            </Label>
            <Textarea
              id="reason"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="The interest rate is higher than our threshold..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={isActing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isActing}>
              {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <XCircle className="w-3.5 h-3.5 mr-2" />}
              Reject Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="sm:max-w-105 rounded-lg border-slate-200">
          <DialogHeader>
            <DialogTitle>Withdraw proposal</DialogTitle>
            <DialogDescription>
              The counterparty will be notified and negotiation will stop.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="withdrawReason" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Reason
            </Label>
            <Textarea
              id="withdrawReason"
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              rows={4}
              placeholder="Optional reason..."
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawModal(false)} disabled={isActing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleWithdraw} disabled={isActing}>
              {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
