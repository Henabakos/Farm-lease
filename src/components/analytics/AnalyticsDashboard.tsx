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
  Maximize2
} from 'lucide-react';
import { Prediction, AnalyticsData } from '../../types';

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Yield & ROI Analytics</h2>
          <p className="text-gray-500">Predictive insights for your agricultural investments</p>
        </div>
        <button 
          onClick={handleCalculate}
          disabled={isCalculating}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
          {isCalculating ? 'Recalculating...' : 'Update Predictions'}
        </button>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-emerald-600" />
            Land Size (Hectares)
          </label>
          <input 
            type="number" 
            value={landSize}
            onChange={(e) => setLandSize(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Budget ($)
          </label>
          <input 
            type="number" 
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Region
          </label>
          <select 
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
          >
            {Object.keys(mockPredictions).map(r => (
              <option key={r} value={r}>{r} Region</option>
            ))}
          </select>
        </div>
      </div>

      {/* Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              +{prediction.roi}% ROI
            </span>
          </div>
          <p className="text-sm text-gray-500">Predicted ROI</p>
          <h3 className="text-2xl font-bold text-gray-900">{prediction.roi}%</h3>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
            <ArrowUpRight className="w-3 h-3" />
            <span>Above average</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Sprout className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Estimated Yield</p>
          <h3 className="text-2xl font-bold text-gray-900">{prediction.yield * (landSize / 10)} Tons</h3>
          <p className="mt-2 text-xs text-gray-500">Based on {landSize} hectares</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Projected Cost</p>
          <h3 className="text-2xl font-bold text-gray-900">${(prediction.cost * (landSize / 10)).toLocaleString()}</h3>
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
            <ArrowDownRight className="w-3 h-3" />
            <span>Within budget</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Info className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">High Confidence</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">Confidence Score</p>
          <h3 className="text-2xl font-bold text-gray-900">{prediction.confidence}%</h3>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
            <div 
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-1000" 
              style={{ width: `${prediction.confidence}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">ROI Growth Projection</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span>ROI %</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockAnalyticsData}>
                <defs>
                  <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="roi" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRoi)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Cost vs Yield Analysis</h3>
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }} />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAnalyticsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="cost" name="Cost ($)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="yield" name="Yield (Tons)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Risks & Insights */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Risk Assessment & Mitigation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prediction.risks.map((risk, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="mt-1 w-2 h-2 bg-amber-500 rounded-full shrink-0" />
              <div>
                <p className="font-medium text-gray-900">{risk}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Automated monitoring and early warning systems recommended for this region.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
