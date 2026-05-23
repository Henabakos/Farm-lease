import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export const getAccessToken = () => accessToken;

export const setRefreshToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('refreshToken', token);
  } else {
    localStorage.removeItem('refreshToken');
  }
};

export const getRefreshToken = () => localStorage.getItem('refreshToken');

/**
 * Dispatched when the refresh-token flow has hard-failed and the user must
 * re-authenticate. AuthContext listens for this and clears its in-memory user
 * so the app falls back to the unauthenticated landing/login view.
 */
export const AUTH_LOGOUT_EVENT = 'auth:logout';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach access token to every outgoing request.
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// 401 handling: single-flight refresh + retry
// ---------------------------------------------------------------------------
// Multiple in-flight requests can get 401 simultaneously. We share a single
// refresh promise so we hit /auth/refresh exactly once, then replay all the
// queued originals with the new token.
let refreshInFlight: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    // Use a bare axios call so we don't recurse through this interceptor.
    const res = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const { access_token, refresh_token } = res.data || {};
    if (!access_token) return null;
    setAccessToken(access_token);
    if (refresh_token) setRefreshToken(refresh_token);
    return access_token;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    // Never try to refresh against the auth endpoints themselves.
    const url = original?.url || '';
    const isAuthCall =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout');

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      if (!refreshInFlight) {
        refreshInFlight = performRefresh().finally(() => {
          refreshInFlight = null;
        });
      }
      const newToken = await refreshInFlight;
      if (newToken) {
        original.headers = original.headers || {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      // Refresh failed — wipe tokens and signal the app to log out gracefully.
      setAccessToken(null);
      setRefreshToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
      }
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
  logout: (refreshToken?: string) =>
    api.post('/auth/logout', refreshToken ? { refresh_token: refreshToken } : {}),
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
  delete: (id: string) => api.delete(`/clusters/${id}`),
  join: (id: string) => api.post(`/clusters/${id}/join`),
  leave: (id: string) => api.post(`/clusters/${id}/leave`),
  listMembers: (id: string) => api.get(`/clusters/${id}/members`),
  removeMember: (id: string, memberId: string) =>
    api.delete(`/clusters/${id}/members/${memberId}`),
  inviteMember: (id: string, email: string, role?: string) =>
    api.post(`/clusters/${id}/members/invite`, { email, role }),
  updateMemberRole: (id: string, userId: string, role: string) =>
    api.patch(`/clusters/${id}/members/${userId}/role`, { role }),
  verify: (id: string) => api.post(`/clusters/${id}/verify`)
};

// Plots API
export const plotsAPI = {
  getClusterPlots: (clusterId: string) => api.get(`/plots/cluster/${clusterId}`),
  create: (data: any) => api.post('/plots', data),
  update: (id: string, data: any) => api.patch(`/plots/${id}`, data),
  delete: (id: string) => api.delete(`/plots/${id}`)
};
export const resourcesAPI = {
  getAll: (filters?: { category?: string; cropType?: string; search?: string }) =>
    api.get('/resources', { params: filters }),
  getById: (id: string) => api.get(`/resources/${id}`),
  create: (data: any) => api.post('/resources', data),
  update: (id: string, data: any) => api.put(`/resources/${id}`, data),
  delete: (id: string) => api.delete(`/resources/${id}`),
};

// Provider Requests API
export const providerRequestsAPI = {
  create: (data: any) => api.post('/provider-requests', data),
  getUserRequests: () => api.get('/provider-requests/user'),
  getAll: (filters?: { status?: string }) => api.get('/provider-requests', { params: filters }),
  getById: (id: string) => api.get(`/provider-requests/${id}`),
  approve: (id: string, reviewNotes?: string) => api.post(`/provider-requests/${id}/approve`, { reviewNotes }),
  reject: (id: string, reviewNotes?: string) => api.post(`/provider-requests/${id}/reject`, { reviewNotes })
};

