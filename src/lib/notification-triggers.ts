import { createNotification } from '@/lib/notifications';

// Project-related notifications
export async function notifyProjectCreated(
  userId: string, 
  projectName: string, 
  projectId: string
) {
  return createNotification(
    userId,
    'PROJECT_CREATED',
    { projectName },
    { 
      projectId,
      actionUrl: `/dashboard/projects/${projectId}`,
      actionLabel: 'View Project'
    }
  );
}

export async function notifyProjectCompleted(
  userId: string, 
  projectName: string, 
  projectId: string
) {
  return createNotification(
    userId,
    'PROJECT_COMPLETED',
    { projectName },
    { 
      projectId,
      actionUrl: `/dashboard/projects/${projectId}`,
      actionLabel: 'View Project'
    }
  );
}

export async function notifyProjectDeadlineApproaching(
  userId: string, 
  projectName: string, 
  projectId: string, 
  daysUntilDeadline: number
) {
  return createNotification(
    userId,
    'PROJECT_DEADLINE_APPROACHING',
    { projectName, days: daysUntilDeadline },
    { 
      projectId,
      dueDate: new Date(Date.now() + daysUntilDeadline * 24 * 60 * 60 * 1000),
      actionUrl: `/dashboard/projects/${projectId}`,
      actionLabel: 'View Project'
    }
  );
}

// Worker-related notifications
export async function notifyWorkerAssigned(
  userId: string, 
  workerName: string, 
  projectName: string, 
  workerId: string, 
  projectId: string
) {
  return createNotification(
    userId,
    'WORKER_ASSIGNED',
    { workerName, projectName },
    { 
      workerId,
      projectId,
      actionUrl: `/dashboard/projects/${projectId}`,
      actionLabel: 'View Assignment'
    }
  );
}

// Payment-related notifications
export async function notifyPaymentDue(
  userId: string, 
  amount: number, 
  projectName: string, 
  projectId: string
) {
  return createNotification(
    userId,
    'PAYMENT_DUE',
    { amount: amount.toFixed(2), projectName },
    { 
      projectId,
      amount,
      actionUrl: `/dashboard/projects/${projectId}`,
      actionLabel: 'Make Payment'
    }
  );
}

export async function notifyPaymentReceived(
  userId: string, 
  amount: number, 
  projectName: string, 
  projectId: string
) {
  return createNotification(
    userId,
    'PAYMENT_RECEIVED',
    { amount: amount.toFixed(2), projectName },
    { 
      projectId,
      amount,
      actionUrl: `/dashboard/projects/${projectId}`,
      actionLabel: 'View Details'
    }
  );
}

// System notifications
export async function notifySystemUpdate(userId: string) {
  return createNotification(
    userId,
    'SYSTEM_UPDATE',
    {},
    { 
      actionUrl: '/dashboard/announcements',
      actionLabel: 'View Updates'
    }
  );
}

// Batch notifications for multiple users
export async function notifyMultipleUsers(
  userIds: string[],
  templateType: string,
  variables: Record<string, any> = {},
  metadata?: any
) {
  const promises = userIds.map(userId => 
    createNotification(userId, templateType, variables, metadata)
  );
  
  return Promise.all(promises);
}

// Welcome notification for new users
export async function notifyWelcomeUser(userId: string, userName: string) {
  return createNotification(
    userId,
    'SYSTEM_UPDATE',
    {},
    { 
      actionUrl: '/dashboard',
      actionLabel: 'Get Started'
    }
  );
}

// Deadline reminder system
export async function checkAndNotifyUpcomingDeadlines() {
  // This would typically be called by a cron job or scheduled function
  // Implementation would fetch projects with upcoming deadlines and notify users
  console.log('Checking for upcoming deadlines...');
  
  // Example implementation:
  // 1. Query projects with deadlines in the next 3 days
  // 2. For each project, notify the project owner
  // 3. Log the notifications sent
}