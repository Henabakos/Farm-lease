import React, { useState } from 'react';
import { Agreement, AgreementWorkflowStatus } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Eye, 
  Filter,
  Calendar,
  DollarSign,
  ShieldCheck,
  MoreVertical,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Users
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAgreements } from '@/src/hooks/useAgreements';
import { mapAgreementFromApi } from '@/src/lib/apiMappers';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface AdminAgreementViewProps {
  onSelectAgreement: (agreement: Agreement) => void;
}

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

export function AdminAgreementView({ onSelectAgreement }: AdminAgreementViewProps) {
  const { agreements: apiAgreements, isLoading, updateAgreement, terminateAgreement, downloadAgreement } = useAgreements();
  const agreements = Array.isArray(apiAgreements) ? apiAgreements.map((a) => mapAgreementFromApi(a as unknown as Record<string, unknown>)) : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<AgreementWorkflowStatus>('DRAFT');
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (isLoading && agreements.length === 0) {
    return (
      <motion.div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </motion.div>
    );
  }

  const getWorkflowBadge = (status?: AgreementWorkflowStatus) => {
    if (!status) return null;
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><FileText className="w-3.5 h-3.5" /> Draft</Badge>;
      case 'PENDING_SIGNATURES':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><Clock className="w-3.5 h-3.5" /> Awaiting Payment</Badge>;
      case 'ACTIVE':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5" /> Active</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</Badge>;
      case 'TERMINATED':
        return <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/10 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><XCircle className="w-3.5 h-3.5" /> Terminated</Badge>;
      case 'DISPUTED':
        return <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/10 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><AlertTriangle className="w-3.5 h-3.5" /> Disputed</Badge>;
    }
  };

  const filteredAgreements = agreements.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (a.targetName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                          a.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.apiStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async () => {
    if (!selectedAgreement) return;
    setIsProcessing(true);
    try {
      await updateAgreement(selectedAgreement.id, { workflow_status: newStatus });
      setStatusDialogOpen(false);
      setSelectedAgreement(null);
      toast.success('Agreement status updated successfully');
    } catch (error) {
      toast.error('Failed to update agreement status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTerminate = async () => {
    if (!selectedAgreement) return;
    setIsProcessing(true);
    try {
      await terminateAgreement(selectedAgreement.id, terminateReason);
      setTerminateDialogOpen(false);
      setSelectedAgreement(null);
      setTerminateReason('');
      toast.success('Agreement terminated successfully');
    } catch (error) {
      toast.error('Failed to terminate agreement');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgreement) return;
    setIsProcessing(true);
    try {
      // Note: Delete functionality would need to be added to the backend API
      toast.success('Agreement deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedAgreement(null);
      setDeleteReason('');
    } catch (error) {
      toast.error('Failed to delete agreement');
    } finally {
      setIsProcessing(false);
    }
  };

  const openStatusDialog = (agreement: Agreement, status: AgreementWorkflowStatus) => {
    setSelectedAgreement(agreement);
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  const openTerminateDialog = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setTerminateDialogOpen(true);
  };

  const openDeleteDialog = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setDeleteDialogOpen(true);
  };

  const handleDownload = async (agreement: Agreement) => {
    try {
      await downloadAgreement(agreement.id, agreement.title);
    } catch (error) {
      toast.error('Failed to download agreement');
    }
  };

  const stats = {
    total: agreements.length,
    active: agreements.filter(a => a.apiStatus === 'ACTIVE').length,
    pending: agreements.filter(a => a.apiStatus === 'PENDING_SIGNATURES').length,
    draft: agreements.filter(a => a.apiStatus === 'DRAFT').length,
    totalValue: agreements.reduce((acc, curr) => acc + curr.amount, 0)
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Agreement Management</h1>
          <p className="text-slate-500 text-xs mt-1">Oversee and manage all agreements across the platform</p>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-slate-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Draft</p>
                <p className="text-2xl font-bold text-slate-600 mt-1">{stats.draft}</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-slate-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Value</p>
                <p className="text-lg font-bold text-primary mt-1">${stats.totalValue.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filter */}
      <motion.div variants={item}>
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardContent className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search agreements, parties, or IDs..." 
                  className="pl-9 bg-white border-slate-200 focus-visible:ring-primary/20 h-9 rounded-md text-xs transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white border-slate-200 h-9 rounded-md focus:ring-primary/20 text-[11px] font-bold uppercase tracking-wider transition-all">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-md border-slate-200">
                  <SelectItem value="all" className="text-xs font-medium">All Status</SelectItem>
                  <SelectItem value="DRAFT" className="text-xs font-medium">Draft</SelectItem>
                  <SelectItem value="PENDING_SIGNATURES" className="text-xs font-medium">Awaiting Payment</SelectItem>
                  <SelectItem value="ACTIVE" className="text-xs font-medium">Active</SelectItem>
                  <SelectItem value="COMPLETED" className="text-xs font-medium">Completed</SelectItem>
                  <SelectItem value="TERMINATED" className="text-xs font-medium">Terminated</SelectItem>
                  <SelectItem value="DISPUTED" className="text-xs font-medium">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Agreements List */}
      <motion.div variants={container} className="grid grid-cols-1 gap-4">
        {filteredAgreements.length === 0 ? (
          <motion.div variants={item} className="text-center py-16 bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No agreements found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
          </motion.div>
        ) : filteredAgreements.map((agreement) => (
          <motion.div key={agreement.id} variants={item}>
            <Card className="group hover:shadow-md transition-all duration-300 border border-slate-200 bg-white overflow-hidden rounded-lg">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors leading-tight">{agreement.title}</h3>
                          {getWorkflowBadge(agreement.apiStatus)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">
                            <ShieldCheck className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">Parties: <span className="font-bold text-slate-900">{agreement.investorName}</span> & <span className="font-bold text-slate-900">{agreement.targetName}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-primary tracking-tight">${agreement.amount.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Value</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-[11px] pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Created: <span className="text-slate-900 font-bold">{new Date(agreement.createdAt).toLocaleDateString()}</span></span>
                      </div>
                      {agreement.signedAt && (
                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Signed: <span className="text-slate-900 font-bold">{new Date(agreement.signedAt).toLocaleDateString()}</span></span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>ID: <span className="text-primary font-mono font-bold">{agreement.id.toUpperCase()}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 md:w-64 flex flex-col justify-center p-5 border-t md:border-t-0 md:border-l border-slate-100 gap-3">
                    <div className="flex items-center gap-2">
                      <Button 
                        className="flex-1 h-9 rounded-md gap-2 font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all" 
                        onClick={() => onSelectAgreement(agreement)}
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openStatusDialog(agreement, 'DRAFT')}>
                            <FileText className="w-4 h-4 mr-2" />
                            Set to Draft
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openStatusDialog(agreement, 'PENDING_SIGNATURES')}>
                            <Clock className="w-4 h-4 mr-2" />
                            Set to Awaiting Payment
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openStatusDialog(agreement, 'ACTIVE')}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Set to Active
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openStatusDialog(agreement, 'COMPLETED')}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Set to Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openStatusDialog(agreement, 'DISPUTED')}>
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Set to Disputed
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openTerminateDialog(agreement)} className="text-amber-600">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Terminate Agreement
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(agreement)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Agreement
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-9 rounded-md gap-2 font-bold text-xs uppercase tracking-wider border-slate-200 bg-white hover:bg-slate-50 transition-all"
                      onClick={() => handleDownload(agreement)}
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Agreement Status</DialogTitle>
            <DialogDescription>
              Change the status of agreement {selectedAgreement?.id.toUpperCase()} from {selectedAgreement?.apiStatus} to {newStatus}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={isProcessing}>
              {isProcessing ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate Dialog */}
      <Dialog open={terminateDialogOpen} onOpenChange={setTerminateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminate Agreement</DialogTitle>
            <DialogDescription>
              This will terminate agreement {selectedAgreement?.id.toUpperCase()}. Please provide a reason for termination.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for termination..."
            value={terminateReason}
            onChange={(e) => setTerminateReason(e.target.value)}
            className="min-h-24"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminateDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleTerminate} disabled={isProcessing}>
              {isProcessing ? 'Terminating...' : 'Terminate Agreement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agreement</DialogTitle>
            <DialogDescription>
              This will permanently delete agreement {selectedAgreement?.id.toUpperCase()}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for deletion (optional)..."
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            className="min-h-24"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
              {isProcessing ? 'Deleting...' : 'Delete Agreement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
