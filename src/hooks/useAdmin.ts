import { useState, useCallback, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { toast } from 'sonner';

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

  const updateUserActivation = useCallback(async (id: string, activate: boolean) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminAPI.updateUserActivation(id, activate);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...response.data } : u));
      toast.success(`User ${activate ? 'activated' : 'deactivated'} successfully`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update user activation';
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
      setAuditLogs(unwrapItems(response.data));
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch audit logs';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    stats,
    isLoading,
    error,
    fetchAllUsers,
    updateUserStatus,
    approveUser,
    updateUserVerification,
    updateUserRole,
    updateUserActivation,
    fetchAuditLogs,
    fetchStats,
  };
};
