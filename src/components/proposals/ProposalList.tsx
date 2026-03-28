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
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      case 'NEGOTIATING':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1"><MessageSquare className="w-3 h-3" /> Negotiating</Badge>;
    }
  };

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.targetName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investment Proposals</h1>
          <p className="text-muted-foreground">Track and manage your funding offers to farmers and clusters.</p>
        </div>
        {user.role === 'INVESTOR' && (
          <Button onClick={onCreateProposal} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>New Proposal</span>
          </Button>
        )}
      </div>

      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search proposals or targets..." 
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
                <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {filteredProposals.map((proposal) => (
          <Card key={proposal.id} className="group hover:shadow-md transition-all border-none bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{proposal.title}</h3>
                        {getStatusBadge(proposal.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {proposal.targetType === 'CLUSTER' ? <Users className="w-4 h-4" /> : <Sprout className="w-4 h-4" />}
                        <span>Target: <span className="font-medium text-foreground">{proposal.targetName}</span></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">${proposal.budget.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Budget</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {proposal.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Timeline: {proposal.timeline}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>{proposal.documents.length} Documents</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {new Date(proposal.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 md:w-48 flex flex-col justify-center p-6 border-t md:border-t-0 md:border-l border-border/50">
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => onSelectProposal(proposal)}
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProposals.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No proposals found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or create a new proposal.</p>
        </div>
      )}
    </div>
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
