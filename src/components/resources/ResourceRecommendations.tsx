import React, { useState } from 'react';
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

  // Simple "Recommended for you" logic based on user's role and location
  const recommendedResources = mockResources.filter(resource => {
    if (user.role === 'FARMER' || user.role === 'CLUSTER_REP') {
      // If user is in Nigeria, prioritize Mechanized Africa or AgriStaff
      if (user.location?.includes('Nigeria')) {
        return resource.provider === 'Mechanized Africa' || resource.provider === 'AgriStaff Solutions';
      }
      // Otherwise, just show top rated
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Resource Hub</h1>
          <p className="text-gray-500 mt-1">Discover vetted services to optimize your agricultural investments.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Vetting Process</span>
          </Button>
          <Button className="gap-2 shadow-md">
            <span>Become a Provider</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Recommended for You Section */}
      {(user.role === 'FARMER' || user.role === 'CLUSTER_REP') && recommendedResources.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5 fill-current" />
            <h2 className="text-xl font-bold">Recommended for You</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedResources.map(resource => (
              <Card key={`rec-${resource.id}`} className="border-2 border-primary/10 bg-primary/5 shadow-none overflow-hidden group">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-40 h-40 shrink-0 overflow-hidden">
                    <img 
                      src={resource.imageUrl} 
                      alt={resource.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider mb-2">
                          Best Match
                        </Badge>
                        <div className="flex items-center gap-1 text-amber-600">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-xs font-bold">{resource.rating}</span>
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-900">{resource.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{resource.provider}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs font-bold text-primary">{resource.priceRange}</span>
                      <Button size="sm" className="h-8 text-xs font-bold" onClick={() => handleContact(resource.provider)}>
                        Contact Now
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">All Resources</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>Showing results for {user.location || 'Global'}</span>
          </div>
        </div>
        
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-4 bg-white">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search services or providers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <select 
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value as any)}
                    className="bg-transparent text-sm font-medium outline-none py-1"
                  >
                    {cropOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                  {(['ALL', 'INSURANCE', 'LABOR', 'SUPPORT'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        selectedCategory === cat 
                          ? 'bg-white text-primary shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
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
          {filteredResources.map((resource) => {
            const Icon = categoryIcons[resource.category];
            return (
              <Card key={resource.id} className="group border-none shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={resource.imageUrl} 
                    alt={resource.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 backdrop-blur-sm text-gray-900 border-none flex items-center gap-1.5 py-1 px-2.5">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{resource.category}</span>
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                        {resource.title}
                      </CardTitle>
                      <p className="text-sm font-medium text-gray-500 mt-0.5">{resource.provider}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs font-bold">{resource.rating}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {resource.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {resource.cropTypes.map(crop => (
                      <Badge key={crop} variant="secondary" className="text-[10px] font-medium bg-gray-100 text-gray-600 border-none">
                        {crop}
                      </Badge>
                    ))}
                  </div>
                  {resource.priceRange && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Estimated Cost</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{resource.priceRange}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-4 border-t border-gray-50 bg-gray-50/50 gap-3">
                  <Button variant="outline" className="flex-1 gap-2 text-xs font-bold" onClick={() => resource.websiteUrl && window.open(resource.websiteUrl, '_blank')}>
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Details
                  </Button>
                  <Button className="flex-1 gap-2 text-xs font-bold" onClick={() => handleContact(resource.provider)}>
                    <Mail className="w-3.5 h-3.5" />
                    Contact
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {filteredResources.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">No resources found</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">Try adjusting your filters or search term to find what you're looking for.</p>
            </div>
            <Button variant="link" onClick={() => { setSelectedCrop('ALL'); setSelectedCategory('ALL'); setSearchTerm(''); }}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
