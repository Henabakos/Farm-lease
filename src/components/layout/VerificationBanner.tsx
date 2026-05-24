import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Clock, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/src/contexts/AuthContext';

/**
 * Site-wide notice for users whose identity has not been verified yet.
 * Hidden for admins, verified users, and on the profile page itself
 * (the profile page already shows the full Identity Verification card).
 */
export function VerificationBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;
  if (user.role === 'ADMIN') return null;
  const status = user.verification_status;
  if (status === 'verified') return null;
  if (location.pathname.startsWith('/profile')) return null;

  const isPending = status === 'pending';
  const isRejected = (status as string) === 'rejected';

  const tone = isPending
    ? {
        wrap: 'border-amber-200 bg-amber-50',
        icon: 'text-amber-600',
        title: 'text-amber-800',
        body: 'text-amber-700',
        Icon: Clock,
        heading: 'Verification pending review',
        message:
          'An admin is reviewing your documents. Some actions remain disabled until your identity is verified.',
      }
    : isRejected
    ? {
        wrap: 'border-rose-200 bg-rose-50',
        icon: 'text-rose-600',
        title: 'text-rose-800',
        body: 'text-rose-700',
        Icon: XCircle,
        heading: 'Verification rejected',
        message: 'Your documents were rejected. Please re-upload to regain full access.',
      }
    : {
        wrap: 'border-amber-200 bg-amber-50',
        icon: 'text-amber-600',
        title: 'text-amber-800',
        body: 'text-amber-700',
        Icon: AlertCircle,
        heading: 'Identity verification required',
        message:
          "Upload your photo and national ID so an admin can verify your identity. You can browse the platform, but you can't create proposals, sign agreements, or run payments until you're verified.",
      };

  const { Icon } = tone;

  return (
    <div className={`mb-5 rounded-lg border ${tone.wrap} shadow-sm`}>
      <div className="p-3 sm:p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-md bg-white/60 border border-white/80 flex items-center justify-center shrink-0">
          <Icon className={`w-4 h-4 ${tone.icon}`} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className={`text-xs font-bold ${tone.title}`}>{tone.heading}</p>
          <p className={`text-[11px] font-medium leading-relaxed ${tone.body}`}>{tone.message}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider bg-white"
            onClick={() => navigate('/profile')}
          >
            <ShieldCheck className="w-3 h-3 mr-1" />
            {isPending ? 'View status' : isRejected ? 'Re-upload' : 'Verify identity'}
          </Button>
        </div>
      </div>
    </div>
  );
}
