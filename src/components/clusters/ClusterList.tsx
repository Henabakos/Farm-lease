import React, { useState } from 'react';
import { Cluster } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Filter, 
  ArrowRight,
  Plus,
  Layers
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useClusters } from '@/src/hooks/useClusters';
import { useAuth } from '@/src/contexts/AuthContext';
import { apiRoleToUi, mapClusterFromApi } from '@/src/lib/apiMappers';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { CreateClusterDialog } from './CreateClusterDialog';

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

export function ClusterList({ onSelectCluster }: { onSelectCluster: (cluster: Cluster) => void }) {
  const { clusters: apiClusters, isLoading, fetchClusters } = useClusters();
  const { user } = useAuth();
  const clusters = Array.isArray(apiClusters) ? apiClusters.map((c) => mapClusterFromApi(c as unknown as Record<string, unknown>)) : [];
  const uiRole = user ? apiRoleToUi(user.role) : null;
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  const filteredClusters = clusters.filter(cluster => {
    const matchesSearch = cluster.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cluster.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = regionFilter === 'all' || cluster.region === regionFilter;
    const matchesVerified = verifiedFilter === 'all' || 
                            (verifiedFilter === 'verified' && cluster.isVerified) || 
                            (verifiedFilter === 'unverified' && !cluster.isVerified);
    
    return matchesSearch && matchesRegion && matchesVerified;
  });

  const canCreateCluster = uiRole === 'ADMIN' || uiRole === 'CLUSTER_REP' || uiRole === 'FARMER';

  if (isLoading && clusters.length === 0) {
    return (
      <motion.div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Farming Clusters</h1>
          <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Manage and monitor agricultural production groups.</p>
        </div>
        {canCreateCluster && (
          <Button
            onClick={() => setShowCreate(true)}
            className="gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95 text-[10px] font-bold uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Cluster</span>
          </Button>
        )}
      </motion.div>

      <motion.div variants={item}>
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search by name or location..." 
                  className="pl-9 bg-white border-slate-200 focus-visible:ring-primary/20 h-9 rounded-md text-xs transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="bg-white border-slate-200 h-9 rounded-md focus:ring-primary/20 text-[11px] font-bold uppercase tracking-wider transition-all">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent className="rounded-md border-slate-200">
                  <SelectItem value="all" className="text-xs font-medium">All Regions</SelectItem>
                  <SelectItem value="North West" className="text-xs font-medium">North West</SelectItem>
                  <SelectItem value="North Central" className="text-xs font-medium">North Central</SelectItem>
                  <SelectItem value="South West" className="text-xs font-medium">South West</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                <SelectTrigger className="bg-white border-slate-200 h-9 rounded-md focus:ring-primary/20 text-[11px] font-bold uppercase tracking-wider transition-all">
                  <SelectValue placeholder="Verification Status" />
                </SelectTrigger>
                <SelectContent className="rounded-md border-slate-200">
                  <SelectItem value="all" className="text-xs font-medium">All Status</SelectItem>
                  <SelectItem value="verified" className="text-xs font-medium">Verified Only</SelectItem>
                  <SelectItem value="unverified" className="text-xs font-medium">Unverified Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClusters.map((cluster) => (
          <motion.div key={cluster.id} variants={item}>
            <Card className="group hover:shadow-md transition-all duration-300 border border-slate-200 bg-white overflow-hidden rounded-lg flex flex-col h-full">
              <div className="h-24 bg-slate-50 relative overflow-hidden border-b border-slate-100">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                <div className="absolute top-3 right-3">
                  {cluster.isVerified && (
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-md text-emerald-600 border border-emerald-100 shadow-sm font-semibold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
              <CardHeader className="pb-2 pt-4 px-6">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors leading-tight">{cluster.name}</CardTitle>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-normal">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cluster.location}, {cluster.region}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col px-6 pb-6">
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 font-normal">
                  {cluster.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Members</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-bold text-lg text-foreground">{cluster.memberCount}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Total Area</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <Layers className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-bold text-lg text-foreground">{cluster.size} <span className="text-xs font-normal text-slate-400">Ha</span></span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-2">
                  <Button 
                    className="w-full h-10 rounded-md bg-slate-50 hover:bg-primary text-slate-700 hover:text-white border border-slate-200 hover:border-primary transition-all duration-300 font-semibold text-sm gap-2 shadow-sm"
                    onClick={() => onSelectCluster(cluster)}
                  >
                    <span>Manage Cluster</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filteredClusters.length === 0 && (
        <div className="text-center py-16 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Search className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No clusters found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
          <Button 
            variant="link" 
            className="mt-4 text-primary font-semibold text-sm hover:no-underline hover:text-primary/80"
            onClick={() => { setSearchQuery(''); setRegionFilter('all'); setVerifiedFilter('all'); }}
          >
            Clear all filters
          </Button>
        </div>
      )}

      <CreateClusterDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={() => fetchClusters()}
      />
    </motion.div>
  );
}
