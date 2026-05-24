import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { clustersAPI } from '@/src/services/api';
import { ClusterLocationPicker } from './ClusterLocationPicker';

// Lightweight cluster-creation form. Posts to POST /clusters; the server fills
// owner from the JWT, so we only collect human-meaningful fields plus optional
// center coordinates for map display and geospatial features.
export function CreateClusterDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [region, setRegion] = useState('');
  const [areaHectares, setAreaHectares] = useState<string>('');
  const [description, setDescription] = useState('');
  const [centerLatitude, setCenterLatitude] = useState<number | undefined>();
  const [centerLongitude, setCenterLongitude] = useState<number | undefined>();
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setLocation('');
    setRegion('');
    setAreaHectares('');
    setDescription('');
    setCenterLatitude(undefined);
    setCenterLongitude(undefined);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;

    const lat = centerLatitude;
    const lng = centerLongitude;
    if (
      (lat != null && lng == null) ||
      (lat == null && lng != null)
    ) {
      toast.error('Please provide both latitude and longitude, or clear both');
      return;
    }
    if (
      lat != null &&
      (lat < -90 || lat > 90 || lng! < -180 || lng! > 180)
    ) {
      toast.error('Coordinates are out of valid range');
      return;
    }

    setSaving(true);
    try {
      await clustersAPI.create({
        name: name.trim(),
        location: location.trim(),
        region: region.trim() || undefined,
        area_hectares: areaHectares ? Number(areaHectares) : undefined,
        description: description.trim() || undefined,
        center_latitude: lat,
        center_longitude: lng,
      });
      toast.success('Cluster created');
      reset();
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to create cluster');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-lg border-slate-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
            New Cluster
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Create a cluster with location details and map coordinates
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={120}
              className="h-9 rounded-md text-xs border-slate-200"
              placeholder="e.g. Northern Maize Collective"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="h-9 rounded-md text-xs border-slate-200"
                placeholder="District, Country"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Region</Label>
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-9 rounded-md text-xs border-slate-200"
                placeholder="e.g. North West"
              />
            </div>
          </div>

          <ClusterLocationPicker
            latitude={centerLatitude}
            longitude={centerLongitude}
            onChange={({ latitude, longitude }) => {
              setCenterLatitude(latitude);
              setCenterLongitude(longitude);
            }}
          />

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Area (Hectares)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={areaHectares}
              onChange={(e) => setAreaHectares(e.target.value)}
              className="h-9 rounded-md text-xs border-slate-200"
              placeholder="Optional, total cluster size"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 border-dashed space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Base Coordinates (For Plot Positioning)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={centerLatitude ?? ''}
                  onChange={(e) => setCenterLatitude(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 6.5244"
                  className="h-8 rounded-md text-xs border-slate-200 bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={centerLongitude ?? ''}
                  onChange={(e) => setCenterLongitude(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 3.3792"
                  className="h-8 rounded-md text-xs border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              className="rounded-md text-xs border-slate-200"
              placeholder="Optional"
            />
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
              disabled={saving}
              className="h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-white gap-2"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>{saving ? 'Creating…' : 'Create Cluster'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
