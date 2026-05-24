import { useState, useCallback, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { toast } from 'sonner';

export const useAnalytics = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [usersByRole, setUsersByRole] = useState<any[]>([]);
  const [proposalsByStatus, setProposalsByStatus] = useState<any[]>([]);
  const [topClusters, setTopClusters] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analyticsAPI.getDashboard();
      setDashboardData(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRevenue = useCallback(async (months?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analyticsAPI.getRevenue(months);
      setRevenueData(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch revenue data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUsersByRole = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analyticsAPI.getUsersByRole();
      setUsersByRole(response.data || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch users by role';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProposalsByStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analyticsAPI.getProposalsByStatus();
      setProposalsByStatus(response.data || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch proposals by status';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTopClusters = useCallback(async (limit?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analyticsAPI.getTopClusters(limit);
      setTopClusters(response.data || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch top clusters';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchActivity = useCallback(async (limit?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analyticsAPI.getActivity(limit);
      setActivityFeed(response.data || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch activity feed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchRevenue(12);
    fetchUsersByRole();
    fetchProposalsByStatus();
    fetchTopClusters(5);
    fetchActivity(10);
  }, [fetchDashboard, fetchRevenue, fetchUsersByRole, fetchProposalsByStatus, fetchTopClusters, fetchActivity]);

  return {
    dashboardData,
    revenueData,
    usersByRole,
    proposalsByStatus,
    topClusters,
    activityFeed,
    isLoading,
    error,
    fetchDashboard,
    fetchRevenue,
    fetchUsersByRole,
    fetchProposalsByStatus,
    fetchTopClusters,
    fetchActivity,
  };
};
