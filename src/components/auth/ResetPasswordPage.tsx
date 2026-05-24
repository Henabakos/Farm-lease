import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { authAPI } from '../../services/api';
import { motion } from 'motion/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Password must contain letters and digits');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password });
      setSuccess(true);
      toast.success('Password reset successful. You can now log in with your new password.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Failed to reset password:', err);
      setError(err.response?.data?.message || 'Failed to reset password. The token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reset Password</h1>
            <p className="text-sm text-slate-500">Enter your new password below</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Alert variant="destructive" className="rounded-md border-destructive/20 bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">Password Reset Successful</h3>
                <p className="text-sm text-slate-500">You can now log in with your new password.</p>
                <p className="text-xs text-slate-400">Redirecting to login page...</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || !token}
                  className="h-10 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-sm font-medium pl-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || !token}
                  className="h-10 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-sm font-medium pl-4"
                />
              </div>

              <div className="pt-2 space-y-3">
                <Button
                  type="submit"
                  className="w-full h-10 rounded-md bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                  disabled={loading || !token}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="w-full h-10 rounded-md text-slate-600 hover:text-slate-900 font-bold text-xs uppercase tracking-wider gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Login</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
