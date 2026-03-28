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
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Resource Hub
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Discover vetted services to optimize your agricultural investments.
          </p>
        </motion.div>
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button variant="outline" className="gap-2 h-11 px-5 rounded-xl border-border/50 hover:bg-muted/50 transition-all duration-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold">Vetting Process</span>
          </Button>
          <Button className="gap-2 h-11 px-5 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all duration-300 active:scale-95">
            <span className="font-semibold">Become a Provider</span>
            <ArrowRight className="w-4 h-4" />
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
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Recommended for You</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recommendedResources.map((resource, idx) => (
              <motion.div
                key={`rec-${resource.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 + (idx * 0.1) }}
              >
                <Card className="border-none bg-primary/5 backdrop-blur-md shadow-none overflow-hidden group premium-shadow hover:bg-primary/10 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-48 h-48 shrink-0 overflow-hidden">
                      <img 
                        src={resource.imageUrl} 
                        alt={resource.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-6 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-2.5 py-1">
                            Best Match
                          </Badge>
                          <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs font-black">{resource.rating}</span>
                          </div>
                        </div>
                        <h3 className="font-bold text-xl text-foreground leading-tight group-hover:text-primary transition-colors">{resource.title}</h3>
                        <p className="text-sm font-medium text-muted-foreground mt-2">{resource.provider}</p>
                      </div>
                      <div className="flex items-center justify-between mt-6">
                        <span className="text-sm font-black text-primary uppercase tracking-wider">{resource.priceRange}</span>
                        <Button size="sm" className="h-9 px-4 text-xs font-black rounded-lg shadow-md hover:scale-105 transition-transform" onClick={() => handleContact(resource.provider)}>
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
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">All Resources</h2>
          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full">
            <MapPin className="w-4 h-4 text-primary/70" />
            <span>Showing results for {user.location || 'Global'}</span>
          </div>
        </div>
        
        <Card className="border-none shadow-sm overflow-hidden bg-card/40 backdrop-blur-md premium-shadow">
          <CardContent className="p-5">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search services or providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-muted/20 border border-border/50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-300"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-3 bg-muted/20 border border-border/50 rounded-xl px-4 py-2 group focus-within:border-primary transition-colors">
                  <Filter className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <select 
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value as any)}
                    className="bg-transparent text-sm font-bold outline-none py-1 min-w-[120px]"
                  >
                    {cropOptions.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-card">{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-1 bg-muted/20 p-1.5 rounded-xl border border-border/50">
                  {(['ALL', 'INSURANCE', 'LABOR', 'SUPPORT'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-4 py-1.5 text-xs font-black rounded-lg transition-all duration-300 uppercase tracking-widest",
                        selectedCategory === cat 
                          ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredResources.map((resource, idx) => {
            const Icon = categoryIcons[resource.category];
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + (idx * 0.05) }}
              >
                <Card className="group border-none shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col bg-card/40 backdrop-blur-md premium-shadow h-full hover:-translate-y-2">
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={resource.imageUrl} 
                      alt={resource.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-card/90 backdrop-blur-md text-foreground border-border/50 flex items-center gap-2 py-1.5 px-3 shadow-lg">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{resource.category}</span>
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-3 px-6 pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors truncate">
                          {resource.title}
                        </CardTitle>
                        <p className="text-sm font-bold text-muted-foreground mt-1">{resource.provider}</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-full shrink-0">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-xs font-black">{resource.rating}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-6 px-6">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-medium">
                      {resource.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {resource.cropTypes.map(crop => (
                        <Badge key={crop} variant="secondary" className="text-[10px] font-bold bg-muted/40 text-muted-foreground border-none px-2 py-0.5 uppercase tracking-wider">
                          {crop}
                        </Badge>
                      ))}
                    </div>
                    {resource.priceRange && (
                      <div className="pt-4 border-t border-border/30">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Estimated Cost</p>
                        <p className="text-base font-black text-foreground mt-1">{resource.priceRange}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-6 pt-4 border-t border-border/30 bg-muted/10 gap-4">
                    <Button variant="outline" className="flex-1 gap-2 text-xs font-bold h-10 rounded-xl border-border/50 hover:bg-muted/50" onClick={() => resource.websiteUrl && window.open(resource.websiteUrl, '_blank')}>
                      <ExternalLink className="w-3.5 h-3.5" />
                      Details
                    </Button>
                    <Button className="flex-1 gap-2 text-xs font-bold h-10 rounded-xl shadow-md hover:scale-105 transition-transform" onClick={() => handleContact(resource.provider)}>
                      <Mail className="w-3.5 h-3.5" />
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
            className="flex flex-col items-center justify-center py-24 text-center space-y-6 bg-card/40 backdrop-blur-md rounded-[2rem] border-2 border-dashed border-border/50 premium-shadow"
          >
            <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground tracking-tight">No resources found</h3>
              <p className="text-base text-muted-foreground max-w-xs mx-auto">Try adjusting your filters or search term to find what you're looking for.</p>
            </div>
            <Button variant="outline" className="rounded-xl border-border/50 hover:bg-muted/50" onClick={() => { setSelectedCrop('ALL'); setSelectedCategory('ALL'); setSearchTerm(''); }}>
              Clear all filters
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
