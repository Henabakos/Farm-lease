import React from 'react';
import { useRole } from '@/src/contexts/RoleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sprout, 
  Tractor, 
  CloudSun, 
  Wheat, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  MapPin,
  Droplets,
  Thermometer,
  Activity
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

export function FarmerDashboard() {
  const { user } = useRole();

  const stats = [
    { title: 'Total Land', value: '45 ha', change: '+5 ha', icon: Sprout, color: 'text-primary', trend: 'up' },
    { title: 'Active Crops', value: '8', change: '+2', icon: Wheat, color: 'text-primary', trend: 'up' },
    { title: 'Yield Rate', value: '92%', change: '+3%', icon: TrendingUp, color: 'text-primary', trend: 'up' },
    { title: 'Equipment', value: '12', change: 'All OK', icon: Tractor, color: 'text-primary', trend: 'stable' },
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
            Here's what's happening with your farm operations today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-9 px-4 rounded-md border-slate-200 bg-white hover:bg-slate-50 hover:text-primary transition-all shadow-sm active:scale-95 text-[10px] font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>This Season</span>
          </Button>
          <Button className="gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95 text-[10px] font-bold uppercase tracking-wider">
            <Sprout className="w-3.5 h-3.5" />
            <span>New Crop</span>
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

      {/* Weather and Conditions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item}>
          <Card className="h-full border border-slate-200 shadow-sm bg-white rounded-lg">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-primary" />
                Weather Conditions
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current and forecasted conditions.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Thermometer className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold text-slate-700">Temperature</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">28°C</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold text-slate-700">Humidity</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">65%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Droplets className="w-4 h-4 text-cyan-500" />
                    <span className="text-xs font-bold text-slate-700">Rainfall</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">12mm</span>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-md bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Optimal growing conditions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full border border-slate-200 shadow-sm bg-white overflow-hidden rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold tracking-tight text-slate-900">Active Crops</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current season crop management.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="rounded-md text-primary hover:bg-primary/5 px-3 text-[10px] font-bold uppercase tracking-wider">View All</Button>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              <div className="space-y-4">
                {[
                  { name: 'Maize', status: 'Growing', progress: 65, area: '15 ha' },
                  { name: 'Soybeans', status: 'Growing', progress: 45, area: '12 ha' },
                  { name: 'Cassava', status: 'Harvest Ready', progress: 100, area: '8 ha' },
                ].map((crop, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-md bg-slate-50 hover:bg-slate-100 transition-all duration-200 border border-slate-200/50">
                    <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Wheat className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{crop.name}</h4>
                        <Badge variant={crop.status === 'Harvest Ready' ? 'default' : 'secondary'} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0">
                          {crop.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <span>{crop.area}</span>
                        <span className="text-primary">{crop.progress}% complete</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${crop.progress}%` }}
                          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full bg-primary rounded-full" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
