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

const DEFAULT_CLAUSES: Clause[] = [
  {
    id: 'c1',
    title: 'Preamble and Parties',
    content: `Unofficial translation. This land lease agreement is made between:
- The Ministry of Agriculture and Rural Development, Kirkos Sub-city, Addis Ababa, Ethiopia (the "Lessor"), and
- Rahwa Agri-Development PLC, Bole Sub-city, Kebele 02, House No. Addis, Tel: _______ (the "Lessee"), including successors/beneficiaries and authorized representatives.

Whereas the Lessee is a business entity established to engage in cotton development under the laws of Ethiopia and requires sufficient land for production in the Southern Nations, Nationalities and Peoples Regional State; and
Whereas the Lessor is willing to provide the needed land in accordance with the terms and conditions stated herein;

Now therefore, the parties execute this agreement on 07/09/2002 EC (May 15, 2010).`,
    isEditable: false,
  },
  {
    id: 'c2',
    title: 'Article 1 - Scope of Agreement',
    content: `1.1 The scope of this agreement is to establish a long-term land lease for cotton, cereals, oil seeds, and field crops farming on 3,000 hectares located in the Southern Nations, Nationalities and Peoples Regional State, South Omo Zone, Dassanech District, Karawo and Qelemagnato Kebele. The land is leased with all rights of easements, amenities, fittings, fixtures, structures, installations, property, or establishments standing thereon to the Lessee for the purposes mentioned below.
1.2 This agreement applies to the "lease land" and grants full and exclusive use of rural land, subject to rental payments stated in Article 2.`,
    isEditable: false,
  },
  {
    id: 'c3',
    title: 'Article 2 - Period of the Land Lease and the Rate',
    content: `2.1 The lease term is 25 years. Upon mutual agreement, the term may be renewed for additional year(s).
2.2 Payment procedure of the land lease:
  2.2.1 From the signing date, there is a three (3) year grace period. Unpaid rent during the grace period shall be prorated over the remaining lease term and paid with the regular annual payment.
  2.2.2 The lease rate is Birr 158 per hectare for agricultural investment stated in Article 1. The annual payment is Birr 474,000 and the total payment for the lease period is Birr 11,850,000.
  2.2.3 Upon payment of rent, a receipt shall be issued immediately to the Lessee and a copy submitted to the district (wereda) administration office.
  2.2.4 In addition to 2.2.1, there shall be a prepayment (down payment) of one year rent of the land stated above.
  2.2.5 The Lessor reserves the right to revise the lease rate and inform the Lessee accordingly.`,
    isEditable: false,
  },
  {
    id: 'c4',
    title: 'Article 3 - Rights of the Lessee',
    content: `The Lessee shall have the right to:
3.1 Develop and administer the land in accordance with this agreement.
3.2 Build infrastructure such as dams, water boreholes, power houses, irrigation systems, roads, bridges, offices, residential buildings, fuel stations, and health and educational institutions, subject to permits and consultation with concerned authorities.
3.3 Develop or administer the leased land by itself or through a legally represented individual or entity.
3.4 Develop, cultivate, and harvest the leased land using modern machinery and appropriate methods.
3.5 Obtain additional land based on performance, achievement, and need of the company.
3.6 Terminate the agreement with at least six months prior written notice, with convincing reason and good cause.`,
    isEditable: false,
  },
  {
    id: 'c5',
    title: 'Article 4 - Obligations of the Lessee',
    content: `4.1 The Lessee shall provide good care and conservation of the leased land and natural resources and shall:
  a) Conserve trees not cleared during land preparation.
  b) Use methods appropriate to prevent soil erosion, especially in sloped areas.
  c) Respect and implement legislation relating to natural resource conservation.
  d) Conduct an environmental impact assessment and provide a report within four months of execution of this agreement.
4.2 The Lessee shall start developing the land within six months of signing, provided required licenses are issued.
4.3 The Lessee shall develop one-third (1/3) of the leased land within one year and the entire land within three years from the signing date.
4.4 Upon termination or expiry, or cancellation of the investment license, the Lessee shall remove installed assets within six months and hand over the land to the Lessor.
4.5 Upon request of the Ministry of Agriculture and Rural Development, the Lessee shall provide accurate data and report investment activities.
4.6 When the grace period ends, the Lessee shall settle annual rent and prorated amounts at the regional office every year between December and June.
4.7 Upon entering into this agreement, the Lessee shall submit an action plan for use of the leased land.
4.8 Without written consent of the Lessor, the Lessee shall not use the land for any purpose other than stated in Article 3.
4.9 The Lessee may not transfer the land to another company or individual unless 75% of the land is developed.
4.10 Upon developing 75% and obtaining the Lessor's permission, the Lessee may transfer the land, and the Lessor shall respond promptly.`,
    isEditable: false,
  },
  {
    id: 'c6',
    title: 'Article 5 - Rights of the Lessor',
    content: `The Lessor has exclusive rights to:
5.1 Control and follow up that the Lessee executes all obligations diligently.
5.2 Take over undeveloped areas in accordance with sub-article 4.3 after the one-year limit, if the Lessee fails to correct within one year after six months notice of warning.
5.3 Exercise rights under 5.1 without hindering the Lessee's work and activities.
5.4 Terminate the lease agreement with convincing and justifiable good reason, subject to six months prior notice.
5.5 Amend the land rent pursuant to this agreement.`,
    isEditable: false,
  },
  {
    id: 'c7',
    title: 'Article 6 - Obligations of the Lessor',
    content: `6.1 The Lessor shall hand over the leased land within one month of signing, free from obstructions.
6.2 The Lessor shall provide special privileges such as exemptions from taxation and import duties on capital goods, and repatriation of capital and profits, in accordance with Ethiopian laws for foreign companies.
6.3 The Lessor shall ensure there are no legal or other limitations that may restrict the Lessee's duties in clearing the land or implementing the objectives.
6.4 The Lessor shall arrange access to federal and regional research centers for soil testing and surveying for a fee.
6.5 If the Lessee fails to develop the land within time limits, causes damage to natural resources, or becomes unable to pay rent, the Lessor may terminate the lease with six months prior notice of warning; if no notice is given, the Lessor may extend the time limit by six months.
6.6 The Lessor shall cooperate (including adequate security) free of charge so the Lessee may develop the land peacefully, free from trouble, riot, or disturbance except force majeure.`,
    isEditable: false,
  },
  {
    id: 'c8',
    title: 'Article 7 - Delivery of the Leased Land',
    content: `7.1 The Lessor shall deliver the land plan, title certificate, and other certificates within 30 days of signing.
7.2 If delivery cannot be actualized due to reasons caused by the Lessor after written notice, the Lessor assumes responsibility for such failure.
7.3 Delivery shall be effected once the one-year prepayment is completed in accordance with Article 2.2.2.
7.4 The land shall be handed over within 15 days of signing.`,
    isEditable: false,
  },
  {
    id: 'c9',
    title: 'Article 8 - Amendment and Renewal of the Contract',
    content: `8.1 This agreement may be renewed on similar terms and conditions.
8.2 If the Lessee wishes to renew, it shall notify the Lessor six months before expiration.`,
    isEditable: false,
  },
  {
    id: 'c10',
    title: 'Article 9 - Grounds for Termination of the Contract',
    content: `This agreement may be terminated for the following reasons:
9.1 Expiry of the lease period.
9.2 The Lessor is unable to deliver the land due to causes beyond reasonable control (force majeure).
9.3 The Lessor fails to fulfill obligations after a six-month prior written notice from the Lessee.
9.4 The Lessee fails to make annual rental and other tax payments for two consecutive years.
9.5 The Lessee fails to perform obligations after a six-month prior notice from the Lessor.
9.6 The Lessor terminates with good reason after six months prior notice as indicated in 5.4.
9.7 The Lessor terminates with good reason after six months prior notice as indicated in 3.6.`,
    isEditable: false,
  },
  {
    id: 'c11',
    title: 'Article 10 - Results of Contract Termination',
    content: `10.1 Upon termination, the Lessee shall return the leased land within six months of termination.
10.2 If terminated by the Lessee per 9.3 or by the Lessor per 9.6, the Lessor shall pay the Lessee for improvements and expenses at market rate after deducting outstanding dues.
10.3 If terminated for reasons in 9.4, 9.5, or 9.7, the Lessor is not obliged to make payments to the Lessee.
10.4 Upon termination, the Lessor has priority to negotiate and purchase properties on the land; if not interested, the Lessee may detach and take its property.`,
    isEditable: false,
  },
  {
    id: 'c12',
    title: 'Article 11 - Registration',
    content: `This agreement is not subject to registration and approval by a designated entity. Copies of the agreement and carbon copies shall be sent to the Lessor, the Lessee, the district (wereda) administration, finance office, investment commission, and other concerned entities with a covering letter of cooperation provided by the Lessor.`,
    isEditable: false,
  },
  {
    id: 'c13',
    title: 'Article 12 - Governing Law',
    content: `The Ethiopian law shall govern operations under this agreement.`,
    isEditable: false,
  },
  {
    id: 'c14',
    title: 'Article 13 - Force Majeure',
    content: `Regarding matters of force majeure, the Ethiopian Civil Code shall apply.`,
    isEditable: false,
  },
  {
    id: 'c15',
    title: 'Article 14 - Covenant for Peaceful Possession/Usage',
    content: `The Lessor guarantees the Lessee has full ownership and property rights in the leased land. The Lessor confirms the land remains under its peaceful possession and the Lessee may use it without problem.`,
    isEditable: false,
  },
  {
    id: 'c16',
    title: 'Article 15 - Calendar',
    content: `The Ethiopian calendar shall be used for the purpose of this agreement.`,
    isEditable: false,
  },
  {
    id: 'c17',
    title: 'Article 16 - Annexes to the Agreement',
    content: `The following items are annexed and considered part of this agreement:
16.1 The site plan of the leased land.
16.2 Photocopy of ID card or passport of the Lessee.
16.3 Photocopy of the memorandum and Articles of Association of the Lessee.`,
    isEditable: false,
  },
  {
    id: 'c18',
    title: 'Article 17 - Settlement of Disputes',
    content: `If a dispute arises between the parties, they shall endeavor to resolve it peacefully. If the dispute cannot be resolved, it shall be referred to the Ethiopian Federal Court.`,
    isEditable: false,
  },
  {
    id: 'c19',
    title: 'Article 18 - Language',
    content: `This agreement has been signed between the contracting parties in Amharic.`,
    isEditable: false,
  },
  {
    id: 'c20',
    title: 'Article 19 - Notices and Establishing Offices',
    content: `19.1 The Lessee shall establish an office in Ethiopia to perform its duties and notify the Lessor accordingly.
19.2 All communications and notices of warning shall be in writing either in English or Amharic and delivered in person or sent by mail to the addresses in the preamble.`,
    isEditable: false,
  },
  {
    id: 'c21',
    title: 'Article 20 - Effective Date of this Contract',
    content: `This agreement remains in effect for 25 years starting from 07/09/2002 EC (May 15, 2010) and expires on 06/09/2027 EC (May 14, 2035).`,
    isEditable: false,
  },
  {
    id: 'c22',
    title: 'Signatures and Witnesses',
    content: `Lessor: Ministry of Agriculture and Rural Development
Name: Tefera Deribew, Minister
Signature: illegible
Date: not stated

Lessee: Rahwa Agri-Development PLC
Name: not stated
Signature: illegible
Date: not stated

Witnesses:
1) Rahwa M/Ab - Signature: illegible - Date: 07/09/2002 EC (05/15/2010)
2) Berhanu Tesfaye - Signature: illegible - Date: 07/09/2002 EC (05/15/2010)
3) Wondimagegnehu - Signature: illegible - Date: 07/09/2002 EC (05/15/2010)

Note: Each page bears two seals (Ministry of Agriculture and Rural Development and Adama Development PLC) and initials by both parties. The last page includes additional signatures: Dr. Abera Deressa, State Minister of Agriculture, and Esayas Kebede Amare, Director, Agricultural Investment Directorate.`,
    isEditable: false,
  },
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
  const navigate = useNavigate();
  const { signAgreement: apiSignAgreement, updateAgreement: apiUpdateAgreement, downloadAgreement: apiDownloadAgreement } = useAgreements();
  const [clauses, setClauses] = useState<Clause[]>(agreement.clauses.length > 0 ? agreement.clauses : DEFAULT_CLAUSES);
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
