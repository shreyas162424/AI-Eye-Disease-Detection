import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, Moon, Globe, Bell, Shield, Download, Trash2, 
  User, Mail, Phone, Save, AlertCircle, LogOut 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser, useClerk } from '@clerk/clerk-react'; // Import Clerk hooks

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  
  // Get Real User Data from Clerk
  const { user } = useUser();
  const { signOut } = useClerk();

  // Load settings from LocalStorage or default
  const [userSettings, setUserSettings] = useState(() => {
    const saved = localStorage.getItem('user_preferences');
    return saved ? JSON.parse(saved) : {
      notifications: { email: true, push: false, reminders: true },
      privacy: { shareData: false, analytics: true },
      phone: ''
    };
  });

  // Sync Clerk Name/Email to State (only for display/editing name)
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    if (user) {
      setProfileName(user.fullName || '');
    }
  }, [user]);

  // Save Preferences to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('user_preferences', JSON.stringify(userSettings));
  }, [userSettings]);

  // Language options (Assuming your context provides these, or we mock them)
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'hi', label: 'Hindi' } // Added Hindi relevant for India context
  ];

  const handleSaveProfile = async () => {
    try {
      // In a real app, you'd update Clerk user metadata here
      // await user?.update({ firstName: ... }) 
      
      toast({
        title: "Profile Updated",
        description: "Your preferences have been saved locally.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive"
      });
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setUserSettings((prev: any) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setUserSettings((prev: any) => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value }
    }));
  };

  const handleExportData = () => {
    // Create a JSON file of local history
    const history = localStorage.getItem('clarity_scan_history');
    const blob = new Blob([history || '{}'], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "my_health_data.json";
    document.body.appendChild(link);
    link.click();
    
    toast({
      title: "Export Successful",
      description: "Your scan history has been downloaded.",
    });
  };

  const handleDeleteAllData = () => {
    if (window.confirm("Are you sure? This will wipe your local scan history permanently.")) {
      localStorage.removeItem('clarity_scan_history');
      localStorage.removeItem('user_preferences');
      toast({
        title: "Data Deleted",
        description: "All local data has been wiped.",
        variant: "destructive",
      });
      // Refresh to reset state
      window.location.reload();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            {t('settings') || 'Settings'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your account preferences and app settings.
          </p>
        </div>

        {/* Theme & Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" /> Appearance</CardTitle>
            <CardDescription>Customize how the app looks and feels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Theme</Label>
                <div className="text-sm text-muted-foreground">Switch between light and dark mode</div>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                <Moon className="h-4 w-4" />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Language</Label>
                <div className="text-sm text-muted-foreground">Select your preferred language</div>
              </div>
              <Select value={currentLanguage} onValueChange={setLanguage}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {languageOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Personal Information</CardTitle>
            <CardDescription>Managed via your Clerk secure account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={profileName} 
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address (Read Only)</Label>
                <Input 
                  id="email" 
                  value={user?.primaryEmailAddress?.emailAddress || ''} 
                  disabled 
                  className="bg-slate-100 text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input 
                  id="phone" 
                  placeholder="+91 98765 43210"
                  value={userSettings.phone}
                  onChange={(e) => setUserSettings((prev: any) => ({ ...prev, phone: e.target.value }))} 
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} className="bg-slate-900 text-white hover:bg-slate-800">
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: 'email', label: 'Email Notifications', desc: 'Receive results via email' },
              { id: 'push', label: 'Push Notifications', desc: 'Browser alerts for analysis' },
              { id: 'reminders', label: 'Health Reminders', desc: 'Monthly check-up reminders' }
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">{item.label}</Label>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </div>
                <Switch 
                  checked={userSettings.notifications[item.id as keyof typeof userSettings.notifications]} 
                  onCheckedChange={(c) => handleNotificationChange(item.id, c)} 
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Data & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Share Anonymous Data</Label>
                <div className="text-sm text-muted-foreground">Allow anonymized data for research</div>
              </div>
              <Switch 
                checked={userSettings.privacy.shareData} 
                onCheckedChange={(c) => handlePrivacyChange('shareData', c)} 
              />
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button variant="outline" onClick={handleExportData} className="flex-1">
                <Download className="h-4 w-4 mr-2" /> Export Data (JSON)
              </Button>
              <Button variant="destructive" onClick={handleDeleteAllData} className="flex-1">
                <Trash2 className="h-4 w-4 mr-2" /> Delete All History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <div className="flex justify-center pt-4">
            <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
        </div>

      </motion.div>
    </div>
  );
};

export default SettingsPage;
