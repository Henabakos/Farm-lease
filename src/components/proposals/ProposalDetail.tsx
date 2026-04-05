import React, { useState } from 'react';
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
  Download, 
  Eye, 
  History,
  DollarSign,
  Calendar,
  ShieldCheck,
  TrendingUp,
  Users,
  Sprout,
  ExternalLink,
  PenTool
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/src/store/useStore';
import { toast } from 'sonner';

export function ProposalDetail({ 
  proposal, 
  onBack, 
  onNegotiate 
}: { 
  proposal: Proposal, 
  onBack: () => void,
  onNegotiate: () => void
}) {
  const { user, updateProposalStatus, createAgreement } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'history'>('overview');

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/10 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      case 'NEGOTIATING':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><MessageSquare className="w-3 h-3" /> Negotiating</Badge>;
    }
  };

  const handleApprove = () => {
    updateProposalStatus(proposal.id, 'APPROVED');
    createAgreement(proposal);
    toast.success('Proposal approved and agreement generated');
  };

  const handleReject = () => {
    updateProposalStatus(proposal.id, 'REJECTED');
    toast.error('Proposal rejected');
  };

  const handleSignAgreement = () => {
    createAgreement(proposal);
    toast.success('Agreement generated and sent for signing');
  };

  const canApprove = (user.role === 'FARMER' && proposal.targetType === 'FARMER') || 
                    (user.role === 'CLUSTER_REP' && proposal.targetType === 'CLUSTER') ||
                    (user.role === 'ADMIN');

  const canSign = proposal.status === 'APPROVED' && 
                  ((user.role === 'INVESTOR') || 
                   (user.role === 'FARMER' && proposal.targetType === 'FARMER') || 
                   (user.role === 'CLUSTER_REP' && proposal.targetType === 'CLUSTER'));

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
              {getStatusBadge(proposal.status)}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              {proposal.targetType === 'CLUSTER' ? <Users className="w-3 h-3" /> : <Sprout className="w-3 h-3" />}
              <span>Target: <span className="text-slate-900">{proposal.targetName}</span></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider border-slate-200 bg-white shadow-sm transition-all active:scale-95" onClick={onNegotiate}>
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Negotiate</span>
          </Button>
          
          {proposal.status === 'PENDING' && canApprove && (
            <>
              <Button variant="outline" className="text-destructive hover:bg-destructive/5 border-destructive/10 gap-2 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95" onClick={handleReject}>
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </Button>
              <Button className="gap-2 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95" onClick={handleApprove}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </Button>
            </>
          )}

          {canSign && (
            <Button className="gap-2 bg-primary hover:bg-primary/90 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95" onClick={handleSignAgreement}>
              <PenTool className="w-3.5 h-3.5" />
              <span>Sign Agreement</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-1 border-b border-slate-100 pb-2 overflow-x-auto">
            <Button 
              variant="ghost" 
              className={cn("gap-2 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all", activeTab === 'overview' ? "bg-slate-100 text-primary" : "text-slate-500 hover:bg-slate-50")}
              onClick={() => setActiveTab('overview')}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Overview</span>
            </Button>
            <Button 
              variant="ghost" 
              className={cn("gap-2 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all", activeTab === 'documents' ? "bg-slate-100 text-primary" : "text-slate-500 hover:bg-slate-50")}
              onClick={() => setActiveTab('documents')}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Documents</span>
            </Button>
            <Button 
              variant="ghost" 
              className={cn("gap-2 h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all", activeTab === 'history' ? "bg-slate-100 text-primary" : "text-slate-500 hover:bg-slate-50")}
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
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Proposal Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {proposal.description}
                  </p>
                  
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
                        <span className="font-bold text-xs text-slate-900">{proposal.terms.interestRate}%</span>
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
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Repayment Period</p>
                      <p className="text-xs font-bold text-slate-900">{proposal.terms.repaymentPeriod}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Interest Rate</p>
                      <p className="text-xs font-bold text-slate-900">{proposal.terms.interestRate}% Annually</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Collateral</p>
                      <p className="text-xs font-bold text-slate-900">{proposal.terms.collateral || 'No collateral required'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Funding Type</p>
                      <p className="text-xs font-bold text-slate-900">Direct Investment (Debt)</p>
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
                <CardDescription className="text-xs">Review the technical and legal documents attached to this proposal.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {proposal.documents.map((doc, i) => (
                    <div key={i} className="p-3 rounded-md border border-slate-100 bg-slate-50 flex items-center justify-between group hover:bg-slate-100 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-900 truncate max-w-[120px]">{doc.name}</p>
                          <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">{doc.size} • {doc.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white hover:text-primary border border-transparent hover:border-slate-200 transition-all">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white hover:text-primary border border-transparent hover:border-slate-200 transition-all">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-6 rounded-md bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">Document Preview</h3>
                    <p className="text-[11px] text-slate-500 max-w-[200px]">
                      Select a document to preview its contents directly in the platform.
                    </p>
                  </div>
                  <Button variant="outline" className="gap-2 h-8 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    <ExternalLink className="w-3 h-3" />
                    <span>Open in New Tab</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'history' && (
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Proposal History</CardTitle>
                <CardDescription className="text-xs">Timeline of all actions and changes made to this proposal.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
                  {proposal.history.map((item, i) => (
                    <div key={i} className="relative flex items-start gap-4 pl-10">
                      <div className="absolute left-0 mt-1 w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center z-10 shadow-sm">
                        <History className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900">{item.action}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{new Date(item.date).toLocaleString()}</p>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">By <span className="text-slate-900">{item.user}</span></p>
                        {item.details && (
                          <p className="text-[11px] bg-slate-50 p-2.5 rounded-md mt-2 border border-slate-100 text-slate-600 font-medium">
                            {item.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Compliance Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                {[
                  { label: 'KYC Verified', status: true },
                  { label: 'Land Title Confirmed', status: true },
                  { label: 'Environmental Check', status: true },
                  { label: 'Financial Audit', status: false },
                ].map((check) => (
                  <div key={check.label} className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{check.label}</span>
                    {check.status ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="p-3.5 rounded-md bg-primary/5 border border-primary/10 space-y-1.5">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Secure Transaction</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  All funds are held in escrow until all compliance checks are completed and both parties sign the agreement.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Target Profile</CardTitle>
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
                <div className="flex justify-between text-[10px] uppercase tracking-wider">
                  <span className="text-slate-500 font-bold">Reliability Score</span>
                  <span className="font-bold text-primary">98%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-primary w-[98%]" />
                </div>
              </div>
              <Button variant="outline" className="w-full h-9 rounded-md text-[10px] font-bold uppercase tracking-wider border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                View Full Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
