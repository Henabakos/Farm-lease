import React, { useState } from 'react';
import { Payment, PaymentStatus } from '@/src/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Upload, 
  Eye, 
  FileText,
  ArrowUpRight
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { usePayments } from '@/src/hooks/usePayments';
import { mapPaymentFromApi } from '@/src/lib/apiMappers';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export function InvestorPaymentView({
  onSelectPayment,
  onSubmitPayment,
  onViewReceipt
}: {
  onSelectPayment: (payment: Payment) => void,
  onSubmitPayment: (payment: Payment) => void,
  onViewReceipt?: (payment: Payment) => void
}) {
  const { payments: apiPayments, isLoading } = usePayments();
  const apiPaymentRows: Array<Record<string, unknown>> = Array.isArray(apiPayments)
    ? (apiPayments as Array<Record<string, unknown>>)
    : Array.isArray((apiPayments as { data?: unknown } | undefined)?.data)
      ? ((apiPayments as unknown as { data: Array<Record<string, unknown>> }).data)
      : [];
  const payments: Payment[] = apiPaymentRows.map((payment) => mapPaymentFromApi(payment));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  if (isLoading) {
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

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.agreementTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          payment.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Payments</h1>
          <p className="text-sm text-slate-500 mt-1">View and manage your payment transactions</p>
        </div>
      </div>

      <motion.div variants={item} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by agreement or payment ID..." 
              className="pl-9 bg-white border-slate-200 focus-visible:ring-primary/20 h-9 rounded-md text-xs transition-all"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white border-slate-200 h-9 rounded-md focus:ring-primary/20 text-[11px] font-bold uppercase tracking-wider transition-all">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-md border-slate-200">
              <SelectItem value="all" className="text-xs font-medium">All Statuses</SelectItem>
              <SelectItem value="PENDING" className="text-xs font-medium">Pending</SelectItem>
              <SelectItem value="SUBMITTED" className="text-xs font-medium">Submitted</SelectItem>
              <SelectItem value="VERIFIED" className="text-xs font-medium">Verified</SelectItem>
              <SelectItem value="REJECTED" className="text-xs font-medium">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-1 gap-4">
        {filteredPayments.length === 0 ? (
          <motion.div variants={item} className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-50 text-slate-400">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">No payments yet</h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Payments appear here once you have a fully-signed agreement. Open the agreement and click "Upload Payment Receipt" to schedule the initial disbursement.
            </p>
            <Button
              className="mt-5 h-9 gap-2 px-4 rounded-md text-xs font-bold uppercase tracking-wider"
              onClick={() => (window.location.href = '/agreements')}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Go to Agreements</span>
            </Button>
          </motion.div>
        ) : filteredPayments.map((payment) => (
          <motion.div key={payment.id} variants={item}>
            <Card className="group hover:shadow-md transition-all duration-300 border border-slate-200 bg-white overflow-hidden rounded-lg">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-sm text-slate-900 tracking-tight truncate">
                            {payment.agreementTitle}
                          </h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium truncate">
                          {payment.senderName} → {payment.receiverName}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold tracking-tight text-slate-900">
                          ${payment.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {payment.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {payment.id.toUpperCase()}
                      </span>
                      {payment.dueDate && (
                        <span>Due: {new Date(payment.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-50 md:w-56 flex flex-col justify-center p-5 border-t md:border-t-0 md:border-l border-slate-100 gap-2">
                    {payment.status === 'PENDING' ? (
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
                        View Receipt
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
