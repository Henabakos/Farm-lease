import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Wallet, 
  Activity, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowUpRight,
  UserPlus,
  MapPin,
  FileText,
  Shield,
  BarChart3,
  Lock,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { User, Cluster, Payment, UserRole } from '../../types';
import { useStore } from '@/src/store/useStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const AdminDashboard: React.FC = () => {
  const { clusters, payments, verifyCluster, verifyPayment } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'USERS' | 'CLUSTERS' | 'PAYMENTS'>('USERS');

  // Mock users for now as they aren't in the store yet
  const mockUsers: User[] = [
    { id: 'u1', name: 'Alex Johnson', email: 'alex@example.com', role: 'INVESTOR', joinedDate: '2024-01-15', location: 'New York, USA' },
    { id: 'u2', name: 'Sarah Miller', email: 'sarah@example.com', role: 'FARMER', joinedDate: '2024-02-10', location: 'Zaria, Nigeria' },
    { id: 'u3', name: 'John Doe', email: 'john@example.com', role: 'CLUSTER_REP', joinedDate: '2024-03-05', location: 'Nairobi, Kenya' },
    { id: 'u4', name: 'Admin User', email: 'admin@agriinvest.com', role: 'ADMIN', joinedDate: '2023-12-01', location: 'Remote' },
  ];

  const pendingClusters = clusters.filter(c => !c.isVerified);
  const pendingPayments = payments.filter(p => p.status === 'SUBMITTED');

  const stats = [
    { title: 'Total Users', value: '1,284', change: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { title: 'Active Clusters', value: clusters.length.toString(), change: '+8%', icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { title: 'Total Volume', value: `$${(payments.filter(p => p.status === 'VERIFIED').reduce((sum, p) => sum + p.amount, 0) / 1000).toFixed(1)}k`, change: '+15%', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { title: 'System Health', value: '99.9%', change: 'Stable', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-500/10' },
  ];

  const handleVerifyCluster = (id: string) => {
    verifyCluster(id);
    toast.success('Cluster verified successfully');
  };

  const handleVerifyPayment = (id: string) => {
    verifyPayment(id);
    toast.success('Payment verified successfully');
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground leading-tight">
            Admin <span className="text-primary">Control Center</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">
            Manage users, verify entities, and monitor system performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-12 px-6 rounded-2xl border-primary/10 bg-card/40 backdrop-blur-md hover:bg-primary/5 hover:text-primary transition-all">
            <FileText className="w-5 h-5" />
            <span className="font-bold">Export Report</span>
          </Button>
          <Button className="gap-2 h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <UserPlus className="w-5 h-5" />
            <span className="font-bold">Invite User</span>
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group overflow-hidden relative rounded-[2rem] border border-primary/5 hover:border-primary/20">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110", stat.bg, stat.color)}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black px-3 py-1 rounded-xl text-xs">
                    {stat.change}
                  </Badge>
                </div>
                <div className="mt-6">
                  <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1">{stat.title}</p>
                  <h3 className="text-3xl font-black mt-2 tracking-tight text-foreground">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <motion.div variants={item} className="xl:col-span-2">
          <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-primary/5">
            <CardHeader className="p-8 pb-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <Shield className="w-6 h-6 text-primary" />
                    System Management
                  </CardTitle>
                  <CardDescription className="text-base font-medium">Manage and monitor all system entities and users.</CardDescription>
                </div>
                <div className="relative group w-full md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Search..." 
                    className="pl-10 bg-background/40 border-primary/10 focus-visible:ring-primary/20 h-11 rounded-xl text-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Tabs defaultValue="USERS" className="mt-8" onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="bg-primary/5 p-1 rounded-2xl h-14 w-full md:w-auto border border-primary/10">
                  <TabsTrigger value="USERS" className="rounded-xl px-8 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">Users</TabsTrigger>
                  <TabsTrigger value="CLUSTERS" className="rounded-xl px-8 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">Clusters</TabsTrigger>
                  <TabsTrigger value="PAYMENTS" className="rounded-xl px-8 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all">Payments</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'USERS' && (
                    <div className="space-y-4">
                      {mockUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-6 rounded-3xl bg-background/40 border border-primary/5 hover:border-primary/20 hover:bg-background/60 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black group-hover:scale-110 transition-transform">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-foreground">{user.name}</h4>
                              <p className="text-xs text-muted-foreground font-medium">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="hidden md:block text-right">
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-black px-3 py-1 rounded-xl text-[10px] uppercase tracking-widest">
                                {user.role}
                              </Badge>
                              <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-tighter">Role</p>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary">
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'CLUSTERS' && (
                    <div className="space-y-4">
                      {clusters.map((cluster) => (
                        <div key={cluster.id} className="flex items-center justify-between p-6 rounded-3xl bg-background/40 border border-primary/5 hover:border-primary/20 hover:bg-background/60 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                              <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-foreground">{cluster.name}</h4>
                              <p className="text-xs text-muted-foreground font-medium">{cluster.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {cluster.isVerified ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black px-3 py-1 rounded-xl text-[10px] uppercase tracking-widest">Verified</Badge>
                            ) : (
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl h-9" onClick={() => handleVerifyCluster(cluster.id)}>
                                Verify Now
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary">
                              <ChevronRight className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeTab === 'PAYMENTS' && (
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-6 rounded-3xl bg-background/40 border border-primary/5 hover:border-primary/20 hover:bg-background/60 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                              <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-foreground">${payment.amount.toLocaleString()}</h4>
                              <p className="text-xs text-muted-foreground font-medium">{payment.agreementTitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={cn(
                              "font-black px-3 py-1 rounded-xl text-[10px] uppercase tracking-widest border-none",
                              payment.status === 'VERIFIED' ? "bg-emerald-500/10 text-emerald-600" : 
                              payment.status === 'SUBMITTED' ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
                            )}>
                              {payment.status}
                            </Badge>
                            {payment.status === 'SUBMITTED' && (
                              <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold rounded-xl h-9" onClick={() => handleVerifyPayment(payment.id)}>
                                Verify
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-8">
          {/* Quick Actions / Verification Queue */}
          <motion.div variants={item}>
            <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-primary/5">
              <CardHeader className="p-8">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                    <Activity className="w-5 h-5 text-primary" />
                    Pending Verification
                  </CardTitle>
                  <Badge className="bg-primary/10 text-primary border-none font-black px-2.5 py-0.5 rounded-lg text-[10px]">
                    {pendingClusters.length + pendingPayments.length}
                  </Badge>
                </div>
                <CardDescription className="text-sm font-medium">Critical items requiring admin approval.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-4">
                {pendingClusters.slice(0, 2).map((cluster) => (
                  <div key={cluster.id} className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 space-y-4 group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{cluster.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{cluster.location}</p>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-500/10" onClick={() => handleVerifyCluster(cluster.id)}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingPayments.slice(0, 2).map((payment) => (
                  <div key={payment.id} className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/10 space-y-4 group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">${payment.amount.toLocaleString()}</h4>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{payment.agreementTitle}</p>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-amber-600 hover:bg-amber-500/10" onClick={() => handleVerifyPayment(payment.id)}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest text-primary hover:bg-primary/5">
                  View Full Queue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Security */}
          <motion.div variants={item}>
            <Card className="border-none shadow-xl shadow-primary/5 bg-primary/5 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-primary/10">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg tracking-tight">Security Status</h3>
                    <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">All Systems Secure</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Firewall</span>
                    <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] uppercase tracking-widest">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Encryption</span>
                    <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] uppercase tracking-widest">AES-256</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Audit Logging</span>
                    <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] uppercase tracking-widest">Enabled</Badge>
                  </div>
                </div>
                <Button className="w-full mt-8 h-12 rounded-2xl bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                  Security Audit
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
