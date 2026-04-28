import { useState, useCallback, useEffect } from 'react';
import { proposalsAPI } from '../services/api';
import { toast } from 'sonner';

export interface Proposal {
  id: string;
  cluster_id: string;
  owner_id: string;
  tenant_id?: string;
  title: string;
  description?: string;
  lease_term_months?: number;
  proposed_price?: number;
  currency: string;
  status: 'draft' | 'published' | 'negotiating' | 'accepted' | 'rejected' | 'expired';
  terms?: any;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export const useProposals = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = useCallback(async (filters?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await proposalsAPI.getAll(filters);
      setProposals(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch proposals';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getProposal = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await proposalsAPI.getById(id);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch proposal';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProposal = useCallback(async (data: any) => {
    try {
      setIsLoading(true);
      const response = await proposalsAPI.create(data);
      setProposals(prev => [response.data, ...prev]);
      toast.success('Proposal created successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create proposal';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProposal = useCallback(async (id: string, data: any) => {
    try {
      setIsLoading(true);
      const response = await proposalsAPI.update(id, data);
      setProposals(prev => prev.map(p => p.id === id ? response.data : p));
      toast.success('Proposal updated successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update proposal';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acceptProposal = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await proposalsAPI.accept(id);
      setProposals(prev => prev.map(p => p.id === id ? response.data : p));
      toast.success('Proposal accepted successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to accept proposal';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rejectProposal = useCallback(async (id: string, reason?: string) => {
    try {
      setIsLoading(true);
      const response = await proposalsAPI.reject(id, reason);
      setProposals(prev => prev.map(p => p.id === id ? response.data : p));
      toast.success('Proposal rejected');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to reject proposal';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return {
    proposals,
    isLoading,
    error,
    fetchProposals,
    getProposal,
    createProposal,
    updateProposal,
    acceptProposal,
    rejectProposal
  };
};
