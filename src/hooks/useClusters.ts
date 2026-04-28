import { useState, useCallback, useEffect } from 'react';
import { clustersAPI } from '../services/api';
import { toast } from 'sonner';

export interface Cluster {
  id: string;
  owner_id: string;
  name: string;
  location: string;
  area_hectares?: number;
  description?: string;
  image_url?: string;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}

export const useClusters = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClusters = useCallback(async (filters?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await clustersAPI.getAll(filters);
      setClusters(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch clusters';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCluster = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await clustersAPI.getById(id);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch cluster';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCluster = useCallback(async (data: any) => {
    try {
      setIsLoading(true);
      const response = await clustersAPI.create(data);
      setClusters(prev => [response.data, ...prev]);
      toast.success('Cluster created successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create cluster';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCluster = useCallback(async (id: string, data: any) => {
    try {
      setIsLoading(true);
      const response = await clustersAPI.update(id, data);
      setClusters(prev => prev.map(c => c.id === id ? response.data : c));
      toast.success('Cluster updated successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update cluster';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteCluster = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await clustersAPI.delete(id);
      setClusters(prev => prev.filter(c => c.id !== id));
      toast.success('Cluster deleted successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete cluster';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  return {
    clusters,
    isLoading,
    error,
    fetchClusters,
    getCluster,
    createCluster,
    updateCluster,
    deleteCluster
  };
};
