import React, { useState } from 'react';
import { Agreement, AgreementStatus } from '@/src/types';
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
  ArrowRight,
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
import { useAgreements } from '@/src/hooks/useAgreements';
import { mapAgreementFromApi } from '@/src/lib/apiMappers';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

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

export function AgreementList({ onSelectAgreement }: { onSelectAgreement: (agreement: Agreement) => void }) {
  const { agreements: apiAgreements, isLoading } = useAgreements();
  const agreements = Array.isArray(apiAgreements) ? apiAgreements.map((a) => mapAgreementFromApi(a as unknown as Record<string, unknown>)) : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  if (isLoading && agreements.length === 0) {
    return (
      <motion.div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </motion.div>
    );
  }

  const getStatusBadge = (status: AgreementStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><Clock className="w-3 h-3" /> Pending Signature</Badge>;
      case 'SIGNED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Signed</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/10 gap-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><XCircle className="w-3 h-3" /> Rejected</Badge>;
    }
  };

  const filteredAgreements = agreements.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (a.targetName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Contract Repository</h1>
          <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Manage and review all your legal agreements and contracts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 h-9 px-4 rounded-md border-slate-200 bg-white hover:bg-slate-50 transition-all text-[10px] font-bold uppercase tracking-wider shadow-sm active:scale-95">
            <Download className="w-3.5 h-3.5" />
            <span>Export All</span>
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
                      placeholder="Search contracts, parties, or IDs..." 
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
                      <SelectItem value="PENDING" className="text-xs font-medium">Pending Signature</SelectItem>
                      <SelectItem value="SIGNED" className="text-xs font-medium">Signed</SelectItem>
                      <SelectItem value="REJECTED" className="text-xs font-medium">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={container} className="grid grid-cols-1 gap-4">
            {filteredAgreements.map((agreement) => (
              <motion.div key={agreement.id} variants={item}>
                <Card className="group hover:shadow-md transition-all duration-300 border border-slate-200 bg-white overflow-hidden rounded-lg">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-5 space-y-5">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors leading-tight">{agreement.title}</h3>
                              {getStatusBadge(agreement.status)}
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
                        <Button 
                          className="w-full h-9 rounded-md gap-2 font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all" 
                          onClick={() => onSelectAgreement(agreement)}
                        >
                          <Eye className="w-4 h-4" />
                          <span>View & Sign</span>
                        </Button>
                        <Button variant="outline" className="w-full h-9 rounded-md gap-2 font-bold text-xs uppercase tracking-wider border-slate-200 bg-white hover:bg-slate-50 transition-all">
                          <Download className="w-4 h-4" />
                          <span>Download PDF</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {filteredAgreements.length === 0 && (
              <div className="text-center py-16 bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No agreements found</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
                <Button 
                  variant="link" 
                  className="mt-4 text-primary font-bold text-sm hover:no-underline"
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <motion.div variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Agreement Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Value</span>
                    <span className="font-bold text-sm text-slate-900">${agreements.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Contracts</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[9px] uppercase tracking-wider px-1.5 py-0 rounded-md">
                      {agreements.filter(a => a.status === 'SIGNED').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Signature</span>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-[9px] uppercase tracking-wider px-1.5 py-0 rounded-md">
                      {agreements.filter(a => a.status === 'PENDING').length}
                    </Badge>
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
                    <h3 className="font-bold text-sm tracking-tight text-slate-900">Legal Support</h3>
                    <p className="text-[9px] font-bold text-primary/60 uppercase tracking-wider">Contract Review</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed font-medium mb-4">
                  All agreements are legally binding and stored securely on the blockchain for immutable record keeping.
                </p>
                <Button variant="outline" className="w-full h-8 rounded-md bg-white border-slate-200 text-slate-700 font-bold text-[9px] uppercase tracking-wider shadow-sm hover:bg-slate-50 transition-all">
                  Contact Legal
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
