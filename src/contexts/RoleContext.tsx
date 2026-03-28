import React, { createContext, useContext, ReactNode } from 'react';
import { UserRole, User } from '@/src/types';
import { useStore } from '@/src/store/useStore';

interface RoleContextType {
  user: User;
  isLoggedIn: boolean;
  setRole: (role: UserRole) => void;
  login: (role: UserRole) => void;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn, setRole, login, logout } = useStore();

  return (
    <RoleContext.Provider value={{ user, isLoggedIn, setRole, login, logout }}>
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
