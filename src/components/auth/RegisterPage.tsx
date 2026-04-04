import React, { useState } from 'react';
import { useRole } from '@/src/contexts/RoleContext';
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

export function RegisterPage({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useRole();
  const [step, setStep] = useState<Step>('ROLE');
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  const roles: { id: UserRole; title: string; description: string; icon: React.ElementType }[] = [
    { id: 'INVESTOR', title: 'Investor', description: 'Invest in high-yield agricultural projects', icon: TrendingUp },
    { id: 'FARMER', title: 'Farmer', description: 'Access funding and scale your farm operations', icon: Sprout },
    { id: 'CLUSTER_REP', title: 'Cluster Rep', description: 'Coordinate farmers and manage resources', icon: Map },
    { id: 'ADMIN', title: 'Admin', description: 'Platform management and oversight', icon: Shield },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setStep('SUCCESS');
      setLoading(false);
    }, 1500);
  };

  if (step === 'SUCCESS') {
    return (
      <AuthLayout 
        title="Account Created!" 
        subtitle="Your AgriInvest account is ready to use"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 py-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-primary/10 text-primary shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black tracking-tight">Welcome to the Platform</h3>
            <p className="text-muted-foreground text-lg font-medium">
              You've successfully registered as an <span className="font-black text-primary uppercase tracking-wider">{role?.toLowerCase().replace('_', ' ')}</span>.
            </p>
          </div>
          <Button 
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] gap-3" 
            onClick={() => login(role!)}
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-6 h-6" />
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title={step === 'ROLE' ? "Choose Your Role" : "Complete Registration"} 
      subtitle={step === 'ROLE' ? "Select the account type that best fits your needs" : "Tell us more about yourself"}
    >
      <AnimatePresence mode="wait">
        {step === 'ROLE' ? (
          <motion.div 
            key="role-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 gap-4">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={cn(
                    "flex items-center gap-5 p-5 rounded-[2rem] border-2 text-left transition-all duration-300 group relative overflow-hidden",
                    role === r.id 
                      ? "border-primary bg-primary/5 shadow-xl shadow-primary/10" 
                      : "border-primary/5 bg-primary/5 hover:border-primary/30 hover:bg-primary/10"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500",
                    role === r.id ? "bg-primary text-white scale-110 rotate-3" : "bg-white text-primary group-hover:scale-110"
                  )}>
                    <r.icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-xl text-foreground tracking-tight">{r.title}</p>
                    <p className="text-sm text-muted-foreground mt-1 font-medium line-clamp-1">{r.description}</p>
                  </div>
                  {role === r.id && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"
                    >
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <Button 
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] gap-3" 
                disabled={!role}
                onClick={() => setStep('DETAILS')}
              >
                <span>Continue</span>
                <ChevronRight className="w-6 h-6" />
              </Button>

              <p className="text-center text-base text-muted-foreground font-medium">
                Already have an account?{' '}
                <button 
                  type="button"
                  className="font-black text-primary hover:text-primary/80 transition-all ml-1" 
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
            className="space-y-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-black uppercase tracking-[0.1em] text-primary/60 ml-1">First Name</Label>
                  <Input id="firstName" placeholder="John" required className="h-14 bg-primary/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-lg font-medium pl-5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-black uppercase tracking-[0.1em] text-primary/60 ml-1">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" required className="h-14 bg-primary/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-lg font-medium pl-5" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-black uppercase tracking-[0.1em] text-primary/60 ml-1">Email Address</Label>
                <Input id="email" type="email" placeholder="john@example.com" required className="h-14 bg-primary/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-lg font-medium pl-5" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-black uppercase tracking-[0.1em] text-primary/60 ml-1">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" required className="h-14 bg-primary/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-lg font-medium pl-5" />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full sm:w-1/3 h-14 rounded-2xl border-primary/10 hover:bg-primary/5 font-black gap-3 text-base transition-all"
                  onClick={() => setStep('ROLE')}
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Back</span>
                </Button>
                <Button 
                  type="submit" 
                  className="w-full sm:w-2/3 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] gap-3" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-6 h-6" />
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
