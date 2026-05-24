import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthLayout } from './AuthLayout';
import { Loader2, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'motion/react';

export function LoginPage({ onSwitch, onBack }: { onSwitch: () => void, onBack: () => void }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Enter your credentials to access your investment dashboard."
      onBack={onBack}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <motion.div className="space-y-1.5">
            <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Email Address</Label>
            <motion.div className="relative group">
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-sm font-medium pl-4"
              />
            </motion.div>
          </motion.div>

          <motion.div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</Label>
              <Button variant="link" type="button" onClick={() => navigate('/forgot-password')} className="px-0 font-bold text-[10px] h-auto text-primary hover:no-underline hover:text-primary/80 uppercase tracking-wider">
                Forgot password?
              </Button>
            </div>
            <motion.div className="relative group">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 bg-slate-50 border-slate-200 rounded-md pr-12 focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-sm font-medium pl-4"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors p-1.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </motion.div>
          </motion.div>

          <div className="flex items-center space-x-2.5 ml-1">
            <Checkbox id="remember" className="w-4 h-4 rounded-sm border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
            <Label htmlFor="remember" className="text-xs font-medium text-slate-500 cursor-pointer select-none">
              Keep me signed in for 30 days
            </Label>
          </div>

          <Button 
            type="submit" 
            className="w-full h-10 rounded-md bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all gap-2" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <div className="relative py-2">
            <motion.div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100" />
            </motion.div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-widest font-bold">
              <span className="bg-white px-4 text-slate-400">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button" className="h-10 rounded-md border-slate-200 hover:bg-slate-50 font-bold gap-2 text-xs transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.33-2.03 4.44-1.33 1.33-3.4 2.78-6.94 2.78-5.48 0-9.86-4.43-9.86-9.86s4.38-9.86 9.86-9.86c3.13 0 5.38 1.23 7.08 2.88l2.36-2.36C18.4 1.95 15.53 0 12 0 5.37 0 0 5.37 0 12s5.37 12 12 12c3.57 0 6.26-1.17 8.48-3.48 2.22-2.22 3.01-5.33 3.01-7.81 0-.53-.05-1.05-.12-1.54h-10.89z"/>
              </svg>
              Google
            </Button>
            <Button variant="outline" type="button" className="h-10 rounded-md border-slate-200 hover:bg-slate-50 font-bold gap-2 text-xs transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>
          </div>

          <p className="text-center text-xs text-slate-500 font-medium pt-2">
            New to AgriInvest?{' '}
            <button 
              type="button"
              className="font-bold text-primary hover:text-primary/80 transition-all ml-1" 
              onClick={onSwitch}
            >
              Create an account
            </button>
          </p>
        </form>
      </motion.div>
    </AuthLayout>
  );
}
