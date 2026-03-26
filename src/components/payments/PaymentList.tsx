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

export function PaymentList({ 
  onSelectPayment, 
  onSubmitPayment,
  onReviewPayment
}: { 
  onSelectPayment: (payment: Payment) => void,
  onSubmitPayment: (payment: Payment) => void,
  onReviewPayment: (payment: Payment) => void
}) {
  const { user } = useRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-muted text-muted-foreground border-none gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'SUBMITTED':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1"><Upload className="w-3 h-3" /> Submitted</Badge>;
      case 'VERIFIED':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
    }
  };

  const filteredPayments = MOCK_PAYMENTS.filter(p => {
    const matchesSearch = p.agreementTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isAdminOrRep = user.role === 'ADMIN' || user.role === 'CLUSTER_REP';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Tracker</h1>
          <p className="text-muted-foreground">Monitor disbursements and repayments across your active agreements.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            <span>Download Statement</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary/5 border border-primary/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary/70 font-medium">Total Disbursed</CardDescription>
            <CardTitle className="text-3xl font-bold text-primary">$17,500</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpRight className="w-3 h-3 text-primary" />
              <span>+12% from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-500/5 border border-emerald-500/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-600/70 font-medium">Total Repaid</CardDescription>
            <CardTitle className="text-3xl font-bold text-emerald-600">$2,500</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
              <span>On track for Q1 goals</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-500/5 border border-amber-500/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-600/70 font-medium">Pending Verification</CardDescription>
            <CardTitle className="text-3xl font-bold text-amber-600">2 Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Requires immediate review</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by agreement or payment ID..." 
                className="pl-10 bg-background/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
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

      <div className="grid grid-cols-1 gap-4">
        {filteredPayments.map((payment) => (
          <Card key={payment.id} className="group hover:shadow-md transition-all border-none bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          payment.type === 'DISBURSEMENT' ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600"
                        )}>
                          {payment.type === 'DISBURSEMENT' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <h3 className="text-lg font-bold">{payment.agreementTitle}</h3>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" />
                          {payment.type === 'DISBURSEMENT' ? 'Investment Disbursement' : 'Loan Repayment'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(payment.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-xl font-bold",
                        payment.type === 'DISBURSEMENT' ? "text-primary" : "text-emerald-600"
                      )}>
                        ${payment.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Amount</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground">Sender:</span> {payment.senderName}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground">Receiver:</span> {payment.receiverName}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground">ID:</span> {payment.id.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 md:w-64 flex flex-col justify-center p-6 border-t md:border-t-0 md:border-l border-border/50 gap-2">
                  {isAdminOrRep && payment.status === 'SUBMITTED' ? (
                    <Button 
                      className="w-full gap-2 bg-amber-600 hover:bg-amber-700" 
                      onClick={() => onReviewPayment(payment)}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Review Receipt</span>
                    </Button>
                  ) : payment.status === 'PENDING' ? (
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => onSubmitPayment(payment)}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Submit Receipt</span>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full gap-2" onClick={() => onSelectPayment(payment)}>
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </Button>
                  )}
                  {payment.receiptUrl && (
                    <Button variant="ghost" className="w-full gap-2 text-xs h-8">
                      <FileText className="w-3 h-3" />
                      <span>View Receipt</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
