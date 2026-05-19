import React, { useState } from 'react';
import { Payment, PaymentStatus } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Upload, 
  Eye, 
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  MoreVertical,
  ShieldCheck
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useRole } from '@/src/contexts/RoleContext';
import { usePayments } from '@/src/hooks/usePayments';
import { mapPaymentFromApi } from '@/src/lib/apiMappers';
import { Loader2 } from 'lucide-react';

const MOCK_PAYMENTS_FALLBACK: Payment[] = [
  {
    id: 'pay1',
    agreementId: 'a1',
    agreementTitle: 'Solar Irrigation System Agreement',
    amount: 12500,
    type: 'DISBURSEMENT',
    status: 'VERIFIED',
    date: '2024-03-16',
    submittedAt: '2024-03-16T11:00:00Z',
    verifiedAt: '2024-03-17T09:30:00Z',
    senderName: 'Alex Johnson',
    receiverName: 'Zaria Organic Growers',
    receiptUrl: 'receipt_001.pdf'
  },
  {
    id: 'pay2',
    agreementId: 'a1',
    agreementTitle: 'Solar Irrigation System Agreement',
    amount: 2500,
    type: 'REPAYMENT',
    status: 'SUBMITTED',
    date: '2024-03-25',
    submittedAt: '2024-03-25T14:20:00Z',
    senderName: 'Zaria Organic Growers',
    receiverName: 'Alex Johnson',
    receiptUrl: 'receipt_002.pdf'
  },
  {
    id: 'pay3',
    agreementId: 'a2',
    agreementTitle: 'Organic Fertilizer Pilot Agreement',
    amount: 5000,
    type: 'DISBURSEMENT',
    status: 'PENDING',
    date: '2024-03-26',
    senderName: 'Alex Johnson',
    receiverName: 'Sarah Miller'
  }
];

import { motion } from 'motion/react';

