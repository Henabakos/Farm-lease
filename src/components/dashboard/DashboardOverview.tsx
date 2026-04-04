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
          <h1 className="text-4xl font-black tracking-tight text-foreground leading-tight">
            Welcome back, <span className="text-primary">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">
            Here's what's happening with your agricultural portfolio today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-12 px-6 rounded-2xl border-primary/10 bg-card/40 backdrop-blur-md hover:bg-primary/5 hover:text-primary transition-all">
            <Calendar className="w-5 h-5" />
            <span className="font-bold">Last 30 Days</span>
          </Button>
          <Button className="gap-2 h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <TrendingUp className="w-5 h-5" />
            <span className="font-bold">New Investment</span>
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group overflow-hidden relative rounded-[2rem] border border-primary/5 hover:border-primary/20">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                <stat.icon className="w-24 h-24 -mr-6 -mt-6 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
              </div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black px-3 py-1 rounded-xl text-xs">
                    {stat.change}
                  </Badge>
                </div>
                <div className="mt-6">
                  <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1">{stat.title}</p>
                  <h3 className="text-3xl font-black mt-2 tracking-tight text-foreground">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md overflow-hidden rounded-[2.5rem] border border-primary/5">
            <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black tracking-tight">Recent Projects</CardTitle>
                <CardDescription className="text-base font-medium">High-yield agricultural opportunities matching your profile.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="rounded-full text-primary hover:bg-primary/10 px-4 font-bold">View All</Button>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-5 p-5 rounded-[2rem] bg-primary/5 hover:bg-primary/10 transition-all duration-500 cursor-pointer group border border-transparent hover:border-primary/20">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-xl border-2 border-white/10">
                      <img 
                        src={`https://picsum.photos/seed/farm${i}/200/200`} 
                        alt="Farm" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xl font-black text-foreground truncate group-hover:text-primary transition-colors leading-tight">Green Valley Organic Maize</h4>
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.15em] bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full shrink-0">Active</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-5 mt-2 text-sm text-muted-foreground font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span>Kaduna, Nigeria</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                            <TrendingUp className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="font-bold text-foreground">22% ROI</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block pl-4 border-l border-primary/10">
                      <p className="text-2xl font-black text-primary tracking-tighter">$12,000</p>
                      <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mt-1">Invested</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-primary/5">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black tracking-tight">Yield Distribution</CardTitle>
              <CardDescription className="text-base font-medium">Performance by crop category.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <div className="space-y-8 pt-2">
                {[
                  { label: 'Maize', value: 45, color: 'bg-primary' },
                  { label: 'Soybeans', value: 30, color: 'bg-primary/70' },
                  { label: 'Cocoa', value: 15, color: 'bg-primary/40' },
                  { label: 'Others', value: 10, color: 'bg-primary/20' },
                ].map((item) => (
                  <div key={item.label} className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-black text-foreground tracking-tight">{item.label}</span>
                      <span className="text-primary font-black">{item.value}%</span>
                    </div>
                    <div className="h-3 w-full bg-primary/5 rounded-full overflow-hidden border border-primary/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full ${item.color} rounded-full shadow-lg shadow-primary/20`} 
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12 p-6 rounded-[2rem] bg-primary/5 border border-primary/10 group hover:bg-primary/10 transition-all duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <TrendingUp className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em]">Projected Growth</p>
                    <p className="text-xl font-black text-primary mt-1">+15.4% <span className="text-sm font-bold text-primary/60">next quarter</span></p>
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
