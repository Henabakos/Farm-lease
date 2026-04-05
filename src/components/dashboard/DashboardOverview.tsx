import React from 'react';
import { useRole } from '@/src/contexts/RoleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Sprout, 
  Users, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare
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

export function DashboardOverview() {
  const { user } = useRole();

  const stats = [
    { title: 'Total Portfolio', value: '$124,500.00', change: '+12.5%', icon: Wallet, color: 'text-primary', trend: 'up' },
    { title: 'Active Investments', value: '12', change: '+2', icon: TrendingUp, color: 'text-primary', trend: 'up' },
    { title: 'Farms Supported', value: '45', change: '+5', icon: Sprout, color: 'text-primary', trend: 'up' },
    { title: 'Yield Rate', value: '18.4%', change: '+1.2%', icon: ArrowUpRight, color: 'text-primary', trend: 'up' },
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
            Here's what's happening with your agricultural portfolio today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-9 px-4 rounded-md border-slate-200 bg-white hover:bg-slate-50 hover:text-primary transition-all shadow-sm active:scale-95 text-[10px] font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Last 30 Days</span>
          </Button>
          <Button className="gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95 text-[10px] font-bold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>New Investment</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full border border-slate-200 shadow-sm bg-white overflow-hidden rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold tracking-tight text-slate-900">Recent Projects</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">High-yield agricultural opportunities matching your profile.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="rounded-md text-primary hover:bg-primary/5 px-3 text-[10px] font-bold uppercase tracking-wider">View All</Button>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-md bg-slate-50 hover:bg-slate-100 transition-all duration-200 cursor-pointer group border border-slate-200/50 hover:border-slate-300">
                    <div className="w-14 h-14 rounded-md overflow-hidden shrink-0 shadow-sm border border-slate-200">
                      <img 
                        src={`https://picsum.photos/seed/farm${i}/200/200`} 
                        alt="Farm" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-primary transition-colors leading-tight">Green Valley Organic Maize</h4>
                        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-white text-slate-600 border-slate-200 px-2 py-0.5 rounded-md shrink-0">Active</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>Kaduna, Nigeria</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600">22% ROI</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block pl-4 border-l border-slate-200">
                      <p className="text-lg font-bold text-primary tracking-tight">$12,000</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Invested</p>
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
              <CardTitle className="text-base font-bold tracking-tight text-slate-900">Yield Distribution</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Performance by crop category.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              <div className="space-y-6 pt-2">
                {[
                  { label: 'Maize', value: 45, color: 'bg-primary' },
                  { label: 'Soybeans', value: 30, color: 'bg-primary/70' },
                  { label: 'Cocoa', value: 15, color: 'bg-primary/40' },
                  { label: 'Others', value: 10, color: 'bg-primary/20' },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-slate-700 tracking-tight">{item.label}</span>
                      <span className="text-primary">{item.value}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
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
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Projected Growth</p>
                    <p className="text-base font-bold text-primary mt-0.5">+15.4% <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">next quarter</span></p>
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
