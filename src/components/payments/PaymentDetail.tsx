import React from 'react';
import { Payment, PaymentStatus } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Download, 
  Calendar,
  DollarSign,
  User,
  Info,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function PaymentDetail({ 
  payment, 
  onBack,
  onViewReceipt
}: { 
  payment: Payment, 
  onBack: () => void,
  onViewReceipt?: (payment: Payment) => void
}) {
  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-muted text-muted-foreground border-none gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'SUBMITTED':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1"><Clock className="w-3 h-3" /> Submitted</Badge>;
      case 'VERIFIED':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
    }
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
              <h1 className="text-3xl font-bold tracking-tight">Payment Details</h1>
              {getStatusBadge(payment.status)}
            </div>
            <p className="text-muted-foreground">Transaction details for {payment.agreementTitle}.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle>Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Agreement</p>
                    <p className="text-lg font-bold">{payment.agreementTitle}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Payment Type</p>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        payment.type === 'DISBURSEMENT' ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600"
                      )}>
                        {payment.type === 'DISBURSEMENT' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                      </div>
                      <span className="font-semibold">{payment.type === 'DISBURSEMENT' ? 'Investment Disbursement' : 'Loan Repayment'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Amount</p>
                    <p className={cn(
                      "text-3xl font-bold",
                      payment.type === 'DISBURSEMENT' ? "text-primary" : "text-emerald-600"
                    )}>
                      ${payment.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                    <p className="font-semibold">{payment.status}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Sender</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-bold">{payment.senderName}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Receiver</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-bold">{payment.receiverName}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Payment Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{new Date(payment.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Timeline & History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="w-0.5 h-full bg-border/50 my-1"></div>
                  </div>
                  <div className="pb-6">
                    <p className="font-bold">Payment Scheduled</p>
                    <p className="text-sm text-muted-foreground">{new Date(payment.date).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Payment was automatically generated based on agreement terms.</p>
                  </div>
                </div>

                {payment.submittedAt && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="w-0.5 h-full bg-border/50 my-1"></div>
                    </div>
                    <div className="pb-6">
                      <p className="font-bold">Receipt Submitted</p>
                      <p className="text-sm text-muted-foreground">{new Date(payment.submittedAt).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Proof of payment was uploaded by {payment.senderName}.</p>
                    </div>
                  </div>
                )}

                {payment.verifiedAt && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <p className="font-bold">Payment Verified</p>
                      <p className="text-sm text-muted-foreground">{new Date(payment.verifiedAt).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Payment was reviewed and verified by the system administrator.</p>
                    </div>
                  </div>
                )}

                {payment.status === 'REJECTED' && payment.notes && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                        <XCircle className="w-4 h-4 text-destructive" />
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-destructive">Payment Rejected</p>
                      <p className="text-sm text-muted-foreground">Reason: {payment.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Proof of Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {payment.receiptUrl ? (
                <div className="space-y-4">
                  <div className="aspect-[3/4] bg-muted/30 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <FileText className="w-12 h-12 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate max-w-[150px]">{payment.receiptUrl}</p>
                      <p className="text-xs text-muted-foreground">PDF Document • 1.2 MB</p>
                    </div>
                    <Button 
                      variant="secondary" 
                      className="w-full gap-2"
                      onClick={() => onViewReceipt?.(payment)}
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Receipt</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-muted/30 border border-dashed border-border text-center space-y-3">
                  <Info className="w-8 h-8 text-muted-foreground mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">No Receipt Available</p>
                    <p className="text-xs text-muted-foreground">This payment is still pending submission of proof.</p>
                  </div>
                </div>
              )}

              {payment.notes && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</p>
                  <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                    <p className="text-sm italic">"{payment.notes}"</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary/5 border border-primary/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <DollarSign className="w-5 h-5" />
                <h4 className="font-bold">Payment ID</h4>
              </div>
              <p className="font-mono text-xs break-all bg-background/50 p-2 rounded border border-primary/10">
                {payment.id.toUpperCase()}
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                This ID is unique to this transaction and should be used for all inquiries regarding this payment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
