import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { UserRole } from '@/src/types';

// Backend (Phase 4) emits canonical roles directly, so the legacy
// apiRoleToUi mapping is no longer needed. The boolean helpers below
// preserve the original API surface (`isOwner`, `isTenant`) so existing
// components keep compiling — they now resolve against the canonical
// taxonomy: INVESTOR / CLUSTER_REP → owner-style, FARMER → tenant-style.
interface RoleContextType {
  role: UserRole | null;
  isOwner: boolean;
  isTenant: boolean;
  isAdmin: boolean;
  isInvestor: boolean;
  isClusterRep: boolean;
  isFarmer: boolean;
  canAccess: (requiredRoles: string[]) => boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    bio?: string;
    phone?: string;
    location?: string;
    joinedDate?: string;
    clusters?: { id: string; name: string; location?: string; memberCount?: number }[];
  } | null;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => void;
  setUser: (user: Partial<{ name: string; email: string; phone?: string; bio?: string; location?: string }>) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user: authUser, logout, updateProfile } = useAuth();

  const role = (authUser?.role as UserRole | undefined) ?? null;
  const isAdmin       = role === 'ADMIN';
  const isInvestor    = role === 'INVESTOR';
  const isClusterRep  = role === 'CLUSTER_REP';
  const isFarmer      = role === 'FARMER';
  // Legacy aliases kept so existing components don't break.
  const isOwner       = isInvestor || isClusterRep;
  const isTenant      = isFarmer;

  const canAccess = (requiredRoles: string[]) => {
    if (!role) return false;
    if (isAdmin) return true;
    // Accept both canonical and legacy tokens in the required list so
    // pre-existing route guards (`['owner']`, `['tenant']`) keep working.
    const tokens = new Set(requiredRoles.map((r) => r.toUpperCase()));
    if (tokens.has(role)) return true;
    if (tokens.has('OWNER')  && (isInvestor || isClusterRep)) return true;
    if (tokens.has('TENANT') && isFarmer) return true;
    return false;
  };

  const user = authUser
    ? {
        id: authUser.id,
        name: authUser.full_name || authUser.email,
        email: authUser.email,
        role: authUser.role as UserRole,
        avatar: authUser.avatar_url,
        bio: authUser.bio,
        phone: authUser.phone,
        location: undefined,
        joinedDate: undefined,
        clusters: [],
      }
    : null;

  const setRole = (_role: UserRole) => {
    // Role changes are managed server-side; no-op for UI compatibility
  };

  const setUser = async (data: Partial<{ name: string; email: string; phone?: string; bio?: string }>) => {
    if (!authUser) return;
    await updateProfile({
      full_name: data.name ?? authUser.full_name,
      phone: data.phone,
      bio: data.bio,
    } as Parameters<typeof updateProfile>[0]);
  };

  const value: RoleContextType = {
    role,
    isOwner,
    isTenant,
    isInvestor,
    isClusterRep,
    isFarmer,
    isAdmin,
    canAccess,
    user,
    logout,
    setRole,
    setUser,
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
