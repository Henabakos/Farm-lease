import React from 'react';
import { Sprout } from 'lucide-react';

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
            <Sprout className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        
        <div className="bg-card border rounded-2xl p-8 shadow-sm">
          {children}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          &copy; 2026 AgriInvest Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}
