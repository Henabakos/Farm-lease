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
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-md hover:bg-slate-100 transition-all active:scale-95">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Review Payment Receipt</h1>
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md gap-1"><Clock className="w-3 h-3" /> Submitted</Badge>
            </div>
            <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Verify the proof of payment for {payment.agreementTitle}.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-9 gap-2 text-[10px] font-bold uppercase tracking-wider rounded-md border-slate-200 bg-white shadow-sm transition-all active:scale-95">
            <Download className="w-3.5 h-3.5" />
            <span>Download Receipt</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold tracking-tight">Receipt Preview</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-slate-100 transition-all active:scale-95">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Zoom</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-slate-100 transition-all active:scale-95">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-[3/4] bg-slate-50 flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center shadow-sm border border-primary/5">
                  <FileText className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Receipt: {payment.receiptUrl}</h3>
                  <p className="text-xs text-slate-500 max-w-[300px] leading-relaxed font-medium">
                    This is a simulated preview of the uploaded document. In a real application, the PDF or image would be rendered here.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-[400px]">
                  <div className="p-4 rounded-md bg-white border border-slate-100 text-left space-y-1 shadow-sm">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">File Type</p>
                    <p className="text-xs font-bold text-slate-700">PDF Document</p>
                  </div>
                  <div className="p-4 rounded-md bg-white border border-slate-100 text-left space-y-1 shadow-sm">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">File Size</p>
                    <p className="text-xs font-bold text-slate-700">1.2 MB</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold tracking-tight">Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Submitted By</p>
                  <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-md border border-slate-100 shadow-sm">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span className="font-bold text-xs text-slate-900">{payment.senderName}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Submission Date</p>
                  <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-md border border-slate-100 shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span className="font-bold text-xs text-slate-900">{new Date(payment.submittedAt!).toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Payment ID</p>
                  <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100 shadow-sm">
                    <p className="font-mono text-[10px] font-bold text-slate-600">{payment.id.toUpperCase()}</p>
                  </div>
                </div>
              </div>
              
              {payment.notes && (
                <div className="p-4 rounded-md bg-slate-50 border border-slate-100 space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Info className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Sender Notes</span>
                  </div>
                  <p className="text-xs italic text-slate-600 leading-relaxed font-medium">"{payment.notes}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold tracking-tight">Verification Panel</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Cross-check the receipt against the expected terms.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-slate-50 border border-slate-100 space-y-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expected Amount</span>
                    <span className="font-bold text-base text-primary">${payment.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment Type</span>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-white border-slate-200 text-slate-600 px-1.5 py-0 rounded-sm">{payment.type}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Due Date</span>
                    <span className="text-xs font-bold text-slate-700">{new Date(payment.date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Verification Checklist</p>
                  <div className="space-y-2">
                    {[
                      'Transaction ID matches bank record',
                      'Amount matches exactly',
                      'Recipient account is correct',
                      'Receipt is not a duplicate',
                    ].map((check, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-md bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-[11px]">{check}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {!showRejectForm ? (
                <div className="space-y-3">
                  <Button 
                    className="w-full h-10 gap-2 text-[11px] font-bold uppercase tracking-wider rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95" 
                    disabled={isVerifying}
                    onClick={handleVerify}
                  >
                    {isVerifying ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify Payment
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-10 gap-2 text-[11px] font-bold uppercase tracking-wider rounded-md border-rose-200 bg-white text-rose-600 shadow-sm hover:bg-rose-50 transition-all active:scale-95" 
                    onClick={() => setShowRejectForm(true)}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Receipt
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 p-4 rounded-md bg-rose-50 border border-rose-100 animate-in fade-in slide-in-from-top-2 shadow-sm">
                  <div className="space-y-2">
                    <Label htmlFor="reject-reason" className="text-[10px] font-bold uppercase tracking-wider text-rose-600 ml-1">Rejection Reason</Label>
                    <Textarea 
                      id="reject-reason" 
                      placeholder="Explain why this receipt is being rejected..." 
                      className="min-h-[100px] bg-white border-rose-200 focus:border-rose-400 focus:ring-rose-100 text-xs font-medium p-3 resize-none rounded-md"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive" 
                      className="flex-1 h-9 gap-2 text-[10px] font-bold uppercase tracking-wider rounded-md bg-rose-600 hover:bg-rose-700 shadow-sm transition-all active:scale-95" 
                      disabled={!rejectReason.trim() || isRejecting}
                      onClick={handleReject}
                    >
                      {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-9 text-[10px] font-bold uppercase tracking-wider rounded-md border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition-all active:scale-95" 
                      onClick={() => setShowRejectForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-amber-200 shadow-sm bg-amber-50 rounded-lg overflow-hidden">
            <CardContent className="p-4 flex gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                Verification is a critical step. Once verified, funds will be officially recorded in the ledger and the agreement status will be updated accordingly.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
