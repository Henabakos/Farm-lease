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
  ExternalLink,
  ArrowUpRight,
  Users
} from 'lucide-react';
import { EditProfileModal } from './EditProfileModal';
import { Separator } from '@/components/ui/separator';
import { motion } from 'motion/react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

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
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/10 rounded-lg blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
            <Avatar className="w-32 h-32 border-4 border-white shadow-lg relative z-10 rounded-lg">
              <AvatarImage src={user.avatar} className="object-cover" />
              <AvatarFallback className="text-4xl font-bold bg-slate-50 text-primary">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-md shadow-md border-2 border-white z-20"
            >
              <RoleIcon className="w-4 h-4" />
            </motion.div>
          </div>
          <div className="text-center md:text-left space-y-2 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">{user.name}</h1>
              <Badge variant="secondary" className="bg-slate-100 text-primary border-none px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
                {user.role.toLowerCase().replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2 group cursor-pointer hover:text-primary transition-colors">
                <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                  <Mail className="w-3 h-3 text-primary/70" />
                </div>
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer hover:text-primary transition-colors">
                <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                  <MapPin className="w-3 h-3 text-primary/70" />
                </div>
                <span>{user.location}</span>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer hover:text-primary transition-colors">
                <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                  <Calendar className="w-3 h-3 text-primary/70" />
                </div>
                <span>Joined {new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => setIsEditModalOpen(true)} 
          className="gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary/90 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95 w-full md:w-auto"
        >
          <Edit className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <motion.div variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-base font-bold tracking-tight text-slate-900">About Me</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">A brief overview of your professional background and goals.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                <p className="text-slate-600 leading-relaxed text-xs font-medium">
                  {user.bio || "No bio provided yet. Tell us about yourself!"}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2.5 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all group">
                        <Mail className="w-3.5 h-3.5 text-primary/70 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-[10px] text-slate-700 uppercase tracking-wider">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-3 p-2.5 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all group">
                        <Phone className="w-3.5 h-3.5 text-primary/70 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-[10px] text-slate-700 uppercase tracking-wider">{user.phone || "Not provided"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Location</h4>
                    <div className="flex items-center gap-3 p-2.5 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all group">
                      <MapPin className="w-3.5 h-3.5 text-primary/70 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-[10px] text-slate-700 uppercase tracking-wider">{user.location || "Not provided"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {user.role === 'FARMER' && user.clusters && (
            <motion.div variants={item}>
              <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-base font-bold tracking-tight text-slate-900">Cluster Memberships</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Farming groups you are currently associated with.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.clusters.map((cluster) => (
                      <div key={cluster.id} className="p-4 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all duration-300 group relative overflow-hidden">
                        <div className="flex items-start justify-between relative z-10">
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight">{cluster.name}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              <MapPin className="w-3 h-3 text-primary/60" />
                              <span>{cluster.location}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border-emerald-100 px-2 py-0.5 rounded-md">Active</Badge>
                        </div>
                        <div className="mt-4 flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            <Users className="w-3 h-3 text-primary/60" />
                            <span>{cluster.memberCount} members</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 rounded-md px-3 text-[10px] font-bold uppercase tracking-wider gap-2 hover:bg-white hover:text-primary border border-transparent hover:border-slate-200 transition-all">
                            <span>View</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-base font-bold tracking-tight text-slate-900">Account Permissions</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security and access levels assigned to your account.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { title: 'Identity Verified', desc: 'Your identity has been confirmed via KYC.', status: true },
                    { title: 'Investment Access', desc: 'Authorized to participate in funding rounds.', status: user.role !== 'FARMER' },
                    { title: 'Farm Management', desc: 'Can manage and update farm production data.', status: user.role === 'FARMER' || user.role === 'CLUSTER_REP' || user.role === 'ADMIN' },
                    { title: 'Admin Console', desc: 'Access to system-wide settings and logs.', status: user.role === 'ADMIN' },
                  ].map((perm) => (
                    <div key={perm.title} className="flex items-center justify-between p-4 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all group">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 tracking-tight group-hover:text-primary transition-colors">{perm.title}</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{perm.desc}</p>
                      </div>
                      {perm.status ? (
                        <div className="w-8 h-8 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-md border border-slate-200 bg-white" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-8">
          <motion.div variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <div className="h-24 bg-slate-50 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              </div>
              <CardContent className="p-6 -mt-12 relative z-10">
                <div className="space-y-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-md rounded-lg">
                      <AvatarImage src={user.avatar} className="object-cover" />
                      <AvatarFallback className="text-3xl font-bold bg-slate-50 text-primary">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-lg tracking-tight text-slate-900">{user.name}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  
                  <Separator className="bg-slate-100" />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-slate-400">Profile Strength</span>
                      <span className="text-primary">85%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '85%' }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full bg-primary rounded-full" 
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-wider leading-relaxed">
                      Complete your profile to unlock more features and increase visibility.
                    </p>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full h-9 rounded-md border-slate-200 bg-white hover:bg-slate-50 font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm active:scale-95" 
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    Complete Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-base font-bold tracking-tight text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-4 space-y-2">
                <Button variant="ghost" className="w-full justify-start gap-3 h-10 rounded-md px-3 hover:bg-slate-50 hover:text-primary transition-all group border border-transparent hover:border-slate-200">
                  <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                    <Shield className="w-3.5 h-3.5 text-primary/70" />
                  </div>
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">Security Settings</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 h-10 rounded-md px-3 hover:bg-slate-50 hover:text-primary transition-all group border border-transparent hover:border-slate-200">
                  <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-primary/70" />
                  </div>
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">Notification Prefs</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 h-10 rounded-md px-3 text-destructive hover:text-destructive hover:bg-destructive/5 transition-all group border border-transparent hover:border-destructive/10">
                  <div className="w-7 h-7 rounded-md bg-destructive/5 border border-destructive/10 flex items-center justify-center group-hover:bg-destructive/10 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5 text-destructive" />
                  </div>
                  <span className="font-bold text-[11px] uppercase tracking-wider">Deactivate Account</span>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <EditProfileModal 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
      />
    </motion.div>
  );
}
