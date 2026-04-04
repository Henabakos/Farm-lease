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

const MOCK_PAYMENTS: Payment[] = [
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
  const { user } = useRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-muted text-muted-foreground border-none gap-1 px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'SUBMITTED':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1 px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider"><Upload className="w-3 h-3" /> Submitted</Badge>;
      case 'VERIFIED':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Verified</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider"><XCircle className="w-3 h-3" /> Rejected</Badge>;
    }
  };

  const filteredPayments = MOCK_PAYMENTS.filter(p => {
    const matchesSearch = p.agreementTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isAdminOrRep = user.role === 'ADMIN' || user.role === 'CLUSTER_REP';

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
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Payment Tracker</h1>
          <p className="text-muted-foreground text-lg mt-1">Monitor disbursements and repayments across your active agreements.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 h-11 px-5 rounded-xl border-border/50 bg-card/50 backdrop-blur-sm">
            <FileText className="w-4 h-4" />
            <span>Download Statement</span>
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={item}>
          <Card className="border-none shadow-sm bg-primary/5 border border-primary/10 rounded-2xl">
            <CardHeader className="pb-2">
              <CardDescription className="text-primary/70 font-bold uppercase tracking-widest text-[10px]">Total Disbursed</CardDescription>
              <CardTitle className="text-3xl font-black text-primary tracking-tighter">$17,500</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowUpRight className="w-3 h-3 text-primary" />
                </div>
                <span>+12% from last month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="border-none shadow-sm bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <CardHeader className="pb-2">
              <CardDescription className="text-emerald-600/70 font-bold uppercase tracking-widest text-[10px]">Total Repaid</CardDescription>
              <CardTitle className="text-3xl font-black text-emerald-600 tracking-tighter">$2,500</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                </div>
                <span>On track for Q1 goals</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="border-none shadow-sm bg-amber-500/5 border border-amber-500/10 rounded-2xl">
            <CardHeader className="pb-2">
              <CardDescription className="text-amber-600/70 font-bold uppercase tracking-widest text-[10px]">Pending Verification</CardDescription>
              <CardTitle className="text-3xl font-black text-amber-600 tracking-tighter">2 Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-amber-600" />
                </div>
                <span>Requires immediate review</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-md rounded-2xl">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search by agreement or payment ID..." 
                  className="pl-10 bg-background/50 border-none focus-visible:ring-primary/20 h-11 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background/50 border-none h-11 rounded-xl focus:ring-primary/20">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-1 gap-4">
        {filteredPayments.map((payment) => (
          <motion.div key={payment.id} variants={item}>
            <Card className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border-none bg-card/50 backdrop-blur-md overflow-hidden rounded-3xl">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                            payment.type === 'DISBURSEMENT' ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600"
                          )}>
                            {payment.type === 'DISBURSEMENT' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                          </div>
                          <h3 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">{payment.agreementTitle}</h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-full border border-border/50 font-medium">
                            <DollarSign className="w-3.5 h-3.5 text-primary/60" />
                            {payment.type === 'DISBURSEMENT' ? 'Investment Disbursement' : 'Loan Repayment'}
                          </span>
                          <span className="flex items-center gap-2 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-primary/60" />
                            {new Date(payment.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-3xl font-black tracking-tighter",
                          payment.type === 'DISBURSEMENT' ? "text-primary" : "text-emerald-600"
                        )}>
                          ${payment.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Amount</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 text-xs text-muted-foreground pt-4 border-t border-border/50">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold uppercase tracking-tighter text-[9px]">Sender</span>
                        <span className="font-bold text-foreground text-sm">{payment.senderName}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold uppercase tracking-tighter text-[9px]">Receiver</span>
                        <span className="font-bold text-foreground text-sm">{payment.receiverName}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold uppercase tracking-tighter text-[9px]">Transaction ID</span>
                        <span className="font-mono text-foreground text-sm">{payment.id.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/5 md:w-64 flex flex-col justify-center p-6 border-t md:border-t-0 md:border-l border-border/50 gap-3">
                    {isAdminOrRep && payment.status === 'SUBMITTED' ? (
                      <Button 
                        className="w-full h-11 rounded-xl gap-2 bg-amber-600 hover:bg-amber-700 font-bold shadow-lg shadow-amber-600/10" 
                        onClick={() => onReviewPayment(payment)}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Review Receipt</span>
                      </Button>
                    ) : payment.status === 'PENDING' ? (
                      <Button 
                        className="w-full h-11 rounded-xl gap-2 font-bold shadow-lg shadow-primary/10" 
                        onClick={() => onSubmitPayment(payment)}
                      >
                        <Upload className="w-4 h-4" />
                        <span>Submit Receipt</span>
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full h-11 rounded-xl gap-2 font-bold border-border/50 hover:bg-white transition-all" onClick={() => onSelectPayment(payment)}>
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </Button>
                    )}
                    {payment.receiptUrl && (
                      <Button 
                        variant="ghost" 
                        className="w-full gap-2 text-[10px] font-bold uppercase tracking-widest h-8 hover:bg-primary/5 hover:text-primary"
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
    </motion.div>
  );
}
