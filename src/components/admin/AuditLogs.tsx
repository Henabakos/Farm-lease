import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  User, 
  Activity, 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  ChevronRight,
  Clock,
  Terminal,
  History,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { AuditLog, UserRole } from '../../types';
import { useStore } from '@/src/store/useStore';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

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

export const AuditLogs: React.FC = () => {
  const { auditLogs } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState('LAST_24H');

  const getActionIcon = (action: string) => {
    if (action.includes('CREATED')) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (action.includes('VERIFIED')) return <Shield className="w-4 h-4 text-blue-500" />;
    if (action.includes('UPDATED')) return <Activity className="w-4 h-4 text-amber-500" />;
    if (action.includes('SECURITY')) return <AlertCircle className="w-4 h-4 text-rose-500" />;
    return <Activity className="w-4 h-4 text-primary" />;
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || log.userRole === roleFilter;
    return matchesSearch && matchesRole;
  });

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
            System <span className="text-primary">Audit Logs</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">
            Detailed timeline of all administrative and user activities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-12 px-6 rounded-2xl border-primary/10 bg-card/40 backdrop-blur-md hover:bg-primary/5 hover:text-primary transition-all">
            <Download className="w-5 h-5" />
            <span className="font-bold">Download CSV</span>
          </Button>
          <Button variant="outline" className="gap-2 h-12 px-6 rounded-2xl border-primary/10 bg-card/40 backdrop-blur-md hover:bg-primary/5 hover:text-primary transition-all">
            <Calendar className="w-5 h-5" />
            <span className="font-bold">Select Range</span>
          </Button>
        </div>
      </motion.div>

      {/* Filters Card */}
      <motion.div variants={item}>
        <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-primary/5">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search logs by user, action, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 bg-background/40 border-primary/10 focus-visible:ring-primary/20 h-12 rounded-2xl text-base transition-all"
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                  <SelectTrigger className="bg-background/40 border-primary/10 h-12 rounded-2xl focus:ring-primary/20 text-base transition-all min-w-[160px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-primary/10 backdrop-blur-xl">
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="ADMIN">Admin Only</SelectItem>
                    <SelectItem value="INVESTOR">Investor Only</SelectItem>
                    <SelectItem value="FARMER">Farmer Only</SelectItem>
                    <SelectItem value="CLUSTER_REP">Cluster Rep Only</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-primary/10 bg-background/40 hover:bg-primary/5 hover:text-primary">
                  <Filter className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Timeline View */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <motion.div variants={item} className="xl:col-span-3">
          <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-primary/5">
            <CardHeader className="p-8 border-b border-primary/5">
              <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                <History className="w-6 h-6 text-primary" />
                Activity Timeline
              </CardTitle>
              <CardDescription className="text-base font-medium">Real-time stream of system events and user interactions.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-primary/5">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-8 hover:bg-primary/5 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-background/60 shadow-inner flex items-center justify-center border border-primary/5 group-hover:scale-110 transition-transform">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-black text-lg text-foreground">{log.userName}</span>
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-black px-2.5 py-0.5 rounded-lg text-[10px] uppercase tracking-widest">
                              {log.userRole}
                            </Badge>
                          </div>
                          <p className="text-base font-bold text-foreground leading-tight">{log.action}</p>
                          <p className="text-sm text-muted-foreground font-medium">{log.details}</p>
                        </div>
                      </div>
                      <div className="flex flex-col md:items-end gap-2 shrink-0">
                        <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-xl">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mr-2">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredLogs.length === 0 && (
                <div className="p-24 text-center">
                  <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Terminal className="w-10 h-10 text-primary/40" />
                  </div>
                  <h3 className="text-2xl font-bold">No logs found</h3>
                  <p className="text-muted-foreground text-lg mt-2">Try adjusting your filters or search query.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-8">
          {/* Quick Stats */}
          <motion.div variants={item}>
            <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-primary/5">
              <CardHeader className="p-8">
                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                  <Activity className="w-5 h-5 text-primary" />
                  Log Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-muted-foreground">Total Events</span>
                    <span className="font-black text-lg">{auditLogs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-muted-foreground">Security Alerts</span>
                    <Badge className="bg-rose-500/10 text-rose-600 border-none font-black text-xs">0</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-muted-foreground">Admin Actions</span>
                    <span className="font-black text-lg">{auditLogs.filter(l => l.userRole === 'ADMIN').length}</span>
                  </div>
                </div>
                <div className="pt-6 border-t border-primary/5">
                  <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mb-4">Storage Status</p>
                  <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[15%]" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 font-bold">15% of log capacity used</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Info */}
          <motion.div variants={item}>
            <Card className="border-none shadow-xl shadow-primary/5 bg-primary/5 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-primary/10">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <Terminal className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg tracking-tight">Log Settings</h3>
                    <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">Retention: 90 Days</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Auto-Archive</span>
                    <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] uppercase tracking-widest">ON</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Real-time Sync</span>
                    <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] uppercase tracking-widest">ON</Badge>
                  </div>
                </div>
                <Button className="w-full mt-8 h-12 rounded-2xl bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                  Manage Storage
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
