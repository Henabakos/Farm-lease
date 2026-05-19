import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { resourcesAPI } from '../../services/api';

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddResourceDialog: React.FC<AddResourceDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [provider, setProvider] = useState('');
  const [description, setDescription] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [rating, setRating] = useState('5.0');
  const [imageUrl, setImageUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [cropTypes, setCropTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCropTypeToggle = (cropType: string) => {
    setCropTypes(prev => 
      prev.includes(cropType) 
        ? prev.filter(c => c !== cropType)
        : [...prev, cropType]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !category || !provider || !description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (cropTypes.length === 0) {
      toast.error('Please select at least one crop type');
      return;
    }

    const ratingValue = parseFloat(rating);
    if (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 5) {
      toast.error('Rating must be between 0 and 5');
      return;
    }

    setLoading(true);
    try {
      await resourcesAPI.create({
        title,
        category,
        provider,
        description,
        priceRange: priceRange || null,
        rating: ratingValue,
        reviewCount: 0,
        cropTypes,
        imageUrl: imageUrl || null,
        contactEmail: contactEmail || null,
        websiteUrl: websiteUrl || null,
      });
      toast.success('Resource added successfully');
      onOpenChange(false);
      onSuccess?.();
      // Reset form
      setTitle('');
      setCategory('');
      setProvider('');
      setDescription('');
      setPriceRange('');
      setRating('5.0');
      setImageUrl('');
      setContactEmail('');
      setWebsiteUrl('');
      setCropTypes([]);
    } catch (err: any) {
      console.error('Failed to add resource:', err);
      toast.error(err.response?.data?.message || 'Failed to add resource');
    } finally {
      setLoading(false);
    }
  };

  const cropOptions = [
    { value: 'MAIZE', label: 'Maize' },
    { value: 'SOYBEANS', label: 'Soybeans' },
    { value: 'COCOA', label: 'Cocoa' },
    { value: 'RICE', label: 'Rice' },
    { value: 'CASSAVA', label: 'Cassava' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Resource Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter resource title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INSURANCE">Insurance</SelectItem>
                <SelectItem value="LABOR">Labor</SelectItem>
                <SelectItem value="SUPPORT">Support Services</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Provider Name *</Label>
            <Input
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="Enter provider/company name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the resource and what it offers"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceRange">Price Range</Label>
            <Input
              id="priceRange"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              placeholder="e.g., $50 - $200 / hectare"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">Rating (0-5) *</Label>
            <Input
              id="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="5.0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Crop Types *</Label>
            <div className="flex flex-wrap gap-3">
              {cropOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`crop-${option.value}`}
                    checked={cropTypes.includes(option.value)}
                    onCheckedChange={() => handleCropTypeToggle(option.value)}
                  />
                  <Label htmlFor={`crop-${option.value}`} className="text-sm font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@provider.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://provider-website.com"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Resource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
