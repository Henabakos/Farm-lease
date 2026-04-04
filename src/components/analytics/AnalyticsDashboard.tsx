import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Sprout, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Info,
  RefreshCw,
  MapPin,
  Maximize2,
  PieChart as PieChartIcon,
  Activity,
  Zap
} from 'lucide-react';
import { Prediction, AnalyticsData } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const mockAnalyticsData: AnalyticsData[] = [
  { month: 'Jan', roi: 12, cost: 5000, yield: 200 },
  { month: 'Feb', roi: 15, cost: 4800, yield: 220 },
  { month: 'Mar', roi: 18, cost: 5200, yield: 250 },
  { month: 'Apr', roi: 22, cost: 5500, yield: 300 },
  { month: 'May', roi: 25, cost: 5300, yield: 350 },
  { month: 'Jun', roi: 30, cost: 5800, yield: 420 },
];

const mockPredictions: Record<string, Prediction> = {
  'North': { yield: 450, roi: 32, cost: 6000, confidence: 92, risks: ['Early frost', 'Water scarcity'] },
  'South': { yield: 520, roi: 38, cost: 5500, confidence: 88, risks: ['Pest outbreak', 'High humidity'] },
  'East': { yield: 380, roi: 28, cost: 6200, confidence: 85, risks: ['Soil acidity', 'Logistics'] },
  'West': { yield: 410, roi: 30, cost: 5900, confidence: 90, risks: ['Wind damage', 'Market volatility'] },
};

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

export const AnalyticsDashboard: React.FC = () => {
  const [landSize, setLandSize] = useState<number>(10);
  const [budget, setBudget] = useState<number>(50000);
  const [region, setRegion] = useState<string>('North');
  const [isCalculating, setIsCalculating] = useState(false);

  const prediction = mockPredictions[region];

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => setIsCalculating(false), 1500);
  };

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
            Yield & ROI <span className="text-primary">Analytics</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">
            Predictive insights and data-driven projections for your agricultural investments.
          </p>
        </div>
        <Button 
          onClick={handleCalculate}
          disabled={isCalculating}
          className="gap-2 h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className={cn("w-5 h-5", isCalculating && "animate-spin")} />
          <span className="font-bold">{isCalculating ? 'Recalculating...' : 'Update Predictions'}</span>
        </Button>
      </motion.div>

      {/* Input Section */}
      <motion.div variants={item}>
        <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-primary/5">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <Label className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Land Size (Hectares)
                </Label>
                <Input 
                  type="number" 
                  value={landSize}
                  onChange={(e) => setLandSize(Number(e.target.value))}
                  className="bg-background/40 border-primary/10 focus-visible:ring-primary/20 h-12 rounded-2xl text-base transition-all font-bold"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  Budget ($)
                </Label>
                <Input 
                  type="number" 
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="bg-background/40 border-primary/10 focus-visible:ring-primary/20 h-12 rounded-2xl text-base transition-all font-bold"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Region
                </Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="bg-background/40 border-primary/10 h-12 rounded-2xl focus:ring-primary/20 text-base transition-all font-bold">
                    <SelectValue placeholder="Select Region" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-primary/10 backdrop-blur-xl">
                    <SelectItem value="North">North Region</SelectItem>
                    <SelectItem value="South">South Region</SelectItem>
                    <SelectItem value="East">East Region</SelectItem>
                    <SelectItem value="West">West Region</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={item}>
          <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2rem] border border-primary/5 hover:border-primary/20 transition-all group">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <Sprout className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em]">Expected Yield</p>
              <h3 className="text-3xl font-black mt-2 tracking-tight text-foreground">{prediction.yield} <span className="text-sm font-bold text-muted-foreground">tons</span></h3>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2rem] border border-primary/5 hover:border-primary/20 transition-all group">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em]">Projected ROI</p>
              <h3 className="text-3xl font-black mt-2 tracking-tight text-emerald-600">{prediction.roi}%</h3>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2rem] border border-primary/5 hover:border-primary/20 transition-all group">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-[0.2em]">Confidence</p>
              <h3 className="text-3xl font-black mt-2 tracking-tight text-blue-600">{prediction.confidence}%</h3>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2rem] border border-primary/5 hover:border-primary/20 transition-all group">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-[0.2em]">Active Risks</p>
              <h3 className="text-3xl font-black mt-2 tracking-tight text-amber-600">{prediction.risks.length} <span className="text-sm font-bold text-muted-foreground">identified</span></h3>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={item}>
          <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-primary/5">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                <Activity className="w-6 h-6 text-primary" />
                Performance Trends
              </CardTitle>
              <CardDescription className="text-base font-medium">Historical ROI and Yield growth over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockAnalyticsData}>
                  <defs>
                    <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--primary)/0.1)" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderRadius: '16px', 
                      border: '1px solid hsl(var(--primary)/0.1)',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="roi" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorRoi)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-primary/5">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                <PieChartIcon className="w-6 h-6 text-primary" />
                Cost vs Yield Distribution
              </CardTitle>
              <CardDescription className="text-base font-medium">Monthly operational costs compared to agricultural output.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockAnalyticsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--primary)/0.1)" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 700 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderRadius: '16px', 
                      border: '1px solid hsl(var(--primary)/0.1)',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 700 }} />
                  <Bar dataKey="cost" fill="hsl(var(--primary)/0.4)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="yield" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Risks Section */}
      <motion.div variants={item}>
        <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-primary/5">
          <CardHeader className="p-8">
            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              Risk Mitigation Strategies
            </CardTitle>
            <CardDescription className="text-base font-medium">Recommended actions to address identified regional risks.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prediction.risks.map((risk, idx) => (
                <div key={idx} className="flex items-start gap-4 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-110 transition-transform">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-foreground">{risk}</h4>
                    <p className="text-sm text-muted-foreground mt-1 font-medium leading-relaxed">
                      Implement advanced monitoring and early warning systems to mitigate the impact of {risk.toLowerCase()} in the {region} region.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
