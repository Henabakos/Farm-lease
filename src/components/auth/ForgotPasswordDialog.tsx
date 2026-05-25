import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { authAPI } from '../../services/api';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ open, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.forgotPassword(email);
      console.log('Forgot password response:', response.data);
      toast.success('If an account exists for that email, a reset link has been sent.');
      setSuccess(true);

      // In development mode, the API returns the reset URL
      if (response.data.resetUrl) {
        console.log('Reset URL received:', response.data.resetUrl);
        setResetUrl(response.data.resetUrl);
        // Don't auto-close in dev mode so user can see the link
      } else {
        console.log('No reset URL in response');
        // Auto-close after 3 seconds in production mode
        setTimeout(() => {
          onOpenChange(false);
          setEmail('');
          setSuccess(false);
          setResetUrl(null);
        }, 3000);
      }
    } catch (err: any) {
      console.error('Failed to request password reset:', err);
      toast.error(err.response?.data?.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>
        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-600">
                If an account exists for that email, a reset link has been sent to your inbox.
              </p>
              {resetUrl && (
                <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-200 text-left">
                  <p className="text-xs font-medium text-slate-500 mb-2">Development Mode - Reset Link:</p>
                  <a
                    href={resetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline break-all block"
                  >
                    {resetUrl}
                  </a>
                  <p className="text-[10px] text-slate-400 mt-2">Click the link above to reset your password</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setEmail('');
                  setSuccess(false);
                  setResetUrl(null);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
