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
  status: 'draft' | 'published' | 'negotiating' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
  version?: number;
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

export interface NegotiationEntry {
  id: string;
  proposal_id: string;
  initiator_id: string;
  initiator_name?: string | null;
  initiator_role?: string | null;
  proposed_amount: number;
  proposed_terms: Record<string, any>;
  message?: string | null;
  status: 'OPEN' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  created_at: string;
  updated_at: string;
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

  const getNegotiations = useCallback(async (id: string): Promise<NegotiationEntry[]> => {
    const response = await proposalsAPI.getNegotiations(id);
    return Array.isArray(response.data) ? (response.data as NegotiationEntry[]) : [];
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

  const updateProposal = useCallback(async (id: string, data: any, expectedVersion?: number): Promise<ProposalDto> => {
    const response = await proposalsAPI.update(id, data, expectedVersion);
    const updated = response.data as ProposalDto;
    setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
    toast.success('Proposal updated');
    return updated;
  }, []);

  const publishProposal = useCallback(async (id: string, expectedVersion?: number): Promise<ProposalDto> => {
    try {
      const response = await proposalsAPI.publish(id, expectedVersion);
      const updated = response.data as ProposalDto;
      setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success('Proposal submitted');
      return updated;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to publish');
      throw err;
    }
  }, []);

  const reviewProposal = useCallback(async (id: string, expectedVersion?: number): Promise<ProposalDto> => {
    try {
      const response = await proposalsAPI.review(id, expectedVersion);
      const updated = response.data as ProposalDto;
      setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success('Proposal reviewed');
      return updated;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to review proposal');
      throw err;
    }
  }, []);

  const acceptProposal = useCallback(async (id: string, expectedVersion?: number): Promise<ProposalDto> => {
    try {
      const response = await proposalsAPI.accept(id, expectedVersion);
      const updated = response.data as ProposalDto;
      setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success('Proposal accepted');
      return updated;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to accept proposal');
      throw err;
    }
  }, []);

  const rejectProposal = useCallback(async (id: string, reason?: string, expectedVersion?: number): Promise<ProposalDto> => {
    try {
      const response = await proposalsAPI.reject(id, reason, expectedVersion);
      const updated = response.data as ProposalDto;
      setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success('Proposal rejected');
      return updated;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reject proposal');
      throw err;
    }
  }, []);

  const withdrawProposal = useCallback(async (id: string, reason?: string, expectedVersion?: number): Promise<ProposalDto> => {
    try {
      const response = await proposalsAPI.withdraw(id, reason, expectedVersion);
      const updated = response.data as ProposalDto;
      setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success('Proposal withdrawn');
      return updated;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to withdraw proposal');
      throw err;
    }
  }, []);

  const negotiateProposal = useCallback(
    async (id: string, data: { proposedAmount?: number; proposedTerms?: any; message?: string }, expectedVersion?: number): Promise<ProposalDto> => {
      try {
        const response = await proposalsAPI.negotiate(id, { ...data, expectedVersion });
        toast.success('Counter-offer sent');
        // Refresh the proposal so its status becomes 'negotiating'.
        const refreshed = await proposalsAPI.getById(id);
        setProposals((prev) => prev.map((p) => (p.id === id ? (refreshed.data as ProposalDto) : p)));
        return refreshed.data as ProposalDto;
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
    getNegotiations,
    createProposal,
    updateProposal,
    publishProposal,
    reviewProposal,
    acceptProposal,
    rejectProposal,
    withdrawProposal,
    negotiateProposal,
  };
};
