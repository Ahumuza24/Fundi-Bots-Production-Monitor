'use client';

import { NotificationCenter } from '@/components/notifications/notification-center';
import { NotificationStats } from '@/components/notifications/notification-demo';
import { NotificationTest } from '@/components/notifications/notification-test';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NotificationsPage() {
  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">My Notifications</TabsTrigger>
          <TabsTrigger value="demo">Demo & Test</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications" className="mt-6">
          <NotificationCenter />
        </TabsContent>
        
        <TabsContent value="demo" className="mt-6">
          <div className="space-y-6">
            <NotificationStats />
          </div>
        </TabsContent>
        
        <TabsContent value="status" className="mt-6">
          <NotificationTest />
        </TabsContent>
      </Tabs>
    </div>
  );
}