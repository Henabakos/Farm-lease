import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sprout,
  Users,
  Calendar,
  MessageSquare,
  MapPin,
  BookOpen,
  FileSignature,
  Clock,
} from 'lucide-react';
import { useRole } from '@/src/contexts/RoleContext';
import { useClusters } from '@/src/hooks/useClusters';
import { useMeetings } from '@/src/hooks/useMeetings';
import { useAgreements } from '@/src/hooks/useAgreements';
import { container, item, StatCard, WelcomeHeader, EmptyState } from './_shared';

export const FarmerDashboard: React.FC = () => {
  const { user } = useRole();
  const navigate = useNavigate();
  const { clusters } = useClusters();
  const { meetings } = useMeetings();
  const { agreements } = useAgreements();

  const myAgreements = useMemo(
    () => agreements.filter((a) => a.tenant_id === user?.id),
    [agreements, user?.id],
  );
  const activeAgreements = myAgreements.filter((a) => a.status === 'active');

  const upcomingMeetings = useMemo(
    () =>
      meetings
        .filter((m) => m.status === 'SCHEDULED' && new Date(m.scheduledAt).getTime() > Date.now())
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 5),
    [meetings],
  );

  const myCluster = clusters[0]; // farmers belong to clusters; show first one as primary

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
      <WelcomeHeader
        name={user?.name || 'Farmer'}
        subtitle="Your cluster, agreements, and upcoming meetings."
        actions={
          <>
            <Button
              variant="outline"
              className="gap-2 h-9 px-4 rounded-md border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold uppercase tracking-wider"
              onClick={() => navigate('/resources')}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Resources
            </Button>
            <Button
              className="gap-2 h-9 px-4 rounded-md bg-primary text-[10px] font-bold uppercase tracking-wider"
              onClick={() => navigate('/clusters')}
            >
              <Sprout className="w-3.5 h-3.5" />
              My cluster
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="My Clusters"
          value={clusters.length}
          icon={Sprout}
          helper={myCluster ? myCluster.name : 'No cluster yet'}
        />
        <StatCard
          title="Active Agreements"
          value={activeAgreements.length}
          icon={FileSignature}
          helper={`${myAgreements.length} total`}
        />
        <StatCard
          title="Upcoming Meetings"
          value={upcomingMeetings.length}
          icon={Calendar}
          helper="Scheduled"
        />
        <StatCard
          title="Cluster Members"
          value={myCluster?.members_count ?? 0}
          icon={Users}
          helper="In your primary cluster"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full border border-slate-200 shadow-sm bg-white overflow-hidden rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold tracking-tight text-slate-900">My Cluster</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Cluster you're a member of.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-md text-primary hover:bg-primary/5 px-3 text-[10px] font-bold uppercase tracking-wider"
                onClick={() => navigate('/clusters')}
              >
                View all
              </Button>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              {clusters.length === 0 ? (
                <EmptyState
                  icon={Sprout}
                  title="No cluster yet"
                  message="Join or get assigned to a cluster to see details."
                />
              ) : (
                <div className="space-y-3">
                  {clusters.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-4 p-4 rounded-md bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200/50 cursor-pointer"
                      onClick={() => navigate(`/clusters/${c.id}`)}
                    >
                      <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Sprout className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{c.name}</h4>
                        <div className="flex flex-wrap items-center gap-4 mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{c.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>{c.members_count} members</span>
                          </div>
                          {c.area_hectares != null && (
                            <span>{c.area_hectares} ha</span>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold uppercase tracking-wider bg-white text-slate-600 border-slate-200"
                      >
                        {c.status}
                      </Badge>
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
              <CardTitle className="text-base font-bold tracking-tight text-slate-900">Upcoming Meetings</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Your scheduled sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              {upcomingMeetings.length === 0 ? (
                <EmptyState icon={Calendar} title="No meetings" message="Nothing scheduled yet." />
              ) : (
                <div className="space-y-3">
                  {upcomingMeetings.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-md bg-slate-50 border border-slate-200/50 cursor-pointer hover:bg-slate-100"
                      onClick={() => navigate('/meetings')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">{m.title}</span>
                        <Badge variant="outline" className="text-[9px] uppercase shrink-0">
                          {m.provider}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(m.scheduledAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                className="w-full mt-4 gap-2 text-[10px] font-bold uppercase tracking-wider"
                onClick={() => navigate('/messages')}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Open messages
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};
