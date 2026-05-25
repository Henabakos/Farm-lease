import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DollarSign,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAgreements } from '@/src/hooks/useAgreements';
import { mapAgreementFromApi } from '@/src/lib/apiMappers';
import { paymentsAPI } from '@/src/services/api';
import { toast } from 'sonner';
import { motion } from 'motion/react';
const getDefaultClauses = (agreement: Agreement): Clause[] => {
  const startFmt = agreement.startDate ? new Date(agreement.startDate).toLocaleDateString('en-GB') : 'N/A';
  const endFmt   = agreement.endDate   ? new Date(agreement.endDate).toLocaleDateString('en-GB')   : 'N/A';
  const total    = Number(agreement.totalAmount || agreement.amount * 12 || 0).toLocaleString();
  const monthly  = Number(agreement.amount || 0).toLocaleString();
  const currency = agreement.currency || 'USD';
  const freq     = (agreement.terms?.repaymentPeriod || 'monthly').charAt(0).toUpperCase()
                 + (agreement.terms?.repaymentPeriod || 'monthly').slice(1);

  return [
    {
      id: 'c1',
      title: 'Article 1 - Scope of Agreement',
      content: `1.1 The scope of this lease agreement is to establish a long-term land lease for agricultural farming. The land is leased with all rights of easements of amenities, fittings, fixtures, structures, installations, property, or establishments standing thereon to the Lessee for the purposes mentioned herein.\n\n1.2 This lease agreement shall be applicable to the "lease land" which allows full and exclusive use of the rural land and to make rental payments as stated in Article 2.`,
      isEditable: true,
    },
    {
      id: 'c2',
      title: 'Article 2 - Period of the Land Lease and the Rate',
      content: `2.1 This land lease shall be in effect for the period stated (from ${startFmt} to ${endFmt}). Upon mutual agreement of both parties, it may be renewed for additional year(s).\n\n2.2 Payment Procedure:\n   2.2.1 From the date this lease is signed, there shall be a grace period as agreed. Unpaid rent during the grace period shall be prorated over the remaining years and paid with the regular annual payment.\n   2.2.2 The annual payment shall be ${currency} ${monthly} (${freq}) and the total amount of payment for the lease period shall be ${currency} ${total}.\n   2.2.3 Upon payment of rent, a receipt shall be issued immediately to the Lessee.\n   2.2.4 There shall be a prepayment (down payment) of one period's rent as stated above.\n   2.2.5 The Lessor reserves the right to revise and change the lease rate and inform the Lessee accordingly.`,
      isEditable: true,
    },
    {
      id: 'c3',
      title: 'Article 3 - Rights of the Lessee',
      content: `The Lessee shall have the right to:\n\n3.1 Develop and administer the land in accordance with the terms of this agreement.\n3.2 Build, when deemed appropriate, infrastructure such as irrigation systems, roads, offices, and residential buildings, by submitting permit requests to concerned authorities.\n3.3 Develop or administer the leased land by itself or through a legally represented individual or entity (a person or institution with power of attorney).\n3.4 Develop and cultivate the leased land and collect the harvest by employing modern machinery and other appropriate methods.\n3.5 Obtain additional land based on the performance, achievement, and need of the company.\n3.6 Terminate the land lease contractual agreement subject to at least six (6) months prior written notice with convincing reason and good cause.`,
      isEditable: true,
    },
    {
      id: 'c4',
      title: 'Article 4 - Obligations of the Lessee',
      content: `4.1 The Lessee shall provide good care and conservation of the leased land and natural resources thereon, including:\n   a) Conserving trees not cleared during land preparation.\n   b) Utilizing methods appropriate to prevent soil erosion, especially in sloped areas.\n   c) Respecting and implementing legislation relating to natural resource conservation.\n   d) Conducting an environmental impact assessment within four (4) months of execution.\n\n4.2 The Lessee shall start developing the land within six (6) months from signing, provided all licenses are issued.\n4.3 The Lessee shall develop one-third (1/3) of the leased land within one year and the entire leased land within three (3) years from signing.\n4.4 Upon termination or expiry, the Lessee shall remove installed assets and hand over the land within six (6) months.\n4.5 The Lessee shall provide accurate data and report investment activities upon request.\n4.6 When the grace period ends, the Lessee shall settle the annual rent per the predetermined lease rate.\n4.7 The Lessee shall submit an action plan regarding utilization of the leased land upon entering into this agreement.\n4.8 Without written consent of the Lessor, the Lessee shall not use the land for any purpose other than stated in Article 3.\n4.9 The Lessee has no right to transfer the land unless 75% of the land is developed.\n4.10 Upon developing 75% and obtaining the Lessor's permission, the Lessee may transfer the land. The Lessor shall respond promptly.`,
      isEditable: true,
    },
    {
      id: 'c5',
      title: 'Article 5 - Rights of the Lessor',
      content: `The Lessor has exclusive rights to:\n\n5.1 Control and follow up that the Lessee is executing all obligations diligently.\n5.2 Take over undeveloped areas of the leased land in accordance with sub-article 4.3, upon expiry of the one-year limit, if the Lessee fails to correct such failure within one year after a six-month warning notice.\n5.3 Exercise the right mentioned under Article 5.1 without causing hindrances to the Lessee's work and activities.\n5.4 Terminate the lease agreement, with convincing and justifiable good reason, subject to six (6) months prior notice.\n5.5 Amend the land rent pursuant to this lease agreement.`,
      isEditable: true,
    },
    {
      id: 'c6',
      title: 'Article 6 - Obligations of the Lessor',
      content: `6.1 The Lessor shall hand over the leased land within one (1) month from the date of signing, free from any obstructions.\n6.2 The Lessor shall provide special privileges, such as applicable tax exemptions and incentives, in accordance with the governing laws.\n6.3 The Lessor shall ensure there are no legal or other limitations that may restrict the Lessee from executing its duties under this agreement.\n6.4 The Lessor shall arrange access to applicable government research centers for soil testing and surveying.\n6.5 If the Lessee fails to develop the land within stated time limits, causes damage to natural resources, or becomes unable to pay rent, the Lessor may terminate the lease with six (6) months prior warning; absent such notice, the Lessor may extend the time limit for another six (6) months.\n6.6 The Lessor shall cooperate in providing adequate security, free of charge, so the Lessee may develop the land peacefully, except in cases of force majeure.`,
      isEditable: true,
    },
    {
      id: 'c7',
      title: 'Article 7 - Delivery of the Leased Land',
      content: `7.1 The Lessor shall deliver to the Lessee the land plan, title certificate, and other certificates within thirty (30) days from the signing of this agreement.\n7.2 If the delivery cannot be actualized due to reasons caused by the Lessor, the Lessor shall bear responsibility for such failure.\n7.3 Delivery of the leased land shall be effected once the initial prepayment is completed in accordance with Article 2.2.4.\n7.4 The land shall be handed over within fifteen (15) days of the signing of this agreement.`,
      isEditable: true,
    },
    {
      id: 'c8',
      title: 'Article 8 - Amendment and Renewal of the Contract',
      content: `8.1 This land lease agreement shall be renewable on similar contractual terms and conditions.\n8.2 If the Lessee wishes to renew the agreement, it shall notify the Lessor at least six (6) months before the expiration of the contract period.`,
      isEditable: true,
    },
    {
      id: 'c9',
      title: 'Article 9 - Grounds for Termination of the Contract',
      content: `This land lease agreement may be terminated for the following reasons:\n\n9.1 When the land lease contract period expires.\n9.2 When the Lessor is unable to deliver the land due to causes beyond reasonable control (force majeure).\n9.3 When the Lessor fails to fulfill any obligations even after the Lessee has submitted a six-month prior written notice.\n9.4 When the Lessee fails to make annual rental and other payments for two (2) consecutive years.\n9.5 When the Lessee fails to perform contractual obligations after the Lessor has given six months prior notice.\n9.6 When the Lessor, by giving a six-month prior notice, has good reasons to terminate as indicated in sub-article 5.4.\n9.7 When the Lessee, by giving a six-month prior notice, has good reasons to terminate as indicated in sub-article 3.6.`,
      isEditable: true,
    },
    {
      id: 'c10',
      title: 'Article 10 - Results of Contract Termination',
      content: `10.1 Upon termination, the Lessee shall return the leased land to the Lessor within six (6) months from the date of termination.\n10.2 When this agreement is terminated by the Lessee per Article 9.3 or by the Lessor per Article 9.6, the Lessor shall pay the Lessee the value of improvements and expenditures at market rate after deducting outstanding dues.\n10.3 If this agreement is terminated for reasons stated in Articles 9.4, 9.5, or 9.7, the Lessor shall not be obliged to make any payments to the Lessee.\n10.4 Upon termination, the Lessor has priority to negotiate and purchase properties on the land; if not interested, the Lessee has the right to detach and take its property.`,
      isEditable: true,
    },
    {
      id: 'c11',
      title: 'Article 11 - Registration',
      content: `This land lease agreement shall be subject to registration with the appropriate designated authority. Copies of this agreement shall be sent to the Lessor, the Lessee, and all relevant offices with a covering letter provided by the Lessor.`,
      isEditable: true,
    },
    {
      id: 'c12',
      title: 'Article 12 - Governing Law',
      content: `The applicable law of the jurisdiction in which the land is situated shall govern operations under this agreement.`,
      isEditable: true,
    },
    {
      id: 'c13',
      title: 'Article 13 - Force Majeure',
      content: `Regarding matters of conditions that pertain to forces of majeure (acts of God, war, natural disasters, or government action beyond the control of the parties), neither party shall be held liable for failure to perform obligations caused thereby. The affected party shall notify the other within fifteen (15) days of the occurrence.`,
      isEditable: true,
    },
    {
      id: 'c14',
      title: 'Article 14 - Covenant for Peaceful Possession/Usage',
      content: `The Lessor guarantees that the Lessee has full right to use the land leased under this agreement. The Lessor confirms that the leased land shall remain under peaceful possession and the Lessee shall make use of it without any problem.`,
      isEditable: true,
    },
    {
      id: 'c15',
      title: 'Article 15 - Calendar',
      content: `The Gregorian calendar shall be used as the primary calendar for the purposes of this agreement, unless otherwise stated.`,
      isEditable: true,
    },
    {
      id: 'c16',
      title: 'Article 16 - Annexes to the Agreement',
      content: `The following items are annexed and shall be considered as part of this agreement:\n\n16.1 The site plan of the leased land.\n16.2 Photocopy of valid identification document or passport of the Lessee.\n16.3 Photocopy of the Memorandum and Articles of Association (or equivalent constituting document) of the Lessee.`,
      isEditable: true,
    },
    {
      id: 'c17',
      title: 'Article 17 - Settlement of Disputes',
      content: `When a dispute arises between the Lessor and the Lessee in connection with or arising out of this land lease agreement, both parties shall endeavor to resolve the dispute peacefully and to the mutual benefit of both parties. If the dispute cannot be resolved accordingly, it shall be referred to arbitration or the competent court of jurisdiction.`,
      isEditable: true,
    },
    {
      id: 'c18',
      title: 'Article 18 - Language',
      content: `This agreement has been signed between the contracting parties in English. In the event of any discrepancy between translations, the English version shall prevail.`,
      isEditable: true,
    },
    {
      id: 'c19',
      title: 'Article 19 - Notices and Establishing Offices',
      content: `19.1 The Lessee shall establish and maintain a registered address for service of notices and shall notify the Lessor accordingly.\n19.2 All communications and notices between the parties shall be in writing. Such notices shall be delivered in person, by registered mail, or electronic means to the addresses registered by each party.`,
      isEditable: true,
    },
    {
      id: 'c20',
      title: 'Article 20 - Effective Date of this Contract',
      content: `This land lease agreement shall remain in effect for the agreed term starting ${startFmt} and coming to expiry on ${endFmt}, unless earlier terminated pursuant to the provisions of this agreement.`,
      isEditable: true,
    }
  ];
};

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
  const navigate = useNavigate();
  const { signAgreement: apiSignAgreement, updateAgreement: apiUpdateAgreement, downloadAgreement: apiDownloadAgreement } = useAgreements();
  const [clauses, setClauses] = useState<Clause[]>(agreement.clauses.length > 0 ? agreement.clauses : getDefaultClauses(agreement));
  const [isSigning, setIsSigning] = useState(false);
  const [signedName, setSignedName] = useState('');
  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [isPreparingReceipt, setIsPreparingReceipt] = useState(false);
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

  const handleUploadReceipt = async () => {
    setIsPreparingReceipt(true);
    try {
      // 1) Look for an existing payment tied to this agreement.
      const existing = await paymentsAPI.getAll({ agreementId: agreement.id });
      const rows = (Array.isArray(existing.data?.data) ? existing.data.data : existing.data) as Array<Record<string, unknown>>;
      const hasPending = rows.some((p) => String(p.status ?? '').toLowerCase() === 'pending');

      if (!hasPending) {
        // None found — create one now (server allows either party).
        await paymentsAPI.create({
          agreementId: agreement.id,
          amount: agreement.amount,
          type: 'DISBURSEMENT',
          notes: 'Initial lease disbursement',
        });
      }
      toast.success('Payment ready — submit your receipt from the Payments tab.');
      navigate('/payments');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to prepare payment receipt upload';
      toast.error(msg);
    } finally {
      setIsPreparingReceipt(false);
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
          {workflowStatus === 'PENDING_SIGNATURES' && (
            <Button
              className="gap-2 h-9 px-4 rounded-md transition-all text-xs font-bold uppercase tracking-wider shadow-sm"
              onClick={handleUploadReceipt}
              disabled={isPreparingReceipt}
            >
              {isPreparingReceipt ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Payment Receipt</span>
                </>
              )}
            </Button>
          )}
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
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line pl-4 border-l-2 border-slate-100 group-hover:border-primary/20 transition-all">
                        {clause.content}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Signatures & Execution Section */}
              <div className="mt-12 pt-8 border-t border-slate-200 space-y-6">
                <h3 className="text-center font-bold text-sm uppercase tracking-wider text-slate-700">Execution & Signatures</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Lessor Signature column */}
                  <div className="p-4 rounded-md border border-slate-100 bg-slate-50/50 space-y-3">
                    <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Lessor</h4>
                    <p className="text-xs font-semibold text-slate-800">{agreement.investorName}</p>
                    {(() => {
                      const lessorSig = capturedSignatures.find(s => s.signerId === agreement.lessorId);
                      if (lessorSig) {
                        return (
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400">Signed digitally by:</p>
                            <div className="p-3 bg-white rounded border border-slate-200 text-center shadow-sm">
                              <span className="font-recursive text-xl text-primary italic">
                                {lessorSig.signatureData || lessorSig.signerName || 'Signed'}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-400">Date: {new Date(lessorSig.signedAt).toLocaleString()}</p>
                          </div>
                        );
                      }
                      return (
                        <div className="h-16 flex items-center justify-center border border-dashed border-slate-200 rounded text-[11px] text-slate-400 italic bg-white">
                          Awaiting signature...
                        </div>
                      );
                    })()}
                  </div>

                  {/* Lessee Signature column */}
                  <div className="p-4 rounded-md border border-slate-100 bg-slate-50/50 space-y-3">
                    <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Lessee</h4>
                    <p className="text-xs font-semibold text-slate-800">{agreement.targetName}</p>
                    {(() => {
                      const lesseeSig = capturedSignatures.find(s => s.signerId === agreement.lesseeId);
                      if (lesseeSig) {
                        return (
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-400">Signed digitally by:</p>
                            <div className="p-3 bg-white rounded border border-slate-200 text-center shadow-sm">
                              <span className="font-recursive text-xl text-primary italic">
                                {lesseeSig.signatureData || lesseeSig.signerName || 'Signed'}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-400">Date: {new Date(lesseeSig.signedAt).toLocaleString()}</p>
                          </div>
                        );
                      }
                      return (
                        <div className="h-16 flex items-center justify-center border border-dashed border-slate-200 rounded text-[11px] text-slate-400 italic bg-white">
                          Awaiting signature...
                        </div>
                      );
                    })()}
                  </div>
                </div>
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

          <motion.div variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="pb-3 px-5 pt-5">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Farming Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-5 pb-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Crop</p>
                    <p className="text-xs font-bold text-slate-900">{agreement.terms.cropType || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Land Area</p>
                    <p className="text-xs font-bold text-slate-900">
                      {agreement.terms.landArea
                        ? `${agreement.terms.landArea} ${agreement.terms.landAreaUnit ?? 'hectares'}`
                        : '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Revenue Share</p>
                    <p className="text-xs font-bold text-slate-900">
                      {agreement.terms.revenueShare != null ? `${agreement.terms.revenueShare}% to cluster` : '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Term</p>
                    <p className="text-xs font-bold text-slate-900">
                      {agreement.startDate ? new Date(agreement.startDate).toLocaleDateString() : '—'}
                      {' → '}
                      {agreement.endDate ? new Date(agreement.endDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
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
                    {signedName.trim() && (
                      <div className="mt-2 p-3 bg-white border border-slate-200 rounded-md text-center shadow-sm">
                        <span className="font-recursive text-2xl text-primary italic font-medium">
                          {signedName}
                        </span>
                      </div>
                    )}
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
