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
  Sprout,
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
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/10 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      case 'NEGOTIATING':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider"><MessageSquare className="w-3 h-3" /> Negotiating</Badge>;
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
      className="space-y-6"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Investment Proposals</h1>
          <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Track and manage your funding offers to farmers and clusters.</p>
        </div>
        {user.role === 'INVESTOR' && (
          <Button onClick={onCreateProposal} className="gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95 text-[10px] font-bold uppercase tracking-wider">
            <Plus className="w-3.5 h-3.5" />
            <span>New Proposal</span>
          </Button>
        )}
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
                      placeholder="Search proposals or targets..." 
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
                      <SelectItem value="NEGOTIATING" className="text-xs font-medium">Negotiating</SelectItem>
                      <SelectItem value="APPROVED" className="text-xs font-medium">Approved</SelectItem>
                      <SelectItem value="REJECTED" className="text-xs font-medium">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={container} className="grid grid-cols-1 gap-4">
            {filteredProposals.map((proposal) => (
              <motion.div key={proposal.id} variants={item}>
                <Card className="group hover:shadow-md transition-all duration-300 border border-slate-200 bg-white overflow-hidden rounded-lg">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-5 space-y-5">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors">{proposal.title}</h3>
                              {getStatusBadge(proposal.status)}
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-slate-500">
                              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 uppercase font-bold tracking-wider">
                                {proposal.targetType === 'CLUSTER' ? <Users className="w-3 h-3 text-primary/60" /> : <Sprout className="w-3 h-3 text-primary/60" />}
                                <span>Target: <span className="text-slate-900">{proposal.targetName}</span></span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary tracking-tight">${proposal.budget.toLocaleString()}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Budget</p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 max-w-2xl font-medium">
                          {proposal.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-5 text-[10px] pt-4 border-t border-slate-50">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Clock className="w-3 h-3 text-primary/60" />
                            <span className="font-bold uppercase tracking-wider">Timeline: <span className="text-slate-900">{proposal.timeline}</span></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <FileText className="w-3 h-3 text-primary/60" />
                            <span className="font-bold uppercase tracking-wider">{proposal.documents.length} Documents</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <CalendarIcon className="w-3 h-3 text-primary/60" />
                            <span className="font-bold uppercase tracking-wider">Created: <span className="text-slate-900">{new Date(proposal.createdAt).toLocaleDateString()}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50 md:w-40 flex flex-col justify-center p-5 border-t md:border-t-0 md:border-l border-slate-100">
                        <Button 
                          className="w-full h-9 rounded-md gap-2 font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95" 
                          onClick={() => onSelectProposal(proposal)}
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {filteredProposals.length === 0 && (
              <div className="text-center py-16 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">No proposals found</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">Try adjusting your filters or create a new proposal.</p>
              </div>
            )}
          </motion.div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <motion.div variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Proposal Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Active</span>
                    <span className="font-bold text-sm text-slate-900">{proposals.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Approval</span>
                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 font-bold text-[9px] uppercase tracking-wider px-1.5 py-0 rounded-md">
                      {proposals.filter(p => p.status === 'PENDING').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Negotiating</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 font-bold text-[9px] uppercase tracking-wider px-1.5 py-0 rounded-md">
                      {proposals.filter(p => p.status === 'NEGOTIATING').length}
                    </Badge>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Success Rate</p>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[85%] transition-all duration-1000" />
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1.5 font-bold uppercase tracking-wider">85% Approval Rate</p>
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
                    <h3 className="font-bold text-sm tracking-tight text-slate-900">Compliance</h3>
                    <p className="text-[9px] font-bold text-primary/60 uppercase tracking-wider">Verified Standards</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed font-medium mb-4">
                  All proposals are automatically screened for compliance with regional agricultural investment standards.
                </p>
                <Button variant="outline" className="w-full h-8 rounded-md bg-white border-slate-200 text-slate-700 font-bold text-[9px] uppercase tracking-wider shadow-sm hover:bg-slate-50 transition-all">
                  View Guidelines
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function CalendarIcon(props: any) {
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
