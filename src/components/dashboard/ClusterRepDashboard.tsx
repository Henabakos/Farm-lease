import React from 'react';
import { useRole } from '@/src/contexts/RoleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  MapPin, 
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Sprout
} from 'lucide-react';
import { motion } from 'motion/react';

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

export function ClusterRepDashboard() {
  const { user } = useRole();

  const stats = [
    { title: 'Total Farmers', value: '156', change: '+12', icon: Users, color: 'text-primary', trend: 'up' },
    { title: 'Active Proposals', value: '23', change: '+5', icon: Sprout, color: 'text-primary', trend: 'up' },
    { title: 'Total Investment', value: '$450K', change: '+$50K', icon: Building2, color: 'text-primary', trend: 'up' },
    { title: 'Completion Rate', value: '87%', change: '+2%', icon: CheckCircle2, color: 'text-primary', trend: 'up' },
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            Welcome back, <span className="text-primary">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 mt-1 text-xs font-bold uppercase tracking-wider">
            Here's what's happening in your cluster today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-9 px-4 rounded-md border-slate-200 bg-white hover:bg-slate-50 hover:text-primary transition-all shadow-sm active:scale-95 text-[10px] font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>This Month</span>
          </Button>
          <Button className="gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95 text-[10px] font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            <span>Add Farmer</span>
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-all duration-200 group overflow-hidden relative rounded-lg">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300">
                <stat.icon className="w-16 h-16 -mr-4 -mt-4 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
              </div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center ${stat.color} group-hover:scale-105 transition-transform duration-300`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-medium px-2 py-0.5 rounded-md text-xs">
                    {stat.change}
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1 tracking-tight text-slate-900">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Cluster Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full border border-slate-200 shadow-sm bg-white overflow-hidden rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold tracking-tight text-slate-900">Recent Proposals</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Investment proposals from farmers in your cluster.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="rounded-md text-primary hover:bg-primary/5 px-3 text-[10px] font-bold uppercase tracking-wider">View All</Button>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              <div className="space-y-4">
                {[
                  { farmer: 'John Doe', crop: 'Maize', amount: '$15,000', status: 'Pending', location: 'Kaduna' },
                  { farmer: 'Mary Smith', crop: 'Soybeans', amount: '$22,000', status: 'Approved', location: 'Kano' },
                  { farmer: 'Ahmed Ibrahim', crop: 'Cassava', amount: '$18,500', status: 'In Review', location: 'Sokoto' },
                ].map((proposal, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-md bg-slate-50 hover:bg-slate-100 transition-all duration-200 cursor-pointer group border border-slate-200/50 hover:border-slate-300">
                    <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-primary transition-colors leading-tight">{proposal.farmer}</h4>
                        <Badge variant={
                          proposal.status === 'Approved' ? 'default' : 
                          proposal.status === 'Pending' ? 'secondary' : 'outline'
                        } className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0">
                          {proposal.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{proposal.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Sprout className="w-3 h-3 text-primary" />
                          <span>{proposal.crop}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block pl-4 border-l border-slate-200">
                      <p className="text-lg font-bold text-primary tracking-tight">{proposal.amount}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Requested</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full border border-slate-200 shadow-sm bg-white rounded-lg">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-base font-bold tracking-tight text-slate-900">Cluster Performance</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Key metrics overview.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              <div className="space-y-6 pt-2">
                {[
                  { label: 'Proposals Approved', value: 45, color: 'bg-primary' },
                  { label: 'Proposals Pending', value: 23, color: 'bg-amber-500' },
                  { label: 'Proposals Rejected', value: 8, color: 'bg-red-500' },
                  { label: 'In Progress', value: 15, color: 'bg-blue-500' },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-slate-700 tracking-tight">{item.label}</span>
                      <span className="text-primary">{item.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.value / 91) * 100}%` }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full ${item.color} rounded-full`} 
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-md bg-slate-50 border border-slate-200 group hover:bg-slate-100 transition-all duration-200 active:scale-95">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cluster Growth</p>
                    <p className="text-base font-bold text-primary mt-0.5">+23% <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">this quarter</span></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
