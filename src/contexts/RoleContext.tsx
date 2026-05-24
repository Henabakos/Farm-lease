import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { UserRole } from '@/src/types';
import { usersAPI } from '@/src/services/api';

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
  isLoading: boolean;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => void;
  setUser: (user: Partial<{ name: string; email: string; phone?: string; bio?: string; location?: string }>) => void;
  refreshProfile: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user: authUser, logout, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

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

  const user = profileData || (authUser
    ? {
        id: authUser.id,
        name: (authUser as any).full_name || authUser.email,
        email: authUser.email,
        role: authUser.role as UserRole,
        avatar: (authUser as any).avatar_url,
        bio: (authUser as any).bio,
        phone: (authUser as any).phone,
        location: (authUser as any).location,
        joinedDate: (authUser as any).created_at,
        clusters: [],
      }
    : null);

  const refreshProfile = async () => {
    if (!authUser) return;
    try {
      setIsLoading(true);
      const response = await usersAPI.getProfile(authUser.id);
      setProfileData({
        id: response.data.id,
        name: response.data.fullName || response.data.email,
        email: response.data.email,
        role: response.data.role as UserRole,
        avatar: response.data.avatarUrl,
        bio: response.data.bio,
        phone: response.data.phone,
        location: response.data.location,
        joinedDate: response.data.createdAt,
        clusters: [],
      });
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) {
      refreshProfile();
    }
  }, [authUser?.id]);

  const setRole = (_role: UserRole) => {
    // Role changes are managed server-side; no-op for UI compatibility
  };

  const setUser = async (data: Partial<{ name: string; email: string; phone?: string; bio?: string; location?: string }>) => {
    if (!authUser) return;
    await updateProfile({
      full_name: data.name ?? authUser.full_name,
      phone: data.phone,
      bio: data.bio,
    } as Parameters<typeof updateProfile>[0]);
    // Refresh profile after update
    await refreshProfile();
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
    isLoading,
    logout,
    setRole,
    setUser,
    refreshProfile,
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
