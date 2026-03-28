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
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      case 'NEGOTIATING':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1"><MessageSquare className="w-3 h-3" /> Negotiating</Badge>;
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{proposal.title}</h1>
              {getStatusBadge(proposal.status)}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {proposal.targetType === 'CLUSTER' ? <Users className="w-4 h-4" /> : <Sprout className="w-4 h-4" />}
              <span>Target: <span className="font-medium text-foreground">{proposal.targetName}</span></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={onNegotiate}>
            <MessageSquare className="w-4 h-4" />
            <span>Negotiate</span>
          </Button>
          
          {proposal.status === 'PENDING' && canApprove && (
            <>
              <Button variant="outline" className="text-destructive hover:bg-destructive/10 gap-2" onClick={handleReject}>
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </Button>
              <Button className="gap-2" onClick={handleApprove}>
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve</span>
              </Button>
            </>
          )}

          {canSign && (
            <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={handleSignAgreement}>
              <PenTool className="w-4 h-4" />
              <span>Sign Agreement</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex gap-4 border-b pb-4 overflow-x-auto">
            <Button 
              variant="ghost" 
              className={cn("gap-2 h-10 px-4", activeTab === 'overview' && "bg-muted font-bold")}
              onClick={() => setActiveTab('overview')}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Overview</span>
            </Button>
            <Button 
              variant="ghost" 
              className={cn("gap-2 h-10 px-4", activeTab === 'documents' && "bg-muted font-bold")}
              onClick={() => setActiveTab('documents')}
            >
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </Button>
            <Button 
              variant="ghost" 
              className={cn("gap-2 h-10 px-4", activeTab === 'history' && "bg-muted font-bold")}
              onClick={() => setActiveTab('history')}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </Button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-8">
              <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Proposal Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-foreground leading-relaxed">
                    {proposal.description}
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Budget</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="font-bold text-lg">${proposal.budget.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Timeline</p>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{proposal.timeline}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Interest Rate</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{proposal.terms.interestRate}%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Repayment</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{proposal.terms.repaymentPeriod}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Financial Terms</CardTitle>
                  <CardDescription>Detailed breakdown of the investment structure.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Repayment Period</p>
                      <p className="text-foreground">{proposal.terms.repaymentPeriod}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Interest Rate</p>
                      <p className="text-foreground">{proposal.terms.interestRate}% Annually</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Collateral</p>
                      <p className="text-foreground">{proposal.terms.collateral || 'No collateral required'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Funding Type</p>
                      <p className="text-foreground">Direct Investment (Debt)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'documents' && (
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Supporting Documents</CardTitle>
                <CardDescription>Review the technical and legal documents attached to this proposal.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {proposal.documents.map((doc, i) => (
                    <div key={i} className="p-4 rounded-xl border bg-muted/20 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[150px]">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.size} • {doc.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-8 rounded-xl bg-muted/50 border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Document Preview</h3>
                    <p className="text-sm text-muted-foreground max-w-[250px]">
                      Select a document to preview its contents directly in the platform.
                    </p>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in New Tab</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'history' && (
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Proposal History</CardTitle>
                <CardDescription>Timeline of all actions and changes made to this proposal.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-muted before:to-transparent">
                  {proposal.history.map((item, i) => (
                    <div key={i} className="relative flex items-start gap-6 pl-12">
                      <div className="absolute left-0 mt-1.5 w-10 h-10 rounded-full bg-card border-2 border-primary flex items-center justify-center z-10 shadow-sm">
                        <History className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-foreground">{item.action}</p>
                          <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleString()}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">By <span className="font-medium text-foreground">{item.user}</span></p>
                        {item.details && (
                          <p className="text-sm bg-muted/30 p-3 rounded-lg mt-2 border border-border/50">
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

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { label: 'KYC Verified', status: true },
                  { label: 'Land Title Confirmed', status: true },
                  { label: 'Environmental Check', status: true },
                  { label: 'Financial Audit', status: false },
                ].map((check) => (
                  <div key={check.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">{check.label}</span>
                    {check.status ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm font-bold">Secure Transaction</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All funds are held in escrow until all compliance checks are completed and both parties sign the agreement.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Target Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  {proposal.targetType === 'CLUSTER' ? <Users className="w-6 h-6 text-primary" /> : <Sprout className="w-6 h-6 text-primary" />}
                </div>
                <div>
                  <p className="font-bold">{proposal.targetName}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{proposal.targetType}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reliability Score</span>
                  <span className="font-bold text-primary">98%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[98%]" />
                </div>
              </div>
              <Button variant="outline" className="w-full h-10">
                View Full Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
