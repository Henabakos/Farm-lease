import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const paymentVerificationService = {
  // Get pending verifications (admin)
  getPendingVerifications: async () => {
    const { data } = await axios.get(`${API_URL}/payment-verification/pending`);
    return data;
  },

  // Get verification details
  getVerification: async (paymentId: string) => {
    const { data } = await axios.get(`${API_URL}/payment-verification/${paymentId}`);
    return data;
  },

  // Upload receipt
  uploadReceipt: async (paymentId: string, formData: FormData) => {
    const { data } = await axios.post(
      `${API_URL}/payment-verification/${paymentId}/receipts`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  // Get receipts
  getReceipts: async (paymentId: string) => {
    const { data } = await axios.get(`${API_URL}/payment-verification/${paymentId}/receipts`);
    return data;
  },

  // Delete receipt
  deleteReceipt: async (receiptId: string) => {
    const { data } = await axios.delete(`${API_URL}/payment-verification/receipts/${receiptId}`);
    return data;
  },

  // Verify payment (admin)
  verifyPayment: async (paymentId: string, details: {
    verifiedAmount: number;
    notes: string;
    status: 'verified' | 'rejected' | 'disputed';
  }) => {
    const { data } = await axios.post(
      `${API_URL}/payment-verification/${paymentId}/verify`,
      details
    );
    return data;
  },

  // Get verification stats
  getVerificationStats: async () => {
    const { data } = await axios.get(`${API_URL}/payment-verification/stats/summary`);
    return data;
  }
};
