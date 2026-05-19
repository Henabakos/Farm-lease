// ============================================================================
// Admin API service
// ============================================================================
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface SystemStats {
  users: {
    total: number;
    pending: number;
    suspended: number;
  };
  clusters: number;
  proposals: number;
  agreements: number;
  payments: number;
  recentActivity: AuditLog[];
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  verificationStatus: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  user: {
    id: string;
    email: string;
    fullName: string;
  } | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  changes: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class AdminAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getSystemStats(): Promise<SystemStats> {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch system stats');
    return res.json();
  }

  async listUsers(filters: { status?: string; role?: string; page?: number; limit?: number } = {}): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.role) params.append('role', filters.role);
    params.append('page', String(filters.page || 1));
    params.append('limit', String(filters.limit || 20));

    const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  }

  async updateUserStatus(userId: string, status: string, reason?: string): Promise<User> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status, reason }),
    });
    if (!res.ok) throw new Error('Failed to update user status');
    return res.json();
  }

  async approveUser(userId: string): Promise<User> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/approve`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to approve user');
    return res.json();
  }

  async listAuditLogs(filters: { userId?: string; action?: string; entityType?: string; page?: number; limit?: number } = {}): Promise<PaginatedResponse<AuditLog>> {
    const params = new URLSearchParams();
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.action) params.append('action', filters.action);
    if (filters.entityType) params.append('entityType', filters.entityType);
    params.append('page', String(filters.page || 1));
    params.append('limit', String(filters.limit || 50));

    const res = await fetch(`${API_BASE}/admin/audit-logs?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  }
}

export const adminAPI = new AdminAPI();
