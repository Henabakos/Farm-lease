import { useState, useCallback, useEffect } from 'react';
import { meetingsAPI } from '../services/api';
import { toast } from 'sonner';

export interface AvailabilitySlot {
  id: string;
  userId: string;
  dayOfWeek: number;    // 0=Sun … 6=Sat
  startTime: string;    // "HH:mm"
  endTime: string;      // "HH:mm"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function useAvailability(userId?: string) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSlots = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = userId
        ? await meetingsAPI.getAvailabilityForUser(userId)
        : await meetingsAPI.getMyAvailability();
      setSlots(res.data ?? []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load availability');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const createSlot = useCallback(async (data: { dayOfWeek: number; startTime: string; endTime: string }) => {
    const res = await meetingsAPI.createAvailability(data);
    const slot = res.data as AvailabilitySlot;
    setSlots(prev => [...prev, slot]);
    toast.success('Availability slot added');
    return slot;
  }, []);

  const updateSlot = useCallback(async (id: string, data: Partial<AvailabilitySlot>) => {
    const res = await meetingsAPI.updateAvailability(id, data);
    const updated = res.data as AvailabilitySlot;
    setSlots(prev => prev.map(s => s.id === id ? updated : s));
    toast.success('Slot updated');
    return updated;
  }, []);

  const removeSlot = useCallback(async (id: string) => {
    await meetingsAPI.deleteAvailability(id);
    setSlots(prev => prev.filter(s => s.id !== id));
    toast.success('Slot removed');
  }, []);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  return { slots, isLoading, fetchSlots, createSlot, updateSlot, removeSlot };
}
