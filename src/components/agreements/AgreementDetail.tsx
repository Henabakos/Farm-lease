import React, { useState } from 'react';
import { Agreement, Clause, AgreementStatus, AgreementWorkflowStatus } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Download, 
  History,
  ShieldCheck,
  PenTool,
  Lock,
  Unlock,
  AlertCircle,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAgreements } from '@/src/hooks/useAgreements';
import { mapAgreementFromApi } from '@/src/lib/apiMappers';
import { toast } from 'sonner';
import { motion } from 'motion/react';

const DEFAULT_CLAUSES: Clause[] = [
  { id: 'c1', title: '1. Purpose of Investment', content: 'The Investor agrees to provide the specified amount to the Target for the sole purpose of agricultural expansion and operational improvements as detailed in the approved proposal.', isEditable: false },
  { id: 'c2', title: '2. Repayment Terms', content: 'The Target shall repay the principal amount plus the agreed interest rate within the specified repayment period. Payments shall be made on a quarterly basis.', isEditable: true },
  { id: 'c3', title: '3. Collateral & Security', content: 'The Target provides the specified collateral as security for the investment. In case of default, the Investor has the right to claim the collateral as per local regulations.', isEditable: true },
  { id: 'c4', title: '4. Reporting & Monitoring', content: 'The Target agrees to provide monthly progress reports and allow the Investor or their representative to conduct site visits for monitoring purposes.', isEditable: true },
  { id: 'c5', title: '5. Dispute Resolution', content: 'Any disputes arising from this agreement shall be resolved through mediation in accordance with the laws of the jurisdiction where the Target is located.', isEditable: false },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function AgreementDetail({ 
  agreement, 
  onBack, 
  onSign,
  onUpdateAgreement,
}: { 
  agreement: Agreement, 
  onBack: () => void,
  onSign?: (agreement: Agreement) => void,
  onUpdateAgreement?: (agreement: Agreement) => void,
}) {
  const { user } = useAuth();
  const { signAgreement: apiSignAgreement, updateAgreement: apiUpdateAgreement, downloadAgreement: apiDownloadAgreement } = useAgreements();
  const [clauses, setClauses] = useState<Clause[]>(agreement.clauses.length > 0 ? agreement.clauses : DEFAULT_CLAUSES);
  const [isSigning, setIsSigning] = useState(false);
  const [signedName, setSignedName] = useState('');
  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [terms, setTerms] = useState({ ...agreement.terms });
  const rawWorkflowStatus = agreement.apiStatus ?? (agreement.status === 'SIGNED' ? 'ACTIVE' : 'DRAFT');
  const workflowStatus: AgreementWorkflowStatus = String(rawWorkflowStatus).toUpperCase() as AgreementWorkflowStatus;
  const capturedSignatures = agreement.signatures ?? [];

  const handleClauseChange = (id: string, content: string) => {
    setClauses(clauses.map(c => c.id === id ? { ...c, content } : c));
  };

  const handleSaveTerms = async () => {
    try {
      const updated = await apiUpdateAgreement(agreement.id, {
        terms,
        clauses: clauses.map((clause) => ({
          title: clause.title,
          body: clause.content,
          isEditable: clause.isEditable,
        })),
      });
      const mapped = mapAgreementFromApi(updated as Record<string, unknown>);
      onUpdateAgreement?.(mapped);
      setIsEditingTerms(false);
      toast.success('Agreement draft updated');
    } catch {
      // handled by hook toast
    }
  };

  const handleSign = async () => {
    if (!signedName.trim()) return;
    setIsSigning(true);
    try {
      const updated = await apiSignAgreement(agreement.id, { method: 'TYPED', signature_data: signedName });
      const mapped = mapAgreementFromApi(updated as Record<string, unknown>);
      setIsSigning(false);
      if (onSign) onSign(mapped);
    } catch (err) {
      setIsSigning(false);
    }
  };

  const getStatusBadge = (status: AgreementStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><Clock className="w-3 h-3" /> Pending Signature</Badge>;
      case 'SIGNED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Signed</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/10 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><XCircle className="w-3 h-3" /> Rejected</Badge>;
    }
  };

  const getWorkflowBadge = (status: AgreementWorkflowStatus) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><FileText className="w-3 h-3" /> Draft</Badge>;
      case 'PENDING_SIGNATURES':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><Clock className="w-3 h-3" /> Awaiting Payment</Badge>;
      case 'ACTIVE':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Active</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Completed</Badge>;
      case 'TERMINATED':
      case 'DISPUTED':
        return <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/10 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><XCircle className="w-3 h-3" /> {status.toLowerCase()}</Badge>;
    }
  };

  const currentUserRole = user?.role;
  const currentUserId = user?.id;
  const canEdit = (workflowStatus === 'DRAFT' || workflowStatus === 'PENDING_SIGNATURES') && (
    currentUserRole === 'INVESTOR' ||
    currentUserRole === 'CLUSTER_REP' ||
    currentUserRole === 'ADMIN'
  );
  const hasSigned = Boolean(currentUserId) && capturedSignatures.some((signature) => signature.signerId === currentUserId);
  const canShowSignatureCard = workflowStatus === 'DRAFT' || workflowStatus === 'PENDING_SIGNATURES';
  const canSign = canShowSignatureCard && Boolean(user) && !hasSigned;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="h-9 w-9 rounded-md hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{agreement.title}</h1>
              {getStatusBadge(agreement.status)}
              {getWorkflowBadge(workflowStatus)}
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Contract ID: <span className="font-mono text-primary font-bold">{agreement.id.toUpperCase()}</span> • Created on {new Date(agreement.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 h-9 px-4 rounded-md border-slate-200 bg-white hover:bg-slate-50 transition-all text-xs font-bold uppercase tracking-wider" onClick={() => apiDownloadAgreement(agreement.id, agreement.title)}>
            <Download className="w-3.5 h-3.5" />
            <span>Download Draft</span>
          </Button>
          {workflowStatus === 'DRAFT' && (
            <Button variant="outline" className="text-destructive border-destructive/10 hover:bg-destructive/5 gap-2 h-9 px-4 rounded-md transition-all text-xs font-bold uppercase tracking-wider">
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Agreement Document</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Review and customize the legal clauses of this contract.</CardDescription>
                </div>
                <Badge variant="outline" className="gap-1.5 bg-primary/5 text-primary border-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  Legally Binding
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-10 space-y-8">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-xl font-bold uppercase tracking-widest text-slate-900">Investment Agreement</h2>
                <div className="h-0.5 w-12 bg-primary/20 mx-auto rounded-full" />
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-4">
                  This agreement is entered into between <span className="font-bold text-slate-900">{agreement.investorName}</span> and <span className="font-bold text-slate-900">{agreement.targetName}</span>
                </p>
              </div>

              <div className="space-y-8">
                {clauses.map((clause, index) => (
                  <motion.div 
                    key={clause.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="space-y-3 group"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">{clause.title}</h3>
                      {clause.isEditable ? (
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] font-bold uppercase tracking-wider gap-1 px-2 py-0.5">
                          <Unlock className="w-2.5 h-2.5" /> Editable
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none text-[10px] font-bold uppercase tracking-wider gap-1 px-2 py-0.5">
                          <Lock className="w-2.5 h-2.5" /> Standard
                        </Badge>
                      )}
                    </div>
                    {clause.isEditable && canEdit && isEditingTerms ? (
                      <Textarea 
                        value={clause.content}
                        onChange={(e) => handleClauseChange(clause.id, e.target.value)}
                        className="min-h-25 bg-slate-50 border-slate-200 focus:border-primary/40 focus:ring-primary/10 rounded-md transition-all resize-none text-sm leading-relaxed"
                      />
                    ) : (
                      <p className="text-sm text-slate-600 leading-relaxed pl-4 border-l-2 border-slate-100 group-hover:border-primary/20 transition-all">
                        {clause.content}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>

              <Separator className="my-10 bg-slate-100" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-md border border-slate-200 bg-slate-50/50 space-y-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Signature Progress</p>
                  <p className="text-sm font-bold text-slate-900">{capturedSignatures.length} of 2 signatures captured</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {workflowStatus === 'PENDING_SIGNATURES'
                      ? 'Both parties have signed. The agreement is now waiting for payment verification.'
                      : 'The agreement remains editable until both parties complete the review and signing flow.'}
                  </p>
                </div>

                <div className="p-4 rounded-md border border-slate-200 bg-white space-y-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Latest Revision</p>
                  <p className="text-sm font-bold text-slate-900">{workflowStatus === 'DRAFT' ? 'Draft in review' : 'Ready for activation'}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Edits to clauses or terms reset signatures and require both parties to confirm the updated draft again.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-6">
          <motion.div variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="pb-3 px-5 pt-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Investment Terms</CardTitle>
                  {workflowStatus !== 'ACTIVE' && workflowStatus !== 'COMPLETED' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:bg-primary/5 rounded-md h-7 px-2 text-[10px] font-bold uppercase tracking-wider"
                      onClick={() => setIsEditingTerms(!isEditingTerms)}
                    >
                      {isEditingTerms ? 'Cancel' : 'Edit'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold ml-0.5">Total Amount</Label>
                    <div className="flex items-center gap-3 p-3 rounded-md bg-slate-50 border border-slate-100 group transition-all">
                      <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-lg text-slate-900">${agreement.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold ml-0.5">Interest Rate (%)</Label>
                    {isEditingTerms ? (
                      <Input 
                        type="number" 
                        value={terms.interestRate}
                        onChange={(e) => setTerms({ ...terms, interestRate: Number(e.target.value) })}
                        className="bg-white border-slate-200 focus:border-primary/40 rounded-md h-10 text-sm font-bold"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-md bg-slate-50 border border-slate-100 group transition-all">
                        <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm text-slate-900">{terms.interestRate}%</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold ml-0.5">Repayment Period</Label>
                    {isEditingTerms ? (
                      <Input 
                        value={terms.repaymentPeriod}
                        onChange={(e) => setTerms({ ...terms, repaymentPeriod: e.target.value })}
                        className="bg-white border-slate-200 focus:border-primary/40 rounded-md h-10 text-sm font-bold"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-md bg-slate-50 border border-slate-100 group transition-all">
                        <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm text-slate-900">{terms.repaymentPeriod}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isEditingTerms && canEdit && (
                  <Button 
                    className="w-full h-9 gap-2 rounded-md shadow-sm transition-all text-xs font-bold uppercase tracking-wider" 
                    onClick={handleSaveTerms}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Save Changes
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {canShowSignatureCard && (
            <motion.div variants={item}>
              <Card className="border border-primary/20 shadow-md shadow-primary/5 bg-primary/5 rounded-lg overflow-hidden">
                <CardHeader className="bg-primary/10 py-4 px-5">
                  <div className="flex items-center gap-3 text-primary">
                    <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center shadow-sm">
                      <PenTool className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold">Digital Signature</CardTitle>
                      <CardDescription className="text-[10px] text-primary/70 font-medium uppercase tracking-wider">Finalize Agreement</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="sign-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-0.5">Type your full name to sign</Label>
                    <Input 
                      id="sign-name" 
                      placeholder={user?.full_name || user?.email || 'Your full name'} 
                      className="bg-white border-slate-200 focus:border-primary focus:ring-primary/10 rounded-md h-10 text-sm font-medium px-4 transition-all"
                      value={signedName}
                      onChange={(e) => setSignedName(e.target.value)}
                      disabled={hasSigned}
                    />
                  </div>

                  <div className="p-3.5 rounded-md bg-white border border-primary/10 space-y-2">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Legal Notice</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      By clicking "Sign Agreement", you are providing a digital signature that is legally binding. You agree to all terms and clauses specified.
                    </p>
                  </div>

                  <Button 
                    className="w-full h-10 gap-2 text-xs font-bold uppercase tracking-wider rounded-md shadow-md shadow-primary/20 transition-all" 
                    disabled={!signedName.trim() || isSigning || hasSigned}
                    onClick={handleSign}
                  >
                    {isSigning ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : hasSigned ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Already Signed
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Sign Agreement
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="pb-3 px-5 pt-5">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Agreement History
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                  <div className="flex gap-3 relative z-10">
                    <div className="w-8 h-8 bg-slate-50 rounded-md flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                      <FileText className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">Agreement Drafted</p>
                      <p className="text-[10px] text-slate-500 font-medium">{new Date(agreement.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {agreement.signedAt && (
                    <div className="flex gap-3 relative z-10">
                      <div className="w-8 h-8 bg-emerald-50 rounded-md flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900">Agreement Signed</p>
                        <p className="text-[10px] text-slate-500 font-medium">{new Date(agreement.signedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
