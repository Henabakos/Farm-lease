import React from 'react';
import { Sprout, TrendingUp, BarChart3, PieChart as PieChartIcon, ShieldCheck, Globe, Zap } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';

const lineData = [
  { name: 'MON', value: 400 },
  { name: 'TUE', value: 300 },
  { name: 'WED', value: 600 },
  { name: 'THU', value: 400 },
  { name: 'FRI', value: 500 },
];

const pieData = [
  { name: 'Completed', value: 42 },
  { name: 'Remaining', value: 58 },
];

const COLORS = ['#0d9488', 'rgba(13, 148, 136, 0.1)'];

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background font-sans">
      {/* Left Side: Form */}
      <div className="flex-1 flex flex-col p-8 md:p-16 lg:p-24 justify-center relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[120px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-md w-full mx-auto space-y-12 relative z-10"
        >
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <Sprout className="w-7 h-7 text-white" />
            </div>
            <span className="font-black text-3xl tracking-tighter text-primary">AgriInvest</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl font-black tracking-tighter text-foreground leading-none">{title}</h1>
            <p className="text-muted-foreground text-xl font-medium leading-relaxed">{subtitle}</p>
          </div>

          <div className="pt-2">
            {children}
          </div>

          <div className="pt-8 flex items-center gap-6 text-muted-foreground/40">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Global</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Instant</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side: Visuals */}
      <div className="hidden lg:flex flex-1 bg-[#020617] relative overflow-hidden items-center justify-center p-16">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-primary/20 blur-[150px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, -45, 0],
              opacity: [0.05, 0.1, 0.05]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]" 
          />
        </div>

        <div className="relative z-10 w-full max-w-xl space-y-16">
          {/* Main Visual Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] space-y-8 relative group"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white tracking-tight">Portfolio Performance</h3>
                <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Real-time Analytics</p>
              </div>
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#0d9488" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#0d9488', strokeWidth: 3, stroke: '#020617' }} 
                    activeDot={{ r: 8, fill: '#fff', strokeWidth: 4, stroke: '#0d9488' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Floating Stats */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-8 -bottom-8 bg-white rounded-[2rem] p-6 shadow-2xl w-56 border border-primary/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Yield Rate</p>
                  <p className="text-2xl font-black text-primary tracking-tighter">+18.4%</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center space-y-6 pt-8"
          >
            <h2 className="text-4xl font-black text-white tracking-tight leading-tight">Empowering the Future of <br/><span className="text-primary">Sustainable Agriculture</span></h2>
            <p className="text-white/40 text-xl font-medium leading-relaxed max-w-lg mx-auto">
              Join a global network of investors and farmers. Secure, transparent, and high-yield agricultural opportunities at your fingertips.
            </p>
            
            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#020617] overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-white/60 text-sm font-bold tracking-tight">Joined by <span className="text-white font-black">10k+</span> investors</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
