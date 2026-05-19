import { useState, useCallback, useEffect } from 'react';
import { proposalsAPI } from '../services/api';
import { toast } from 'sonner';

// Raw server proposal DTO (see server/modules/proposals/proposals.service.js#toDto).
export interface ProposalDto {
  id: string;
  title: string;
  description: string;
  investor_id: string;
  target_type: 'CLUSTER' | 'FARMER';
  cluster_id?: string | null;
  target_user_id?: string | null;
  cluster_name?: string | null;
  target_user_name?: string | null;
  proposed_price: number;
  currency: string;
  lease_term_months?: number | null;
  roi?: number | null;
  location?: string | null;
  terms: Record<string, any>;
  status: 'draft' | 'published' | 'negotiating' | 'accepted' | 'rejected' | 'expired';
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProposalHistoryEntry {
  id: string;
  actor_id: string;
  action: string;
  details: any;
  created_at: string;
}

function unwrap<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.data)) return data.data as T[];
  if (Array.isArray(data?.items)) return data.items as T[];
  return [];
}

export const useProposals = () => {
  const [proposals, setProposals] = useState<ProposalDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = useCallback(async (filters?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await proposalsAPI.getAll(filters);
      setProposals(unwrap<ProposalDto>(response.data));
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch proposals';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getProposal = useCallback(async (id: string): Promise<ProposalDto> => {
    const response = await proposalsAPI.getById(id);
    return response.data as ProposalDto;
  }, []);

  const getHistory = useCallback(async (id: string): Promise<ProposalHistoryEntry[]> => {
    const response = await proposalsAPI.getHistory(id);
    return Array.isArray(response.data) ? (response.data as ProposalHistoryEntry[]) : [];
  }, []);

  const createProposal = useCallback(async (data: any): Promise<ProposalDto> => {
    try {
      setIsLoading(true);
      const response = await proposalsAPI.create(data);
      const created = response.data as ProposalDto;
      setProposals((prev) => [created, ...prev]);
      toast.success('Proposal created');
      return created;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create proposal';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProposal = useCallback(async (id: string, data: any): Promise<ProposalDto> => {
    const response = await proposalsAPI.update(id, data);
    const updated = response.data as ProposalDto;
    setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
    toast.success('Proposal updated');
    return updated;
  }, []);

  const publishProposal = useCallback(async (id: string): Promise<ProposalDto> => {
    try {
      const response = await proposalsAPI.publish(id);
      const updated = response.data as ProposalDto;
      setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success('Proposal published');
      return updated;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to publish');
      throw err;
    }
  }, []);

  const acceptProposal = useCallback(async (id: string): Promise<ProposalDto> => {
    try {
      const response = await proposalsAPI.accept(id);
      const updated = response.data as ProposalDto;
      setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success('Proposal accepted');
      return updated;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to accept proposal');
      throw err;
    }
  }, []);

  const rejectProposal = useCallback(async (id: string, reason?: string): Promise<ProposalDto> => {
    try {
      const response = await proposalsAPI.reject(id, reason);
      const updated = response.data as ProposalDto;
      setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success('Proposal rejected');
      return updated;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reject proposal');
      throw err;
    }
  }, []);

  const negotiateProposal = useCallback(
    async (id: string, data: { proposedAmount: number; proposedTerms?: any; message?: string }) => {
      try {
        const response = await proposalsAPI.negotiate(id, data);
        toast.success('Counter-offer sent');
        // Refresh the proposal so its status becomes 'negotiating'.
        const refreshed = await proposalsAPI.getById(id);
        setProposals((prev) => prev.map((p) => (p.id === id ? (refreshed.data as ProposalDto) : p)));
        return response.data;
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to send counter-offer');
        throw err;
      }
    },
    [],
  );

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return {
    proposals,
    isLoading,
    error,
    fetchProposals,
    getProposal,
    getHistory,
    createProposal,
    updateProposal,
    publishProposal,
    acceptProposal,
    rejectProposal,
    negotiateProposal,
  };
};
