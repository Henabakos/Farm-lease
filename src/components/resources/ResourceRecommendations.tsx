import React, { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { 
  ShieldCheck, 
  Users, 
  Wrench, 
  Star, 
  Search, 
  Filter, 
  ExternalLink, 
  Mail, 
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Resource, CropType } from '../../types';
import { useRole } from '../../contexts/RoleContext';
import { toast } from 'sonner';

const mockResources: Resource[] = [
  {
    id: 'r1',
    title: 'AgriGuard Crop Insurance',
    category: 'INSURANCE',
    provider: 'Global Agro Insurance',
    description: 'Comprehensive coverage against drought, pests, and unexpected weather events. Specifically tailored for large-scale grain production.',
    priceRange: '$50 - $200 / hectare',
    rating: 4.8,
    reviewCount: 124,
    cropTypes: ['MAIZE', 'SOYBEANS', 'RICE'],
    imageUrl: 'https://picsum.photos/seed/insurance/400/250',
    contactEmail: 'support@agriguard.com',
    websiteUrl: 'https://example.com/agriguard'
  },
  {
    id: 'r2',
    title: 'Seasonal Harvest Labor Force',
    category: 'LABOR',
    provider: 'AgriStaff Solutions',
    description: 'Vetted and experienced seasonal workers for harvest and planting. Includes on-site management and basic training.',
    priceRange: '$15 - $25 / day / worker',
    rating: 4.5,
    reviewCount: 89,
    cropTypes: ['COCOA', 'CASSAVA', 'MAIZE'],
    imageUrl: 'https://picsum.photos/seed/labor/400/250',
    contactEmail: 'hire@agristaff.com'
  },
  {
    id: 'r3',
    title: 'Precision Soil Analysis',
    category: 'SUPPORT',
    provider: 'TerraTech Labs',
    description: 'Advanced soil testing and nutrient mapping to optimize fertilizer application and maximize yield potential.',
    priceRange: '$120 / plot',
    rating: 4.9,
    reviewCount: 56,
    cropTypes: ['MAIZE', 'SOYBEANS', 'COCOA', 'RICE', 'CASSAVA'],
    imageUrl: 'https://picsum.photos/seed/support/400/250',
    websiteUrl: 'https://example.com/terratech'
  },
  {
    id: 'r4',
    title: 'Cocoa Yield Protection',
    category: 'INSURANCE',
    provider: 'Heritage Mutual',
    description: 'Specialized insurance for perennial crops, covering disease outbreaks and market price fluctuations.',
    priceRange: '$300 - $500 / hectare',
    rating: 4.7,
    reviewCount: 42,
    cropTypes: ['COCOA'],
    imageUrl: 'https://picsum.photos/seed/cocoa/400/250',
    contactEmail: 'cocoa@heritage.com'
  },
  {
    id: 'r5',
    title: 'Tractor Fleet Rental',
    category: 'SUPPORT',
    provider: 'Mechanized Africa',
    description: 'Modern tractor and harvester rentals with maintenance support and GPS tracking for efficient field operations.',
    priceRange: '$80 / hour',
    rating: 4.6,
    reviewCount: 215,
    cropTypes: ['MAIZE', 'SOYBEANS', 'RICE'],
    imageUrl: 'https://picsum.photos/seed/tractor/400/250',
    websiteUrl: 'https://example.com/mechanized'
  },
  {
    id: 'r6',
    title: 'Organic Fertilizer Supply',
    category: 'SUPPORT',
    provider: 'EcoFarm Inputs',
    description: 'Bulk supply of certified organic fertilizers and bio-pesticides for sustainable farming practices.',
    priceRange: '$40 / bag',
    rating: 4.4,
    reviewCount: 78,
    cropTypes: ['MAIZE', 'SOYBEANS', 'CASSAVA'],
    imageUrl: 'https://picsum.photos/seed/fertilizer/400/250',
    contactEmail: 'sales@ecofarm.com'
  }
];

const cropOptions: { label: string; value: CropType | 'ALL' }[] = [
  { label: 'All Crops', value: 'ALL' },
  { label: 'Maize', value: 'MAIZE' },
  { label: 'Soybeans', value: 'SOYBEANS' },
  { label: 'Cocoa', value: 'COCOA' },
  { label: 'Rice', value: 'RICE' },
  { label: 'Cassava', value: 'CASSAVA' },
];

const categoryIcons = {
  INSURANCE: ShieldCheck,
  LABOR: Users,
  SUPPORT: Wrench,
};

export const ResourceRecommendations: React.FC = () => {
  const { user } = useRole();
  const [selectedCrop, setSelectedCrop] = useState<CropType | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'INSURANCE' | 'LABOR' | 'SUPPORT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResources = mockResources.filter(resource => {
    const matchesCrop = selectedCrop === 'ALL' || resource.cropTypes.includes(selectedCrop as CropType);
    const matchesCategory = selectedCategory === 'ALL' || resource.category === selectedCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         resource.provider.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCrop && matchesCategory && matchesSearch;
  });

  const recommendedResources = mockResources.filter(resource => {
    if (user.role === 'FARMER' || user.role === 'CLUSTER_REP') {
      if (user.location?.includes('Nigeria')) {
        return resource.provider === 'Mechanized Africa' || resource.provider === 'AgriStaff Solutions';
      }
      return resource.rating >= 4.8;
    }
    return false;
  }).slice(0, 2);

  const handleContact = (provider: string) => {
    toast.success(`Contact request sent to ${provider}!`, {
      description: "They will get back to you within 24 hours.",
    });
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Resource Hub
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Discover vetted services to optimize your agricultural investments.
          </p>
        </motion.div>
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button variant="outline" className="gap-2 h-9 px-4 rounded-md border-slate-200 bg-white text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Vetting Process</span>
          </Button>
          <Button className="gap-2 h-9 px-4 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95">
            <span>Become a Provider</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </motion.div>
      </div>

      {/* Recommended for You Section */}
      {(user.role === 'FARMER' || user.role === 'CLUSTER_REP') && recommendedResources.length > 0 && (
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 text-primary">
            <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Recommended for You</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedResources.map((resource, idx) => (
              <motion.div
                key={`rec-${resource.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 + (idx * 0.1) }}
              >
                <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 rounded-lg">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-40 h-40 shrink-0 overflow-hidden border-r border-slate-100">
                      <img 
                        src={resource.imageUrl} 
                        alt={resource.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-5 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-primary text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                            Best Match
                          </Badge>
                          <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-[10px] font-bold">{resource.rating}</span>
                          </div>
                        </div>
                        <h3 className="font-bold text-base text-slate-900 leading-tight group-hover:text-primary transition-colors">{resource.title}</h3>
                        <p className="text-xs font-medium text-slate-500 mt-1">{resource.provider}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{resource.priceRange}</span>
                        <Button size="sm" className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md" onClick={() => handleContact(resource.provider)}>
                          Contact Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters Bar */}
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">All Resources</h2>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-md uppercase tracking-wider">
            <MapPin className="w-3 h-3 text-primary/70" />
            <span>Showing results for {user.location || 'Global'}</span>
          </div>
        </div>
        
        <Card className="border border-slate-200 shadow-sm bg-slate-50 rounded-lg">
          <CardContent className="p-3">
            <div className="flex flex-col lg:flex-row items-center gap-3">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search services or providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200 h-10"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-2 group focus-within:border-primary transition-colors h-10">
                  <Filter className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <select 
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value as any)}
                    className="bg-transparent text-xs font-bold outline-none py-1 min-w-[100px] uppercase tracking-wider"
                  >
                    {cropOptions.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-white">{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-1 bg-white p-1 rounded-md border border-slate-200 h-10">
                  {(['ALL', 'INSURANCE', 'LABOR', 'SUPPORT'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-3 py-1 text-[10px] font-bold rounded-md transition-all duration-200 uppercase tracking-wider",
                        selectedCategory === cat 
                          ? 'bg-primary text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredResources.map((resource, idx) => {
            const Icon = categoryIcons[resource.category];
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + (idx * 0.05) }}
              >
                <Card className="group border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col bg-white h-full rounded-lg">
                  <div className="relative h-48 overflow-hidden border-b border-slate-100">
                    <img 
                      src={resource.imageUrl} 
                      alt={resource.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/90 backdrop-blur-sm text-slate-900 border-slate-200 flex items-center gap-1.5 py-1 px-2.5 shadow-sm rounded-md">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">{resource.category}</span>
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="p-5 pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <CardTitle className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors truncate leading-tight">
                          {resource.title}
                        </CardTitle>
                        <p className="text-xs font-bold text-slate-500 mt-1">{resource.provider}</p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md shrink-0">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-[10px] font-bold">{resource.rating}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4 p-5 pt-2">
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-medium">
                      {resource.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {resource.cropTypes.map(crop => (
                        <Badge key={crop} variant="secondary" className="text-[9px] font-bold bg-slate-50 text-slate-500 border-slate-200 px-2 py-0.5 uppercase tracking-wider rounded-md">
                          {crop}
                        </Badge>
                      ))}
                    </div>
                    {resource.priceRange && (
                      <div className="pt-3 border-t border-slate-50">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Estimated Cost</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{resource.priceRange}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-5 pt-3 border-t border-slate-50 bg-slate-50/50 gap-3">
                    <Button variant="outline" className="flex-1 gap-2 text-[10px] font-bold uppercase tracking-wider h-9 rounded-md border-slate-200 bg-white hover:bg-slate-50" onClick={() => resource.websiteUrl && window.open(resource.websiteUrl, '_blank')}>
                      <ExternalLink className="w-3 h-3" />
                      Details
                    </Button>
                    <Button className="flex-1 gap-2 text-[10px] font-bold uppercase tracking-wider h-9 rounded-md shadow-sm transition-all active:scale-95" onClick={() => handleContact(resource.provider)}>
                      <Mail className="w-3 h-3" />
                      Contact
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredResources.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Search className="w-6 h-6 text-slate-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">No resources found</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">Try adjusting your filters or search term to find what you're looking for.</p>
            </div>
            <Button variant="outline" className="rounded-md border-slate-200 bg-white text-xs font-bold uppercase tracking-wider h-9 px-4" onClick={() => { setSelectedCrop('ALL'); setSelectedCategory('ALL'); setSearchTerm(''); }}>
              Clear all filters
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
