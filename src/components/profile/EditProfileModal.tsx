import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRole } from '@/src/contexts/RoleContext';
import { Loader2, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function EditProfileModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { user } = useRole();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    bio: user.bio || '',
    phone: user.phone || '',
    location: user.location || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-lg border-slate-200 shadow-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">Edit Profile</DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Update your personal information and profile details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-2 border-white shadow-md rounded-lg overflow-hidden">
                <AvatarImage src={user.avatar} className="rounded-lg object-cover" />
                <AvatarFallback className="rounded-lg bg-slate-50 text-primary font-bold text-2xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <button 
                type="button"
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Click to change avatar</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-50 border-slate-200 h-10 rounded-md text-xs font-medium focus-visible:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</Label>
              <Input 
                id="email" 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-50 border-slate-200 h-10 rounded-md text-xs font-medium focus-visible:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</Label>
              <Input 
                id="phone" 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-slate-50 border-slate-200 h-10 rounded-md text-xs font-medium focus-visible:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Location</Label>
              <Input 
                id="location" 
                value={formData.location} 
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-slate-50 border-slate-200 h-10 rounded-md text-xs font-medium focus-visible:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Bio</Label>
            <Textarea 
              id="bio" 
              value={formData.bio} 
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="bg-slate-50 border-slate-200 rounded-md text-xs font-medium focus-visible:ring-primary/20 min-h-[100px] transition-all"
              placeholder="Tell us about yourself..."
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-10 rounded-md font-bold text-[10px] uppercase tracking-wider border-slate-200 hover:bg-slate-50 transition-all active:scale-95">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-10 rounded-md font-bold text-[10px] uppercase tracking-wider bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
