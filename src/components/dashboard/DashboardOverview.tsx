import React from 'react';
import { Loader2 } from 'lucide-react';
import { useRole } from '@/src/contexts/RoleContext';
import { InvestorDashboard } from './InvestorDashboard';
import { FarmerDashboard } from './FarmerDashboard';
import { ClusterRepDashboard } from './ClusterRepDashboard';
import { AdminDashboard } from '../admin/AdminDashboard';

/**
 * Role-aware dashboard router. Renders a tailored dashboard for each
 * authenticated user role directly under /dashboard.
 */
export const DashboardOverview: React.FC = () => {
  const { role, isLoading } = useRole();

  if (isLoading || !role) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  switch (role) {
    case 'INVESTOR':
      return <InvestorDashboard />;
    case 'FARMER':
      return <FarmerDashboard />;
    case 'CLUSTER_REP':
      return <ClusterRepDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <InvestorDashboard />;
  }
};