// Proposals API
export const proposalsAPI = {
  getAll: (filters?: any) => api.get('/proposals', { params: filters }),
  getById: (id: string) => api.get(`/proposals/${id}`),
  getHistory: (id: string) => api.get(`/proposals/${id}/history`),
  create: (data: any) => api.post('/proposals', data),
  update: (id: string, data: any, expectedVersion?: number) =>
    api.put(`/proposals/${id}`, expectedVersion != null ? { ...data, expectedVersion } : data),
  publish: (id: string, expectedVersion?: number) =>
    api.post(`/proposals/${id}/publish`, expectedVersion != null ? { expectedVersion } : {}),
  review: (id: string, expectedVersion?: number) =>
    api.post(`/proposals/${id}/review`, expectedVersion != null ? { expectedVersion } : {}),
  accept: (id: string, expectedVersion?: number) =>
    api.post(`/proposals/${id}/accept`, expectedVersion != null ? { expectedVersion } : {}),
  reject: (id: string, reason?: string, expectedVersion?: number) =>
    api.post(`/proposals/${id}/reject`, expectedVersion != null ? { reason, expectedVersion } : { reason }),
  withdraw: (id: string, reason?: string, expectedVersion?: number) =>
    api.post(`/proposals/${id}/withdraw`, expectedVersion != null ? { reason, expectedVersion } : { reason }),
  getNegotiations: (id: string) => api.get(`/proposals/${id}/negotiations`),
  negotiate: (id: string, data: { proposedAmount?: number; proposedTerms?: any; message?: string; expectedVersion?: number }) =>
    api.post(`/proposals/${id}/negotiate`, data),
  sendNegotiationMessage: (id: string, data: { proposedAmount?: number; proposedTerms?: any; message?: string }) =>
    api.post(`/negotiations/${id}/messages`, data)
};

// Agreements API
export const agreementsAPI = {
  getAll: (filters?: any) => api.get('/agreements', { params: filters }),
  getById: (id: string) => api.get(`/agreements/${id}`),
  create: (data: any) => api.post('/agreements', data),
  update: (id: string, data: any) => api.put(`/agreements/${id}`, data),
  sign: (id: string, data: { method?: 'TYPED' | 'DRAWN'; signature_data?: string }) =>
    api.post(`/agreements/${id}/sign`, data),
  download: (id: string) =>
    api.get(`/agreements/${id}/download`, { responseType: 'blob' }),
  terminate: (id: string, reason?: string) =>
    api.post(`/agreements/${id}/terminate`, { reason })
};

// Payments API
export const paymentsAPI = {
  getAll: (filters?: any) => api.get('/payments', { params: filters }),
  getById: (id: string) => api.get(`/payments/${id}`),
  create: (data: any) => api.post('/payments', data),
  process: (id: string, data: any) =>
    api.post(`/payments/${id}/process`, typeof data === 'string' ? { storage_key: data, file_name: data, mime_type: 'application/pdf', file_size: 1000 } : data),
  verify: (id: string, data: any) =>
    api.post(`/payments/${id}/verify`, data),
  refund: (id: string, reason?: string) =>
    api.post(`/payments/${id}/refund`, { reason })
};

// Messages API
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (conversationId: string, pageSize = 50, page = 1) =>
    api.get(`/messages/conversation/${conversationId}`, {
      params: { page, pageSize }
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
  update: (id: string, data: any) => api.patch(`/meetings/${id}`, data),
  updateStatus: (id: string, status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled') =>
    api.patch(`/meetings/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/meetings/${id}`)
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
  updateUserStatus: (id: string, status: string, reason?: string) =>
    api.patch(`/admin/users/${id}/status`, { status, reason }),
  approveUser: (id: string) => api.post(`/admin/users/${id}/approve`),
  getAuditLogs: (filters?: any) => api.get('/admin/audit-logs', { params: filters }),
  getStats: () => api.get('/admin/stats')
};
