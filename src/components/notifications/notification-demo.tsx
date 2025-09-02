'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Users, 
  Calendar, 
  Briefcase, 
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';

export function NotificationStats() {
  const { notifications, unreadCount, refresh: refreshNotifications } = useNotifications();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setIsRefreshing(false);
  };

  // Group notifications by type for stats
  const notificationStats = notifications.reduce((acc, notification) => {
    const type = notification.type;
    if (!acc[type]) {
      acc[type] = { count: 0, unread: 0 };
    }
    acc[type].count++;
    if (!notification.isRead) {
      acc[type].unread++;
    }
    return acc;
  }, {} as Record<string, { count: number; unread: number }>);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PROJECT_CREATED_FOR_ASSEMBLERS':
      case 'PROJECT_ASSIGNED_TO_ASSEMBLER':
        return <Briefcase className="h-4 w-4" />;
      case 'WORK_SESSION_COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'PROJECT_DEADLINE_APPROACHING_ASSEMBLERS':
      case 'PROJECT_DEADLINE_APPROACHING_LEADS':
        return <AlertTriangle className="h-4 w-4" />;
      case 'NEW_ANNOUNCEMENT':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'PROJECT_CREATED_FOR_ASSEMBLERS':
        return 'New Projects';
      case 'PROJECT_ASSIGNED_TO_ASSEMBLER':
        return 'Project Assignments';
      case 'WORK_SESSION_COMPLETED':
        return 'Work Sessions';
      case 'PROJECT_DEADLINE_APPROACHING_ASSEMBLERS':
      case 'PROJECT_DEADLINE_APPROACHING_LEADS':
        return 'Deadline Alerts';
      case 'NEW_ANNOUNCEMENT':
        return 'Announcements';
      default:
        return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Overview
              </CardTitle>
              <CardDescription>
                Real-time notification system status and statistics
              </CardDescription>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Total</span>
              </div>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Unread</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">Read</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{notifications.length - unreadCount}</div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Today</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {notifications.filter(n => {
                  const today = new Date();
                  const notificationDate = new Date(n.createdAt || Date.now());
                  return notificationDate.toDateString() === today.toDateString();
                }).length}
              </div>
            </div>
          </div>

          {Object.keys(notificationStats).length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Notification Types</h3>
              <div className="space-y-2">
                {Object.entries(notificationStats).map(([type, stats]) => (
                  <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(type)}
                      <span className="font-medium">{getTypeLabel(type)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {stats.count} total
                      </Badge>
                      {stats.unread > 0 && (
                        <Badge variant="destructive">
                          {stats.unread} unread
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notifications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm">Notifications will appear here when triggered by system events</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Workflows</CardTitle>
          <CardDescription>
            Active notification workflows in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Briefcase className="h-5 w-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium">Project Created</h4>
                <p className="text-sm text-muted-foreground">
                  When a new project is created, all assemblers receive in-app and email notifications
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Users className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <h4 className="font-medium">Project Assignment</h4>
                <p className="text-sm text-muted-foreground">
                  When a project is assigned to an assembler, they receive in-app and email notifications
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-500 mt-1" />
              <div>
                <h4 className="font-medium">Work Session Completed</h4>
                <p className="text-sm text-muted-foreground">
                  When an assembler finishes a work session, the project lead receives detailed notifications
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-500 mt-1" />
              <div>
                <h4 className="font-medium">Deadline Approaching</h4>
                <p className="text-sm text-muted-foreground">
                  When project deadlines approach, both assemblers and project leads are notified
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <MessageSquare className="h-5 w-5 text-indigo-500 mt-1" />
              <div>
                <h4 className="font-medium">Announcements</h4>
                <p className="text-sm text-muted-foreground">
                  When project leads make announcements, relevant users receive notifications
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}