export function PaymentList({ 
  onSelectPayment, 
  onSubmitPayment,
  onReviewPayment,
  onViewReceipt
}: { 
  onSelectPayment: (payment: Payment) => void,
  onSubmitPayment: (payment: Payment) => void,
  onReviewPayment: (payment: Payment) => void,
  onViewReceipt?: (payment: Payment) => void
}) {
  const { isAdmin } = useRole();
  const { payments: apiPayments, isLoading } = usePayments();
  const payments = apiPayments.length > 0
    ? apiPayments.map((p) => mapPaymentFromApi(p as unknown as Record<string, unknown>))
    : MOCK_PAYMENTS_FALLBACK;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  if (isLoading && apiPayments.length === 0) {
    return (
      <motion.div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </motion.div>
    );
  }

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'SUBMITTED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><Upload className="w-3 h-3" /> Submitted</Badge>;
      case 'VERIFIED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Verified</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/10 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><XCircle className="w-3 h-3" /> Rejected</Badge>;
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.agreementTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isAdminOrRep = isAdmin;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Payment Tracker</h1>
          <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Monitor disbursements and repayments across your active agreements.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 h-9 px-4 rounded-md border-slate-200 bg-white text-[10px] font-bold uppercase tracking-wider shadow-sm active:scale-95">
            <FileText className="w-3.5 h-3.5" />
            <span>Download Statement</span>
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-9 space-y-6">
          <motion.div variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardContent className="p-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="Search by agreement or payment ID..." 
                      className="pl-9 bg-white border-slate-200 focus-visible:ring-primary/20 h-9 rounded-md text-xs transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white border-slate-200 h-9 rounded-md focus:ring-primary/20 text-[11px] font-bold uppercase tracking-wider transition-all">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border-slate-200">
                      <SelectItem value="all" className="text-xs font-medium">All Status</SelectItem>
                      <SelectItem value="PENDING" className="text-xs font-medium">Pending</SelectItem>
                      <SelectItem value="SUBMITTED" className="text-xs font-medium">Submitted</SelectItem>
                      <SelectItem value="VERIFIED" className="text-xs font-medium">Verified</SelectItem>
                      <SelectItem value="REJECTED" className="text-xs font-medium">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={container} className="grid grid-cols-1 gap-4">
            {filteredPayments.map((payment) => (
              <motion.div key={payment.id} variants={item}>
                <Card className="group hover:shadow-md transition-all duration-300 border border-slate-200 bg-white overflow-hidden rounded-lg">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-5 space-y-5">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-9 h-9 rounded-md flex items-center justify-center shadow-sm",
                                payment.type === 'DISBURSEMENT' ? "bg-primary/10 text-primary" : "bg-emerald-50 text-emerald-600"
                              )}>
                                {payment.type === 'DISBURSEMENT' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                              </div>
                              <h3 className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors">{payment.agreementTitle}</h3>
                              {getStatusBadge(payment.status)}
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-slate-500">
                              <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 font-bold uppercase tracking-wider">
                                <DollarSign className="w-3 h-3 text-slate-400" />
                                {payment.type === 'DISBURSEMENT' ? 'Disbursement' : 'Repayment'}
                              </span>
                              <span className="flex items-center gap-1.5 font-medium">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {new Date(payment.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "text-2xl font-bold tracking-tight",
                              payment.type === 'DISBURSEMENT' ? "text-primary" : "text-emerald-600"
                            )}>
                              ${payment.amount.toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Amount</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-8 text-[10px] text-slate-500 pt-4 border-t border-slate-100">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400">Sender</span>
                            <span className="font-bold text-slate-700">{payment.senderName}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400">Receiver</span>
                            <span className="font-bold text-slate-700">{payment.receiverName}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold uppercase tracking-wider text-[9px] text-slate-400">Transaction ID</span>
                            <span className="font-mono text-slate-700">{payment.id.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50 md:w-56 flex flex-col justify-center p-5 border-t md:border-t-0 md:border-l border-slate-100 gap-2">
                        {isAdminOrRep && payment.status === 'SUBMITTED' ? (
                          <Button 
                            className="w-full h-9 rounded-md gap-2 bg-amber-600 hover:bg-amber-700 text-xs font-bold uppercase tracking-wider" 
                            onClick={() => onReviewPayment(payment)}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Review Receipt</span>
                          </Button>
                        ) : payment.status === 'PENDING' ? (
                          <Button 
                            className="w-full h-9 rounded-md gap-2 text-xs font-bold uppercase tracking-wider" 
                            onClick={() => onSubmitPayment(payment)}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Submit Receipt</span>
                          </Button>
                        ) : (
                          <Button variant="outline" className="w-full h-9 rounded-md gap-2 text-xs font-bold uppercase tracking-wider border-slate-200 bg-white hover:bg-slate-50" onClick={() => onSelectPayment(payment)}>
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </Button>
                        )}
                        {payment.receiptUrl && (
                          <Button 
                            variant="ghost" 
                            className="w-full gap-2 text-[9px] font-bold uppercase tracking-wider h-7 hover:bg-primary/5 hover:text-primary"
                            onClick={() => onViewReceipt?.(payment)}
                          >
                            <FileText className="w-3 h-3" />
                            <span>View Receipt</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <motion.div variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Payment Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Disbursed</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">$17,500</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                      <ArrowUpRight className="w-3 h-3" />
                      <span>+12% vs last month</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Repaid</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">$2,500</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>On track for Q1</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Review</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">2</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      <span>Action required</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border border-primary/10 shadow-sm bg-primary/5 rounded-lg overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight text-slate-900">Security</h3>
                    <p className="text-[9px] font-bold text-primary/60 uppercase tracking-wider">Verified Payments</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed font-medium mb-4">
                  All transactions are verified through multi-party receipt validation to ensure transparency and trust.
                </p>
                <Button variant="outline" className="w-full h-8 rounded-md bg-white border-slate-200 text-slate-700 font-bold text-[9px] uppercase tracking-wider shadow-sm hover:bg-slate-50 transition-all">
                  Security Protocol
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
