import React, { useState } from 'react';
import { Payment } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Download, 
  Eye, 
  History,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  ExternalLink,
  User,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/src/store/useStore';
import { toast } from 'sonner';

export function PaymentReview({ 
  payment, 
  onBack, 
  onVerify,
  onReject 
}: { 
  payment: Payment, 
  onBack: () => void,
  onVerify: (id: string) => void,
  onReject: (id: string, reason: string) => void
}) {
  const { verifyPayment, updatePayment } = useStore();
  const [rejectReason, setRejectReason] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      verifyPayment(payment.id);
      onVerify(payment.id);
      setIsVerifying(false);
      toast.success('Payment verified successfully');
    }, 1500);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    setIsRejecting(true);
    setTimeout(() => {
      updatePayment(payment.id, { status: 'REJECTED', notes: rejectReason });
      onReject(payment.id, rejectReason);
      setIsRejecting(false);
      toast.success('Payment rejected');
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Review Payment Receipt</h1>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1"><Clock className="w-3 h-3" /> Submitted</Badge>
            </div>
            <p className="text-muted-foreground">Verify the proof of payment for {payment.agreementTitle}.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            <span>Download Receipt</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle>Receipt Preview</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>Zoom</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in New Tab</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-[3/4] bg-muted/50 flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <FileText className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Receipt: {payment.receiptUrl}</h3>
                  <p className="text-sm text-muted-foreground max-w-[300px]">
                    This is a simulated preview of the uploaded document. In a real application, the PDF or image would be rendered here.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-[400px]">
                  <div className="p-4 rounded-xl bg-background/50 border border-border/50 text-left space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">File Type</p>
                    <p className="text-sm font-bold">PDF Document</p>
                  </div>
                  <div className="p-4 rounded-xl bg-background/50 border border-border/50 text-left space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">File Size</p>
                    <p className="text-sm font-bold">1.2 MB</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Submitted By</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-bold">{payment.senderName}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Submission Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{new Date(payment.submittedAt!).toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Payment ID</p>
                  <p className="font-mono text-xs">{payment.id.toUpperCase()}</p>
                </div>
              </div>
              
              {payment.notes && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Sender Notes</span>
                  </div>
                  <p className="text-sm italic text-foreground">"{payment.notes}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Verification Panel</CardTitle>
              <CardDescription>Cross-check the receipt against the expected terms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-background/50 border border-border/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Expected Amount</span>
                    <span className="font-bold text-lg text-primary">${payment.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Payment Type</span>
                    <Badge variant="outline" className="text-[10px]">{payment.type}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Due Date</span>
                    <span className="text-sm font-medium">{new Date(payment.date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Verification Checklist</p>
                  <div className="space-y-2">
                    {[
                      'Transaction ID matches bank record',
                      'Amount matches exactly',
                      'Recipient account is correct',
                      'Receipt is not a duplicate',
                    ].map((check, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span>{check}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {!showRejectForm ? (
                <div className="space-y-3">
                  <Button 
                    className="w-full h-12 gap-2 text-lg shadow-lg shadow-primary/20" 
                    disabled={isVerifying}
                    onClick={handleVerify}
                  >
                    {isVerifying ? (
                      <>
                        <Clock className="w-5 h-5 animate-pulse" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        Verify Payment
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 gap-2 text-destructive hover:bg-destructive/10" 
                    onClick={() => setShowRejectForm(true)}
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Receipt
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <Label htmlFor="reject-reason" className="text-destructive">Rejection Reason</Label>
                    <Textarea 
                      id="reject-reason" 
                      placeholder="Explain why this receipt is being rejected..." 
                      className="min-h-[100px] bg-background/50 border-destructive/20 focus:border-destructive"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive" 
                      className="flex-1 h-10 gap-2" 
                      disabled={!rejectReason.trim() || isRejecting}
                      onClick={handleReject}
                    >
                      {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-10" 
                      onClick={() => setShowRejectForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-amber-500/5 border border-amber-500/10">
            <CardContent className="p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-[10px] text-amber-700 leading-relaxed">
                Verification is a critical step. Once verified, funds will be officially recorded in the ledger and the agreement status will be updated accordingly.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
