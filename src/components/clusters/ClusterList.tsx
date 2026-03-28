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
import { useStore } from '@/src/store/useStore';

export function ClusterList({ onSelectCluster }: { onSelectCluster: (cluster: Cluster) => void }) {
  const { clusters, user } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');

  const filteredClusters = clusters.filter(cluster => {
    const matchesSearch = cluster.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cluster.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = regionFilter === 'all' || cluster.region === regionFilter;
    const matchesVerified = verifiedFilter === 'all' || 
                            (verifiedFilter === 'verified' && cluster.isVerified) || 
                            (verifiedFilter === 'unverified' && !cluster.isVerified);
    
    return matchesSearch && matchesRegion && matchesVerified;
  });

  const canCreateCluster = user.role === 'ADMIN' || user.role === 'CLUSTER_REP';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Farming Clusters</h1>
          <p className="text-muted-foreground">Manage and monitor agricultural production groups.</p>
        </div>
        {canCreateCluster && (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Create New Cluster</span>
          </Button>
        )}
      </div>

      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or location..." 
                className="pl-10 bg-background/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                <SelectItem value="North West">North West</SelectItem>
                <SelectItem value="North Central">North Central</SelectItem>
                <SelectItem value="South West">South West</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="unverified">Unverified Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClusters.map((cluster) => (
          <Card key={cluster.id} className="group hover:shadow-md transition-all border-none bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="h-2 bg-primary/20 group-hover:bg-primary transition-colors" />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{cluster.name}</CardTitle>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{cluster.location}, {cluster.region}</span>
                  </div>
                </div>
                {cluster.isVerified && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {cluster.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Members</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{cluster.memberCount}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Area</p>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{cluster.size} Ha</span>
                  </div>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                onClick={() => onSelectCluster(cluster)}
              >
                <span>Manage Cluster</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClusters.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No clusters found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
          <Button variant="link" onClick={() => { setSearchQuery(''); setRegionFilter('all'); setVerifiedFilter('all'); }}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
