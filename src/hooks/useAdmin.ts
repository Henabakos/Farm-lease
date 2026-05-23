import { useState, useCallback, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { toast } from 'sonner';
import { mapAuditLogFromApi } from '../lib/apiMappers';

function unwrapItems<T = unknown>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as any).data)) {
    return (payload as any).data as T[];
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as any).items)) {
    return (payload as any).items as T[];
  }
  return [];
}

export const useAdmin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsPagination, setAuditLogsPagination] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllUsers = useCallback(async (filters?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminAPI.getAllUsers(filters);
      setUsers(unwrapItems(response.data));
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserStatus = useCallback(async (id: string, status: string, reason?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminAPI.updateUserStatus(id, status, reason);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...response.data } : u));
      toast.success('User status updated successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update user status';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveUser = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminAPI.approveUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...response.data } : u));
      toast.success('User approved successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to approve user';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserVerification = useCallback(async (id: string, verificationStatus: string, reason?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminAPI.updateUserVerification(id, verificationStatus, reason);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...response.data } : u));
      toast.success('User verification updated successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update user verification';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserRole = useCallback(async (id: string, role: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminAPI.updateUserRole(id, role);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...response.data } : u));
      toast.success('User role updated successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update user role';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsuspendUser = useCallback(async (id: string, reason?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminAPI.unsuspendUser(id, reason);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...response.data } : u));
      toast.success('User unsuspended successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to unsuspend user';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async (filters?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminAPI.getAuditLogs(filters);
      const items = unwrapItems(response.data);
      setAuditLogs(items.map(mapAuditLogFromApi));
      setAuditLogsPagination(response.data?.pagination || null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch audit logs';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportAuditLogsCsv = useCallback(async (filters?: any) => {
    try {
      const response = await adminAPI.exportAuditLogs(filters);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Audit logs exported successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to export audit logs';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const clearAuditLogs = useCallback(async (beforeDate: string) => {
    try {
      const response = await adminAPI.clearAuditLogs(beforeDate);
      toast.success(`Cleared ${response.data.deleted} audit logs`);
      // Refresh the audit logs
      fetchAuditLogs({ page: 1, limit: 10 });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to clear audit logs';
      toast.error(errorMessage);
      throw err;
    }
  }, [fetchAuditLogs]);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch stats';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllUsers();
    fetchStats();
  }, [fetchAllUsers, fetchStats]);

  return {
    users,
    auditLogs,
    auditLogsPagination,
    stats,
    isLoading,
    error,
    fetchAllUsers,
    updateUserStatus,
    approveUser,
    updateUserVerification,
    updateUserRole,
    unsuspendUser,
    fetchAuditLogs,
    exportAuditLogsCsv,
    clearAuditLogs,
    fetchStats,
  };
};
