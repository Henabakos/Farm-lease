import React, { useState } from 'react';
import { Agreement, Clause, AgreementStatus } from '@/src/types';
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
import { useStore } from '@/src/store/useStore';
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
  onSign 
}: { 
  agreement: Agreement, 
  onBack: () => void,
  onSign?: (id: string) => void
}) {
  const { user, signAgreement } = useStore();
  const [clauses, setClauses] = useState<Clause[]>(agreement.clauses.length > 0 ? agreement.clauses : DEFAULT_CLAUSES);
  const [isSigning, setIsSigning] = useState(false);
  const [signedName, setSignedName] = useState('');
  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [terms, setTerms] = useState({ ...agreement.terms });

  const handleClauseChange = (id: string, content: string) => {
    setClauses(clauses.map(c => c.id === id ? { ...c, content } : c));
  };

  const handleSign = () => {
    if (!signedName.trim()) return;
    setIsSigning(true);
    setTimeout(() => {
      signAgreement(agreement.id);
      setIsSigning(false);
      toast.success('Agreement signed successfully');
      if (onSign) onSign(agreement.id);
    }, 1500);
  };

  const getStatusBadge = (status: AgreementStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1.5 px-3 py-1"><Clock className="w-3.5 h-3.5" /> Pending Signature</Badge>;
      case 'SIGNED':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1.5 px-3 py-1"><CheckCircle2 className="w-3.5 h-3.5" /> Signed</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1.5 px-3 py-1"><XCircle className="w-3.5 h-3.5" /> Rejected</Badge>;
    }
  };

  const canSign = agreement.status === 'PENDING' && 
                  ((user.role === 'INVESTOR') || 
                   (user.role === 'FARMER' && agreement.farmerId === user.id) || 
                   (user.role === 'CLUSTER_REP' && agreement.clusterId === user.id));

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{agreement.title}</h1>
              {getStatusBadge(agreement.status)}
            </div>
            <p className="text-muted-foreground mt-1">
              Contract ID: <span className="font-mono text-primary/80">{agreement.id.toUpperCase()}</span> • Created on {new Date(agreement.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
            <Download className="w-4 h-4" />
            <span>Download Draft</span>
          </Button>
          {agreement.status === 'PENDING' && (
            <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10 gap-2 rounded-xl transition-all">
              <XCircle className="w-4 h-4" />
              <span>Reject Agreement</span>
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-primary/10 bg-primary/5 py-8 px-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">Agreement Document</CardTitle>
                  <CardDescription className="text-base mt-1">Review and customize the legal clauses of this contract.</CardDescription>
                </div>
                <Badge variant="outline" className="gap-1.5 bg-primary/10 text-primary border-primary/20 px-3 py-1">
                  <ShieldCheck className="w-4 h-4" />
                  Legally Binding
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="text-center space-y-3 mb-10">
                <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-primary/90">Investment Agreement</h2>
                <div className="h-1 w-24 bg-primary/20 mx-auto rounded-full" />
                <p className="text-base text-muted-foreground max-w-md mx-auto">
                  This agreement is entered into between <span className="font-bold text-foreground">{agreement.investorName}</span> and <span className="font-bold text-foreground">{agreement.targetName}</span>
                </p>
              </div>

              <div className="space-y-10">
                {clauses.map((clause, index) => (
                  <motion.div 
                    key={clause.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="space-y-4 group"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{clause.title}</h3>
                      {clause.isEditable ? (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[11px] gap-1.5 px-2.5 py-1">
                          <Unlock className="w-3 h-3" /> Editable
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-none text-[11px] gap-1.5 px-2.5 py-1">
                          <Lock className="w-3 h-3" /> Standard Clause
                        </Badge>
                      )}
                    </div>
                    {clause.isEditable && agreement.status === 'PENDING' ? (
                      <Textarea 
                        value={clause.content}
                        onChange={(e) => handleClauseChange(clause.id, e.target.value)}
                        className="min-h-[100px] bg-background/40 border-primary/10 focus:border-primary/40 focus:ring-primary/10 rounded-2xl transition-all resize-none text-base leading-relaxed"
                      />
                    ) : (
                      <p className="text-base text-muted-foreground/80 leading-relaxed pl-6 border-l-2 border-primary/20 group-hover:border-primary/40 transition-all">
                        {clause.content}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>

              <Separator className="my-16 bg-primary/10" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-5">
                  <p className="text-xs text-primary/60 uppercase tracking-[0.15em] font-black">Investor Signature</p>
                  <div className="h-28 border-b-2 border-primary/10 flex items-end pb-4 italic font-serif text-3xl text-primary/90 bg-primary/5 rounded-t-2xl px-6">
                    {agreement.investorName}
                  </div>
                  <div className="px-1">
                    <p className="text-lg font-bold text-foreground">{agreement.investorName}</p>
                    <p className="text-sm text-muted-foreground">Signed on {new Date(agreement.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <p className="text-xs text-primary/60 uppercase tracking-[0.15em] font-black">Target Signature</p>
                  {agreement.status === 'SIGNED' ? (
                    <div className="space-y-5">
                      <div className="h-28 border-b-2 border-primary/10 flex items-end pb-4 italic font-serif text-3xl text-primary/90 bg-primary/5 rounded-t-2xl px-6">
                        {agreement.targetName}
                      </div>
                      <div className="px-1">
                        <p className="text-lg font-bold text-foreground">{agreement.targetName}</p>
                        <p className="text-sm text-muted-foreground">Signed on {new Date(agreement.signedAt!).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 border-2 border-dashed border-primary/10 rounded-2xl flex items-center justify-center text-muted-foreground/40 italic text-lg bg-muted/5">
                      Awaiting Signature
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-8">
          <motion.div variants={item}>
            <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-3xl overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">Investment Terms</CardTitle>
                  {agreement.status === 'PENDING' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:bg-primary/10 rounded-full h-8 px-4"
                      onClick={() => setIsEditingTerms(!isEditingTerms)}
                    >
                      {isEditingTerms ? 'Cancel' : 'Customize'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] text-primary/60 uppercase tracking-[0.2em] font-black ml-1">Total Amount</Label>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 group hover:border-primary/30 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <span className="font-black text-2xl text-foreground">${agreement.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] text-primary/60 uppercase tracking-[0.2em] font-black ml-1">Interest Rate (%)</Label>
                    {isEditingTerms ? (
                      <Input 
                        type="number" 
                        value={terms.interestRate}
                        onChange={(e) => setTerms({ ...terms, interestRate: Number(e.target.value) })}
                        className="bg-background/40 border-primary/10 focus:border-primary/40 rounded-xl h-12 text-lg font-bold"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 group hover:border-primary/30 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl text-foreground">{terms.interestRate}%</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] text-primary/60 uppercase tracking-[0.2em] font-black ml-1">Repayment Period</Label>
                    {isEditingTerms ? (
                      <Input 
                        value={terms.repaymentPeriod}
                        onChange={(e) => setTerms({ ...terms, repaymentPeriod: e.target.value })}
                        className="bg-background/40 border-primary/10 focus:border-primary/40 rounded-xl h-12 text-lg font-bold"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 group hover:border-primary/30 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl text-foreground">{terms.repaymentPeriod}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isEditingTerms && (
                  <Button 
                    className="w-full h-12 gap-2 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" 
                    onClick={() => setIsEditingTerms(false)}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Save Customized Terms
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {canSign && (
            <motion.div variants={item}>
              <Card className="border-none shadow-2xl shadow-primary/10 bg-primary/5 border border-primary/20 rounded-3xl overflow-hidden">
                <CardHeader className="bg-primary/10 py-6">
                  <div className="flex items-center gap-3 text-primary">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <PenTool className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Digital Signature</CardTitle>
                      <CardDescription className="text-primary/70">Sign this document to finalize the investment.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="sign-name" className="text-sm font-bold ml-1">Type your full name to sign</Label>
                    <Input 
                      id="sign-name" 
                      placeholder={user.name} 
                      className="bg-background/60 border-primary/20 focus:border-primary focus:ring-primary/10 rounded-2xl h-14 text-lg font-medium px-6 transition-all"
                      value={signedName}
                      onChange={(e) => setSignedName(e.target.value)}
                    />
                  </div>

                  <div className="p-5 rounded-2xl bg-background/40 border border-primary/10 space-y-4">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-xs font-black uppercase tracking-wider">Legal Notice</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      By clicking "Sign Agreement", you are providing a digital signature that is legally binding and equivalent to a handwritten signature. You agree to all terms and clauses specified in this document.
                    </p>
                  </div>

                  <Button 
                    className="w-full h-16 gap-3 text-xl font-bold rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all" 
                    disabled={!signedName.trim() || isSigning}
                    onClick={handleSign}
                  >
                    {isSigning ? (
                      <>
                        <Clock className="w-6 h-6 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-6 h-6" />
                        Sign Agreement
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div variants={item}>
            <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-3xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Agreement History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-primary/10">
                  <div className="flex gap-4 relative z-10">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/20 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-foreground">Agreement Drafted</p>
                      <p className="text-xs text-muted-foreground font-medium">{new Date(agreement.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {agreement.signedAt && (
                    <div className="flex gap-4 relative z-10">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-bold text-foreground">Agreement Signed</p>
                        <p className="text-xs text-muted-foreground font-medium">{new Date(agreement.signedAt).toLocaleString()}</p>
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
