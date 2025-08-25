export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'project' | 'worker' | 'payment' | 'system' | 'reminder';
  isRead: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    projectId?: string;
    workerId?: string;
    amount?: number;
    dueDate?: Date;
    [key: string]: any;
  };
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  categories: {
    project: boolean;
    worker: boolean;
    payment: boolean;
    system: boolean;
    reminder: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
}

export interface NotificationTemplate {
  type: string;
  title: string;
  message: string;
  category: Notification['category'];
  priority: 'low' | 'medium' | 'high';
}