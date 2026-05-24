import { useState, useCallback, useEffect } from 'react';
import { clustersAPI } from '../services/api';
import { toast } from 'sonner';

// Server DTO shape (snake_case). The frontend `Cluster` UI type comes from
// `@/src/types`; map between them with `mapClusterFromApi` from `apiMappers`.
export interface ClusterDto {
  id: string;
  owner_id: string;
  name: string;
  location: string;
  region: string | null;
  area_hectares: number | null;
  description: string | null;
  image_url: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  center_latitude: number | null;
  center_longitude: number | null;
  has_verified_survey: boolean;
  members_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function unwrap<T = unknown>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as any).data)) {
    return (payload as any).data as T[];
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as any).items)) {
    return (payload as any).items as T[];
  }
  return [];
}

export const useClusters = () => {
  const [clusters, setClusters] = useState<ClusterDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClusters = useCallback(async (filters?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await clustersAPI.getAll(filters);
      setClusters(unwrap<ClusterDto>(response.data));
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
      setClusters(prev => [response.data as ClusterDto, ...prev]);
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
      setClusters(prev => prev.map(c => c.id === id ? (response.data as ClusterDto) : c));
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

  const listMembers = useCallback(async (id: string) => {
    try {
      const response = await clustersAPI.listMembers(id);
      return Array.isArray(response.data) ? response.data : [];
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to load members';
      toast.error(errorMessage);
      return [];
    }
  }, []);

  const assignRepresentative = useCallback(async (id: string, userId: string) => {
    try {
      const response = await clustersAPI.assignRepresentative(id, userId);
      const updated = response.data as ClusterDto;
      setClusters(prev => prev.map(c => c.id === id ? updated : c));
      toast.success('Cluster representative assigned');
      return updated;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to assign representative');
      throw err;
    }
  }, []);

  const removeMember = useCallback(async (id: string, userId: string) => {
    try {
      await clustersAPI.removeMember(id, userId);
      toast.success('Member removed');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
      throw err;
    }
  }, []);

  const joinCluster = useCallback(async (id: string) => {
    try {
      const response = await clustersAPI.join(id);
      toast.success('Joined cluster');
      return response.data;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to join cluster');
      throw err;
    }
  }, []);

  const verifyCluster = useCallback(async (id: string) => {
    try {
      const response = await clustersAPI.verify(id);
      const updated = response.data as ClusterDto;
      setClusters(prev => prev.map(c => c.id === id ? updated : c));
      toast.success('Cluster verified');
      return updated;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to verify cluster');
      throw err;
    }
  }, []);

  const unverifyCluster = useCallback(async (id: string) => {
    try {
      const response = await clustersAPI.unverify(id);
      const updated = response.data as ClusterDto;
      setClusters(prev => prev.map(c => c.id === id ? updated : c));
      toast.success('Cluster verification removed');
      return updated;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to unverify cluster');
      throw err;
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
    deleteCluster,
    listMembers,
    assignRepresentative,
    removeMember,
    joinCluster,
    verifyCluster,
    unverifyCluster,
  };
};
