import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { authAPI } from '@/src/services/api';
import { Mail, Loader2, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

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
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-4">
      {/* Background ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex flex-col items-center text-center">
          {/* Logo / Icon container */}
          <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Mail className="h-8 w-8" />
            <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white animate-pulse">
              !
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Verify your email
          </h1>
          
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            We sent a verification link to <span className="font-semibold text-slate-200">{user?.email}</span>. 
            Please click the link in that email to activate your account and access the dashboard.
          </p>

          <AnimatePresence mode="wait">
            {statusMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`w-full mb-6 p-4 rounded-xl border text-left text-xs ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {statusMsg.type === 'success' ? (
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  )}
                  <p>{statusMsg.text}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full space-y-3">
            <Button
              onClick={handleResend}
              disabled={resendLoading || cooldown > 0}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl transition duration-200 border-none shadow-md shadow-indigo-600/20"
            >
              {resendLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Resending...
                </span>
              ) : cooldown > 0 ? (
                `Resend link in ${cooldown}s`
              ) : (
                'Resend verification email'
              )}
            </Button>

            <Button
              onClick={logout}
              variant="outline"
              className="w-full h-11 border-slate-800 bg-slate-900/40 hover:bg-slate-800 hover:text-white active:bg-slate-900 text-slate-300 font-semibold rounded-xl transition duration-200 flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-850 w-full flex items-center justify-between text-xs text-slate-500">
            <span>Logged in as: {user?.full_name}</span>
            <span className="capitalize px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-medium">
              {user?.role?.toLowerCase()?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
