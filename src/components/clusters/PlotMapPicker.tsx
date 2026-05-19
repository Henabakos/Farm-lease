import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface PlotMapPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (plot: { location: string; size: number; status: string; latitude: number; longitude: number }) => void;
}

export function PlotMapPicker({ open, onOpenChange, onSave }: PlotMapPickerProps) {
  const [location, setLocation] = useState('');
  const [size, setSize] = useState('');
  const [status, setStatus] = useState('AVAILABLE');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const handleOpenGoogleMaps = () => {
    if (latitude && longitude) {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
    } else {
      toast.error('Please enter latitude and longitude first');
    }
  };

  const handleOpenMapPicker = () => {
    // Open Google Maps for picking coordinates
    window.open('https://www.google.com/maps', '_blank');
    toast.info('Click on the map to get coordinates, then enter them here');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !size || !latitude || !longitude) {
      toast.error('Please fill in all fields');
      return;
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      toast.error('Invalid coordinates');
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      toast.error('Coordinates out of valid range');
      return;
    }

    onSave({
      location,
      size: parseFloat(size),
      status,
      latitude: lat,
      longitude: lon,
    });

    // Reset form
    setLocation('');
    setSize('');
    setStatus('AVAILABLE');
    setLatitude('');
    setLongitude('');
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
                className="h-9 rounded-md text-xs border-slate-200"
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

          <div className="space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Coordinates
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleOpenMapPicker}
                className="ml-2 h-auto p-0 text-[10px] font-semibold text-primary hover:text-primary/80"
              >
                Pick from Google Maps
              </Button>
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
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
                  required
                  placeholder="e.g., 3.3792"
                  className="h-9 rounded-md text-xs border-slate-200"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenGoogleMaps}
              disabled={!latitude || !longitude}
              className="w-full h-8 rounded-md text-[10px] font-bold uppercase tracking-wider border-slate-200 gap-2"
            >
              <MapPin className="w-3 h-3" />
              View on Google Maps
            </Button>
          </div>

          <DialogFooter className="pt-2 gap-2">
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
