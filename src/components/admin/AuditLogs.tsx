import React, { useState, useEffect, useCallback } from 'react';
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
  FileText,
  ChevronLeft,
  ChevronDown,
  AlertTriangle,
  Trash2
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
import { useAdmin } from '@/src/hooks/useAdmin';
import { useStore } from '@/src/store/useStore';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

type DateRangePreset = 'LAST_24H' | 'LAST_7D' | 'LAST_30D' | 'LAST_90D' | 'ALL';

const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  LAST_24H: 'Last 24 Hours',
  LAST_7D: 'Last 7 Days',
  LAST_30D: 'Last 30 Days',
  LAST_90D: 'Last 90 Days',
  ALL: 'All Time',
};

function getDateRangeFilter(preset: DateRangePreset): { createdAfter?: Date } {
  const now = new Date();
  switch (preset) {
    case 'LAST_24H':
      return { createdAfter: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
    case 'LAST_7D':
      return { createdAfter: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    case 'LAST_30D':
      return { createdAfter: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    case 'LAST_90D':
      return { createdAfter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
    case 'ALL':
    default:
      return {};
  }
}

export const AuditLogs: React.FC = () => {
  const { auditLogs, auditLogsPagination, isLoading, error, fetchAuditLogs, exportAuditLogsCsv, clearAuditLogs } = useAdmin();
  const { setCurrentView } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState<DateRangePreset>('ALL');
  const [page, setPage] = useState(1);
  const [showDateRangePopover, setShowDateRangePopover] = useState(false);
  const [clearBeforeDate, setClearBeforeDate] = useState('');
  const [showClearDatePicker, setShowClearDatePicker] = useState(false);

  const getActionIcon = (action: string) => {
    if (action.includes('CREATED')) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (action.includes('VERIFIED')) return <Shield className="w-4 h-4 text-blue-500" />;
    if (action.includes('UPDATED')) return <Activity className="w-4 h-4 text-amber-500" />;
    if (action.includes('SECURITY')) return <AlertCircle className="w-4 h-4 text-rose-500" />;
    if (action.includes('SUSPENDED') || action.includes('DELETED')) return <XCircle className="w-4 h-4 text-rose-500" />;
    return <Activity className="w-4 h-4 text-primary" />;
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch logs when filters change
  useEffect(() => {
    const dateFilter = getDateRangeFilter(dateRange);
    const filters: any = {
      page,
      limit: 10,
      ...dateFilter,
    };
    if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
    if (roleFilter !== 'ALL') filters.role = roleFilter;
    if (actionFilter) filters.action = actionFilter;
    if (entityTypeFilter !== 'ALL') filters.entityType = entityTypeFilter;
    fetchAuditLogs(filters);
  }, [debouncedSearchTerm, roleFilter, actionFilter, entityTypeFilter, dateRange, page, fetchAuditLogs]);

  const handleExport = useCallback(() => {
    const dateFilter = getDateRangeFilter(dateRange);
    const filters: any = {
      ...dateFilter,
    };
    if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
    if (roleFilter !== 'ALL') filters.role = roleFilter;
    if (actionFilter) filters.action = actionFilter;
    if (entityTypeFilter !== 'ALL') filters.entityType = entityTypeFilter;
    exportAuditLogsCsv(filters);
  }, [debouncedSearchTerm, roleFilter, actionFilter, entityTypeFilter, dateRange, exportAuditLogsCsv]);

  const handleClearLogs = useCallback(async () => {
    if (!clearBeforeDate) return;
    if (!confirm(`Are you sure you want to delete all audit logs before ${new Date(clearBeforeDate).toLocaleDateString()}? This action cannot be undone.`)) return;
    try {
      await clearAuditLogs(clearBeforeDate);
      setShowClearDatePicker(false);
      setClearBeforeDate('');
    } catch (err) {
      // Error handled in hook
    }
  }, [clearBeforeDate, clearAuditLogs]);

  const handleRowClick = (log: AuditLog) => {
    const supportedEntityTypes = ['User', 'Cluster', 'Proposal', 'Agreement', 'Payment'];
    if (log.targetType && supportedEntityTypes.includes(log.targetType) && log.targetId) {
      // Navigate to the entity - this is a simple implementation
      // In a real app, you'd have proper routing based on entity type
      setCurrentView('DASHBOARD'); // Fallback for now
    }
  };

  const securityAlertCount = auditLogs.filter(l => l.action.includes('SECURITY')).length;

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
          <Button 
            variant="outline" 
            className="gap-2 h-9 px-4 rounded-md border-slate-200 bg-white text-[10px] font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all"
            onClick={handleExport}
            disabled={isLoading}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </Button>
          <div className="relative">
            <Button 
              variant="outline" 
              className="gap-2 h-9 px-4 rounded-md border-slate-200 bg-white text-[10px] font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all"
              onClick={() => setShowDateRangePopover(!showDateRangePopover)}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{DATE_RANGE_LABELS[dateRange]}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
            {showDateRangePopover && (
              <Card className="absolute right-0 top-full mt-2 w-48 border-slate-200 shadow-lg z-10">
                <CardContent className="p-2">
                  {(Object.keys(DATE_RANGE_LABELS) as DateRangePreset[]).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setDateRange(preset);
                        setShowDateRangePopover(false);
                        setPage(1);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors",
                        dateRange === preset
                          ? "bg-primary text-white"
                          : "hover:bg-slate-100 text-slate-700"
                      )}
                    >
                      {DATE_RANGE_LABELS[preset]}
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
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
                  placeholder="Search by action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 bg-white border-slate-200 focus-visible:ring-primary/20 h-9 rounded-md text-xs transition-all"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v as any); setPage(1); }}>
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
                <Select value={entityTypeFilter} onValueChange={(v) => { setEntityTypeFilter(v); setPage(1); }}>
                  <SelectTrigger className="bg-white border-slate-200 h-9 rounded-md focus:ring-primary/20 text-[11px] font-bold uppercase tracking-wider transition-all min-w-[140px]">
                    <SelectValue placeholder="All Entities" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-slate-200">
                    <SelectItem value="ALL" className="text-xs font-medium">All Entities</SelectItem>
                    <SelectItem value="User" className="text-xs font-medium">User</SelectItem>
                    <SelectItem value="Cluster" className="text-xs font-medium">Cluster</SelectItem>
                    <SelectItem value="Proposal" className="text-xs font-medium">Proposal</SelectItem>
                    <SelectItem value="Agreement" className="text-xs font-medium">Agreement</SelectItem>
                    <SelectItem value="Payment" className="text-xs font-medium">Payment</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Action..."
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                  className="w-32 bg-white border-slate-200 focus-visible:ring-primary/20 h-9 rounded-md text-xs transition-all"
                />
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
              {error && (
                <Alert className="m-4 border-rose-200 bg-rose-50">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <AlertDescription className="text-rose-800 text-xs">{error}</AlertDescription>
                </Alert>
              )}
              {isLoading && auditLogs.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 animate-pulse">
                    <Terminal className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Loading logs...</h3>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-100">
                    {auditLogs.map((log) => {
                      const isClickable = log.targetType && ['User', 'Cluster', 'Proposal', 'Agreement', 'Payment'].includes(log.targetType);
                      return (
                        <div 
                          key={log.id} 
                          className={cn(
                            "p-5 hover:bg-slate-50/80 transition-all group",
                            isClickable && "cursor-pointer"
                          )}
                          onClick={() => isClickable && handleRowClick(log)}
                        >
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
                                  {log.targetType && (
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-1.5 py-0 rounded-md text-[9px] uppercase tracking-wider">
                                      {log.targetType}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs font-bold text-slate-700 leading-tight">{log.action}</p>
                                {log.details && (
                                  <p className="text-[11px] text-slate-500 font-medium">{log.details}</p>
                                )}
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
                      );
                    })}
                  </div>
                  {auditLogs.length === 0 && !isLoading && (
                    <div className="p-16 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <Terminal className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">No logs found</h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Try adjusting your filters or search query.</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            {/* Pagination */}
            {auditLogsPagination && auditLogsPagination.pages > 1 && (
              <div className="border-t border-slate-100 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold uppercase tracking-wider">Page</span>
                  <span className="font-bold text-slate-900">{auditLogsPagination.page}</span>
                  <span className="text-slate-400">of</span>
                  <span className="font-bold text-slate-900">{auditLogsPagination.pages}</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-bold uppercase tracking-wider">Total</span>
                  <span className="font-bold text-slate-900">{auditLogsPagination.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-md border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-md border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                    onClick={() => setPage(p => Math.min(auditLogsPagination.pages, p + 1))}
                    disabled={page === auditLogsPagination.pages || isLoading}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
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
                    <span className="font-bold text-sm text-slate-900">{auditLogsPagination?.total ?? auditLogs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Security Alerts</span>
                    <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 font-bold text-[9px] uppercase tracking-wider px-1.5 py-0 rounded-md">
                      {securityAlertCount}
                    </Badge>
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

          {/* Clear Logs */}
          <motion.div variants={item}>
            <Card className="border border-rose-200 shadow-sm bg-rose-50 rounded-lg overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-md bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight text-slate-900">Clear Logs</h3>
                    <p className="text-[9px] font-bold text-rose-500/70 uppercase tracking-wider">Delete old logs</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      type="date"
                      value={clearBeforeDate}
                      onChange={(e) => setClearBeforeDate(e.target.value)}
                      className="w-full bg-white border-rose-200 focus-visible:ring-rose-500/20 h-9 rounded-md text-xs"
                    />
                  </div>
                  <Button
                    onClick={handleClearLogs}
                    disabled={!clearBeforeDate || isLoading}
                    className="w-full h-9 rounded-md bg-rose-600 hover:bg-rose-700 font-bold text-[10px] uppercase tracking-wider shadow-sm active:scale-95 transition-all disabled:opacity-50"
                  >
                    Clear Logs Before Date
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
