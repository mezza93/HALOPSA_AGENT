'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Camera,
  Loader2,
  Settings,
  Link2,
  Bell,
  Palette,
  Shield,
  Key,
  Smartphone,
  Trash2,
  ChevronRight,
  Check,
  Moon,
  Sun,
  Monitor,
  Paintbrush,
  FileText,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface SettingsViewProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

type TabId = 'profile' | 'connections' | 'branding' | 'notifications' | 'appearance' | 'security';

const tabs: { id: TabId; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Your personal information' },
  { id: 'connections', label: 'Connections', icon: Link2, description: 'HaloPSA integrations' },
  { id: 'branding', label: 'Branding', icon: Paintbrush, description: 'Colors, logo & naming' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alert preferences' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme and display' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Password and 2FA' },
];

export function SettingsView({ user }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [name, setName] = useState(user.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // Branding state
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#14b8a6');
  const [secondaryColor, setSecondaryColor] = useState('#0d9488');
  const [reportNaming, setReportNaming] = useState('{company} - {type} - {date}');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Load branding settings
  useEffect(() => {
    async function loadBranding() {
      setBrandingLoading(true);
      try {
        const response = await fetch('/api/user/branding');
        if (response.ok) {
          const data = await response.json();
          setPrimaryColor(data.primaryColor || '#14b8a6');
          setSecondaryColor(data.secondaryColor || '#0d9488');
          setReportNaming(data.reportNaming || '{company} - {type} - {date}');
          setLogoUrl(data.logoUrl);
          setLogoPreview(data.logoUrl);
        }
      } catch (error) {
        console.error('Failed to load branding settings:', error);
      } finally {
        setBrandingLoading(false);
      }
    }
    loadBranding();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo must be less than 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('File must be an image');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandingSaving(true);

    try {
      // For now, we'll save the logo as a data URL
      // In production, you'd upload to a file storage service
      let finalLogoUrl = logoUrl;
      if (logoFile && logoPreview) {
        finalLogoUrl = logoPreview; // Using data URL for demo
      }

      const response = await fetch('/api/user/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryColor,
          secondaryColor,
          reportNaming,
          logoUrl: finalLogoUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save branding');
      }

      setLogoUrl(finalLogoUrl);
      setLogoFile(null);
      toast.success('Branding settings saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save branding');
    } finally {
      setBrandingSaving(false);
    }
  };

  const resetBrandingToDefaults = () => {
    setPrimaryColor('#14b8a6');
    setSecondaryColor('#0d9488');
    setReportNaming('{company} - {type} - {date}');
    setLogoPreview(null);
    setLogoUrl(null);
    setLogoFile(null);
    toast.info('Branding reset to defaults (save to apply)');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-turquoise-400 to-turquoise-600 shadow-lg shadow-turquoise-500/25">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account preferences and integrations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                    activeTab === tab.id
                      ? 'bg-turquoise-50 text-turquoise-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <tab.icon className={cn(
                    'h-5 w-5',
                    activeTab === tab.id ? 'text-turquoise-600' : 'text-gray-400'
                  )} />
                  <div className="flex-1">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs text-muted-foreground">{tab.description}</div>
                  </div>
                  {activeTab === tab.id && (
                    <ChevronRight className="h-4 w-4 text-turquoise-600" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-turquoise-500 to-cyan-500 h-24" />
                  <div className="px-6 pb-6 -mt-12">
                    <div className="flex items-end gap-4 mb-6">
                      <div className="relative">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || 'Profile'}
                            className="h-24 w-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-turquoise-100 text-turquoise-600 border-4 border-white shadow-lg">
                            <User className="h-10 w-10" />
                          </div>
                        )}
                        <button className="absolute -bottom-1 -right-1 rounded-full bg-turquoise-500 p-2 text-white shadow-lg hover:bg-turquoise-600 transition-colors">
                          <Camera className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mb-2">
                        <h2 className="text-xl font-semibold">{user.name || 'User'}</h2>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="input-field pl-10"
                              placeholder="Enter your name"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="email"
                              value={user.email || ''}
                              className="input-field pl-10 bg-gray-50"
                              disabled
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-gray-100">
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'connections' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold">HaloPSA Connections</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage your HaloPSA instance connections
                    </p>
                  </div>
                  <Link href="/settings/connections">
                    <Button>
                      <Link2 className="mr-2 h-4 w-4" />
                      Manage Connections
                    </Button>
                  </Link>
                </div>
                <p className="text-muted-foreground text-center py-8">
                  Go to the Connections page to add or manage your HaloPSA integrations.
                </p>
              </div>
            )}

            {activeTab === 'branding' && (
              <div className="space-y-6">
                {brandingLoading ? (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-turquoise-500" />
                  </div>
                ) : (
                  <form onSubmit={handleSaveBranding} className="space-y-6">
                    {/* Colors Section */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-turquoise-400 to-turquoise-600">
                          <Palette className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">Brand Colors</h2>
                          <p className="text-sm text-muted-foreground">
                            Customize colors for reports and dashboards
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="mb-2 block text-sm font-medium">Primary Color</label>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer appearance-none bg-transparent"
                                style={{ backgroundColor: primaryColor }}
                              />
                            </div>
                            <input
                              type="text"
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(e.target.value)}
                              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                              className="input-field flex-1 font-mono uppercase"
                              placeholder="#14b8a6"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Used for charts, headings, and accents
                          </p>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">Secondary Color</label>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <input
                                type="color"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer appearance-none bg-transparent"
                                style={{ backgroundColor: secondaryColor }}
                              />
                            </div>
                            <input
                              type="text"
                              value={secondaryColor}
                              onChange={(e) => setSecondaryColor(e.target.value)}
                              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                              className="input-field flex-1 font-mono uppercase"
                              placeholder="#0d9488"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Used for secondary elements and backgrounds
                          </p>
                        </div>
                      </div>

                      {/* Color Preview */}
                      <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-sm font-medium mb-3">Preview</p>
                        <div className="flex items-center gap-4">
                          <div
                            className="h-16 w-32 rounded-lg shadow-sm flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Primary
                          </div>
                          <div
                            className="h-16 w-32 rounded-lg shadow-sm flex items-center justify-center text-white font-medium"
                            style={{ backgroundColor: secondaryColor }}
                          >
                            Secondary
                          </div>
                          <div className="flex-1 h-16 rounded-lg shadow-sm overflow-hidden flex">
                            <div className="w-1/2 h-full" style={{ backgroundColor: primaryColor }} />
                            <div className="w-1/2 h-full" style={{ backgroundColor: secondaryColor }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Report Naming Section */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-turquoise-400 to-turquoise-600">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">Report Naming</h2>
                          <p className="text-sm text-muted-foreground">
                            Set a naming convention for generated reports
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">Naming Schema</label>
                        <input
                          type="text"
                          value={reportNaming}
                          onChange={(e) => setReportNaming(e.target.value)}
                          className="input-field w-full font-mono"
                          placeholder="{company} - {type} - {date}"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Available placeholders: <code className="bg-gray-100 px-1 rounded">{'{company}'}</code>,{' '}
                          <code className="bg-gray-100 px-1 rounded">{'{type}'}</code>,{' '}
                          <code className="bg-gray-100 px-1 rounded">{'{date}'}</code>,{' '}
                          <code className="bg-gray-100 px-1 rounded">{'{time}'}</code>,{' '}
                          <code className="bg-gray-100 px-1 rounded">{'{user}'}</code>
                        </p>
                      </div>

                      {/* Naming Preview */}
                      <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Example: </span>
                          <span className="font-medium">
                            {reportNaming
                              .replace('{company}', 'Acme Corp')
                              .replace('{type}', 'Monthly Summary')
                              .replace('{date}', new Date().toLocaleDateString())
                              .replace('{time}', new Date().toLocaleTimeString())
                              .replace('{user}', user.name || 'User')}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Logo Section */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-turquoise-400 to-turquoise-600">
                          <ImageIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold">Logo</h2>
                          <p className="text-sm text-muted-foreground">
                            Upload your company logo for reports
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-6">
                        <div className="shrink-0">
                          {logoPreview ? (
                            <div className="relative group">
                              <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="h-24 w-24 object-contain rounded-xl border-2 border-gray-200 bg-white p-2"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setLogoPreview(null);
                                  setLogoUrl(null);
                                  setLogoFile(null);
                                }}
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div className="h-24 w-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <label className="block">
                            <span className="sr-only">Choose logo file</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoChange}
                              className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-lg file:border-0
                                file:text-sm file:font-medium
                                file:bg-turquoise-50 file:text-turquoise-700
                                hover:file:bg-turquoise-100
                                cursor-pointer"
                            />
                          </label>
                          <p className="text-xs text-muted-foreground mt-2">
                            PNG, JPG, or SVG. Max 2MB. Recommended size: 200x200px
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetBrandingToDefaults}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset to Defaults
                      </Button>
                      <Button type="submit" disabled={brandingSaving}>
                        {brandingSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Save Branding
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Email notifications', description: 'Receive email for important updates' },
                    { label: 'Push notifications', description: 'Browser notifications for new messages' },
                    { label: 'SLA alerts', description: 'Get notified before SLA breaches' },
                    { label: 'Weekly digest', description: 'Summary of your weekly activity' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-turquoise-200 transition-colors">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-turquoise-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-turquoise-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-6">Theme</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'system', label: 'System', icon: Monitor },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setTheme(option.id as typeof theme)}
                      className={cn(
                        'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all',
                        theme === option.id
                          ? 'border-turquoise-500 bg-turquoise-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <option.icon className={cn(
                        'h-8 w-8',
                        theme === option.id ? 'text-turquoise-600' : 'text-gray-400'
                      )} />
                      <span className={cn(
                        'font-medium',
                        theme === option.id ? 'text-turquoise-700' : 'text-gray-600'
                      )}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-6">Security Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
                          <Key className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">Change Password</p>
                          <p className="text-sm text-muted-foreground">Update your password</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Change</Button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
                          <Smartphone className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">Two-Factor Authentication</p>
                          <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Enable</Button>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100">
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-red-700">Delete Account</p>
                        <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm">Delete Account</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
