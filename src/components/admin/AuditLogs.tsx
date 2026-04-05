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
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">System Audit Logs</h1>
          <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Detailed timeline of all administrative and user activities.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 h-9 px-4 rounded-md border-slate-200 bg-white text-[10px] font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all">
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </Button>
          <Button variant="outline" className="gap-2 h-9 px-4 rounded-md border-slate-200 bg-white text-[10px] font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all">
            <Calendar className="w-3.5 h-3.5" />
            <span>Select Range</span>
          </Button>
        </div>
      </motion.div>

      {/* Filters Card */}
      <motion.div variants={item}>
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardContent className="p-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search logs by user, action, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 bg-white border-slate-200 focus-visible:ring-primary/20 h-9 rounded-md text-xs transition-all"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                  <SelectTrigger className="bg-white border-slate-200 h-9 rounded-md focus:ring-primary/20 text-[11px] font-bold uppercase tracking-wider transition-all min-w-[140px]">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-slate-200">
                    <SelectItem value="ALL" className="text-xs font-medium">All Roles</SelectItem>
                    <SelectItem value="ADMIN" className="text-xs font-medium">Admin Only</SelectItem>
                    <SelectItem value="INVESTOR" className="text-xs font-medium">Investor Only</SelectItem>
                    <SelectItem value="FARMER" className="text-xs font-medium">Farmer Only</SelectItem>
                    <SelectItem value="CLUSTER_REP" className="text-xs font-medium">Cluster Rep Only</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-md border-slate-200 bg-white hover:bg-slate-50 active:scale-95 transition-all">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Timeline View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div variants={item} className="lg:col-span-9">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Activity Timeline
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Real-time stream of system events and user interactions.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-5 hover:bg-slate-50/80 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-md bg-white shadow-sm flex items-center justify-center border border-slate-100 group-hover:scale-105 transition-transform">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">{log.userName}</span>
                            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 font-bold px-1.5 py-0 rounded-md text-[9px] uppercase tracking-wider">
                              {log.userRole}
                            </Badge>
                          </div>
                          <p className="text-xs font-bold text-slate-700 leading-tight">{log.action}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{log.details}</p>
                        </div>
                      </div>
                      <div className="flex flex-col md:items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5 text-primary font-bold text-[10px] uppercase tracking-wider bg-primary/5 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3" />
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredLogs.length === 0 && (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Terminal className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">No logs found</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Try adjusting your filters or search query.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="lg:col-span-3 space-y-6">
          {/* Quick Stats */}
          <motion.div variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  Log Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Events</span>
                    <span className="font-bold text-sm text-slate-900">{auditLogs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Security Alerts</span>
                    <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 font-bold text-[9px] uppercase tracking-wider px-1.5 py-0 rounded-md">0</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Admin Actions</span>
                    <span className="font-bold text-sm text-slate-900">{auditLogs.filter(l => l.userRole === 'ADMIN').length}</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Storage Status</p>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[15%] transition-all duration-1000" />
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1.5 font-bold uppercase tracking-wider">15% of log capacity used</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Info */}
          <motion.div variants={item}>
            <Card className="border border-primary/10 shadow-sm bg-primary/5 rounded-lg overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight text-slate-900">Log Settings</h3>
                    <p className="text-[9px] font-bold text-primary/60 uppercase tracking-wider">Retention: 90 Days</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Auto-Archive</span>
                    <Badge className="bg-emerald-500 text-white border-none font-bold text-[8px] uppercase tracking-wider px-1.5 py-0 rounded-md">ON</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Real-time Sync</span>
                    <Badge className="bg-emerald-500 text-white border-none font-bold text-[8px] uppercase tracking-wider px-1.5 py-0 rounded-md">ON</Badge>
                  </div>
                </div>
                <Button className="w-full mt-6 h-9 rounded-md bg-primary hover:bg-primary/90 font-bold text-[10px] uppercase tracking-wider shadow-sm active:scale-95 transition-all">
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
