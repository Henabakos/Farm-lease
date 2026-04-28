import { useState, useCallback, useEffect } from 'react';
import { paymentsAPI } from '../services/api';
import { toast } from 'sonner';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (filters?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await paymentsAPI.getAll(filters);
      setPayments(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch payments';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
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
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create payment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processPayment = useCallback(async (id: string, transactionId: string) => {
    try {
      setIsLoading(true);
      const response = await paymentsAPI.process(id, transactionId);
      setPayments(prev => prev.map(p => p.id === id ? response.data : p));
      toast.success('Payment processed successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to process payment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refundPayment = useCallback(async (id: string, reason?: string) => {
    try {
      setIsLoading(true);
      const response = await paymentsAPI.refund(id, reason);
      setPayments(prev => prev.map(p => p.id === id ? response.data : p));
      toast.success('Payment refunded successfully');
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to refund payment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    isLoading,
    error,
    fetchPayments,
    getPayment,
    createPayment,
    processPayment,
    refundPayment
  };
};
