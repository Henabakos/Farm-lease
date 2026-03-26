import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, User } from '@/src/types';

interface RoleContextType {
  user: User;
  isLoggedIn: boolean;
  setRole: (role: UserRole) => void;
  login: (role: UserRole) => void;
  logout: () => void;
}

const MOCK_USERS: Record<UserRole, User> = {
  INVESTOR: {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex@invest.com',
    role: 'INVESTOR',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    bio: 'Experienced agricultural investor focused on sustainable farming and high-yield crop production in West Africa.',
    phone: '+1 (555) 123-4567',
    location: 'New York, USA',
    joinedDate: '2024-01-15',
  },
  FARMER: {
    id: '2',
    name: 'Sarah Miller',
    email: 'sarah@farm.com',
    role: 'FARMER',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    bio: 'Third-generation maize farmer passionate about organic practices and community development.',
    phone: '+234 801 234 5678',
    location: 'Kaduna, Nigeria',
    joinedDate: '2024-03-10',
    clusters: [
      { id: 'c1', name: 'Kaduna North Maize Cluster', location: 'Kaduna', region: 'North West', memberCount: 120, isVerified: true, size: 450, establishedDate: '2023-05-10' },
      { id: 'c2', name: 'Organic Growers Association', location: 'Zaria', region: 'North West', memberCount: 45, isVerified: true, size: 120, establishedDate: '2023-08-22' },
    ]
  },
  CLUSTER_REP: {
    id: '3',
    name: 'Robert Chen',
    email: 'robert@cluster.com',
    role: 'CLUSTER_REP',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
    bio: 'Agricultural coordinator with 10 years of experience in managing large-scale farming clusters and supply chains.',
    phone: '+234 802 345 6789',
    location: 'Abuja, Nigeria',
    joinedDate: '2024-02-20',
  },
  ADMIN: {
    id: '4',
    name: 'Admin User',
    email: 'admin@agriinvest.com',
    role: 'ADMIN',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    bio: 'Platform administrator responsible for system oversight and user management.',
    phone: '+1 (555) 987-6543',
    location: 'Remote',
    joinedDate: '2023-12-01',
  }
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(MOCK_USERS.INVESTOR);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const setRole = (role: UserRole) => {
    setUser(MOCK_USERS[role]);
  };

  const login = (role: UserRole) => {
    setUser(MOCK_USERS[role]);
    setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
  };

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
