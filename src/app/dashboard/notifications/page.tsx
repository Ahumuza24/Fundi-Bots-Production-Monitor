'use client';

import { NotificationCenter } from '@/components/notifications/notification-center';

export default function NotificationsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with real-time project notifications and alerts.
          </p>
        </div>
        <NotificationCenter />
      </div>
    </div>
  );
}