import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { motion, AnimatePresence } from 'motion/react';
import { useRole } from '@/src/contexts/RoleContext';

export function DashboardLayout({ children, onNavigate }: { children: React.ReactNode, onNavigate: (view: 'DASHBOARD' | 'PROFILE' | 'CLUSTERS' | 'PROPOSALS' | 'AGREEMENTS' | 'PAYMENTS' | 'MESSAGES' | 'MEETINGS' | 'ANALYTICS' | 'ADMIN_DASHBOARD' | 'AUDIT_LOGS') => void }) {
  const { user } = useRole();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar className="hidden md:flex" onNavigate={onNavigate} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onNavigate={onNavigate} />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={user.role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
