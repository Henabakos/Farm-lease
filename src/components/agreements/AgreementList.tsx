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

export function AgreementList({ onSelectAgreement }: { onSelectAgreement: (agreement: Agreement) => void }) {
  const { agreements } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status: AgreementStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><Clock className="w-3 h-3" /> Pending Signature</Badge>;
      case 'SIGNED':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Signed</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
    }
  };

  const filteredAgreements = agreements.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (a.targetName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contract Repository</h1>
          <p className="text-muted-foreground">Manage and review all your legal agreements and contracts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            <span>Export All</span>
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search contracts, parties, or IDs..." 
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
                <SelectItem value="PENDING">Pending Signature</SelectItem>
                <SelectItem value="SIGNED">Signed</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {filteredAgreements.map((agreement) => (
          <Card key={agreement.id} className="group hover:shadow-md transition-all border-none bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{agreement.title}</h3>
                        {getStatusBadge(agreement.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Parties: <span className="font-medium text-foreground">{agreement.investorName}</span> & <span className="font-medium text-foreground">{agreement.targetName}</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">${agreement.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Value</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {new Date(agreement.createdAt).toLocaleDateString()}</span>
                    </div>
                    {agreement.signedAt && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Signed: {new Date(agreement.signedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>ID: {agreement.id.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/30 md:w-64 flex flex-col justify-center p-6 border-t md:border-t-0 md:border-l border-border/50 gap-2">
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => onSelectAgreement(agreement)}
                  >
                    <Eye className="w-4 h-4" />
                    <span>View & Sign</span>
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAgreements.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No agreements found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
        </div>
      )}
    </div>
  );
}
