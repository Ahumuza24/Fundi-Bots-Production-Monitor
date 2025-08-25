import { useState, useEffect, useCallback } from 'react';
import { 
  getUserNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToNotifications
} from '@/lib/notifications';
import { Notification } from '@/types/notification';
import { useAuth } from '@/hooks/use-auth';

export function useNotifications(realtime: boolean = true) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const [notificationsData, unreadCountData] = await Promise.all([
        getUserNotifications(user.uid),
        getUnreadNotificationCount(user.uid)
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark notification as read'));
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.uid) return;

    try {
      await markAllNotificationsAsRead(user.uid);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark all notifications as read'));
    }
  }, [user?.uid]);

  // Delete notification
  const deleteNotificationById = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      
      // Update local state
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete notification'));
    }
  }, [notifications]);

  // Get unread notifications
  const unreadNotifications = notifications.filter(n => !n.isRead);

  // Get notifications by category
  const getNotificationsByCategory = useCallback((category: Notification['category']) => {
    return notifications.filter(n => n.category === category);
  }, [notifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.uid || !realtime) {
      if (!realtime) {
        fetchNotifications();
      }
      return;
    }

    const unsubscribe = subscribeToNotifications(user.uid, (notificationsData) => {
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.isRead).length);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.uid, realtime, fetchNotifications]);

  // Initial fetch for non-realtime mode
  useEffect(() => {
    if (!realtime && user?.uid) {
      fetchNotifications();
    }
  }, [realtime, user?.uid, fetchNotifications]);

  return {
    notifications,
    unreadNotifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteNotificationById,
    getNotificationsByCategory,
    refresh: fetchNotifications
  };
}

// Hook for notification preferences
export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Implementation for preferences will be added when needed
    setLoading(false);
  }, [user?.uid]);

  return {
    preferences,
    loading,
    error,
    updatePreferences: async () => {}
  };
}