import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired, clear it
      setAccessToken(null);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; fullName: string; role: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
  getCurrentUser: () => api.get('/auth/me')
};

// Users API
export const usersAPI = {
  getProfile: (id: string) => api.get(`/users/${id}`),
  updateProfile: (id: string, data: any) => api.put(`/users/${id}`, data),
  searchUsers: (query?: string, role?: string) =>
    api.get('/users', { params: { q: query, role } }),
  verifyUser: (id: string) => api.post(`/users/${id}/verify`)
};

// Clusters API
export const clustersAPI = {
  getAll: (filters?: any) => api.get('/clusters', { params: filters }),
  getById: (id: string) => api.get(`/clusters/${id}`),
  create: (data: any) => api.post('/clusters', data),
  update: (id: string, data: any) => api.put(`/clusters/${id}`, data),
  delete: (id: string) => api.delete(`/clusters/${id}`)
};

// Proposals API
export const proposalsAPI = {
  getAll: (filters?: any) => api.get('/proposals', { params: filters }),
  getById: (id: string) => api.get(`/proposals/${id}`),
  create: (data: any) => api.post('/proposals', data),
  update: (id: string, data: any) => api.put(`/proposals/${id}`, data),
  accept: (id: string) => api.post(`/proposals/${id}/accept`),
  reject: (id: string, reason?: string) =>
    api.post(`/proposals/${id}/reject`, { reason })
};

// Agreements API
export const agreementsAPI = {
  getAll: (filters?: any) => api.get('/agreements', { params: filters }),
  getById: (id: string) => api.get(`/agreements/${id}`),
  create: (data: any) => api.post('/agreements', data),
  update: (id: string, data: any) => api.put(`/agreements/${id}`, data),
  terminate: (id: string, reason?: string) =>
    api.post(`/agreements/${id}/terminate`, { reason })
};

// Payments API
export const paymentsAPI = {
  getAll: (filters?: any) => api.get('/payments', { params: filters }),
  getById: (id: string) => api.get(`/payments/${id}`),
  create: (data: any) => api.post('/payments', data),
  process: (id: string, transactionId: string) =>
    api.post(`/payments/${id}/process`, { transactionId }),
  refund: (id: string, reason?: string) =>
    api.post(`/payments/${id}/refund`, { reason })
};

// Messages API
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId: string, limit?: number, offset?: number) =>
    api.get(`/messages/conversation/${conversationId}`, {
      params: { limit, offset }
    }),
  getOrCreateConversation: (data: any) =>
    api.post('/messages/conversation', data),
  sendMessage: (data: any) => api.post('/messages', data),
  markAsRead: (id: string) => api.put(`/messages/${id}/read`),
  markAllAsRead: (conversationId: string) =>
    api.put(`/messages/conversation/${conversationId}/read-all`)
};

// Notifications API
export const notificationsAPI = {
  getAll: (filters?: any) => api.get('/notifications', { params: filters }),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  getById: (id: string) => api.get(`/notifications/${id}`),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all/bulk'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  deleteAllRead: () => api.delete('/notifications/read/all')
};

// Meetings API
export const meetingsAPI = {
  getAll: (filters?: any) => api.get('/meetings', { params: filters }),
  getById: (id: string) => api.get(`/meetings/${id}`),
  schedule: (data: any) => api.post('/meetings', data),
  update: (id: string, data: any) => api.put(`/meetings/${id}`, data),
  start: (id: string) => api.post(`/meetings/${id}/start`),
  end: (id: string, notes?: string) => api.post(`/meetings/${id}/end`, { notes }),
  cancel: (id: string, reason?: string) =>
    api.post(`/meetings/${id}/cancel`, { reason })
};

// Analytics API
export const analyticsAPI = {
  logEvent: (data: any) => api.post('/analytics/events', data),
  getDashboard: () => api.get('/analytics/dashboard'),
  getRevenue: (months?: number) =>
    api.get('/analytics/revenue', { params: { months } }),
  getPaymentStats: () => api.get('/analytics/payments'),
  getClusterStats: (clusterId: string) =>
    api.get(`/analytics/clusters/${clusterId}`)
};

// Admin API
export const adminAPI = {
  getAllUsers: (filters?: any) => api.get('/admin/users', { params: filters }),
  getUserDetails: (id: string) => api.get(`/admin/users/${id}`),
  updateUserRole: (id: string, role: string) =>
    api.put(`/admin/users/${id}/role`, { role }),
  deactivateUser: (id: string, reason?: string) =>
    api.post(`/admin/users/${id}/deactivate`, { reason }),
  getAuditLogs: (filters?: any) => api.get('/admin/audit-logs', { params: filters }),
  getStats: () => api.get('/admin/stats'),
  getOverview: () => api.get('/admin/overview')
};
