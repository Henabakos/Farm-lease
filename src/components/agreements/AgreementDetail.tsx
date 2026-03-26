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

const DEFAULT_CLAUSES: Clause[] = [
  { id: 'c1', title: '1. Purpose of Investment', content: 'The Investor agrees to provide the specified amount to the Target for the sole purpose of agricultural expansion and operational improvements as detailed in the approved proposal.', isEditable: false },
  { id: 'c2', title: '2. Repayment Terms', content: 'The Target shall repay the principal amount plus the agreed interest rate within the specified repayment period. Payments shall be made on a quarterly basis.', isEditable: true },
  { id: 'c3', title: '3. Collateral & Security', content: 'The Target provides the specified collateral as security for the investment. In case of default, the Investor has the right to claim the collateral as per local regulations.', isEditable: true },
  { id: 'c4', title: '4. Reporting & Monitoring', content: 'The Target agrees to provide monthly progress reports and allow the Investor or their representative to conduct site visits for monitoring purposes.', isEditable: true },
  { id: 'c5', title: '5. Dispute Resolution', content: 'Any disputes arising from this agreement shall be resolved through mediation in accordance with the laws of the jurisdiction where the Target is located.', isEditable: false },
];

export function AgreementDetail({ 
  agreement, 
  onBack, 
  onSign 
}: { 
  agreement: Agreement, 
  onBack: () => void,
  onSign: (id: string) => void
}) {
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
      onSign(agreement.id);
      setIsSigning(false);
    }, 1500);
  };

  const getStatusBadge = (status: AgreementStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><Clock className="w-3 h-3" /> Pending Signature</Badge>;
      case 'SIGNED':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Signed</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{agreement.title}</h1>
              {getStatusBadge(agreement.status)}
            </div>
            <p className="text-muted-foreground">Contract ID: {agreement.id.toUpperCase()} • Created on {new Date(agreement.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            <span>Download Draft</span>
          </Button>
          {agreement.status === 'PENDING' && (
            <Button variant="outline" className="text-destructive hover:bg-destructive/10 gap-2">
              <XCircle className="w-4 h-4" />
              <span>Reject Agreement</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Agreement Document</CardTitle>
                  <CardDescription>Review and customize the legal clauses of this contract.</CardDescription>
                </div>
                <Badge variant="outline" className="gap-1.5">
                  <ShieldCheck className="w-3 h-3" />
                  Legally Binding
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold uppercase tracking-widest">Investment Agreement</h2>
                <p className="text-sm text-muted-foreground">This agreement is entered into between {agreement.investorName} and {agreement.targetName}</p>
              </div>

              <div className="space-y-8">
                {clauses.map((clause) => (
                  <div key={clause.id} className="space-y-3 group">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground">{clause.title}</h3>
                      {clause.isEditable ? (
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] gap-1">
                          <Unlock className="w-2.5 h-2.5" /> Editable
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground border-none text-[10px] gap-1">
                          <Lock className="w-2.5 h-2.5" /> Standard Clause
                        </Badge>
                      )}
                    </div>
                    {clause.isEditable && agreement.status === 'PENDING' ? (
                      <Textarea 
                        value={clause.content}
                        onChange={(e) => handleClauseChange(clause.id, e.target.value)}
                        className="min-h-[80px] bg-background/50 border-muted-foreground/20 focus:border-primary transition-all"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed pl-4 border-l-2 border-muted/50">
                        {clause.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <Separator className="my-12" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Investor Signature</p>
                  <div className="h-24 border-b-2 border-muted flex items-end pb-2 italic font-serif text-2xl text-primary/80">
                    {agreement.investorName}
                  </div>
                  <p className="text-sm font-medium">{agreement.investorName}</p>
                  <p className="text-xs text-muted-foreground">Signed on {new Date(agreement.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Target Signature</p>
                  {agreement.status === 'SIGNED' ? (
                    <div className="space-y-4">
                      <div className="h-24 border-b-2 border-muted flex items-end pb-2 italic font-serif text-2xl text-primary/80">
                        {agreement.targetName}
                      </div>
                      <p className="text-sm font-medium">{agreement.targetName}</p>
                      <p className="text-xs text-muted-foreground">Signed on {new Date(agreement.signedAt!).toLocaleDateString()}</p>
                    </div>
                  ) : (
                    <div className="h-24 border-2 border-dashed border-muted rounded-xl flex items-center justify-center text-muted-foreground/50 italic">
                      Awaiting Signature
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Investment Terms</CardTitle>
                {agreement.status === 'PENDING' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary h-8"
                    onClick={() => setIsEditingTerms(!isEditingTerms)}
                  >
                    {isEditingTerms ? 'Cancel' : 'Customize'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Total Amount</Label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span className="font-bold text-lg">${agreement.amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Interest Rate (%)</Label>
                  {isEditingTerms ? (
                    <Input 
                      type="number" 
                      value={terms.interestRate}
                      onChange={(e) => setTerms({ ...terms, interestRate: Number(e.target.value) })}
                      className="bg-background/50"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="font-bold">{terms.interestRate}%</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Repayment Period</Label>
                  {isEditingTerms ? (
                    <Input 
                      value={terms.repaymentPeriod}
                      onChange={(e) => setTerms({ ...terms, repaymentPeriod: e.target.value })}
                      className="bg-background/50"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-bold">{terms.repaymentPeriod}</span>
                    </div>
                  )}
                </div>
              </div>

              {isEditingTerms && (
                <Button className="w-full h-10 gap-2" onClick={() => setIsEditingTerms(false)}>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Customized Terms
                </Button>
              )}
            </CardContent>
          </Card>

          {agreement.status === 'PENDING' && (
            <Card className="border-none shadow-sm bg-primary/5 border border-primary/20 overflow-hidden">
              <CardHeader className="bg-primary/10">
                <div className="flex items-center gap-2 text-primary">
                  <PenTool className="w-5 h-5" />
                  <CardTitle className="text-lg">Digital Signature</CardTitle>
                </div>
                <CardDescription className="text-primary/70">Sign this document to finalize the investment.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sign-name">Type your full name to sign</Label>
                  <Input 
                    id="sign-name" 
                    placeholder={agreement.targetName} 
                    className="bg-background/50 border-primary/20 focus:border-primary"
                    value={signedName}
                    onChange={(e) => setSignedName(e.target.value)}
                  />
                </div>

                <div className="p-4 rounded-xl bg-background/50 border border-primary/10 space-y-3">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-bold">Legal Notice</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    By clicking "Sign Agreement", you are providing a digital signature that is legally binding and equivalent to a handwritten signature. You agree to all terms and clauses specified in this document.
                  </p>
                </div>

                <Button 
                  className="w-full h-12 gap-2 text-lg shadow-lg shadow-primary/20" 
                  disabled={!signedName.trim() || isSigning}
                  onClick={handleSign}
                >
                  {isSigning ? (
                    <>
                      <Clock className="w-5 h-5 animate-pulse" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Sign Agreement
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Agreement History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Agreement Drafted</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(agreement.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {agreement.signedAt && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Agreement Signed</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(agreement.signedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
