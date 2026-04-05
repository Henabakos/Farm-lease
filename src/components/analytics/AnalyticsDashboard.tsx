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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            Yield & ROI <span className="text-primary">Analytics</span>
          </h1>
          <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">
            Predictive insights and data-driven projections for your agricultural investments.
          </p>
        </div>
        <Button 
          onClick={handleCalculate}
          disabled={isCalculating}
          className="gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95 text-[10px] font-bold uppercase tracking-wider"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isCalculating && "animate-spin")} />
          <span>{isCalculating ? 'Recalculating...' : 'Update Predictions'}</span>
        </Button>
      </motion.div>

      {/* Input Section */}
      <motion.div variants={item}>
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5" />
                  Land Size (Hectares)
                </Label>
                <Input 
                  type="number" 
                  value={landSize}
                  onChange={(e) => setLandSize(Number(e.target.value))}
                  className="bg-white border-slate-200 focus-visible:ring-primary/20 h-10 rounded-md text-sm transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  Budget ($)
                </Label>
                <Input 
                  type="number" 
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="bg-white border-slate-200 focus-visible:ring-primary/20 h-10 rounded-md text-sm transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Region
                </Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="bg-white border-slate-200 h-10 rounded-md focus:ring-primary/20 text-sm transition-all font-medium">
                    <SelectValue placeholder="Select Region" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-slate-200">
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
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg hover:shadow-md transition-all group active:scale-95">
            <CardContent className="p-5">
              <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-105 transition-transform">
                <Sprout className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expected Yield</p>
              <h3 className="text-2xl font-bold mt-1 tracking-tight text-slate-900">{prediction.yield} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">tons</span></h3>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg hover:shadow-md transition-all group active:scale-95">
            <CardContent className="p-5">
              <div className="w-9 h-9 rounded-md bg-emerald-50/50 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Projected ROI</p>
              <h3 className="text-2xl font-bold mt-1 tracking-tight text-emerald-600">{prediction.roi}%</h3>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg hover:shadow-md transition-all group active:scale-95">
            <CardContent className="p-5">
              <div className="w-9 h-9 rounded-md bg-blue-50/50 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-105 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confidence</p>
              <h3 className="text-2xl font-bold mt-1 tracking-tight text-blue-600">{prediction.confidence}%</h3>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg hover:shadow-md transition-all group active:scale-95">
            <CardContent className="p-5">
              <div className="w-9 h-9 rounded-md bg-amber-50/50 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Risks</p>
              <h3 className="text-2xl font-bold mt-1 tracking-tight text-amber-600">{prediction.risks.length} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">identified</span></h3>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={item}>
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Performance Trends
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Historical ROI and Yield growth over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockAnalyticsData}>
                  <defs>
                    <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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
                  <Area 
                    type="monotone" 
                    dataKey="roi" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRoi)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-primary" />
                Cost vs Yield Distribution
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly operational costs compared to agricultural output.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockAnalyticsData}>
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
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 500 }} />
                  <Bar dataKey="cost" fill="hsl(var(--primary)/0.2)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="yield" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Risks Section */}
      <motion.div variants={item}>
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardHeader className="p-5">
            <CardTitle className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Risk Mitigation Strategies
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recommended actions to address identified regional risks.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prediction.risks.map((risk, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 rounded-md bg-slate-50 border border-slate-200/50 hover:bg-slate-100 transition-colors group active:scale-95">
                  <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition-transform">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{risk}</h4>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed">
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
