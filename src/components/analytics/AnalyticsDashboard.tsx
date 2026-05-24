import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, AreaChart, Area 
} from 'recharts';
import { 
  DollarSign, 
  Sprout, 
  RefreshCw,
  MapPin,
  Maximize2,
  PieChart as PieChartIcon,
  Activity,
  Brain,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'motion/react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { clustersAPI } from '../../services/api';
import { aiAPI } from '../../services/ai';
import { ClusterAdvisory } from './ClusterAdvisory';

export const AnalyticsDashboard: React.FC = () => {
  const { 
    revenueData, 
    usersByRole, 
    proposalsByStatus, 
    topClusters, 
    isLoading 
  } = useAnalytics();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10 border-t border-slate-100 pt-10"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
            System & Financial <span className="text-primary">Analytics</span>
          </h2>
          <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">
            Real-time platform metrics and financial flow analysis.
          </p>
        </div>
      </motion.div>

      {isLoading ? (
        <motion.div variants={item} className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
        </motion.div>
      ) : (
        <>
          {/* Real Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div variants={item}>
              <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                <CardHeader className="p-5 pb-0">
                  <CardTitle className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    System Financial Flow
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Monthly disbursements, repayments, and service fees processing status.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 h-[350px]">
                  {revenueData && revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="colorDisb" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorRepay" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            borderRadius: '8px', 
                            border: '1px solid hsl(var(--border))',
                            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                            padding: '8px 12px'
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="disbursement" 
                          name="Disbursements"
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorDisb)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="repayment" 
                          name="Repayments"
                          stroke="#10b981" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorRepay)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                      No financial data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                <CardHeader className="p-5 pb-0">
                  <CardTitle className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    User Roles & Proposals Distribution
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Breakdown of active users and platform proposals status.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 h-[350px]">
                  {usersByRole.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={usersByRole.map((u: any) => ({
                        name: u.role,
                        Users: u.count,
                        Proposals: proposalsByStatus.find((p: any) => p.status === u.role)?.count || 0
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: '#ffffff'
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 500 }} />
                        <Bar dataKey="Users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Proposals" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                      No user data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Top Performing Clusters List */}
          {topClusters && topClusters.length > 0 && (
            <motion.div variants={item}>
              <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                <CardHeader className="p-5">
                  <CardTitle className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-primary" />
                    Top Clusters by Activity
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Most active clusters by investment proposal volume.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topClusters.map((cluster: any, idx: number) => (
                      <div key={cluster.id || idx} className="flex items-start gap-3 p-4 rounded-md bg-slate-50 border border-slate-200/50 hover:bg-slate-100 transition-colors">
                        <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 font-bold text-xs">
                          #{idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">{cluster.name}</h4>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">
                            {cluster.location} • {cluster.proposalCount || 0} Proposals
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};
