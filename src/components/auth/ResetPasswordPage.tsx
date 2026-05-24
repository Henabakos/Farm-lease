import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { authAPI } from '@/src/services/api';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mismatch = useMemo(
    () => confirm.length > 0 && password !== confirm,
    [password, confirm],
  );
  const tooShort = password.length > 0 && password.length < 8;

  useEffect(() => {
    if (!token) {
      setError('Reset link is missing a token. Request a new reset email.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || mismatch || tooShort) return;
    setLoading(true);
    setError(null);
    try {
      await authAPI.resetPassword(token, password);
      setDone(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        (err instanceof Error ? err.message : 'Could not reset password');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Pick a new password for your account."
      onBack={() => navigate('/login')}
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {done ? (
          <div className="space-y-5">
            <Alert className="rounded-md border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-xs text-emerald-700">
                Your password has been updated. Sign in with your new password.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate('/login')}
              className="w-full h-10 text-[10px] font-bold uppercase tracking-wider rounded-md"
            >
              Continue to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="rounded-md border-destructive/20 bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                New password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 pr-10 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white text-sm font-medium"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {tooShort && (
                <p className="text-[10px] font-bold text-rose-600 ml-1">Password must be at least 8 characters.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
                Confirm password
              </Label>
              <Input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-10 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white text-sm font-medium"
              />
              {mismatch && (
                <p className="text-[10px] font-bold text-rose-600 ml-1">Passwords don't match.</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading || !token || mismatch || tooShort || !password || !confirm}
              className="w-full h-10 gap-2 text-[10px] font-bold uppercase tracking-wider rounded-md"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Update password
            </Button>
          </form>
        )}
      </motion.div>
    </AuthLayout>
  );
}
