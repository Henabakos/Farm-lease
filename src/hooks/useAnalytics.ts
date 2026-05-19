import { useState, useCallback, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { toast } from 'sonner';

export const useAnalytics = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [paymentStats, setPaymentStats] = useState<any>(null);
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

  const fetchPaymentStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analyticsAPI.getPaymentStats();
      setPaymentStats(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch payment stats';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchClusterStats = useCallback(async (clusterId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analyticsAPI.getClusterStats(clusterId);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch cluster stats';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logEvent = useCallback(async (data: any) => {
    try {
      await analyticsAPI.logEvent(data);
    } catch (err: any) {
      console.error('Failed to log event:', err);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboardData,
    revenueData,
    paymentStats,
    isLoading,
    error,
    fetchDashboard,
    fetchRevenue,
    fetchPaymentStats,
    fetchClusterStats,
    logEvent
  };
};
