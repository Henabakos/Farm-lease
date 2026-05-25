import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { authAPI } from '@/src/services/api';
import { Mail, Loader2, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { AuthLayout } from './AuthLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function VerifyEmailPendingPage() {
  const { user, logout } = useAuth();
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load cooldown from localStorage to persist across refreshes
  useEffect(() => {
    const savedCooldown = localStorage.getItem('email_resend_cooldown');
    if (savedCooldown) {
      const expiry = parseInt(savedCooldown, 10);
      const remaining = Math.ceil((expiry - Date.now()) / 1000);
      if (remaining > 0) {
        setCooldown(remaining);
      } else {
        localStorage.removeItem('email_resend_cooldown');
      }
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          localStorage.removeItem('email_resend_cooldown');
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!user?.email || cooldown > 0) return;
    setResendLoading(true);
    setStatusMsg(null);
    try {
      await authAPI.resendVerification(user.email);
      toast.success('Verification email resent successfully!');
      setStatusMsg({
        type: 'success',
        text: 'A new verification link has been sent to your email address.',
      });
      // Start 60s cooldown
      const expiry = Date.now() + 60 * 1000;
      localStorage.setItem('email_resend_cooldown', expiry.toString());
      setCooldown(60);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to resend verification email. Please try again.';
      toast.error(msg);
      setStatusMsg({
        type: 'error',
        text: msg,
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Activate your account to access your investment dashboard."
      onBack={logout}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div className="flex items-start gap-3 p-3 rounded-md border border-slate-200 bg-slate-50">
          <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
            We sent a verification link to <span className="font-bold text-slate-800">{user?.email}</span>. Click the link in that email to activate your account.
          </p>
        </div>

        {statusMsg && (
          <Alert className={`rounded-md border ${
            statusMsg.type === 'success'
              ? 'border-emerald-250 bg-emerald-50 text-emerald-800'
              : 'border-destructive/20 bg-destructive/5 text-destructive'
          }`}>
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className="text-xs">
              {statusMsg.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleResend}
            disabled={resendLoading || cooldown > 0}
            className="w-full h-10 rounded-md bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all gap-2"
          >
            {resendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend verification email'}
          </Button>

          <Button
            onClick={logout}
            variant="outline"
            className="w-full h-10 border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-md shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>

        <div className="pt-6 border-t border-slate-100 w-full flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>Logged in as: {user?.full_name}</span>
          <span className="capitalize px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200 text-[9px] font-medium">
            {user?.role?.toLowerCase()?.replace('_', ' ')}
          </span>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
