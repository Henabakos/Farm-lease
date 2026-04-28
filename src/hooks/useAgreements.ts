import { useState, useCallback, useEffect } from 'react';
import { agreementsAPI } from '../services/api';
import { toast } from 'sonner';

export interface Agreement {
  id: string;
  proposal_id: string;
  cluster_id: string;
  owner_id: string;
  tenant_id: string;
  status: 'draft' | 'active' | 'completed' | 'terminated' | 'disputed';
  start_date: string;
  end_date: string;
  monthly_amount: number;
  total_amount: number;
  payment_frequency: string;
  terms?: any;
  document_url?: string;
  signed_at?: string;
  created_at: string;
  updated_at: string;
}

export const useAgreements = () => {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgreements = useCallback(async (filters?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await agreementsAPI.getAll(filters);
      setAgreements(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch agreements';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAgreement = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await agreementsAPI.getById(id);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch agreement';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAgreement = useCallback(async (data: any) => {
    try {
      setIsLoading(true);
      const response = await agreementsAPI.create(data);
      setAgreements(prev => [response.data, ...prev]);
      toast.success('Agreement created successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create agreement';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAgreement = useCallback(async (id: string, data: any) => {
    try {
      setIsLoading(true);
      const response = await agreementsAPI.update(id, data);
      setAgreements(prev => prev.map(a => a.id === id ? response.data : a));
      toast.success('Agreement updated successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update agreement';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const terminateAgreement = useCallback(async (id: string, reason?: string) => {
    try {
      setIsLoading(true);
      const response = await agreementsAPI.terminate(id, reason);
      setAgreements(prev => prev.map(a => a.id === id ? response.data : a));
      toast.success('Agreement terminated');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to terminate agreement';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  return {
    agreements,
    isLoading,
    error,
    fetchAgreements,
    getAgreement,
    createAgreement,
    updateAgreement,
    terminateAgreement
  };
};
