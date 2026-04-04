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
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Farming Clusters</h1>
          <p className="text-muted-foreground text-lg mt-1">Manage and monitor agricultural production groups.</p>
        </div>
        {canCreateCluster && (
          <Button className="gap-2 h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="w-5 h-5" />
            <span className="font-bold">Create New Cluster</span>
          </Button>
        )}
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-3xl overflow-hidden">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search by name or location..." 
                  className="pl-12 bg-background/40 border-primary/10 focus-visible:ring-primary/20 h-12 rounded-2xl text-base transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="bg-background/40 border-primary/10 h-12 rounded-2xl focus:ring-primary/20 text-base transition-all">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-primary/10 backdrop-blur-xl">
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="North West">North West</SelectItem>
                  <SelectItem value="North Central">North Central</SelectItem>
                  <SelectItem value="South West">South West</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                <SelectTrigger className="bg-background/40 border-primary/10 h-12 rounded-2xl focus:ring-primary/20 text-base transition-all">
                  <SelectValue placeholder="Verification Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-primary/10 backdrop-blur-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="unverified">Unverified Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredClusters.map((cluster) => (
          <motion.div key={cluster.id} variants={item}>
            <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border-none bg-card/60 backdrop-blur-md overflow-hidden rounded-[2.5rem] flex flex-col h-full border border-primary/5 hover:border-primary/20">
              <div className="h-32 bg-primary/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
                <div className="absolute top-5 right-5">
                  {cluster.isVerified && (
                    <Badge variant="secondary" className="bg-white/90 dark:bg-black/90 backdrop-blur-md text-primary border-none shadow-lg font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />
              </div>
              <CardHeader className="pb-3 pt-8 px-8">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors leading-tight">{cluster.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span>{cluster.location}, {cluster.region}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 flex-1 flex flex-col px-8 pb-8">
                <p className="text-base text-muted-foreground/80 leading-relaxed line-clamp-3 font-medium">
                  {cluster.description}
                </p>
                
                <div className="grid grid-cols-2 gap-6 py-6 border-y border-primary/10">
                  <div className="space-y-2">
                    <p className="text-[10px] text-primary/60 uppercase font-black tracking-[0.2em] ml-1">Members</p>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-black text-2xl text-foreground">{cluster.memberCount}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-primary/60 uppercase font-black tracking-[0.2em] ml-1">Total Area</p>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Layers className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-black text-2xl text-foreground">{cluster.size} <span className="text-sm font-bold text-muted-foreground">Ha</span></span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <Button 
                    className="w-full h-14 rounded-2xl bg-muted/50 hover:bg-primary text-foreground hover:text-primary-foreground border-none transition-all duration-500 font-black text-lg gap-3 shadow-sm hover:shadow-xl hover:shadow-primary/30"
                    onClick={() => onSelectCluster(cluster)}
                  >
                    <span>Manage Cluster</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filteredClusters.length === 0 && (
        <div className="text-center py-24 bg-card/30 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-primary/10">
          <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-primary/40" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">No clusters found</h3>
          <p className="text-muted-foreground text-lg mt-2 max-w-md mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
          <Button 
            variant="link" 
            className="mt-6 text-primary font-bold text-lg hover:no-underline hover:text-primary/80"
            onClick={() => { setSearchQuery(''); setRegionFilter('all'); setVerifiedFilter('all'); }}
          >
            Clear all filters
          </Button>
        </div>
      )}
    </motion.div>
  );
}
