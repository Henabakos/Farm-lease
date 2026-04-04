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
import { useStore } from '@/src/store/useStore';
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
  const { agreements } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status: AgreementStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1.5 px-3 py-1 rounded-xl font-black text-[10px] uppercase tracking-[0.15em]"><Clock className="w-3.5 h-3.5" /> Pending Signature</Badge>;
      case 'SIGNED':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5 px-3 py-1 rounded-xl font-black text-[10px] uppercase tracking-[0.15em]"><CheckCircle2 className="w-3.5 h-3.5" /> Signed</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1.5 px-3 py-1 rounded-xl font-black text-[10px] uppercase tracking-[0.15em]"><XCircle className="w-3.5 h-3.5" /> Rejected</Badge>;
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
      className="space-y-8"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Contract Repository</h1>
          <p className="text-muted-foreground text-lg mt-1">Manage and review all your legal agreements and contracts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-12 px-6 rounded-2xl border-primary/20 bg-card/50 backdrop-blur-md hover:bg-primary/5 hover:text-primary transition-all">
            <Download className="w-5 h-5" />
            <span className="font-bold">Export All</span>
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-3xl overflow-hidden">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search contracts, parties, or IDs..." 
                  className="pl-12 bg-background/40 border-primary/10 focus-visible:ring-primary/20 h-12 rounded-2xl text-base transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background/40 border-primary/10 h-12 rounded-2xl focus:ring-primary/20 text-base transition-all">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-primary/10 backdrop-blur-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending Signature</SelectItem>
                  <SelectItem value="SIGNED">Signed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-1 gap-6">
        {filteredAgreements.map((agreement) => (
          <motion.div key={agreement.id} variants={item}>
            <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border-none bg-card/60 backdrop-blur-md overflow-hidden rounded-[2.5rem] border border-primary/5 hover:border-primary/20">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-8 space-y-8">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 flex-wrap">
                          <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors leading-tight">{agreement.title}</h3>
                          {getStatusBadge(agreement.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
                            <ShieldCheck className="w-5 h-5 text-primary/60" />
                            <span className="font-medium">Parties: <span className="font-black text-foreground">{agreement.investorName}</span> & <span className="font-black text-foreground">{agreement.targetName}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-4xl font-black text-primary tracking-tighter">${agreement.amount.toLocaleString()}</p>
                        <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mt-1">Total Value</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-8 text-sm pt-6 border-t border-primary/10">
                      <div className="flex items-center gap-2.5 text-muted-foreground font-medium">
                        <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-primary/60" />
                        </div>
                        <span>Created: <span className="text-foreground font-bold">{new Date(agreement.createdAt).toLocaleDateString()}</span></span>
                      </div>
                      {agreement.signedAt && (
                        <div className="flex items-center gap-2.5 text-muted-foreground font-medium">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/5 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </div>
                          <span>Signed: <span className="text-foreground font-bold">{new Date(agreement.signedAt).toLocaleDateString()}</span></span>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 text-muted-foreground font-medium">
                        <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-primary/60" />
                        </div>
                        <span>ID: <span className="text-primary font-mono font-black">{agreement.id.toUpperCase()}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/5 md:w-72 flex flex-col justify-center p-8 border-t md:border-t-0 md:border-l border-primary/10 gap-4">
                    <Button 
                      className="w-full h-14 rounded-2xl gap-3 font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                      onClick={() => onSelectAgreement(agreement)}
                    >
                      <Eye className="w-5 h-5" />
                      <span>View & Sign</span>
                    </Button>
                    <Button variant="outline" className="w-full h-14 rounded-2xl gap-3 font-black text-lg border-primary/10 hover:bg-white transition-all">
                      <Download className="w-5 h-5" />
                      <span>Download PDF</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filteredAgreements.length === 0 && (
        <div className="text-center py-24 bg-card/30 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-primary/10">
          <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-primary/40" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">No agreements found</h3>
          <p className="text-muted-foreground text-lg mt-2 max-w-md mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
          <Button 
            variant="link" 
            className="mt-6 text-primary font-bold text-lg hover:no-underline hover:text-primary/80"
            onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
          >
            Clear all filters
          </Button>
        </div>
      )}
    </motion.div>
  );
}
