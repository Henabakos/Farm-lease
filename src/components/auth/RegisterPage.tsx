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
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <div className="text-center space-y-6 py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Welcome to the Platform</h3>
            <p className="text-muted-foreground">
              You've successfully registered as an <span className="font-bold text-foreground">{role?.toLowerCase().replace('_', ' ')}</span>.
            </p>
          </div>
          <Button className="w-full h-11" onClick={() => login(role!)}>
            Go to Dashboard
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title={step === 'ROLE' ? "Choose Your Role" : "Complete Registration"} 
      subtitle={step === 'ROLE' ? "Select the account type that best fits your needs" : "Tell us more about yourself"}
    >
      {step === 'ROLE' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 group",
                  role === r.id 
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                    : "border-muted bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  role === r.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground group-hover:text-primary"
                )}>
                  <r.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.description}</p>
                </div>
                {role === r.id && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
              </button>
            ))}
          </div>

          <Button 
            className="w-full h-11 gap-2" 
            disabled={!role}
            onClick={() => setStep('DETAILS')}
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button variant="link" className="p-0 h-auto font-semibold text-primary" onClick={onSwitch}>
              Sign in
            </Button>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="John" required className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Doe" required className="bg-muted/30" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="john@example.com" required className="bg-muted/30" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" required className="bg-muted/30" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 h-11 gap-2"
              onClick={() => setStep('ROLE')}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <Button type="submit" className="flex-[2] h-11" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
