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
  Terminal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AuditLog, UserRole } from '../../types';
import { useStore } from '@/src/store/useStore';

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
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || log.userRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">System Audit Logs</h1>
          <p className="text-gray-500 mt-1">Detailed timeline of all administrative and user activities.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </Button>
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span>Select Range</span>
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search logs by user, action, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admin Only</option>
                <option value="INVESTOR">Investor Only</option>
                <option value="FARMER">Farmer Only</option>
                <option value="CLUSTER_REP">Cluster Rep Only</option>
              </select>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline View */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Activity Timeline */}
        <div className="xl:col-span-3 space-y-4">
          {filteredLogs.map((log, idx) => (
            <div key={log.id} className="relative pl-8 group">
              {/* Vertical Line */}
              {idx !== filteredLogs.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-100 group-hover:bg-primary/20 transition-colors" />
              )}
              
              {/* Timeline Dot */}
              <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center z-10 group-hover:border-primary/50 transition-colors shadow-sm">
                {getActionIcon(log.action)}
              </div>

              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{log.userName}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-bold uppercase tracking-wider">
                          {log.userRole}
                        </Badge>
                        <span className="text-gray-400 text-xs">•</span>
                        <span className="text-xs font-medium text-primary uppercase tracking-wider">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {log.details}
                      </p>
                      <div className="flex items-center gap-4 pt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Terminal className="w-3 h-3" />
                          {log.ipAddress}
                        </span>
                        {log.targetId && (
                          <span className="flex items-center gap-1 text-primary/70">
                            <ChevronRight className="w-3 h-3" />
                            Target: {log.targetType} ({log.targetId})
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-24 h-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Activity Summary</CardTitle>
              <CardDescription className="text-primary-foreground/70">Last 24 hours of system activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-80">Total Events</span>
                <span className="text-xl font-bold">1,428</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-80">Admin Actions</span>
                <span className="text-xl font-bold">42</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-80">Security Alerts</span>
                <span className="text-xl font-bold text-rose-300">3</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Top Active Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Admin User', actions: 42, role: 'ADMIN' },
                { name: 'Alex Johnson', actions: 28, role: 'INVESTOR' },
                { name: 'Sarah Miller', actions: 15, role: 'FARMER' },
              ].map((u, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{u.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">{u.role}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{u.actions}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
