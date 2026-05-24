import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { clustersAPI, usersAPI } from '@/src/services/api';

type CandidateOption = {
  id: string;
  name: string;
  email: string;
};

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clusterId: string;
  defaultRole?: 'FARMER' | 'REPRESENTATIVE';
  onInvited: () => void;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  clusterId,
  defaultRole = 'FARMER',
  onInvited,
}: InviteMemberDialogProps) {
  const [role, setRole] = useState<'FARMER' | 'REPRESENTATIVE'>(defaultRole);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [inviting, setInviting] = useState(false);

  const reset = () => {
    setRole(defaultRole);
    setSelectedUserId('');
    setSearchQuery('');
  };

  useEffect(() => {
    if (open) {
      setRole(defaultRole);
      setSelectedUserId('');
      setSearchQuery('');
    }
  }, [open, defaultRole]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadCandidates = async () => {
      setLoadingCandidates(true);
      try {
        const targetRole = role === 'FARMER' ? 'FARMER' : 'CLUSTER_REP';
        const [usersResponse, membersResponse] = await Promise.all([
          usersAPI.searchUsers(undefined, targetRole),
          clustersAPI.listMembers(clusterId),
        ]);

        const users = Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data?.data ?? [];
        const members = Array.isArray(membersResponse.data) ? membersResponse.data : membersResponse.data?.data ?? [];
        const memberIds = new Set((members as any[]).map((member) => member.id));
        const availableCandidates: CandidateOption[] = (users as any[])
          .filter((user) => !memberIds.has(user.id))
          .map((user) => ({
            id: String(user.id),
            name: String(user.full_name ?? user.fullName ?? user.name ?? user.email),
            email: String(user.email ?? ''),
          }));

        if (!cancelled) {
          setCandidates(availableCandidates);
          setSelectedUserId((current: string) => (
            availableCandidates.some((candidate) => candidate.id === current) ? current : ''
          ));
        }
      } catch {
        if (!cancelled) {
          setCandidates([]);
          toast.error(`Failed to load ${role === 'FARMER' ? 'farmers' : 'representatives'}`);
        }
      } finally {
        if (!cancelled) setLoadingCandidates(false);
      }
    };

    loadCandidates();
    return () => {
      cancelled = true;
    };
  }, [open, role, clusterId]);

  const visibleCandidates = candidates.filter((candidate) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return candidate.name.toLowerCase().includes(query) || candidate.email.toLowerCase().includes(query);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setInviting(true);
    try {
      await clustersAPI.inviteMember(clusterId, { userId: selectedUserId, role });
      toast.success('Member invited successfully');
      reset();
      onOpenChange(false);
      onInvited();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-xl rounded-xl border-slate-200 p-0 overflow-hidden">
        <div className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-4 py-4 sm:px-6 sm:py-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              {role === 'FARMER' ? 'Add Farmer' : 'Add Representative'}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {role === 'FARMER' ? 'Pick a farmer from the available list' : 'Pick a representative from the available list'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Role</Label>
                <Select value={role} onValueChange={(value: 'FARMER' | 'REPRESENTATIVE') => setRole(value)}>
                  <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-slate-200">
                    <SelectItem value="FARMER" className="text-xs font-medium">Farmer</SelectItem>
                    <SelectItem value="REPRESENTATIVE" className="text-xs font-medium">Representative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Search</Label>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={role === 'FARMER' ? 'Search farmers…' : 'Search representatives…'}
                  className="h-10 rounded-md border-slate-200 bg-white text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {role === 'FARMER' ? 'Farmer' : 'Representative'}
              </Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="h-10 rounded-md border-slate-200 bg-white text-xs">
                  <SelectValue placeholder={loadingCandidates ? 'Loading…' : 'Select a user'} />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-md border-slate-200">
                  {loadingCandidates ? (
                    <div className="px-3 py-2 text-xs text-slate-500">Loading users…</div>
                  ) : visibleCandidates.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-500">No matching users found</div>
                  ) : (
                    visibleCandidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id} className="text-xs font-medium">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-900">{candidate.name}</div>
                          <div className="truncate text-[10px] text-slate-400">{candidate.email}</div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-10 w-full rounded-md border-slate-200 px-4 text-[10px] font-bold uppercase tracking-wider sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={inviting || !selectedUserId}
                className="h-10 w-full gap-2 rounded-md bg-primary px-4 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-primary/90 sm:w-auto"
              >
                {inviting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{inviting ? 'Inviting…' : 'Invite'}</span>
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
