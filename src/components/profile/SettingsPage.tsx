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
  Globe, 
  Trash2,
  Save,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { usersAPI, authAPI } from '@/src/services/api';

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
  const { user, refreshProfile } = useRole();
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    location: user.location || '',
    bio: user.bio || ''
  });

  // Password form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification preferences states
  const [notifications, setNotifications] = useState({
    investmentOpportunities: true,
    paymentReminders: true,
    agreementUpdates: true,
    platformNews: false
  });

  // 2FA states
  const [twoFactor, setTwoFactor] = useState({
    sms: false,
    authenticator: true
  });

  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [id]: value }));
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTwoFactorToggle = (key: keyof typeof twoFactor) => {
    setTwoFactor(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeactivateAccount = async () => {
    if (!confirm('Are you sure you want to deactivate your account? This action can be reversed by contacting support.')) {
      return;
    }
    setIsDeactivating(true);
    try {
      // For now, just show a toast - would need backend endpoint
      toast.info('Account deactivation requires admin approval. Please contact support.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to deactivate account';
      toast.error(errorMessage);
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      return;
    }
    if (!confirm('This will permanently delete all your data including agreements, payments, and profile information. Continue?')) {
      return;
    }
    setIsDeactivating(true);
    try {
      await usersAPI.deleteAccount();
      toast.success('Account deleted successfully. You will be logged out.');
      // Log out the user after deletion
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete account';
      toast.error(errorMessage);
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: any = {};
      if (formData.name !== user.name && formData.name.length >= 2) payload.fullName = formData.name;
      if (formData.phone !== user.phone) {
        if (formData.phone.length >= 5 || formData.phone.length === 0) {
          payload.phone = formData.phone || null;
        }
      }
      if (formData.location !== user.location) payload.location = formData.location || null;
      if (formData.bio !== user.bio) payload.bio = formData.bio || null;

      if (Object.keys(payload).length === 0) {
        toast.info('No changes to save');
        return;
      }

      await usersAPI.updateProfile(user.id, payload);
      toast.success('Settings saved successfully');
      await refreshProfile();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to save settings';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Za-z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword)) {
      toast.error('Password must contain both letters and digits');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update password';
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Settings</h1>
        <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Manage your account preferences and system settings.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-9 space-y-8">
          <Tabs defaultValue="profile" className="space-y-6">
            <motion.div variants={item}>
              <TabsList className="bg-slate-100 p-1 rounded-lg h-10 border border-slate-200">
                <TabsTrigger value="profile" className="gap-2 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-[10px] uppercase tracking-wider transition-all">
                  <User className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-[10px] uppercase tracking-wider transition-all">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Security</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2 px-4 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-[10px] uppercase tracking-wider transition-all">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Notifications</span>
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <AnimatePresence mode="wait">
              <TabsContent value="profile" className="space-y-6 outline-none">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                    <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="text-base font-bold tracking-tight">Public Profile</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">This information will be visible to other users on the platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Full Name</Label>
                          <Input id="name" value={formData.name} onChange={handleInputChange} className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Email Address</Label>
                          <Input id="email" value={formData.email} onChange={handleInputChange} className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Phone Number</Label>
                          <Input id="phone" value={formData.phone} onChange={handleInputChange} className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="location" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Location</Label>
                          <Input id="location" value={formData.location} onChange={handleInputChange} className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="bio" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Bio</Label>
                        <Input id="bio" value={formData.bio} onChange={handleInputChange} className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3" />
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button 
                          onClick={handleSave}
                          disabled={isSaving}
                          className="gap-2 h-9 px-6 rounded-md bg-primary hover:bg-primary/90 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="security" className="space-y-6 outline-none">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                    <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="text-base font-bold tracking-tight">Password</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Update your password to keep your account secure.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="currentPassword" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Current Password</Label>
                        <Input 
                          id="currentPassword" 
                          type="password" 
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordInputChange}
                          className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3" 
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <Label htmlFor="newPassword" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">New Password</Label>
                          <div className="relative">
                            <Input 
                              id="newPassword" 
                              type={showPassword ? "text" : "password"} 
                              value={passwordForm.newPassword}
                              onChange={handlePasswordInputChange}
                              className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3 pr-10" 
                            />
                            <button 
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="confirmPassword" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Confirm New Password</Label>
                          <Input 
                            id="confirmPassword" 
                            type="password" 
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordInputChange}
                            className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3" 
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button 
                          onClick={handlePasswordChange}
                          disabled={isChangingPassword}
                          className="gap-2 h-9 px-6 rounded-md bg-primary hover:bg-primary/90 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95"
                        >
                          {isChangingPassword ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Update Password</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                    <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="text-base font-bold tracking-tight">Two-Factor Authentication</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Add an extra layer of security to your account.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-md border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                            <Smartphone className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 tracking-tight">SMS Authentication</p>
                            <p className="text-[11px] text-slate-500 font-medium">Receive a code via SMS to log in.</p>
                          </div>
                        </div>
                        <Switch 
                          checked={twoFactor.sms}
                          onCheckedChange={() => handleTwoFactorToggle('sms')}
                          className="data-[state=checked]:bg-primary" 
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-md border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 tracking-tight">Authenticator App</p>
                            <p className="text-[11px] text-slate-500 font-medium">Use an app like Google Authenticator.</p>
                          </div>
                        </div>
                        <Switch 
                          checked={twoFactor.authenticator}
                          onCheckedChange={() => handleTwoFactorToggle('authenticator')}
                          className="data-[state=checked]:bg-primary" 
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6 outline-none">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                    <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="text-base font-bold tracking-tight">Notification Preferences</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Choose how you want to be notified about platform activity.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Email Notifications</h4>
                        <div className="space-y-3">
                          {[
                            { key: 'investmentOpportunities' as const, label: 'New Investment Opportunities', desc: 'Get notified when new projects match your profile.' },
                            { key: 'paymentReminders' as const, label: 'Payment Reminders', desc: 'Receive alerts for upcoming and overdue payments.' },
                            { key: 'agreementUpdates' as const, label: 'Agreement Updates', desc: 'Notifications when agreements are signed or modified.' },
                            { key: 'platformNews' as const, label: 'Platform News', desc: 'Stay updated with the latest AgriInvest features.' },
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 rounded-md border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all group">
                              <div className="space-y-0.5">
                                <p className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-primary transition-colors">{item.label}</p>
                                <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
                              </div>
                              <Switch 
                                checked={notifications[item.key]}
                                onCheckedChange={() => handleNotificationToggle(item.key)}
                                className="data-[state=checked]:bg-primary" 
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>

          <motion.div variants={item}>
            <Card className="border border-destructive/20 shadow-sm bg-destructive/5 rounded-lg overflow-hidden">
              <CardHeader className="p-5 border-b border-destructive/10">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  <CardTitle className="text-base font-bold tracking-tight">Danger Zone</CardTitle>
                </div>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-destructive/60 mt-1">Irreversible actions for your account. Please proceed with caution.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleDeactivateAccount}
                  disabled={isDeactivating}
                  className="flex-1 h-10 rounded-md border-destructive/20 text-destructive hover:bg-destructive/10 font-bold text-[11px] uppercase tracking-wider transition-all"
                >
                  {isDeactivating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Deactivate Account'
                  )}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={isDeactivating}
                  className="flex-1 h-10 rounded-md bg-destructive hover:bg-destructive/90 text-white font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all active:scale-95 gap-2"
                >
                  {isDeactivating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Account</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <motion.div variants={item}>
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Account Level</span>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold text-[9px] uppercase tracking-wider px-1.5 py-0 rounded-md">Verified</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">2FA Status</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[9px] uppercase tracking-wider px-1.5 py-0 rounded-md">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Last Login</span>
                    <span className="font-bold text-[10px] text-slate-900">Today, 09:42 AM</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Profile Completion</p>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[85%] transition-all duration-1000" />
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1.5 font-bold uppercase tracking-wider">85% complete</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border border-primary/10 shadow-sm bg-primary/5 rounded-lg overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight text-slate-900">Need Help?</h3>
                    <p className="text-[9px] font-bold text-primary/60 uppercase tracking-wider">Support is available 24/7</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed mb-4">
                  Have questions about your account or platform features? Our support team is here to help you.
                </p>
                <Button variant="outline" className="w-full h-9 rounded-md border-primary/20 text-primary hover:bg-primary/10 font-bold text-[10px] uppercase tracking-wider transition-all">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
