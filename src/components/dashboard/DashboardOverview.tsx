import React from 'react';
import { useRole } from '@/src/contexts/RoleContext';
import { InvestorDashboard } from './InvestorDashboard';
import { FarmerDashboard } from './FarmerDashboard';
import { ClusterRepDashboard } from './ClusterRepDashboard';

export function DashboardOverview() {
  const { role } = useRole();

  // Render role-specific dashboard
  switch (role) {
    case 'INVESTOR':
      return <InvestorDashboard />;
    case 'FARMER':
      return <FarmerDashboard />;
    case 'CLUSTER_REP':
      return <ClusterRepDashboard />;
    case 'ADMIN':
      // Admin will be routed to AdminDashboard directly in App.tsx
      return null;
    default:
      return null;
  }
}
