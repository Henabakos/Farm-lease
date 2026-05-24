import React, { useState } from 'react';
import { Payment, PaymentStatus } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
  Eye,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  ShieldCheck,
  TrendingUp,
  AlertCircle
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
  const { role, isAdmin, isClusterRep } = useRole();
  const isInvestor = role === 'INVESTOR';
  const { payments: apiPayments, stats, isLoading } = usePayments();
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Header skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-md" />
            <Skeleton className="h-3 w-72 rounded-md" />
          </div>
          <Skeleton className="h-9 w-40 rounded-md" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left — search bar + payment cards */}
          <div className="lg:col-span-9 space-y-6">
            {/* Search / filter bar */}
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardContent className="p-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Skeleton className="md:col-span-2 h-9 rounded-md" />
                  <Skeleton className="h-9 rounded-md" />
                </div>
              </CardContent>
            </Card>

            {/* Payment card skeletons */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border border-slate-200 bg-white overflow-hidden rounded-lg">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-5 space-y-5">
                        {/* Title row */}
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <Skeleton className="w-9 h-9 rounded-md shrink-0" />
                              <Skeleton className="h-5 w-56 rounded-md" />
                              <Skeleton className="h-5 w-20 rounded-md" />
                            </div>
                            <div className="flex items-center gap-3 pl-12">
                              <Skeleton className="h-4 w-28 rounded-md" />
                              <Skeleton className="h-4 w-24 rounded-md" />
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <Skeleton className="h-8 w-20 rounded-md" />
                            <Skeleton className="h-3 w-12 rounded-md ml-auto" />
                          </div>
                        </div>

                        {/* Footer row */}
                        <div className="flex items-center gap-8 pt-4 border-t border-slate-100">
                          <div className="space-y-1">
                            <Skeleton className="h-3 w-10 rounded-md" />
                            <Skeleton className="h-4 w-24 rounded-md" />
                          </div>
                          <div className="space-y-1">
                            <Skeleton className="h-3 w-12 rounded-md" />
                            <Skeleton className="h-4 w-24 rounded-md" />
                          </div>
                          <div className="space-y-1">
                            <Skeleton className="h-3 w-20 rounded-md" />
                            <Skeleton className="h-4 w-32 rounded-md" />
                          </div>
                        </div>
                      </div>

                      {/* Action panel */}
                      <div className="bg-slate-50 md:w-56 flex flex-col justify-center p-5 border-t md:border-t-0 md:border-l border-slate-100 gap-3">
                        <Skeleton className="h-9 w-full rounded-md" />
                        <Skeleton className="h-7 w-full rounded-md" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right — stats sidebar skeleton */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="p-5 pb-3 border-b border-slate-100">
                <Skeleton className="h-4 w-28 rounded-md" />
              </CardHeader>
              <CardContent className="p-5 pt-4 space-y-5">
                {/* Stat rows */}
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-8 w-32 rounded-md" />
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </div>
                ))}
                {/* Volume divider */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-5 w-28 rounded-md" />
                  <Skeleton className="h-3 w-36 rounded-md" />
                </div>
                {/* Breakdown grid */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <div className="grid grid-cols-2 gap-1.5">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="h-12 rounded-md" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security card skeleton */}
            <Card className="border border-primary/10 shadow-sm bg-primary/5 rounded-lg overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-md shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-3 w-28 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
              </CardContent>
            </Card>
          </div>
        </div>
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

  const isAdminOrRep = isAdmin || isClusterRep;

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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
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
            {filteredPayments.length === 0 ? (
              <motion.div variants={item} className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-50 text-slate-400">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold tracking-tight text-slate-900">No payments yet</h2>
                <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                  {payments.length === 0 && isInvestor
                    ? 'Payments appear here once you have a fully-signed agreement. Open the agreement and click "Upload Payment Receipt" to schedule the initial disbursement.'
                    : 'Try adjusting your filters or search query.'}
                </p>
                {payments.length === 0 && isInvestor && (
                  <Button
                    className="mt-5 h-9 gap-2 px-4 rounded-md text-xs font-bold uppercase tracking-wider"
                    onClick={() => (window.location.href = '/agreements')}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Go to Agreements</span>
                  </Button>
                )}
              </motion.div>
            ) : filteredPayments.map((payment) => (
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
                        ) : isInvestor && payment.status === 'PENDING' ? (
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
              <CardHeader className="p-5 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Payment Stats</CardTitle>
                  {stats?.is_admin && (
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/10 px-2 py-0.5">
                      Platform-wide
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-4 space-y-5">
                {/* Total Disbursed */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Disbursed</p>
                  {isLoading || !stats ? (
                    <Skeleton className="h-8 w-28 rounded-md" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                      ${stats.total_disbursed.toLocaleString()}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>{stats ? `${stats.verified_count} verified` : '—'}</span>
                  </div>
                </div>

                {/* Total Repaid */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Repaid</p>
                  {isLoading || !stats ? (
                    <Skeleton className="h-8 w-24 rounded-md" />
                  ) : (
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                      ${stats.total_repaid.toLocaleString()}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified repayments</span>
                  </div>
                </div>

                {/* Pending Review */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Review</p>
                  {isLoading || !stats ? (
                    <Skeleton className="h-8 w-12 rounded-md" />
                  ) : (
                    <p className={cn(
                      "text-2xl font-bold tracking-tight",
                      stats.submitted_count > 0 ? "text-amber-600" : "text-slate-900"
                    )}>
                      {stats.submitted_count}
                    </p>
                  )}
                  {stats && stats.submitted_count > 0 ? (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      <span>Awaiting verification</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>All clear</span>
                    </div>
                  )}
                </div>

                {/* Total Volume */}
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Volume</p>
                  {isLoading || !stats ? (
                    <Skeleton className="h-6 w-20 rounded-md" />
                  ) : (
                    <p className="text-base font-bold text-primary tracking-tight">
                      ${stats.total_volume.toLocaleString()}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 font-medium">
                    {stats ? `${stats.total_payments} total transaction${stats.total_payments !== 1 ? 's' : ''}` : '—'}
                  </p>
                </div>

                {/* Status Breakdown */}
                {stats && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Breakdown</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: 'Pending', count: stats.pending_count, color: 'bg-slate-100 text-slate-600' },
                        { label: 'Submitted', count: stats.submitted_count, color: 'bg-blue-50 text-blue-600' },
                        { label: 'Verified', count: stats.verified_count, color: 'bg-emerald-50 text-emerald-600' },
                        { label: 'Rejected', count: stats.rejected_count, color: 'bg-red-50 text-red-500' },
                      ].map(({ label, count, color }) => (
                        <div key={label} className={cn('rounded-md px-2 py-1.5 text-center', color)}>
                          <p className="text-base font-bold leading-none">{count}</p>
                          <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5 opacity-75">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                {stats && stats.rejected_count > 0 && (
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-md bg-red-50 border border-red-100">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <p className="text-[10px] font-bold text-red-600">{stats.rejected_count} payment{stats.rejected_count !== 1 ? 's' : ''} rejected</p>
                  </div>
                )}
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
