// ============================================================================
// Meetings API service
// ============================================================================
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  provider: 'ZOOM' | 'GOOGLE_MEET' | 'IN_PERSON';
  externalMeetingId: string | null;
  joinUrl: string | null;
  startUrl: string | null;
  scheduledAt: string;
  durationMinutes: number;
  startedAt: string | null;
  endedAt: string | null;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  relatedId: string | null;
  relatedType: string | null;
  notes: string | null;
  hostId: string;
  host: {
    id: string;
    email: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
  provider: 'zoom' | 'google' | 'none';
  attendeeEmails?: string[];
  proposalId?: string;
  agreementId?: string;
}

export interface UpdateMeetingData {
  title?: string;
  description?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export interface ListMeetingsFilters {
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  platform?: 'zoom' | 'google' | 'none';
  proposalId?: string;
  agreementId?: string;
  page?: number;
  limit?: number;
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

class MeetingsAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async createMeeting(data: CreateMeetingData): Promise<Meeting> {
    const res = await fetch(`${API_BASE}/meetings`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create meeting');
    return res.json();
  }

  async getMeeting(id: string): Promise<Meeting> {
    const res = await fetch(`${API_BASE}/meetings/${id}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch meeting');
    return res.json();
  }

  async updateMeeting(id: string, data: UpdateMeetingData): Promise<Meeting> {
    const res = await fetch(`${API_BASE}/meetings/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update meeting');
    return res.json();
  }

  async updateMeetingStatus(id: string, status: string): Promise<Meeting> {
    const res = await fetch(`${API_BASE}/meetings/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update meeting status');
    return res.json();
  }

  async deleteMeeting(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/meetings/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete meeting');
    return res.json();
  }

  async listMeetings(filters: ListMeetingsFilters = {}): Promise<PaginatedResponse<Meeting>> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.platform) params.append('platform', filters.platform);
    if (filters.proposalId) params.append('proposalId', filters.proposalId);
    if (filters.agreementId) params.append('agreementId', filters.agreementId);
    params.append('page', String(filters.page || 1));
    params.append('limit', String(filters.limit || 20));

    const res = await fetch(`${API_BASE}/meetings?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch meetings');
    return res.json();
  }
}

export const meetingsAPI = new MeetingsAPI();
