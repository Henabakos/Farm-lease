import React, { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { UserRole } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from './AuthLayout';
import { 
  Loader2, 
  TrendingUp, 
  Sprout, 
  Map, 
  Shield, 
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type Step = 'ROLE' | 'DETAILS' | 'SUCCESS';

export function RegisterPage({ onSwitch, onBack }: { onSwitch: () => void, onBack: () => void }) {
  const { register, login } = useAuth();
  const [step, setStep] = useState<Step>('ROLE');
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const roles: { id: UserRole; title: string; description: string; icon: React.ElementType }[] = [
    { id: 'INVESTOR', title: 'Investor', description: 'Invest in high-yield agricultural projects', icon: TrendingUp },
    { id: 'FARMER', title: 'Farmer', description: 'Access funding and scale your farm operations', icon: Sprout },
    { id: 'CLUSTER_REP', title: 'Cluster Rep', description: 'Coordinate farmers and manage resources', icon: Map },
    { id: 'ADMIN', title: 'Admin', description: 'Platform management and oversight', icon: Shield },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setLoading(true);
    setError(null);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await register(email, password, fullName, role);
      setStep('SUCCESS');
    } catch {
      setError('Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = async () => {
    try {
      await login(email, password);
    } catch {
      onSwitch();
    }
  };

  if (step === 'SUCCESS') {
    return (
      <AuthLayout 
        title="Account Created!" 
        subtitle="Your AgriInvest account is ready to use"
        onBack={onBack}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 py-4"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-slate-900">Welcome to the Platform</h3>
            <p className="text-slate-500 text-sm font-medium">
              You've successfully registered as an <span className="font-bold text-primary uppercase tracking-wider">{role?.toLowerCase().replace('_', ' ')}</span>.
            </p>
          </div>
          <Button 
            className="w-full h-10 rounded-md bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all gap-2" 
            onClick={handleGoToDashboard}
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title={step === 'ROLE' ? "Choose Your Role" : "Complete Registration"} 
      subtitle={step === 'ROLE' ? "Select the account type that best fits your needs" : "Tell us more about yourself"}
      onBack={onBack}
    >
      <AnimatePresence mode="wait">
        {step === 'ROLE' ? (
          <motion.div 
            key="role-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-3">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border text-left transition-all duration-300 group relative overflow-hidden",
                    role === r.id 
                      ? "border-primary bg-primary/5 shadow-sm" 
                      : "border-slate-100 bg-slate-50 hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-md flex items-center justify-center shrink-0 transition-all duration-300",
                    role === r.id ? "bg-primary text-white scale-105" : "bg-white text-primary border border-slate-100 group-hover:scale-105"
                  )}>
                    <r.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 tracking-tight">{r.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium line-clamp-1">{r.description}</p>
                  </div>
                  {role === r.id && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <Button 
                className="w-full h-10 rounded-md bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all gap-2" 
                disabled={!role}
                onClick={() => setStep('DETAILS')}
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </Button>

              <p className="text-center text-xs text-slate-500 font-medium">
                Already have an account?{' '}
                <button 
                  type="button"
                  className="font-bold text-primary hover:text-primary/80 transition-all ml-1" 
                  onClick={onSwitch}
                >
                  Sign in
                </button>
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="details-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-xs text-destructive font-medium">{error}</p>}
              <motion.div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">First Name</Label>
                  <Input id="firstName" placeholder="John" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-10 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-sm font-medium pl-4" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-10 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-sm font-medium pl-4" />
                </div>
              </motion.div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Email Address</Label>
                <Input id="email" type="email" placeholder="john@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-sm font-medium pl-4" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-sm font-medium pl-4" />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full sm:w-1/3 h-10 rounded-md border-slate-200 hover:bg-slate-50 font-bold gap-2 text-xs uppercase tracking-wider transition-all"
                  onClick={() => setStep('ROLE')}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <Button 
                  type="submit" 
                  className="w-full sm:w-2/3 h-10 rounded-md bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all gap-2" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
