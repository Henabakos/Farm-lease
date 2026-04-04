import React, { useState } from 'react';
import { Proposal, ProposalStatus } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  ArrowRight,
  Filter,
  Users,
  Sprout
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

export function ProposalList({ 
  onSelectProposal, 
  onCreateProposal 
}: { 
  onSelectProposal: (proposal: Proposal) => void,
  onCreateProposal: () => void
}) {
  const { proposals, user } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      case 'NEGOTIATING':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider"><MessageSquare className="w-3 h-3" /> Negotiating</Badge>;
    }
  };

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.targetName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-4xl font-bold tracking-tight">Investment Proposals</h1>
          <p className="text-muted-foreground text-lg mt-1">Track and manage your funding offers to farmers and clusters.</p>
        </div>
        {user.role === 'INVESTOR' && (
          <Button onClick={onCreateProposal} className="gap-2 h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            <span>New Proposal</span>
          </Button>
        )}
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-md rounded-2xl">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search proposals or targets..." 
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
                  <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-1 gap-4">
        {filteredProposals.map((proposal) => (
          <motion.div key={proposal.id} variants={item}>
            <Card className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border-none bg-card/50 backdrop-blur-md overflow-hidden rounded-3xl">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">{proposal.title}</h3>
                          {getStatusBadge(proposal.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-full border border-border/50">
                            {proposal.targetType === 'CLUSTER' ? <Users className="w-4 h-4 text-primary/60" /> : <Sprout className="w-4 h-4 text-primary/60" />}
                            <span>Target: <span className="font-bold text-foreground">{proposal.targetName}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-primary tracking-tighter">${proposal.budget.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Budget</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 max-w-2xl">
                      {proposal.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 text-sm pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary/60" />
                        <span className="font-medium">Timeline: <span className="text-foreground">{proposal.timeline}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4 text-primary/60" />
                        <span className="font-medium">{proposal.documents.length} Documents</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 text-primary/60" />
                        <span className="font-medium">Created: <span className="text-foreground">{new Date(proposal.createdAt).toLocaleDateString()}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/5 md:w-48 flex flex-col justify-center p-6 border-t md:border-t-0 md:border-l border-border/50">
                    <Button 
                      className="w-full h-11 rounded-xl gap-2 font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95" 
                      onClick={() => onSelectProposal(proposal)}
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filteredProposals.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No proposals found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or create a new proposal.</p>
        </div>
      )}
    </motion.div>
  );
}

function Calendar(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
