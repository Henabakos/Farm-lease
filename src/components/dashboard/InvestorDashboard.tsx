import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  TrendingUp,
  FileSignature,
  FileText,
  ArrowUpRight,
  Plus,
  MapPin,
  Sprout,
} from 'lucide-react';
import { useRole } from '@/src/contexts/RoleContext';
import { useProposals } from '@/src/hooks/useProposals';
import { useAgreements } from '@/src/hooks/useAgreements';
import { usePayments } from '@/src/hooks/usePayments';
import { container, item, StatCard, WelcomeHeader, EmptyState } from './_shared';

export const InvestorDashboard: React.FC = () => {
  const { user } = useRole();
  const navigate = useNavigate();
  const { proposals } = useProposals();
  const { agreements } = useAgreements();
  const { payments } = usePayments();

  const myProposals = useMemo(
    () => proposals.filter((p) => p.investor_id === user?.id),
    [proposals, user?.id],
  );
  const activeProposals = myProposals.filter((p) =>
    ['published', 'negotiating'].includes(p.status),
  );
  const activeAgreements = agreements.filter((a) => a.status === 'active');
  const completedPayments = payments.filter((p) => p.status === 'completed');
  const totalInvested = completedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const upcomingPayments = payments
    .filter((p) => p.status === 'pending' && p.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
      <WelcomeHeader
        name={user?.name || 'Investor'}
        subtitle="Your investment portfolio at a glance."
        actions={
          <>
            <Button
              variant="outline"
              className="gap-2 h-9 px-4 rounded-md border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider"
              onClick={() => navigate('/clusters')}
            >
              <Sprout className="w-3.5 h-3.5" />
              Browse clusters
            </Button>
            <Button
              className="gap-2 h-9 px-4 rounded-md bg-primary text-[10px] font-bold uppercase tracking-wider"
              onClick={() => navigate('/proposals')}
            >
              <Plus className="w-3.5 h-3.5" />
              New proposal
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Invested"
          value={`$${totalInvested.toLocaleString()}`}
          icon={Wallet}
          helper={`${completedPayments.length} completed payments`}
        />
        <StatCard
          title="Active Proposals"
          value={activeProposals.length}
          icon={FileText}
          helper={`${myProposals.length} total proposals`}
        />
        <StatCard
          title="Active Agreements"
          value={activeAgreements.length}
          icon={FileSignature}
          helper={`${agreements.length} total`}
        />
        <StatCard
          title="Pending Payments"
          value={upcomingPayments.length}
          icon={TrendingUp}
          helper="Due soon"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full border border-slate-200 shadow-sm bg-white overflow-hidden rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold tracking-tight text-slate-900">My Recent Proposals</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Your latest investment proposals.
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
              {myProposals.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No proposals yet"
                  message="Create your first proposal to start investing."
                />
              ) : (
                <div className="space-y-3">
                  {myProposals.slice(0, 5).map((p) => (
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
                          {p.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{p.location}</span>
                            </div>
                          )}
                          {p.roi != null && (
                            <div className="flex items-center gap-1.5">
                              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-600">{p.roi}% ROI</span>
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
              <CardTitle className="text-base font-bold tracking-tight text-slate-900">Upcoming Payments</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Payments due soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              {upcomingPayments.length === 0 ? (
                <EmptyState icon={Wallet} title="No pending payments" message="You're all caught up." />
              ) : (
                <div className="space-y-3">
                  {upcomingPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-md bg-slate-50 border border-slate-200/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">
                          {p.currency} {Number(p.amount).toLocaleString()}
                        </span>
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {p.status}
                        </Badge>
                      </div>
                      {p.due_date && (
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                          Due {new Date(p.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};
