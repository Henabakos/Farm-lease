// ============================================================================
// Analytics API service (admin only)
// ============================================================================
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface DashboardStats {
  users: {
    total: number;
  };
  clusters: {
    total: number;
  };
  proposals: {
    total: number;
    active: number;
  };
  agreements: {
    total: number;
    active: number;
  };
  payments: {
    total: number;
    totalVolume: number;
  };
}

export interface UserStatsByRole {
  role: string;
  count: number;
}

export interface ProposalStatsByStatus {
  status: string;
  count: number;
}

export interface PaymentStatsByMonth {
  month: string;
  disbursement: number;
  repayment: number;
  fee: number;
}

export interface TopCluster {
  id: string;
  name: string;
  location: string;
  proposalCount: number;
  owner: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface ActivityItem {
  type: 'PROPOSAL' | 'AGREEMENT';
  id: string;
  title: string;
  actor?: string;
  actorId?: string;
  status: string;
  createdAt: string;
}

class AnalyticsAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  }

  async getUserStatsByRole(): Promise<UserStatsByRole[]> {
    const res = await fetch(`${API_BASE}/analytics/users/by-role`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user stats');
    return res.json();
  }

  async getProposalStatsByStatus(): Promise<ProposalStatsByStatus[]> {
    const res = await fetch(`${API_BASE}/analytics/proposals/by-status`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch proposal stats');
    return res.json();
  }

  async getPaymentStatsByMonth(months: number = 12): Promise<PaymentStatsByMonth[]> {
    const res = await fetch(`${API_BASE}/analytics/payments/by-month?months=${months}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch payment stats');
    return res.json();
  }

  async getTopClusters(limit: number = 10): Promise<TopCluster[]> {
    const res = await fetch(`${API_BASE}/analytics/clusters/top?limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch top clusters');
    return res.json();
  }

  async getActivityFeed(limit: number = 20): Promise<ActivityItem[]> {
    const res = await fetch(`${API_BASE}/analytics/activity?limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch activity feed');
    return res.json();
  }
}

export const analyticsAPI = new AnalyticsAPI();
