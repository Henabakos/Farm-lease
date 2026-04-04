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
            <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] blur-2xl group-hover:bg-primary/30 transition-all duration-500" />
            <Avatar className="w-40 h-40 border-4 border-white shadow-2xl relative z-10 rounded-[2.5rem]">
              <AvatarImage src={user.avatar} className="object-cover" />
              <AvatarFallback className="text-5xl font-black bg-primary/10 text-primary">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -bottom-3 -right-3 bg-primary text-white p-3 rounded-2xl shadow-2xl border-4 border-white z-20"
            >
              <RoleIcon className="w-6 h-6" />
            </motion.div>
          </div>
          <div className="text-center md:text-left space-y-3 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <h1 className="text-4xl font-black tracking-tight text-foreground leading-tight">{user.name}</h1>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest">
                {user.role.toLowerCase().replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-2 group cursor-pointer hover:text-primary transition-colors">
                <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer hover:text-primary transition-colors">
                <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <span>{user.location}</span>
              </div>
              <div className="flex items-center gap-2 group cursor-pointer hover:text-primary transition-colors">
                <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <span>Joined {new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => setIsEditModalOpen(true)} 
          className="gap-3 h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] w-full md:w-auto"
        >
          <Edit className="w-5 h-5" />
          <span>Edit Profile</span>
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <motion.div variants={item}>
            <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-primary/5">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black tracking-tight">About Me</CardTitle>
                <CardDescription className="text-base font-medium">A brief overview of your professional background and goals.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <p className="text-foreground leading-relaxed text-lg font-medium opacity-80">
                  {user.bio || "No bio provided yet. Tell us about yourself!"}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-10">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1">Contact Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/5 hover:bg-primary/10 transition-all group">
                        <Mail className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-foreground">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/5 hover:bg-primary/10 transition-all group">
                        <Phone className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-foreground">{user.phone || "Not provided"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1">Location</h4>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/5 hover:bg-primary/10 transition-all group">
                      <MapPin className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-foreground">{user.location || "Not provided"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {user.role === 'FARMER' && user.clusters && (
            <motion.div variants={item}>
              <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-primary/5">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black tracking-tight">Cluster Memberships</CardTitle>
                  <CardDescription className="text-base font-medium">Farming groups you are currently associated with.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {user.clusters.map((cluster) => (
                      <div key={cluster.id} className="p-6 rounded-[2rem] border border-primary/5 bg-primary/5 hover:bg-primary/10 transition-all duration-500 group relative overflow-hidden">
                        <div className="flex items-start justify-between relative z-10">
                          <div className="space-y-2">
                            <h4 className="text-xl font-black text-foreground group-hover:text-primary transition-colors leading-tight">{cluster.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                              <MapPin className="w-4 h-4 text-primary/60" />
                              <span>{cluster.location}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.1em] bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full">Active</Badge>
                        </div>
                        <div className="mt-6 flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                            <Users className="w-4 h-4 text-primary/60" />
                            <span>{cluster.memberCount} members</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-10 rounded-xl px-4 text-sm font-black gap-2 hover:bg-primary/10 hover:text-primary transition-all">
                            <span>View</span>
                            <ArrowUpRight className="w-4 h-4" />
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
            <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-primary/5">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black tracking-tight">Account Permissions</CardTitle>
                <CardDescription className="text-base font-medium">Security and access levels assigned to your account.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: 'Identity Verified', desc: 'Your identity has been confirmed via KYC.', status: true },
                    { title: 'Investment Access', desc: 'Authorized to participate in funding rounds.', status: user.role !== 'FARMER' },
                    { title: 'Farm Management', desc: 'Can manage and update farm production data.', status: user.role === 'FARMER' || user.role === 'CLUSTER_REP' || user.role === 'ADMIN' },
                    { title: 'Admin Console', desc: 'Access to system-wide settings and logs.', status: user.role === 'ADMIN' },
                  ].map((perm) => (
                    <div key={perm.title} className="flex items-center justify-between p-5 rounded-2xl bg-primary/5 border border-primary/5 hover:bg-primary/10 transition-all group">
                      <div className="space-y-1">
                        <p className="text-base font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{perm.title}</p>
                        <p className="text-xs text-muted-foreground font-medium">{perm.desc}</p>
                      </div>
                      {perm.status ? (
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl border-2 border-primary/10" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-10">
          <motion.div variants={item}>
            <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-primary/5 overflow-hidden">
              <div className="h-32 bg-primary/10 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
              </div>
              <CardContent className="p-8 -mt-16 relative z-10">
                <div className="space-y-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <Avatar className="w-32 h-32 border-8 border-white shadow-2xl rounded-[2rem]">
                      <AvatarImage src={user.avatar} className="object-cover" />
                      <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="font-black text-2xl tracking-tight">{user.name}</h3>
                      <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em]">{user.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  
                  <Separator className="bg-primary/10" />
                  
                  <div className="space-y-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-black text-muted-foreground uppercase tracking-wider">Profile Strength</span>
                      <span className="font-black text-primary text-lg">85%</span>
                    </div>
                    <div className="h-3 w-full bg-primary/5 rounded-full overflow-hidden border border-primary/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '85%' }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full bg-primary rounded-full shadow-lg shadow-primary/20" 
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center font-medium opacity-70">
                      Complete your profile to unlock more features and increase visibility.
                    </p>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full h-14 rounded-2xl border-primary/10 hover:bg-primary/5 font-black text-base transition-all" 
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    Complete Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-primary/5">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black tracking-tight">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-3">
                <Button variant="ghost" className="w-full justify-start gap-4 h-14 rounded-2xl px-5 hover:bg-primary/5 hover:text-primary transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-black text-base tracking-tight">Security Settings</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-4 h-14 rounded-2xl px-5 hover:bg-primary/5 hover:text-primary transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-black text-base tracking-tight">Notification Prefs</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-4 h-14 rounded-2xl px-5 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-destructive/5 flex items-center justify-center group-hover:bg-destructive/10 transition-colors">
                    <ExternalLink className="w-5 h-5 text-destructive" />
                  </div>
                  <span className="font-black text-base tracking-tight">Deactivate Account</span>
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
