import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Clock,
  FileText as FileTextIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { apiRoleToUi } from '@/src/lib/apiMappers';
import { toast } from 'sonner';
import { GeospatialClusterDetail } from '@/src/components/geospatial';
import { useClusters } from '@/src/hooks/useClusters';
import { clustersAPI, plotsAPI } from '@/src/services/api';
import { InviteMemberDialog } from './InviteMemberDialog';
import { PlotMapPicker } from './PlotMapPicker';
import { motion } from 'motion/react';

export function ClusterDetail({ cluster, onBack }: { cluster: Cluster, onBack: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listMembers, removeMember: apiRemoveMember, verifyCluster } = useClusters();
  const uiRole = user ? apiRoleToUi(user.role) : null;
  const [members, setMembers] = useState<User[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [searchMember, setSearchMember] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteRole, setInviteRole] = useState<'FARMER' | 'REPRESENTATIVE'>('FARMER');
  const [showPlotDialog, setShowPlotDialog] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);

  const canManageCluster = uiRole === 'ADMIN' || (uiRole === 'CLUSTER_REP' && cluster.ownerId === user?.id);
  const canVerify = uiRole === 'ADMIN';
  const canCreateProposal = uiRole === 'INVESTOR';

  const handleCreateProposal = () => {
    // Navigate to proposal creation with cluster pre-selected
    navigate('/proposals/create', { state: { clusterId: cluster.id, clusterName: cluster.name } });
  };

  // Load real members on mount
  useEffect(() => {
    const loadMembers = async () => {
      setLoadingMembers(true);
      try {
        const data = await listMembers(cluster.id);
        setMembers(data.map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          cluster_role: m.cluster_role,
          joinedDate: m.joined_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          avatar: m.avatar,
        })));
      } catch (err) {
        console.error('Failed to load members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };
    loadMembers();
  }, [cluster.id, listMembers]);

  // Load plots from backend on mount
  useEffect(() => {
    const loadPlots = async () => {
      try {
        const response = await plotsAPI.getClusterPlots(cluster.id);
        setPlots(response.data || []);
      } catch (err) {
        console.error('Failed to load plots:', err);
      }
    };
    loadPlots();
  }, [cluster.id]);

  const handleVerify = async () => {
    try {
      await verifyCluster(cluster.id);
      toast.success('Cluster verified successfully');
    } catch (err) {
      console.error('Failed to verify cluster', err);
    }
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchMember.toLowerCase()) ||
    m.email.toLowerCase().includes(searchMember.toLowerCase())
  );

  const handleRemoveMember = async (id: string) => {
    try {
      await apiRemoveMember(cluster.id, id);
      setMembers(members.filter(m => m.id !== id));
      toast.success('Member removed');
    } catch (err) {
      console.error('Failed to remove member', err);
    }
  };

  const handleInviteRep = () => {
    setInviteRole('REPRESENTATIVE');
    setShowInviteDialog(true);
  };

  const handleInviteFarmer = () => {
    setInviteRole('FARMER');
    setShowInviteDialog(true);
  };

  const handleMemberInvited = () => {
    // Reload members after invite
    listMembers(cluster.id).then((data) => {
      setMembers(data.map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        cluster_role: m.cluster_role,
        joinedDate: m.joined_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        avatar: m.avatar,
      })));
    });
  };

  const handleMakeRep = async (memberId: string) => {
    try {
      await clustersAPI.updateMemberRole(cluster.id, memberId, 'REPRESENTATIVE');
      toast.success('Member promoted to representative');
      handleMemberInvited();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to promote member');
    }
  };

  const handleSavePlot = async (plotData: { location: string; size: number; status: string; latitude: number; longitude: number }) => {
    try {
      const response = await plotsAPI.create({
        clusterId: cluster.id,
        location: plotData.location,
        size: plotData.size,
        status: plotData.status,
        latitude: plotData.latitude,
        longitude: plotData.longitude,
      });
      setPlots([...plots, response.data]);
      toast.success('Plot added successfully');
      // Reload plots from backend to ensure consistency
      const updatedPlots = await plotsAPI.getClusterPlots(cluster.id);
      setPlots(updatedPlots.data || []);
    } catch (err) {
      console.error('Failed to save plot:', err);
      toast.error('Failed to save plot');
    }
  };

  const handleViewOnMap = (plot: Plot) => {
    if (plot.latitude && plot.longitude) {
      window.open(`https://www.google.com/maps?q=${plot.latitude},${plot.longitude}`, '_blank');
    } else {
      toast.error('This plot has no coordinates');
    }
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
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
      <motion.div variants={item} className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-md hover:bg-slate-50 hover:text-primary transition-all active:scale-95 border border-transparent hover:border-slate-200 shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">{cluster.name}</h1>
              {cluster.isVerified && (
                <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{cluster.location}, {cluster.region}</span>
            </div>
          </div>
        </div>
        {canCreateProposal && (
          <Button
            onClick={handleCreateProposal}
            className="bg-primary hover:bg-primary/90 font-bold rounded-md h-9 px-4 text-[11px] uppercase tracking-wider gap-2 shadow-sm transition-all active:scale-95"
          >
            <FileTextIcon className="w-3.5 h-3.5" />
            Create Proposal
          </Button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-6">
          <motion.div variants={item}>
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-slate-100 p-1 rounded-md border border-slate-200 h-10">
                <TabsTrigger value="overview" className="gap-2 px-6 h-full rounded-sm data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-[10px] font-bold uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-2 px-6 h-full rounded-sm data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-[10px] font-bold uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5" />
                  <span>Members</span>
                </TabsTrigger>
                <TabsTrigger value="land" className="gap-2 px-6 h-full rounded-sm data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all text-[10px] font-bold uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Land Management</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 outline-none">
                <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-base font-bold tracking-tight text-slate-900">Cluster Information</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Detailed background and operational status.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <p className="text-slate-600 leading-relaxed text-xs font-medium">
                      {cluster.description}
                    </p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Established</p>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="font-bold text-xs text-slate-700">{new Date(cluster.establishedDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Total Area</p>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                            <Layers className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="font-bold text-xs text-slate-700">{cluster.size} Ha</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Members</p>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                            <Users className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="font-bold text-xs text-slate-700">{cluster.memberCount}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Region</p>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="font-bold text-xs text-slate-700">{cluster.region}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                    <div>
                      <CardTitle className="text-base font-bold tracking-tight text-slate-900">Cluster Representatives</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Official contacts managing this cluster.</CardDescription>
                    </div>
                    {canManageCluster && (
                      <Button size="sm" onClick={handleInviteRep} className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-white">
                        <UserPlus className="w-3 h-3 mr-1" />
                        Add Rep
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {members.filter(m => (m.role as string) === 'CLUSTER_REP' || (m.role as string) === 'cluster_rep').map((rep) => (
                        <div key={rep.id} className="flex items-center justify-between p-4 rounded-md bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all group active:scale-[0.99]">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-slate-200 shadow-sm rounded-md">
                              <AvatarImage src={rep.avatar} />
                              <AvatarFallback className="bg-white text-primary font-bold text-xs rounded-md">{rep.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-sm text-slate-900 group-hover:text-primary transition-colors leading-tight">{rep.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cluster Representative</p>
                              <p className="text-[10px] text-slate-500">{rep.email}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="rounded-md h-8 px-3 border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 shadow-sm">Contact</Button>
                        </div>
                      ))}
                      {members.filter(m => (m.role as string) === 'CLUSTER_REP' || (m.role as string) === 'cluster_rep').length === 0 && (
                        <div className="col-span-1 md:col-span-2 text-center py-8 text-slate-500 text-sm">
                          No cluster representatives assigned yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="members" className="space-y-6 outline-none">
                <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                    <div>
                      <CardTitle className="text-xl font-bold tracking-tight">Member Directory</CardTitle>
                      <CardDescription className="text-sm font-normal">Manage farmers associated with this cluster.</CardDescription>
                    </div>
                    {canManageCluster && (
                      <Button onClick={handleInviteFarmer} className="gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all text-xs">
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add Farmer</span>
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <Input 
                        placeholder="Search members by name or email..." 
                        className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-primary/20 h-9 rounded-md text-xs"
                        value={searchMember}
                        onChange={(e) => setSearchMember(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      {filteredMembers.map((member) => {
                        const isRep = ((member as any).cluster_role as string) === 'REPRESENTATIVE' || (member.role as string) === 'CLUSTER_REP';
                        return (
                          <div key={member.id} className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-200">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 border border-slate-200 shadow-sm">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback className="bg-slate-50 text-primary font-bold text-sm">{member.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-sm group-hover:text-primary transition-colors">{member.name}</p>
                                <p className="text-xs text-slate-500">{member.email}</p>
                                {isRep && (
                                  <Badge variant="secondary" className="text-[9px] font-semibold bg-emerald-50 text-emerald-600 border-emerald-100 mt-1">
                                    Representative
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Joined</p>
                                <p className="text-xs font-bold">{new Date(member.joinedDate).toLocaleDateString()}</p>
                              </div>
                              {canManageCluster && !isRep && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-slate-200"
                                  onClick={() => handleMakeRep(member.id)}
                                >
                                  Make Rep
                                </Button>
                              )}
                              {canManageCluster && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-destructive/20"
                                  onClick={() => handleRemoveMember(member.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="land" className="space-y-6 outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                        <div>
                          <CardTitle className="text-xl font-bold tracking-tight">Land Plots</CardTitle>
                          <CardDescription className="text-sm font-normal">Inventory of available and occupied land.</CardDescription>
                        </div>
                        {canManageCluster && (
                          <Button size="sm" onClick={() => setShowPlotDialog(true)} className="gap-2 rounded-md h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-white">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Plot</span>
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent className="p-6 space-y-3">
                        {plots.map((plot) => (
                          <div key={plot.id} className="p-4 rounded-md border border-slate-200 bg-slate-50 space-y-4 hover:bg-slate-100 transition-all group">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{plot.location}</h4>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <Layers className="w-3.5 h-3.5 text-primary/60" />
                                  <span className="font-medium">{plot.size} Hectares</span>
                                </div>
                                {plot.latitude && plot.longitude && (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                    <MapPin className="w-3 h-3 text-primary/60" />
                                    <span className="font-medium">{Number(plot.latitude).toFixed(4)}, {Number(plot.longitude).toFixed(4)}</span>
                                  </div>
                                )}
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase tracking-wider border",
                                  plot.status === 'AVAILABLE' && "text-emerald-600 bg-emerald-50 border-emerald-100",
                                  plot.status === 'OCCUPIED' && "text-blue-600 bg-blue-50 border-blue-100",
                                  plot.status === 'MAINTENANCE' && "text-amber-600 bg-amber-50 border-amber-100"
                                )}
                              >
                                {plot.status}
                              </Badge>
                            </div>
                            {plot.latitude && plot.longitude && (
                              <div className="w-full h-32 rounded-md overflow-hidden border border-slate-200 relative">
                                <iframe
                                  width="100%"
                                  height="100%"
                                  frameBorder="0"
                                  style={{ border: 0 }}
                                  src={`https://maps.google.com/maps?q=${plot.latitude},${plot.longitude}&z=15&output=embed`}
                                  allowFullScreen
                                  title="Google Maps"
                                />
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                              {plot.latitude && plot.longitude && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewOnMap(plot)}
                                  className="h-8 px-3 rounded-md text-xs font-semibold hover:bg-white border border-transparent hover:border-slate-200 gap-2"
                                >
                                  <MapPin className="w-3 h-3" />
                                  View on Map
                                </Button>
                              )}
                              <div className="flex gap-2 ml-auto">
                                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-md text-xs font-semibold hover:bg-white border border-transparent hover:border-slate-200">Edit</Button>
                                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-md text-xs font-semibold text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20">Delete</Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden h-full flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col min-h-125">
               <GeospatialClusterDetail cluster={cluster} plots={plots} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg font-bold tracking-tight">Cluster Health</CardTitle>
                <CardDescription className="text-xs font-normal">Performance metrics for this group.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="space-y-2">
                  {[
                    { label: 'Production Target', value: '92%', icon: CheckCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
                    { label: 'Resource Utilization', value: '78%', icon: Clock, color: 'text-blue-500', bgColor: 'bg-blue-50' },
                    { label: 'Compliance Rate', value: '100%', icon: CheckCircle2, color: 'text-primary', bgColor: 'bg-primary/5' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center border border-slate-200 bg-white", stat.bgColor)}>
                          <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{stat.label}</span>
                      </div>
                      <span className="font-bold text-sm text-foreground">{stat.value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 rounded-md bg-primary/5 border border-primary/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-primary">
                    <Info className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Admin Note</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    This cluster is currently exceeding its quarterly production targets. Consider expanding plot allocations in Sector C.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {canManageCluster && (
            <motion.div variants={item}>
              <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                <CardHeader className="p-6 pb-4">
                  <CardTitle className="text-lg font-bold tracking-tight">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-3 h-10 rounded-md border-slate-200 bg-white hover:bg-slate-50 hover:text-primary transition-all font-semibold text-xs">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Generate Report</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3 h-10 rounded-md border-slate-200 bg-white hover:bg-slate-50 hover:text-primary transition-all font-semibold text-xs">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Bulk Invite Farmers</span>
                  </Button>
                  {canVerify && !cluster.isVerified && (
                    <Button 
                      className="w-full justify-start gap-3 h-10 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all text-xs"
                      onClick={handleVerify}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify Cluster</span>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full justify-start gap-3 h-10 rounded-md border-slate-200 text-destructive hover:text-destructive hover:bg-destructive/5 transition-all font-semibold text-xs">
                    <XCircle className="w-4 h-4" />
                    <span>Suspend Cluster</span>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>

    <InviteMemberDialog
      open={showInviteDialog}
      onOpenChange={setShowInviteDialog}
      clusterId={cluster.id}
      defaultRole={inviteRole}
      onInvited={handleMemberInvited}
    />

    <PlotMapPicker
      open={showPlotDialog}
      onOpenChange={setShowPlotDialog}
      onSave={handleSavePlot}
    />
    </>
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
