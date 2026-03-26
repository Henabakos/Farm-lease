import React, { useState } from 'react';
import { useRole } from '@/src/contexts/RoleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Edit, 
  Sprout, 
  TrendingUp, 
  Map,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { EditProfileModal } from './EditProfileModal';
import { Separator } from '@/components/ui/separator';

export function ProfilePage() {
  const { user } = useRole();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const roleIcons = {
    INVESTOR: TrendingUp,
    FARMER: Sprout,
    CLUSTER_REP: Map,
    ADMIN: Shield,
  };

  const RoleIcon = roleIcons[user.role];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-card shadow-xl">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 rounded-xl shadow-lg border-4 border-card">
              <RoleIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{user.name}</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-3 py-1">
                {user.role.toLowerCase().replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{user.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
        <Button onClick={() => setIsEditModalOpen(true)} className="gap-2 w-full md:w-auto">
          <Edit className="w-4 h-4" />
          <span>Edit Profile</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>About Me</CardTitle>
              <CardDescription>A brief overview of your professional background and goals.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                {user.bio || "No bio provided yet. Tell us about yourself!"}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-primary" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-primary" />
                      <span>{user.phone || "Not provided"}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Location</h4>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{user.location || "Not provided"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {user.role === 'FARMER' && user.clusters && (
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Cluster Memberships</CardTitle>
                <CardDescription>Farming groups you are currently associated with.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.clusters.map((cluster) => (
                    <div key={cluster.id} className="p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors group">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{cluster.name}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{cluster.location}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-tighter">Active</Badge>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>{cluster.memberCount} members</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Account Permissions</CardTitle>
              <CardDescription>Security and access levels assigned to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: 'Identity Verified', desc: 'Your identity has been confirmed via KYC.', status: true },
                  { title: 'Investment Access', desc: 'Authorized to participate in funding rounds.', status: user.role !== 'FARMER' },
                  { title: 'Farm Management', desc: 'Can manage and update farm production data.', status: user.role === 'FARMER' || user.role === 'CLUSTER_REP' || user.role === 'ADMIN' },
                  { title: 'Admin Console', desc: 'Access to system-wide settings and logs.', status: user.role === 'ADMIN' },
                ].map((perm) => (
                  <div key={perm.title} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{perm.title}</p>
                      <p className="text-xs text-muted-foreground">{perm.desc}</p>
                    </div>
                    {perm.status ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="h-24 bg-primary/10" />
            <CardContent className="p-6 -mt-12">
              <div className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <Avatar className="w-20 h-20 border-4 border-card shadow-lg">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg">{user.name}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">{user.role.replace('_', ' ')}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Profile Strength</span>
                    <span className="font-bold text-primary">85%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[85%]" />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Complete your profile to unlock more features.
                  </p>
                </div>

                <Button variant="outline" className="w-full" onClick={() => setIsEditModalOpen(true)}>
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                <Shield className="w-4 h-4" />
                <span>Security Settings</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 h-11">
                <Mail className="w-4 h-4" />
                <span>Notification Prefs</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10">
                <ExternalLink className="w-4 h-4" />
                <span>Deactivate Account</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <EditProfileModal 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
      />
    </div>
  );
}
