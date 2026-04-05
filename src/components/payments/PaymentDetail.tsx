import React from 'react';
import { Payment, PaymentStatus } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
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
        return <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'SUBMITTED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><Clock className="w-3 h-3" /> Submitted</Badge>;
      case 'VERIFIED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Verified</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/10 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><XCircle className="w-3 h-3" /> Rejected</Badge>;
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-md border border-slate-200 bg-white hover:bg-slate-50">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payment Details</h1>
              {getStatusBadge(payment.status)}
            </div>
            <p className="text-slate-500 text-xs mt-0.5">Transaction details for {payment.agreementTitle}.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-9 px-4 rounded-md border-slate-200 bg-white text-xs font-bold uppercase tracking-wider">
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-5">
              <CardTitle className="text-base font-bold tracking-tight">Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Agreement</p>
                    <p className="text-base font-bold text-slate-900 leading-tight">{payment.agreementTitle}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment Type</p>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-7 h-7 rounded-md flex items-center justify-center",
                        payment.type === 'DISBURSEMENT' ? "bg-primary/10 text-primary" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {payment.type === 'DISBURSEMENT' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{payment.type === 'DISBURSEMENT' ? 'Investment Disbursement' : 'Loan Repayment'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Amount</p>
                    <p className={cn(
                      "text-3xl font-bold tracking-tight",
                      payment.type === 'DISBURSEMENT' ? "text-primary" : "text-emerald-600"
                    )}>
                      ${payment.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</p>
                    <p className="text-sm font-bold text-slate-700">{payment.status}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sender</p>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">{payment.senderName}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Receiver</p>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">{payment.receiverName}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">{new Date(payment.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-base font-bold tracking-tight">Timeline & History</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="w-px h-full bg-slate-100 my-1"></div>
                  </div>
                  <div className="pb-6">
                    <p className="text-sm font-bold text-slate-900">Payment Scheduled</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{new Date(payment.date).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-500 mt-1">Payment was automatically generated based on agreement terms.</p>
                  </div>
                </div>

                {payment.submittedAt && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="w-px h-full bg-slate-100 my-1"></div>
                    </div>
                    <div className="pb-6">
                      <p className="text-sm font-bold text-slate-900">Receipt Submitted</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{new Date(payment.submittedAt).toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">Proof of payment was uploaded by {payment.senderName}.</p>
                    </div>
                  </div>
                )}

                {payment.verifiedAt && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Payment Verified</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{new Date(payment.verifiedAt).toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">Payment was reviewed and verified by the system administrator.</p>
                    </div>
                  </div>
                )}

                {payment.status === 'REJECTED' && payment.notes && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-md bg-destructive/5 flex items-center justify-center shrink-0">
                        <XCircle className="w-3.5 h-3.5 text-destructive" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-destructive">Payment Rejected</p>
                      <p className="text-xs text-slate-500 mt-1">Reason: {payment.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-base font-bold tracking-tight">Proof of Payment</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              {payment.receiptUrl ? (
                <div className="space-y-4">
                  <div className="aspect-[3/4] bg-slate-50 rounded-md border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <FileText className="w-10 h-10 text-slate-300" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{payment.receiptUrl}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">PDF Document • 1.2 MB</p>
                    </div>
                    <Button 
                      variant="secondary" 
                      className="w-full h-9 rounded-md gap-2 text-xs font-bold uppercase tracking-wider bg-white border border-slate-200 hover:bg-slate-50"
                      onClick={() => onViewReceipt?.(payment)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-md bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
                  <Info className="w-6 h-6 text-slate-300 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">No Receipt Available</p>
                    <p className="text-[10px] text-slate-500">This payment is still pending submission of proof.</p>
                  </div>
                </div>
              )}

              {payment.notes && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Notes</p>
                  <div className="p-4 rounded-md bg-slate-50 border border-slate-200">
                    <p className="text-xs italic text-slate-600">"{payment.notes}"</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-primary/5 rounded-lg">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <DollarSign className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Payment ID</h4>
              </div>
              <p className="font-mono text-xs break-all bg-white p-2 rounded-md border border-primary/10 text-slate-700">
                {payment.id.toUpperCase()}
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                This ID is unique to this transaction and should be used for all inquiries regarding this payment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
;
}
