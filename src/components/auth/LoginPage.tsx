import React, { useState } from 'react';
import { useRole } from '@/src/contexts/RoleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthLayout } from './AuthLayout';
import { Loader2, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'motion/react';

export function LoginPage({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useRole();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulate API call
    setTimeout(() => {
      login('INVESTOR'); // Default for demo
      setLoading(false);
    }, 1500);
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Enter your credentials to access your investment dashboard."
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
              <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-black uppercase tracking-[0.1em] text-primary/60 ml-1">Email Address</Label>
            <div className="relative group">
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                required 
                className="h-14 bg-primary/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-lg font-medium pl-5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="password" className="text-sm font-black uppercase tracking-[0.1em] text-primary/60">Password</Label>
              <Button variant="link" className="px-0 font-bold text-xs h-auto text-primary hover:no-underline hover:text-primary/80">
                Forgot password?
              </Button>
            </div>
            <div className="relative group">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                required 
                className="h-14 bg-primary/5 border-primary/10 rounded-2xl pr-14 focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-lg font-medium pl-5"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors p-2"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3 ml-1">
            <Checkbox id="remember" className="w-5 h-5 rounded-lg border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
            <Label htmlFor="remember" className="text-sm font-bold text-muted-foreground cursor-pointer select-none">
              Keep me signed in for 30 days
            </Label>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] gap-3" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </Button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-primary/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black">
              <span className="bg-background px-6 text-primary/40">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" type="button" className="h-14 rounded-2xl border-primary/10 hover:bg-primary/5 font-black gap-3 text-base transition-all">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.33-2.03 4.44-1.33 1.33-3.4 2.78-6.94 2.78-5.48 0-9.86-4.43-9.86-9.86s4.38-9.86 9.86-9.86c3.13 0 5.38 1.23 7.08 2.88l2.36-2.36C18.4 1.95 15.53 0 12 0 5.37 0 0 5.37 0 12s5.37 12 12 12c3.57 0 6.26-1.17 8.48-3.48 2.22-2.22 3.01-5.33 3.01-7.81 0-.53-.05-1.05-.12-1.54h-10.89z"/>
              </svg>
              Google
            </Button>
            <Button variant="outline" type="button" className="h-14 rounded-2xl border-primary/10 hover:bg-primary/5 font-black gap-3 text-base transition-all">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>
          </div>

          <p className="text-center text-base text-muted-foreground font-medium pt-4">
            New to AgriInvest?{' '}
            <button 
              type="button"
              className="font-black text-primary hover:text-primary/80 transition-all ml-1" 
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
