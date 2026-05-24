import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Sprout,
  FileText,
  Wallet,
  CheckCircle2,
  Clock,
  MapPin,
  Inbox,
} from 'lucide-react';
import { useRole } from '@/src/contexts/RoleContext';
import { useClusters } from '@/src/hooks/useClusters';
import { useProposals } from '@/src/hooks/useProposals';
import { usePayments } from '@/src/hooks/usePayments';
import { useAgreements } from '@/src/hooks/useAgreements';
import { container, item, StatCard, WelcomeHeader, EmptyState } from './_shared';

export const ClusterRepDashboard: React.FC = () => {
  const { user } = useRole();
  const navigate = useNavigate();
  const { clusters } = useClusters();
  const { proposals } = useProposals();
  const { payments } = usePayments();
  const { agreements } = useAgreements();

  const myClusters = useMemo(
    () => clusters.filter((c) => c.owner_id === user?.id),
    [clusters, user?.id],
  );
  const myClusterIds = new Set(myClusters.map((c) => c.id));

  const incomingProposals = useMemo(
    () => proposals.filter((p) => p.cluster_id && myClusterIds.has(p.cluster_id)),
    [proposals, myClusterIds],
  );
  const pendingReview = incomingProposals.filter((p) =>
    ['published', 'negotiating'].includes(p.status),
  );

  const clusterAgreements = agreements.filter((a) => myClusterIds.has(a.cluster_id));
  const pendingPayments = payments.filter((p) => p.status === 'pending');

  const totalMembers = myClusters.reduce((sum, c) => sum + (c.members_count || 0), 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
      <WelcomeHeader
        name={user?.name || 'Cluster Rep'}
        subtitle="Manage your clusters, review proposals, and verify payments."
        actions={
          <>
            <Button
              variant="outline"
              className="gap-2 h-9 px-4 rounded-md border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider"
              onClick={() => navigate('/payments')}
            >
              <Wallet className="w-3.5 h-3.5" />
              Verify payments
            </Button>
            <Button
              className="gap-2 h-9 px-4 rounded-md bg-primary text-[10px] font-bold uppercase tracking-wider"
              onClick={() => navigate('/proposals')}
            >
              <Inbox className="w-3.5 h-3.5" />
              Review proposals
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="My Clusters"
          value={myClusters.length}
          icon={Sprout}
          helper={`${totalMembers} total members`}
        />
        <StatCard
          title="Pending Proposals"
          value={pendingReview.length}
          icon={FileText}
          helper={`${incomingProposals.length} incoming total`}
        />
        <StatCard
          title="Active Agreements"
          value={clusterAgreements.filter((a) => a.status === 'active').length}
          icon={CheckCircle2}
          helper={`${clusterAgreements.length} total`}
        />
        <StatCard
          title="Payments to Verify"
          value={pendingPayments.length}
          icon={Wallet}
          helper="Awaiting review"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full border border-slate-200 shadow-sm bg-white overflow-hidden rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold tracking-tight text-slate-900">Proposals to Review</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Incoming proposals targeting your clusters.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-md text-primary hover:bg-primary/5 px-3 text-[10px] font-bold uppercase tracking-wider"
                onClick={() => navigate('/proposals')}
              >
                View all
              </Button>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              {pendingReview.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No pending proposals"
                  message="You're all caught up."
                />
              ) : (
                <div className="space-y-3">
                  {pendingReview.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-4 p-4 rounded-md bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200/50 cursor-pointer"
                      onClick={() => navigate(`/proposals/${p.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{p.title}</h4>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-bold uppercase tracking-wider bg-white text-slate-600 border-slate-200"
                          >
                            {p.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          {p.cluster_name && (
                            <div className="flex items-center gap-1.5">
                              <Sprout className="w-3 h-3 text-slate-400" />
                              <span>{p.cluster_name}</span>
                            </div>
                          )}
                          {p.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{p.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right hidden sm:block pl-4 border-l border-slate-200">
                        <p className="text-base font-bold text-primary tracking-tight">
                          {p.currency} {Number(p.proposed_price).toLocaleString()}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          Proposed
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full border border-slate-200 shadow-sm bg-white rounded-lg">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-base font-bold tracking-tight text-slate-900">Payments Pending Verification</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Submitted by investors awaiting review.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              {pendingPayments.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="No payments to verify" message="Queue is empty." />
              ) : (
                <div className="space-y-3">
                  {pendingPayments.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-md bg-slate-50 border border-slate-200/50 cursor-pointer hover:bg-slate-100"
                      onClick={() => navigate('/payments')}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">
                          {p.currency} {Number(p.amount).toLocaleString()}
                        </span>
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {p.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base font-bold tracking-tight text-slate-900">My Clusters</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Clusters you manage.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            {myClusters.length === 0 ? (
              <EmptyState
                icon={Sprout}
                title="No clusters yet"
                message="Create a cluster to start managing members."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {myClusters.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-md bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200/50 cursor-pointer"
                    onClick={() => navigate(`/clusters/${c.id}`)}
                  >
                    <h4 className="text-sm font-bold text-slate-900 truncate">{c.name}</h4>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {c.members_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {c.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
