'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Bell, 
  Mail, 
  Briefcase, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare,
  Save,
  TestTube
} from 'lucide-react';

interface EmailPreferences {
  projectCreated: boolean;
  projectAssigned: boolean;
  workSessionCompleted: boolean;
  deadlineApproaching: boolean;
  announcements: boolean;
  emailEnabled: boolean;
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<EmailPreferences>({
    projectCreated: true,
    projectAssigned: true,
    workSessionCompleted: true,
    deadlineApproaching: true,
    announcements: true,
    emailEnabled: true
  });
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  // Load preferences on component mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      // This would load from Firebase in a real implementation
      // For now, using localStorage as a placeholder
      const saved = localStorage.getItem('emailPreferences');
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      // This would save to Firebase in a real implementation
      // For now, using localStorage as a placeholder
      localStorage.setItem('emailPreferences', JSON.stringify(preferences));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Email preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const testEmailNotifications = async () => {
    setTesting(true);
    try {
      // First test SMTP connection
      const smtpResponse = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'connection'
        })
      });

      const smtpResult = await smtpResponse.json();
      
      if (!smtpResult.success) {
        toast.error('SMTP connection failed. Check your configuration.');
        return;
      }

      // Then test notification system
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'quick'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Email system test completed! Check console for details.');
      } else {
        toast.error('Email notification test failed');
      }
    } catch (error) {
      console.error('Error testing emails:', error);
      toast.error('Failed to test email notifications');
    } finally {
      setTesting(false);
    }
  };

  const testSMTPConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'full',
          recipientEmail: 'ahumuzacedric@gmail.com' // Test with your email
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('SMTP test passed! Check your email inbox.');
      } else {
        toast.error(`SMTP test failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error testing SMTP:', error);
      toast.error('Failed to test SMTP connection');
    } finally {
      setTesting(false);
    }
  };

  const updatePreference = (key: keyof EmailPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const notificationTypes = [
    {
      key: 'projectCreated' as keyof EmailPreferences,
      title: 'New Projects',
      description: 'When new projects are created and available for assignment',
      icon: Briefcase,
      color: 'text-blue-500'
    },
    {
      key: 'projectAssigned' as keyof EmailPreferences,
      title: 'Project Assignments',
      description: 'When you are assigned to work on a project',
      icon: Users,
      color: 'text-green-500'
    },
    {
      key: 'workSessionCompleted' as keyof EmailPreferences,
      title: 'Work Session Updates',
      description: 'When assemblers complete work sessions (for project leads)',
      icon: CheckCircle,
      color: 'text-purple-500'
    },
    {
      key: 'deadlineApproaching' as keyof EmailPreferences,
      title: 'Deadline Alerts',
      description: 'When project deadlines are approaching',
      icon: AlertTriangle,
      color: 'text-orange-500'
    },
    {
      key: 'announcements' as keyof EmailPreferences,
      title: 'Announcements',
      description: 'When project leads make important announcements',
      icon: MessageSquare,
      color: 'text-indigo-500'
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground">
          Manage your email notification preferences
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Control which email notifications you receive from FundiFlow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Master email toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Enable Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Master switch for all email notifications
                </p>
              </div>
              <Switch
                checked={preferences.emailEnabled}
                onCheckedChange={(checked) => updatePreference('emailEnabled', checked)}
              />
            </div>

            <Separator />

            {/* Individual notification types */}
            <div className="space-y-4">
              <h3 className="font-medium">Notification Types</h3>
              {notificationTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <div key={type.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <IconComponent className={`h-5 w-5 mt-0.5 ${type.color}`} />
                      <div className="space-y-1">
                        <Label className="text-base font-medium">{type.title}</Label>
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.emailEnabled && preferences[type.key]}
                      onCheckedChange={(checked) => updatePreference(type.key, checked)}
                      disabled={!preferences.emailEnabled}
                    />
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
              <Button onClick={savePreferences} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Preferences'}
              </Button>
              
              <Button variant="outline" onClick={testSMTPConnection} disabled={testing}>
                <TestTube className="h-4 w-4 mr-2" />
                {testing ? 'Testing...' : 'Test SMTP'}
              </Button>
              
              <Button variant="outline" onClick={testEmailNotifications} disabled={testing}>
                <Bell className="h-4 w-4 mr-2" />
                {testing ? 'Testing...' : 'Test Notifications'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              In-App Notifications
            </CardTitle>
            <CardDescription>
              In-app notifications are always enabled and cannot be disabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notificationTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <div key={type.key} className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-start gap-3">
                      <IconComponent className={`h-5 w-5 mt-0.5 ${type.color}`} />
                      <div className="space-y-1">
                        <Label className="text-base font-medium">{type.title}</Label>
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-green-600 font-medium">Always On</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SMTP Email Configuration</CardTitle>
            <CardDescription>
              Current SMTP email provider and configuration status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Email Provider:</span>
                <span className="text-sm text-muted-foreground">
                  SMTP (Gmail)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">SMTP Host:</span>
                <span className="text-sm text-muted-foreground">
                  smtp.gmail.com:587
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">From Email:</span>
                <span className="text-sm text-muted-foreground">
                  ahumuzacedric@gmail.com
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Authentication:</span>
                <span className="text-sm text-green-600">✅ App Password</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Status:</span>
                <span className="text-sm text-green-600">✅ Ready</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Gmail Setup Notes:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Using App Password for secure authentication</li>
                <li>• 2-Factor Authentication enabled on Gmail account</li>
                <li>• SMTP connection secured with TLS</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}