import { useState, useCallback, useEffect } from 'react';
import { meetingsAPI } from '../services/api';
import { toast } from 'sonner';

// Server DTO (see server/modules/meetings/meetings.service.js + Prisma schema).
export interface MeetingParticipantDto {
  id: string;
  userId: string;
  status: string;
  user: { id: string; email: string; fullName: string };
}

export interface MeetingDto {
  id: string;
  title: string;
  description?: string | null;
  provider: 'ZOOM' | 'GOOGLE_MEET' | 'IN_PERSON';
  externalMeetingId?: string | null;
  joinUrl?: string | null;
  startUrl?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  relatedId?: string | null;
  relatedType?: string | null;
  hostId: string;
  host?: { id: string; email: string; fullName: string };
  participants?: MeetingParticipantDto[];
  startedAt?: string | null;
  endedAt?: string | null;
  notes?: string | null;
}

function unwrap<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.items)) return data.items as T[];
  if (Array.isArray(data?.data)) return data.data as T[];
  return [];
}

export const useMeetings = () => {
  const [meetings, setMeetings] = useState<MeetingDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async (filters?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await meetingsAPI.getAll(filters);
      setMeetings(unwrap<MeetingDto>(response.data));
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch meetings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMeeting = useCallback(async (id: string): Promise<MeetingDto> => {
    const response = await meetingsAPI.getById(id);
    return response.data as MeetingDto;
  }, []);

  const scheduleMeeting = useCallback(async (data: {
    title: string;
    description?: string;
    scheduledAt: string;
    durationMinutes?: number;
    provider: 'zoom' | 'google' | 'none';
    attendeeEmails?: string[];
    proposalId?: string;
    agreementId?: string;
  }): Promise<MeetingDto> => {
    try {
      setIsLoading(true);
      const response = await meetingsAPI.schedule(data);
      const created = response.data as MeetingDto;
      setMeetings((prev) => [created, ...prev]);
      toast.success('Meeting scheduled');
      return created;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to schedule meeting';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateMeeting = useCallback(async (id: string, data: any): Promise<MeetingDto> => {
    const response = await meetingsAPI.update(id, data);
    const updated = response.data as MeetingDto;
    setMeetings((prev) => prev.map((m) => (m.id === id ? updated : m)));
    toast.success('Meeting updated');
    return updated;
  }, []);

  const updateStatus = useCallback(
    async (id: string, status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled') => {
      try {
        const response = await meetingsAPI.updateStatus(id, status);
        const updated = response.data as MeetingDto;
        setMeetings((prev) => prev.map((m) => (m.id === id ? updated : m)));
        toast.success(`Meeting marked ${status}`);
        return updated;
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to update status');
        throw err;
      }
    },
    [],
  );

  const deleteMeeting = useCallback(async (id: string) => {
    try {
      await meetingsAPI.delete(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      toast.success('Meeting cancelled');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel meeting');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return {
    meetings,
    isLoading,
    error,
    fetchMeetings,
    getMeeting,
    scheduleMeeting,
    updateMeeting,
    updateStatus,
    deleteMeeting,
  };
};
