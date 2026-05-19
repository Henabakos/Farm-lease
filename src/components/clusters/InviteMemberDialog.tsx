import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { clustersAPI } from '@/src/services/api';

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
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'FARMER' | 'REPRESENTATIVE'>(defaultRole);
  const [inviting, setInviting] = useState(false);

  const reset = () => {
    setEmail('');
    setRole(defaultRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setInviting(true);
    try {
      await clustersAPI.inviteMember(clusterId, email.trim(), role);
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
      <DialogContent className="sm:max-w-[480px] rounded-lg border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
            Invite Member
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Add a user to this cluster
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
              className="h-9 rounded-md text-xs border-slate-200"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Role</Label>
            <Select value={role} onValueChange={(value: 'FARMER' | 'REPRESENTATIVE') => setRole(value)}>
              <SelectTrigger className="h-9 rounded-md text-xs border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-md border-slate-200">
                <SelectItem value="FARMER" className="text-xs font-medium">Farmer</SelectItem>
                <SelectItem value="REPRESENTATIVE" className="text-xs font-medium">Cluster Representative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={inviting}
              className="h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-white gap-2"
            >
              {inviting && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>{inviting ? 'Inviting…' : 'Invite'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
