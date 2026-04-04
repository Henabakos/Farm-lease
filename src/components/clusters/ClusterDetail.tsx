import React, { useState } from 'react';
import { Cluster, Plot, User } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Users, 
  CheckCircle2, 
  ArrowLeft,
  Calendar,
  Layers,
  Plus,
  Trash2,
  UserPlus,
  Search,
  Map as MapIcon,
  Info,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useStore } from '@/src/store/useStore';
import { toast } from 'sonner';

import { motion } from 'motion/react';

export function ClusterDetail({ cluster, onBack }: { cluster: Cluster, onBack: () => void }) {
  const { user, verifyCluster } = useStore();
  const [members, setMembers] = useState<User[]>([]); // In real app, fetch from store/api
  const [plots, setPlots] = useState<Plot[]>([]); // In real app, fetch from store/api
  const [searchMember, setSearchMember] = useState('');

  const canManage = user.role === 'ADMIN' || user.role === 'CLUSTER_REP';
  const canVerify = user.role === 'ADMIN';

  const handleVerify = () => {
    verifyCluster(cluster.id);
    toast.success('Cluster verified successfully');
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchMember.toLowerCase()) || 
    m.email.toLowerCase().includes(searchMember.toLowerCase())
  );

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const addMember = () => {
    // Mock adding a member
    const newMember: User = {
      id: `m${Date.now()}`,
      name: 'New Farmer',
      email: 'new@farmer.com',
      role: 'FARMER',
      joinedDate: new Date().toISOString().split('T')[0],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`
    };
    setMembers([...members, newMember]);
  };

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
      <motion.div variants={item} className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-primary/10 hover:text-primary transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">{cluster.name}</h1>
            {cluster.isVerified && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Verified
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground mt-1 text-lg">
            <MapPin className="w-4 h-4 text-primary/60" />
            <span>{cluster.location}, {cluster.region}</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div variants={item}>
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-card/50 backdrop-blur-md p-1.5 rounded-2xl border border-border/50">
                <TabsTrigger value="overview" className="gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                  <Info className="w-4 h-4" />
                  <span className="font-bold">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                  <Users className="w-4 h-4" />
                  <span className="font-bold">Members</span>
                </TabsTrigger>
                <TabsTrigger value="land" className="gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                  <Layers className="w-4 h-4" />
                  <span className="font-bold">Land Management</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 outline-none">
                <Card className="border-none shadow-sm bg-card/50 backdrop-blur-md rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold tracking-tight">Cluster Information</CardTitle>
                    <CardDescription className="text-base">Detailed background and operational status.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <p className="text-foreground leading-relaxed text-lg">
                      {cluster.description}
                    </p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-6 border-t border-border/50">
                      <div className="space-y-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Established</p>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-bold text-lg">{new Date(cluster.establishedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Area</p>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-bold text-lg">{cluster.size} Ha</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Members</p>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-bold text-lg">{cluster.memberCount}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Region</p>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-bold text-lg">{cluster.region}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card/50 backdrop-blur-md rounded-3xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold tracking-tight">Cluster Representatives</CardTitle>
                    <CardDescription className="text-base">Official contacts managing this cluster.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: 'Robert Chen', role: 'Cluster Representative', phone: '+234 802 345 6789', email: 'robert@cluster.com' },
                        { name: 'Alice Okafor', role: 'Technical Lead', phone: '+234 803 456 7890', email: 'alice@cluster.com' }
                      ].map((rep) => (
                        <div key={rep.email} className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/30 transition-all group">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">{rep.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-lg group-hover:text-primary transition-colors">{rep.name}</p>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{rep.role}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="rounded-xl border-border/50 hover:bg-white transition-all">Contact</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="members" className="space-y-6 outline-none">
                <Card className="border-none shadow-sm bg-card/50 backdrop-blur-md rounded-3xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                      <CardTitle className="text-2xl font-bold tracking-tight">Member Directory</CardTitle>
                      <CardDescription className="text-base">Manage farmers associated with this cluster.</CardDescription>
                    </div>
                    {canManage && (
                      <Button onClick={addMember} className="gap-2 h-11 px-5 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                        <UserPlus className="w-4 h-4" />
                        <span>Add Farmer</span>
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        placeholder="Search members by name or email..." 
                        className="pl-10 bg-background/50 border-none focus-visible:ring-primary/20 h-11 rounded-xl"
                        value={searchMember}
                        onChange={(e) => setSearchMember(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      {filteredMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/30 transition-all group border border-transparent hover:border-border/50">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-lg group-hover:text-primary transition-colors">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Joined</p>
                              <p className="text-sm font-bold">{new Date(member.joinedDate).toLocaleDateString()}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:bg-destructive/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                              onClick={() => removeMember(member.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="land" className="space-y-6 outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-card/50 backdrop-blur-md rounded-3xl overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                          <CardTitle className="text-2xl font-bold tracking-tight">Land Plots</CardTitle>
                          <CardDescription className="text-base">Inventory of available and occupied land.</CardDescription>
                        </div>
                        {canManage && (
                          <Button size="sm" className="gap-2 rounded-xl h-9 px-4">
                            <Plus className="w-4 h-4" />
                            <span>Add Plot</span>
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {plots.map((plot) => (
                          <div key={plot.id} className="p-5 rounded-2xl border border-border/50 bg-muted/20 space-y-4 hover:bg-muted/30 transition-all group">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{plot.location}</h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Layers className="w-4 h-4 text-primary/60" />
                                  <span className="font-medium">{plot.size} Hectares</span>
                                </div>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider border-none",
                                  plot.status === 'AVAILABLE' && "text-emerald-600 bg-emerald-500/10",
                                  plot.status === 'OCCUPIED' && "text-blue-600 bg-blue-500/10",
                                  plot.status === 'MAINTENANCE' && "text-amber-600 bg-amber-500/10"
                                )}
                              >
                                {plot.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-border/50">
                              <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-xs font-bold hover:bg-white">Edit</Button>
                              <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10">Delete</Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-card/50 backdrop-blur-md rounded-3xl overflow-hidden h-full flex flex-col">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-2xl font-bold tracking-tight">Map View</CardTitle>
                        <CardDescription className="text-base">Visual representation of cluster boundaries.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex items-center justify-center min-h-[400px]">
                        <div className="w-full h-full rounded-2xl bg-muted/30 border-2 border-dashed border-border flex flex-col items-center justify-center text-center p-8 space-y-6">
                          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center shadow-inner">
                            <MapIcon className="w-10 h-10 text-primary" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold">Interactive Map Placeholder</h3>
                            <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">
                              Map integration would display plot boundaries and satellite imagery here.
                            </p>
                          </div>
                          <Button variant="outline" className="gap-2 rounded-xl h-11 px-6 border-border/50 hover:bg-white transition-all">
                            <Layers className="w-4 h-4" />
                            <span>Toggle Layers</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        <div className="space-y-8">
          <motion.div variants={item}>
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-md rounded-3xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold tracking-tight">Cluster Health</CardTitle>
                <CardDescription className="text-base">Performance metrics for this group.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {[
                    { label: 'Production Target', value: '92%', icon: CheckCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
                    { label: 'Resource Utilization', value: '78%', icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
                    { label: 'Compliance Rate', value: '100%', icon: CheckCircle2, color: 'text-primary', bgColor: 'bg-primary/10' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.bgColor)}>
                          <stat.icon className={cn("w-4 h-4", stat.color)} />
                        </div>
                        <span className="text-sm font-bold">{stat.label}</span>
                      </div>
                      <span className="font-black text-lg">{stat.value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Info className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Admin Note</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    This cluster is currently exceeding its quarterly production targets. Consider expanding plot allocations in Sector C.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {canManage && (
            <motion.div variants={item}>
              <Card className="border-none shadow-sm bg-card/50 backdrop-blur-md rounded-3xl overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold tracking-tight">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-4 h-12 rounded-2xl border-border/50 hover:bg-white hover:text-primary transition-all font-bold">
                    <FileText className="w-5 h-5 text-primary/60" />
                    <span>Generate Report</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-4 h-12 rounded-2xl border-border/50 hover:bg-white hover:text-primary transition-all font-bold">
                    <Users className="w-5 h-5 text-primary/60" />
                    <span>Bulk Invite Farmers</span>
                  </Button>
                  {canVerify && !cluster.isVerified && (
                    <Button 
                      className="w-full justify-start gap-4 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                      onClick={handleVerify}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Verify Cluster</span>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full justify-start gap-4 h-12 rounded-2xl border-border/50 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all font-bold">
                    <XCircle className="w-5 h-5" />
                    <span>Suspend Cluster</span>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function FileText(props: any) {
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
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}
