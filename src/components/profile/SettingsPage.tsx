import React, { useState } from 'react';
import { useRole } from '@/src/contexts/RoleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  CreditCard, 
  Globe, 
  Trash2,
  Save,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  ChevronRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function SettingsPage() {
  const { user } = useRole();
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <motion.div variants={item}>
        <h1 className="text-4xl font-black tracking-tight text-foreground leading-tight">Settings</h1>
        <p className="text-muted-foreground mt-2 text-lg font-medium opacity-80">Manage your account preferences and system settings.</p>
      </motion.div>

      <Tabs defaultValue="profile" className="space-y-8">
        <motion.div variants={item}>
          <TabsList className="bg-primary/5 p-1.5 rounded-2xl h-14 border border-primary/5">
            <TabsTrigger value="profile" className="gap-3 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary font-black transition-all">
              <User className="w-5 h-5" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-3 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary font-black transition-all">
              <Lock className="w-5 h-5" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-3 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary font-black transition-all">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-3 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary font-black transition-all">
              <CreditCard className="w-5 h-5" />
              <span>Billing</span>
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <AnimatePresence mode="wait">
          <TabsContent value="profile" className="space-y-8 outline-none">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-primary/5">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black tracking-tight">Public Profile</CardTitle>
                  <CardDescription className="text-base font-medium">This information will be visible to other users on the platform.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-black uppercase tracking-[0.1em] text-primary/60 ml-1">Full Name</Label>
                      <Input id="fullName" defaultValue={user.name} className="h-14 bg-primary/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-lg font-medium pl-5" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-black uppercase tracking-[0.1em] text-primary/60 ml-1">Email Address</Label>
                      <Input id="email" defaultValue={user.email} className="h-14 bg-primary/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-lg font-medium pl-5" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-black uppercase tracking-[0.1em] text-primary/60 ml-1">Phone Number</Label>
                      <Input id="phone" defaultValue={user.phone} className="h-14 bg-primary/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-lg font-medium pl-5" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-black uppercase tracking-[0.1em] text-primary/60 ml-1">Location</Label>
                      <Input id="location" defaultValue={user.location} className="h-14 bg-primary/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-lg font-medium pl-5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-black uppercase tracking-[0.1em] text-primary/60 ml-1">Bio</Label>
                    <Input id="bio" defaultValue={user.bio} className="h-14 bg-primary/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-lg font-medium pl-5" />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={handleSave} 
                      className="gap-3 h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Save className="w-5 h-5" />
                      <span>Save Changes</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="security" className="space-y-8 outline-none">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-primary/5">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black tracking-tight">Password</CardTitle>
                  <CardDescription className="text-base font-medium">Update your password to keep your account secure.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-black uppercase tracking-[0.1em] text-primary/60 ml-1">Current Password</Label>
                    <Input id="currentPassword" type="password" className="h-14 bg-primary/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-lg font-medium pl-5" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-black uppercase tracking-[0.1em] text-primary/60 ml-1">New Password</Label>
                      <div className="relative">
                        <Input 
                          id="newPassword" 
                          type={showPassword ? "text" : "password"} 
                          className="h-14 bg-primary/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-lg font-medium pl-5 pr-14" 
                        />
                        <button 
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-black uppercase tracking-[0.1em] text-primary/60 ml-1">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" className="h-14 bg-primary/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-lg font-medium pl-5" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={handleSave} 
                      className="gap-3 h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Lock className="w-5 h-5" />
                      <span>Update Password</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-primary/5">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black tracking-tight">Two-Factor Authentication</CardTitle>
                  <CardDescription className="text-base font-medium">Add an extra layer of security to your account.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                  <div className="flex items-center justify-between p-6 rounded-[2rem] border border-primary/5 bg-primary/5 hover:bg-primary/10 transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Smartphone className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-foreground tracking-tight">SMS Authentication</p>
                        <p className="text-sm text-muted-foreground font-medium">Receive a code via SMS to log in.</p>
                      </div>
                    </div>
                    <Switch className="data-[state=checked]:bg-primary" />
                  </div>
                  <div className="flex items-center justify-between p-6 rounded-[2rem] border border-primary/5 bg-primary/5 hover:bg-primary/10 transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <ShieldCheck className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-foreground tracking-tight">Authenticator App</p>
                        <p className="text-sm text-muted-foreground font-medium">Use an app like Google Authenticator.</p>
                      </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-8 outline-none">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-primary/5">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black tracking-tight">Notification Preferences</CardTitle>
                  <CardDescription className="text-base font-medium">Choose how you want to be notified about platform activity.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] ml-1">Email Notifications</h4>
                    <div className="space-y-4">
                      {[
                        { label: 'New Investment Opportunities', desc: 'Get notified when new projects match your profile.' },
                        { label: 'Payment Reminders', desc: 'Receive alerts for upcoming and overdue payments.' },
                        { label: 'Agreement Updates', desc: 'Notifications when agreements are signed or modified.' },
                        { label: 'Platform News', desc: 'Stay updated with the latest AgriInvest features.' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-6 rounded-[2rem] border border-primary/5 bg-primary/5 hover:bg-primary/10 transition-all group">
                          <div className="space-y-1">
                            <p className="text-lg font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{item.label}</p>
                            <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                          </div>
                          <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-8 outline-none">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-primary/5">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-2xl font-black tracking-tight">Payment Methods</CardTitle>
                  <CardDescription className="text-base font-medium">Manage your connected bank accounts and cards.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                  <div className="p-8 rounded-[2.5rem] border border-primary/5 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-6 group hover:bg-primary/10 transition-all duration-500">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-14 bg-white rounded-2xl border-2 border-primary/10 flex items-center justify-center font-black text-xl text-primary shadow-xl group-hover:scale-110 transition-transform duration-500">VISA</div>
                      <div>
                        <p className="text-2xl font-black text-foreground tracking-tighter">•••• •••• •••• 4242</p>
                        <p className="text-sm text-muted-foreground font-medium">Expires 12/26</p>
                      </div>
                    </div>
                    <Badge className="bg-primary text-white font-black px-6 py-2 rounded-full text-sm uppercase tracking-widest">Primary</Badge>
                  </div>
                  <Button variant="outline" className="w-full h-20 rounded-[2.5rem] border-2 border-dashed border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary/60 hover:text-primary font-black text-xl transition-all gap-4">
                    <CreditCard className="w-7 h-7" />
                    <span>Add New Payment Method</span>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      <motion.div variants={item}>
        <Card className="border-none shadow-xl shadow-destructive/5 bg-destructive/5 backdrop-blur-md rounded-[2.5rem] border border-destructive/10">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-4 text-destructive">
              <AlertTriangle className="w-8 h-8" />
              <CardTitle className="text-2xl font-black tracking-tight">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-base font-medium text-destructive/60">Irreversible actions for your account. Please proceed with caution.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 flex flex-col sm:flex-row gap-6">
            <Button variant="outline" className="flex-1 h-14 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/10 font-black text-lg transition-all">
              Deactivate Account
            </Button>
            <Button variant="destructive" className="flex-1 h-14 rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-black text-lg shadow-2xl shadow-destructive/30 transition-all hover:scale-[1.02] active:scale-[0.98] gap-3">
              <Trash2 className="w-5 h-5" />
              <span>Delete Account</span>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
