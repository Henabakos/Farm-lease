import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, setAccessToken, setRefreshToken, usersAPI, AUTH_LOGOUT_EVENT } from '../services/api';
import { disconnect as disconnectSocket, reconnectWithToken } from '../services/realtime';
import { toast } from 'sonner';

// Roles are now the canonical 4-role taxonomy emitted by the new backend
// (Phase 4 of the backend rewrite). The legacy owner/tenant/admin mapping
// in `src/lib/apiMappers.ts` is deprecated and only retained for the
// non-role mappers (cluster/proposal/agreement/payment shape adapters).
interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'INVESTOR' | 'FARMER' | 'CLUSTER_REP' | 'ADMIN';
  avatar_url?: string;
  phone?: string;
  bio?: string;
  verification_status: 'unverified' | 'pending' | 'verified';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth on mount + listen for hard-logout signals from the API layer.
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          setAccessToken(token);
          // The api interceptor will attempt a refresh on 401, so a stale
          // access token won't immediately log the user out.
          const response = await authAPI.getCurrentUser();
          setUser(response.data);
          reconnectWithToken();
        }
      } catch (error) {
        // getCurrentUser failed even after the refresh attempt — session is gone.
        setAccessToken(null);
        setRefreshToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const onForcedLogout = () => {
      setUser(null);
      disconnectSocket();
      toast.error('Your session has expired. Please log in again.');
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, onForcedLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onForcedLogout);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });
      
      const { access_token, refresh_token, user: userData } = response.data;

      setAccessToken(access_token);
      setRefreshToken(refresh_token);

      setUser(userData);
      reconnectWithToken();
      toast.success('Logged in successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string, role: string) => {
    try {
      setIsLoading(true);
      await authAPI.register({ email, password, fullName, role });
      
      toast.success('Registration successful! Please log in.');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const refreshToken = localStorage.getItem('refreshToken');
      await authAPI.logout(refreshToken || undefined);

      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      disconnectSocket();

      toast.success('Logged out successfully');
    } catch (error: any) {
      // Still clear local state even if server call fails.
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      disconnectSocket();
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) return;
      
      setIsLoading(true);
      const response = await usersAPI.updateProfile(user.id, data);
      
      setUser(response.data);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
