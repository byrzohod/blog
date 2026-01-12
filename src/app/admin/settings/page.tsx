'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Mail, Globe, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  siteUrl: string;
  authorName: string;
  authorEmail: string;
  postsPerPage: number;
  enableComments: boolean;
  moderateComments: boolean;
  enableNewsletter: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    siteTitle: 'Book of Life',
    siteDescription: 'A personal chronicle of thoughts, experiences, and stories.',
    siteUrl: '',
    authorName: 'Sarkis Haralampiev',
    authorEmail: '',
    postsPerPage: 10,
    enableComments: true,
    moderateComments: true,
    enableNewsletter: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Settings className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-foreground-muted">Configure your blog settings</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-success/10 text-success'
              : 'bg-error/10 text-error'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General
            </CardTitle>
            <CardDescription>Basic site configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="siteTitle">Site Title</Label>
                <Input
                  id="siteTitle"
                  value={settings.siteTitle}
                  onChange={(e) => updateSetting('siteTitle', e.target.value)}
                  placeholder="My Blog"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteUrl">Site URL</Label>
                <Input
                  id="siteUrl"
                  value={settings.siteUrl}
                  onChange={(e) => updateSetting('siteUrl', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => updateSetting('siteDescription', e.target.value)}
                placeholder="A brief description of your blog"
                rows={3}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="authorName">Author Name</Label>
                <Input
                  id="authorName"
                  value={settings.authorName}
                  onChange={(e) => updateSetting('authorName', e.target.value)}
                  placeholder="Your Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postsPerPage">Posts Per Page</Label>
                <Input
                  id="postsPerPage"
                  type="number"
                  min={1}
                  max={50}
                  value={settings.postsPerPage}
                  onChange={(e) => updateSetting('postsPerPage', parseInt(e.target.value) || 10)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email
            </CardTitle>
            <CardDescription>Email and notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="authorEmail">Contact Email</Label>
              <Input
                id="authorEmail"
                type="email"
                value={settings.authorEmail}
                onChange={(e) => updateSetting('authorEmail', e.target.value)}
                placeholder="contact@example.com"
              />
              <p className="text-xs text-foreground-muted">
                Used for contact form submissions and notifications
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableNewsletter"
                checked={settings.enableNewsletter}
                onCheckedChange={(checked) =>
                  updateSetting('enableNewsletter', checked as boolean)
                }
              />
              <Label htmlFor="enableNewsletter" className="font-normal">
                Enable newsletter subscription
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Comment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments
            </CardTitle>
            <CardDescription>Comment moderation settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableComments"
                checked={settings.enableComments}
                onCheckedChange={(checked) =>
                  updateSetting('enableComments', checked as boolean)
                }
              />
              <Label htmlFor="enableComments" className="font-normal">
                Enable comments on posts
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="moderateComments"
                checked={settings.moderateComments}
                onCheckedChange={(checked) =>
                  updateSetting('moderateComments', checked as boolean)
                }
              />
              <Label htmlFor="moderateComments" className="font-normal">
                Require approval for new comments
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
