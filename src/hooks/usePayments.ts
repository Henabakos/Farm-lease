import { useState, useCallback, useEffect } from 'react';
import { paymentsAPI } from '../services/api';
import { toast } from 'sonner';

export interface ReceiptSubmissionPayload {
  storage_key: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  perceptual_hash?: string;
  extracted_fields?: Record<string, unknown>;
}

export interface PaymentStats {
  total_payments: number;
  total_volume: number;
  total_disbursed: number;
  total_repaid: number;
  pending_count: number;
  submitted_count: number;
  verified_count: number;
  rejected_count: number;
  refunded_count: number;
  pending_amount: number;
  submitted_amount: number;
  verified_amount: number;
  is_admin: boolean;
}

export interface Payment {
  id: string;
  agreement_id: string;
  payer_id: string;
  receiver_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (filters?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await paymentsAPI.getAll(filters);
      const body = response.data as
        | Payment[]
        | { data?: Payment[]; items?: Payment[] }
        | undefined;
      const rows: Payment[] = Array.isArray(body)
        ? body
        : Array.isArray(body?.data)
          ? body!.data!
          : Array.isArray(body?.items)
            ? body!.items!
            : [];
      setPayments(rows);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch payments';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await paymentsAPI.getStats();
      setStats(response.data as PaymentStats);
    } catch {
      // stats are non-critical, fail silently
    }
  }, []);

  const getPayment = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await paymentsAPI.getById(id);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch payment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPayment = useCallback(async (data: any) => {
    try {
      setIsLoading(true);
      const response = await paymentsAPI.create(data);
      setPayments(prev => [response.data, ...prev]);
      toast.success('Payment created successfully');
      fetchStats();
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create payment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStats]);

  const processPayment = useCallback(async (id: string, receipt: string | ReceiptSubmissionPayload) => {
    try {
      setIsLoading(true);
      const response = await paymentsAPI.process(id, receipt);
      setPayments(prev => prev.map(p => p.id === id ? response.data : p));
      toast.success('Payment processed successfully');
      fetchStats();
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to process payment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStats]);

  const refundPayment = useCallback(async (id: string, reason?: string) => {
    try {
      setIsLoading(true);
      const response = await paymentsAPI.refund(id, reason);
      setPayments(prev => prev.map(p => p.id === id ? response.data : p));
      toast.success('Payment refunded successfully');
      fetchStats();
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to refund payment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStats]);

  const verifyPayment = useCallback(async (id: string, data: { decision?: 'APPROVED' | 'REJECTED' | 'ESCALATED'; reviewer_notes?: string }) => {
    try {
      setIsLoading(true);
      const response = await paymentsAPI.verify(id, data);
      setPayments(prev => prev.map(p => p.id === id ? response.data : p));
      toast.success(data.decision === 'REJECTED' ? 'Payment rejected' : 'Payment verified successfully');
      fetchStats();
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to verify payment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchStats]);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [fetchPayments, fetchStats]);

  return {
    payments,
    stats,
    isLoading,
    error,
    fetchPayments,
    fetchStats,
    getPayment,
    createPayment,
    processPayment,
    refundPayment,
    verifyPayment
  };
};
