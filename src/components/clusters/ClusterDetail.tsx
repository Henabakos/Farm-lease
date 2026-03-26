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

const MOCK_MEMBERS: User[] = [
  { id: 'm1', name: 'John Doe', email: 'john@example.com', role: 'FARMER', joinedDate: '2023-06-12', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
  { id: 'm2', name: 'Jane Smith', email: 'jane@example.com', role: 'FARMER', joinedDate: '2023-07-05', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' },
  { id: 'm3', name: 'Michael Brown', email: 'michael@example.com', role: 'FARMER', joinedDate: '2023-08-15', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael' },
  { id: 'm4', name: 'Sarah Wilson', email: 'sarah@example.com', role: 'FARMER', joinedDate: '2023-09-20', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
];

const MOCK_PLOTS: Plot[] = [
  { id: 'p1', clusterId: 'c1', size: 5.5, location: 'Sector A-1', status: 'OCCUPIED' },
  { id: 'p2', clusterId: 'c1', size: 4.2, location: 'Sector A-2', status: 'AVAILABLE' },
  { id: 'p3', clusterId: 'c1', size: 6.8, location: 'Sector B-1', status: 'OCCUPIED' },
  { id: 'p4', clusterId: 'c1', size: 3.5, location: 'Sector B-2', status: 'MAINTENANCE' },
  { id: 'p5', clusterId: 'c1', size: 7.2, location: 'Sector C-1', status: 'AVAILABLE' },
];

export function ClusterDetail({ cluster, onBack }: { cluster: Cluster, onBack: () => void }) {
  const [members, setMembers] = useState<User[]>(MOCK_MEMBERS);
  const [plots, setPlots] = useState<Plot[]>(MOCK_PLOTS);
  const [searchMember, setSearchMember] = useState('');

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

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{cluster.name}</h1>
            {cluster.isVerified && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{cluster.location}, {cluster.region}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-card/50 backdrop-blur-sm p-1">
              <TabsTrigger value="overview" className="gap-2">
                <Info className="w-4 h-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-2">
                <Users className="w-4 h-4" />
                <span>Members</span>
              </TabsTrigger>
              <TabsTrigger value="land" className="gap-2">
                <Layers className="w-4 h-4" />
                <span>Land Management</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Cluster Information</CardTitle>
                  <CardDescription>Detailed background and operational status.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-foreground leading-relaxed">
                    {cluster.description}
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Established</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{new Date(cluster.establishedDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Area</p>
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{cluster.size} Ha</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Members</p>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{cluster.memberCount}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Region</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{cluster.region}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Cluster Representatives</CardTitle>
                  <CardDescription>Official contacts managing this cluster.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Robert Chen', role: 'Cluster Representative', phone: '+234 802 345 6789', email: 'robert@cluster.com' },
                      { name: 'Alice Okafor', role: 'Technical Lead', phone: '+234 803 456 7890', email: 'alice@cluster.com' }
                    ].map((rep) => (
                      <div key={rep.email} className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10 border">
                            <AvatarFallback>{rep.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{rep.name}</p>
                            <p className="text-xs text-muted-foreground">{rep.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">Contact</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="space-y-6">
              <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Member Directory</CardTitle>
                    <CardDescription>Manage farmers associated with this cluster.</CardDescription>
                  </div>
                  <Button onClick={addMember} className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Add Farmer</span>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search members by name or email..." 
                      className="pl-10 bg-background/50"
                      value={searchMember}
                      onChange={(e) => setSearchMember(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    {filteredMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10 border">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Joined</p>
                            <p className="text-sm font-medium">{new Date(member.joinedDate).toLocaleDateString()}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
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

            <TabsContent value="land" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Land Plots</CardTitle>
                        <CardDescription>Inventory of available and occupied land.</CardDescription>
                      </div>
                      <Button size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Add Plot</span>
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {plots.map((plot) => (
                        <div key={plot.id} className="p-4 rounded-xl border bg-muted/20 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-semibold text-foreground">{plot.location}</h4>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Layers className="w-3 h-3" />
                                <span>{plot.size} Hectares</span>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] uppercase tracking-tighter",
                                plot.status === 'AVAILABLE' && "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
                                plot.status === 'OCCUPIED' && "text-blue-500 border-blue-500/20 bg-blue-500/10",
                                plot.status === 'MAINTENANCE' && "text-amber-500 border-amber-500/20 bg-amber-500/10"
                              )}
                            >
                              {plot.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">Edit</Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive">Delete</Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm h-full flex flex-col">
                    <CardHeader>
                      <CardTitle>Map View</CardTitle>
                      <CardDescription>Visual representation of cluster boundaries.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center min-h-[400px]">
                      <div className="w-full h-full rounded-xl bg-muted/50 border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <MapIcon className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-semibold">Interactive Map Placeholder</h3>
                          <p className="text-sm text-muted-foreground max-w-[200px]">
                            Map integration would display plot boundaries and satellite imagery here.
                          </p>
                        </div>
                        <Button variant="outline" className="gap-2">
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
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Cluster Health</CardTitle>
              <CardDescription>Performance metrics for this group.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { label: 'Production Target', value: '92%', icon: CheckCircle, color: 'text-emerald-500' },
                  { label: 'Resource Utilization', value: '78%', icon: Clock, color: 'text-blue-500' },
                  { label: 'Compliance Rate', value: '100%', icon: CheckCircle2, color: 'text-primary' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <stat.icon className={cn("w-4 h-4", stat.color)} />
                      <span className="text-sm font-medium">{stat.label}</span>
                    </div>
                    <span className="font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
              
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Info className="w-4 h-4" />
                  <span className="text-sm font-bold">Admin Note</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This cluster is currently exceeding its quarterly production targets. Consider expanding plot allocations in Sector C.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-3 h-11">
                <FileText className="w-4 h-4" />
                <span>Generate Report</span>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-11">
                <Users className="w-4 h-4" />
                <span>Bulk Invite Farmers</span>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10">
                <XCircle className="w-4 h-4" />
                <span>Suspend Cluster</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
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
