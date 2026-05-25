import React, { useEffect, useState, useCallback } from 'react';
import { UserPlus, Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { messagesAPI } from '@/src/services/api';
import { toast } from 'sonner';
import { subscribeToInvitationEvents } from '@/src/services/realtime';

export interface InvitationDto {
  id: string;
  senderId: string;
  message?: string | null;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    role: string;
    avatarUrl?: string | null;
  };
}

export function InvitationBadge({
  onAccepted,
}: {
  onAccepted: (conversationId: string) => void;
}) {
  const [invitations, setInvitations] = useState<InvitationDto[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchInvitations = useCallback(async () => {
    try {
      const res = await messagesAPI.getPendingInvitations();
      const rows = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setInvitations(rows);
    } catch {
      // silent — badge just shows 0
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  // Listen for real-time invitation_received events
  useEffect(() => {
    const unsub = subscribeToInvitationEvents((event) => {
      if (event.type === 'invitation_received') {
        fetchInvitations();
        toast.info(`${event.senderName} sent you a message request`);
      }
      if (event.type === 'invitation_accepted') {
        // Conversation was accepted by the other side — refresh conversations
        onAccepted(event.conversationId);
      }
    });
    return unsub;
  }, [fetchInvitations, onAccepted]);

  const handleAccept = async (inv: InvitationDto) => {
    try {
      const res = await messagesAPI.acceptInvitation(inv.id);
      const conversation = res.data;
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      toast.success(`Now chatting with ${inv.sender.fullName}`);
      onAccepted(conversation.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to accept invitation');
    }
  };

  const handleDecline = async (inv: InvitationDto) => {
    try {
      await messagesAPI.declineInvitation(inv.id);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      toast.success('Invitation declined');
    } catch {
      toast.error('Failed to decline invitation');
    }
  };

  if (invitations.length === 0) return null;

  return (
    <div className="border-b border-slate-200 bg-amber-50/60">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
            Message Requests
          </span>
        </div>
        <Badge className="bg-amber-500 text-white border-none text-[9px] font-bold px-1.5 rounded-sm">
          {invitations.length}
        </Badge>
      </button>

      {isExpanded && (
        <div className="divide-y divide-amber-100">
          {invitations.map((inv) => (
            <div key={inv.id} className="px-4 py-3 flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-white border border-amber-200 flex items-center justify-center shrink-0 shadow-sm">
                <User className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {inv.sender.fullName}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {inv.sender.role?.replace('_', ' ')}
                </p>
                {inv.message && (
                  <p className="text-[11px] text-slate-500 italic leading-tight line-clamp-2">
                    "{inv.message}"
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200"
                  title="Accept"
                  onClick={() => handleAccept(inv)}
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-md bg-red-50 hover:bg-red-100 text-red-500 border border-red-200"
                  title="Decline"
                  onClick={() => handleDecline(inv)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
