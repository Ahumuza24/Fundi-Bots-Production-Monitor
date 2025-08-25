import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification, NotificationPreferences, NotificationTemplate } from '@/types/notification';

// Notification templates
export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  PROJECT_CREATED: {
    type: 'PROJECT_CREATED',
    title: 'New Project Created',
    message: 'Project "{projectName}" has been successfully created.',
    category: 'project',
    priority: 'medium'
  },
  PROJECT_COMPLETED: {
    type: 'PROJECT_COMPLETED',
    title: 'Project Completed',
    message: 'Project "{projectName}" has been marked as completed.',
    category: 'project',
    priority: 'high'
  },
  PROJECT_DEADLINE_APPROACHING: {
    type: 'PROJECT_DEADLINE_APPROACHING',
    title: 'Project Deadline Approaching',
    message: 'Project "{projectName}" is due in {days} days.',
    category: 'reminder',
    priority: 'high'
  },
  WORKER_ASSIGNED: {
    type: 'WORKER_ASSIGNED',
    title: 'Worker Assigned',
    message: '{workerName} has been assigned to project "{projectName}".',
    category: 'worker',
    priority: 'medium'
  },
  PAYMENT_DUE: {
    type: 'PAYMENT_DUE',
    title: 'Payment Due',
    message: 'Payment of ${amount} is due for project "{projectName}".',
    category: 'payment',
    priority: 'high'
  },
  PAYMENT_RECEIVED: {
    type: 'PAYMENT_RECEIVED',
    title: 'Payment Received',
    message: 'Payment of ${amount} has been received for project "{projectName}".',
    category: 'payment',
    priority: 'medium'
  },
  SYSTEM_UPDATE: {
    type: 'SYSTEM_UPDATE',
    title: 'System Update',
    message: 'FundiFlow has been updated with new features and improvements.',
    category: 'system',
    priority: 'low'
  }
};

// Create a new notification
export async function createNotification(
  userId: string,
  templateType: string,
  variables: Record<string, any> = {},
  metadata?: Notification['metadata']
): Promise<string> {
  const template = NOTIFICATION_TEMPLATES[templateType];
  if (!template) {
    throw new Error(`Unknown notification template: ${templateType}`);
  }

  // Replace variables in title and message
  let title = template.title;
  let message = template.message;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    title = title.replace(new RegExp(placeholder, 'g'), String(value));
    message = message.replace(new RegExp(placeholder, 'g'), String(value));
  });

  const notification: Omit<Notification, 'id'> = {
    title,
    message,
    type: template.priority === 'high' ? 'warning' : template.priority === 'low' ? 'info' : 'success',
    category: template.category,
    isRead: false,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata
  };

  const docRef = await addDoc(collection(db, 'notifications'), {
    ...notification,
    createdAt: Timestamp.fromDate(notification.createdAt),
    updatedAt: Timestamp.fromDate(notification.updatedAt)
  });

  return docRef.id;
}

// Get notifications for a user
export async function getUserNotifications(
  userId: string, 
  limitCount: number = 20,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  const constraints = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  ];

  if (unreadOnly) {
    constraints.splice(1, 0, where('isRead', '==', false));
  }

  const q = query(collection(db, 'notifications'), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date()
  })) as Notification[];
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    isRead: true,
    updatedAt: Timestamp.now()
  });
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  
  const snapshot = await getDocs(q);
  const updatePromises = snapshot.docs.map(doc => 
    updateDoc(doc.ref, {
      isRead: true,
      updatedAt: Timestamp.now()
    })
  );
  
  await Promise.all(updatePromises);
}

// Delete notification
export async function deleteNotification(notificationId: string): Promise<void> {
  await deleteDoc(doc(db, 'notifications', notificationId));
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// Subscribe to real-time notifications
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void,
  limitCount: number = 20
) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Notification[];
    
    callback(notifications);
  });
}

// Get or create notification preferences
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const q = query(
    collection(db, 'notificationPreferences'),
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    // Create default preferences
    const defaultPreferences: Omit<NotificationPreferences, 'id'> = {
      userId,
      emailNotifications: true,
      pushNotifications: true,
      categories: {
        project: true,
        worker: true,
        payment: true,
        system: true,
        reminder: true
      },
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
    
    const docRef = await addDoc(collection(db, 'notificationPreferences'), defaultPreferences);
    return { id: docRef.id, ...defaultPreferences };
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as NotificationPreferences;
}

// Update notification preferences
export async function updateNotificationPreferences(
  preferencesId: string,
  updates: Partial<NotificationPreferences>
): Promise<void> {
  const preferencesRef = doc(db, 'notificationPreferences', preferencesId);
  await updateDoc(preferencesRef, updates);
}