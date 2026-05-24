import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { authAPI } from '@/src/services/api';

type State = 'idle' | 'verifying' | 'success' | 'error';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<State>(token ? 'verifying' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!token || startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        await authAPI.verifyEmail(token);
        setState('success');
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          (err instanceof Error ? err.message : 'Verification link is invalid or expired.');
        setError(msg);
        setState('error');
      }
    })();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendLoading(true);
    try {
      await authAPI.resendVerification(resendEmail.trim());
      setResendSent(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Could not resend verification email';
      setError(msg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Confirm your email address to activate your account."
      onBack={() => navigate('/login')}
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {state === 'verifying' && (
          <div className="flex flex-col items-center text-center gap-3 py-8">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verifying your email…
            </p>
          </div>
        )}

        {state === 'success' && (
          <div className="space-y-5">
            <Alert className="rounded-md border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-xs text-emerald-700">
                Your email has been verified. You can now sign in and continue setting up your account.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate('/login')}
              className="w-full h-10 text-[10px] font-bold uppercase tracking-wider rounded-md"
            >
              Continue to sign in
            </Button>
          </div>
        )}

        {(state === 'idle' || state === 'error') && (
          <div className="space-y-5">
            {state === 'error' && error && (
              <Alert variant="destructive" className="rounded-md border-destructive/20 bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex items-start gap-3 p-3 rounded-md border border-slate-200 bg-slate-50">
              <MailCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                Didn't receive a verification email? Enter your address below and we'll send a fresh link.
              </p>
            </div>

            {resendSent ? (
              <Alert className="rounded-md border-emerald-200 bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-xs text-emerald-700">
                  If your email is registered and not yet verified, a new link is on its way.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleResend} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="resend-email" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                    Email Address
                  </Label>
                  <Input
                    id="resend-email"
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="h-10 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white text-sm font-medium"
                    placeholder="name@company.com"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={resendLoading || !resendEmail.trim()}
                  className="w-full h-10 gap-2 text-[10px] font-bold uppercase tracking-wider rounded-md"
                >
                  {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Resend verification email
                </Button>
              </form>
            )}

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/login')}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
              >
                Back to sign in
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </AuthLayout>
  );
}
