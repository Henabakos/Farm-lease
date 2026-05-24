import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { VerificationBanner } from './VerificationBanner';
import { motion, AnimatePresence } from 'motion/react';
import { useRole } from '@/src/contexts/RoleContext';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useRole();

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-30">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <Sidebar className="hidden md:flex relative z-10" />
      
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Topbar />
        
        <main className="flex-1 overflow-y-auto p-5 scrollbar-hide">
          <VerificationBanner />
          <AnimatePresence mode="wait">
            <motion.div
              key={user.role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
