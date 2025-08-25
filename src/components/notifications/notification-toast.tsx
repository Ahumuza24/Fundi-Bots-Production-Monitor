'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/use-notifications';
import { Notification } from '@/types/notification';

export function NotificationToast() {
  const { notifications } = useNotifications();

  useEffect(() => {
    // Show toast for new unread notifications
    const latestNotification = notifications.find(n => !n.isRead);
    
    if (latestNotification) {
      const showToast = () => {
        switch (latestNotification.type) {
          case 'success':
            toast.success(latestNotification.title, {
              description: latestNotification.message,
              action: latestNotification.actionLabel ? {
                label: latestNotification.actionLabel,
                onClick: () => {
                  if (latestNotification.actionUrl) {
                    window.location.href = latestNotification.actionUrl;
                  }
                }
              } : undefined
            });
            break;
          case 'error':
            toast.error(latestNotification.title, {
              description: latestNotification.message,
              action: latestNotification.actionLabel ? {
                label: latestNotification.actionLabel,
                onClick: () => {
                  if (latestNotification.actionUrl) {
                    window.location.href = latestNotification.actionUrl;
                  }
                }
              } : undefined
            });
            break;
          case 'warning':
            toast.warning(latestNotification.title, {
              description: latestNotification.message,
              action: latestNotification.actionLabel ? {
                label: latestNotification.actionLabel,
                onClick: () => {
                  if (latestNotification.actionUrl) {
                    window.location.href = latestNotification.actionUrl;
                  }
                }
              } : undefined
            });
            break;
          default:
            toast.info(latestNotification.title, {
              description: latestNotification.message,
              action: latestNotification.actionLabel ? {
                label: latestNotification.actionLabel,
                onClick: () => {
                  if (latestNotification.actionUrl) {
                    window.location.href = latestNotification.actionUrl;
                  }
                }
              } : undefined
            });
        }
      };

      // Debounce to avoid showing multiple toasts rapidly
      const timeoutId = setTimeout(showToast, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [notifications]);

  return null; // This component doesn't render anything
}