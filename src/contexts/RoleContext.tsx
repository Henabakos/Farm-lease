import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface RoleContextType {
  role: 'owner' | 'tenant' | 'admin' | null;
  isOwner: boolean;
  isTenant: boolean;
  isAdmin: boolean;
  canAccess: (requiredRoles: string[]) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const role = user?.role || null;
  const isOwner = role === 'owner';
  const isTenant = role === 'tenant';
  const isAdmin = role === 'admin';

  const canAccess = (requiredRoles: string[]) => {
    if (!role) return false;
    return requiredRoles.includes(role) || role === 'admin';
  };

  const value: RoleContextType = {
    role,
    isOwner,
    isTenant,
    isAdmin,
    canAccess
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
