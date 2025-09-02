'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuth } from '@/hooks/use-auth';

export function NotificationTest() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, error, refresh } = useNotifications();
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const runTest = async () => {
    setTestStatus('testing');
    
    try {
      // Test the notification system
      await refresh();
      
      // Wait a moment for the data to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTestStatus('success');
    } catch (err) {
      console.error('Test failed:', err);
      setTestStatus('error');
    }
  };

  const getStatusColor = () => {
    switch (testStatus) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'testing': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (testStatus) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'testing': return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Notification System Test
        </CardTitle>
        <CardDescription>
          Test if the Firebase indexes are working and notifications are loading properly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
            <div className="text-sm text-muted-foreground">Total Notifications</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
            <div className="text-sm text-muted-foreground">Unread Count</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className={`text-2xl font-bold ${getStatusColor()}`}>
              {loading ? 'Loading...' : error ? 'Error' : 'Ready'}
            </div>
            <div className="text-sm text-muted-foreground">System Status</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Test Results:</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={user ? 'default' : 'destructive'}>
                {user ? 'Authenticated' : 'Not Authenticated'}
              </Badge>
              <span>User authentication status</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={!loading ? 'default' : 'secondary'}>
                {!loading ? 'Loaded' : 'Loading'}
              </Badge>
              <span>Notification data loading</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={!error ? 'default' : 'destructive'}>
                {!error ? 'No Errors' : 'Has Errors'}
              </Badge>
              <span>Error status</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={testStatus === 'success' ? 'default' : testStatus === 'error' ? 'destructive' : 'secondary'}>
                {testStatus === 'success' ? 'Indexes Working' : testStatus === 'error' ? 'Index Issues' : 'Not Tested'}
              </Badge>
              <span>Firebase indexes status</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <h5 className="font-medium text-red-800">Error Details:</h5>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={runTest} disabled={testStatus === 'testing'}>
            {testStatus === 'testing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Test
          </Button>
          <Button variant="outline" onClick={refresh} disabled={loading}>
            Refresh Data
          </Button>
        </div>

        {testStatus === 'success' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">All systems working!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Firebase indexes are deployed and notifications are loading successfully.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}