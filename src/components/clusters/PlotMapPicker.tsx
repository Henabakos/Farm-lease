import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, MoveHorizontal, Ruler } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PlotMapPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (plot: { 
    location: string; 
    size: number; 
    status: string; 
    latitude?: number; 
    longitude?: number;
    relativeDimensions?: {
      direction: string;
      width: number;
      height: number;
    }
  }) => void;
  baseLocation?: { lat: number; lng: number };
}

export function PlotMapPicker({ open, onOpenChange, onSave, baseLocation }: PlotMapPickerProps) {
  const [activeTab, setActiveTab] = useState('relative');
  const [location, setLocation] = useState('');
  const [size, setSize] = useState('');
  const [status, setStatus] = useState('AVAILABLE');
  
  // Coordinate mode state
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Relative mode state
  const [direction, setDirection] = useState('LEFT');
  const [width, setWidth] = useState('200');
  const [height, setHeight] = useState('200');

  useEffect(() => {
    // Auto-calculate size from width/height when they change
    if (activeTab === 'relative' && width && height) {
      const hectares = (parseFloat(width) * parseFloat(height)) / 10000;
      if (!isNaN(hectares)) {
        setSize(hectares.toFixed(2));
      }
    }
  }, [width, height, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location || !size) {
      toast.error('Please fill in basic fields');
      return;
    }

    if (activeTab === 'coordinates') {
      if (!latitude || !longitude) {
        toast.error('Please enter latitude and longitude');
        return;
      }
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        toast.error('Invalid coordinates');
        return;
      }
      onSave({
        location,
        size: parseFloat(size),
        status,
        latitude: lat,
        longitude: lon,
      });
    } else {
      if (!width || !height) {
        toast.error('Please enter dimensions');
        return;
      }
      onSave({
        location,
        size: parseFloat(size),
        status,
        relativeDimensions: {
          direction,
          width: parseFloat(width),
          height: parseFloat(height),
        }
      });
    }

    // Reset form
    setLocation('');
    setSize('');
    setStatus('AVAILABLE');
    setLatitude('');
    setLongitude('');
    setWidth('200');
    setHeight('200');
    setDirection('LEFT');
    onOpenChange(false);
  };

  const getGoogleMapsEmbedUrl = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${latitude},${longitude}`;
    }
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-lg border-slate-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
            Add Land Plot
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Define plot boundaries and location
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location Name</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              placeholder="e.g., Northern Sector Plot A"
              className="h-9 rounded-md text-xs border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Size (Hectares)</Label>
              <Input
                type="number"
                step="0.01"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                required
                placeholder="0.00"
                readOnly={activeTab === 'relative'}
                className={`h-9 rounded-md text-xs border-slate-200 ${activeTab === 'relative' ? 'bg-slate-50' : ''}`}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 rounded-md text-xs border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md border-slate-200">
                  <SelectItem value="AVAILABLE" className="text-xs font-medium">Available</SelectItem>
                  <SelectItem value="OCCUPIED" className="text-xs font-medium">Occupied</SelectItem>
                  <SelectItem value="MAINTENANCE" className="text-xs font-medium">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9 bg-slate-100 p-1 rounded-md">
              <TabsTrigger value="relative" className="text-[10px] font-bold uppercase tracking-wider rounded-sm data-[state=active]:bg-white data-[state=active]:text-primary">
                Relative Dimensions
              </TabsTrigger>
              <TabsTrigger value="coordinates" className="text-[10px] font-bold uppercase tracking-wider rounded-sm data-[state=active]:bg-white data-[state=active]:text-primary">
                Absolute Coordinates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="relative" className="mt-4 space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 border-dashed space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <MoveHorizontal className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase">Define Position from Center</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Positioning Mode</Label>
                    <Select value={direction} onValueChange={setDirection}>
                      <SelectTrigger className="h-9 rounded-md text-xs border-slate-200 bg-white">
                        <SelectValue placeholder="Select direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LEFT">To the Left (West)</SelectItem>
                        <SelectItem value="RIGHT">To the Right (East)</SelectItem>
                        <SelectItem value="TOP">To the Top (North)</SelectItem>
                        <SelectItem value="BOTTOM">To the Bottom (South)</SelectItem>
                        <SelectItem value="CENTER">Centered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Width (Meters)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        placeholder="200"
                        className="h-9 rounded-md text-xs border-slate-200 pl-8 bg-white"
                      />
                      <Ruler className="w-3 h-3 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Height (Meters)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="200"
                        className="h-9 rounded-md text-xs border-slate-200 pl-8 bg-white"
                      />
                      <Ruler className="w-3 h-3 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                <p className="text-[9px] text-slate-500 font-medium italic">
                  Drawing will be generated relative to Cluster Location: {baseLocation ? `${baseLocation.lat.toFixed(4)}, ${baseLocation.lng.toFixed(4)}` : 'Not set'}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="coordinates" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="e.g., 6.5244"
                    className="h-9 rounded-md text-xs border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="e.g., 3.3792"
                    className="h-9 rounded-md text-xs border-slate-200"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4 gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-white"
            >
              Save Plot
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
