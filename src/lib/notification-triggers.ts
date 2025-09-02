import { createNotification } from '@/lib/notifications';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  sendProjectCreatedEmail,
  sendProjectAssignedEmail,
  sendWorkSessionCompletedEmail,
  sendDeadlineApproachingEmails,
  sendAnnouncementEmails
} from '@/lib/email-notifications';

// Helper function to get all assemblers
async function getAllAssemblers(): Promise<string[]> {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'assembler')
    );
    const snapshot = await getDocs(q);
    const assemblerIds = snapshot.docs.map(doc => doc.id);
    console.log(`📋 Found ${assemblerIds.length} assemblers in database:`, assemblerIds);
    return assemblerIds;
  } catch (error) {
    console.error('Error fetching assemblers:', error);
    return [];
  }
}

// Helper function to get all project leads
async function getAllProjectLeads(): Promise<string[]> {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'admin')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error fetching project leads:', error);
    return [];
  }
}

// 1. When a new project is created - notify all assemblers (in-app + email)
export async function notifyProjectCreatedToAssemblers(
  projectName: string, 
  projectId: string,
  projectLeadId: string
) {
  try {
    console.log(`🔔 Starting project creation notifications for: ${projectName}`);
    
    const assemblerIds = await getAllAssemblers();
    
    if (assemblerIds.length === 0) {
      console.warn('⚠️ No assemblers found in database - no notifications will be sent');
      return {
        inAppNotifications: 0,
        emailNotifications: 0
      };
    }
    
    console.log(`📧 Attempting to send emails to ${assemblerIds.length} assemblers`);
    
    // Send email notifications first to debug
    const emailCount = await sendProjectCreatedEmail(assemblerIds, projectName, projectId);
    console.log(`📧 Email notifications result: ${emailCount} emails sent`);
    
    // Send in-app notifications
    const notifications = assemblerIds.map(assemblerId => 
      createNotification(
        assemblerId,
        'PROJECT_CREATED_FOR_ASSEMBLERS',
        { projectName },
        { 
          projectId,
          projectLeadId,
          actionUrl: `/dashboard/projects/${projectId}`,
          actionLabel: 'View Project Details'
        }
      )
    );
    
    const notificationResults = await Promise.all(notifications);
    
    console.log(`✅ Project Created Notifications Sent:
    - In-app: ${assemblerIds.length} assemblers
    - Email: ${emailCount} assemblers
    - Project: ${projectName}`);
    
    return {
      inAppNotifications: assemblerIds.length,
      emailNotifications: emailCount
    };
  } catch (error) {
    console.error('❌ Error notifying assemblers about new project:', error);
    throw error;
  }
}

// 2. When project is assigned to assembler (in-app + email)
export async function notifyProjectAssignedToAssembler(
  assemblerId: string,
  assemblerName: string,
  projectName: string, 
  projectId: string,
  projectLeadId: string
) {
  try {
    // Send in-app notification
    const notificationPromise = createNotification(
      assemblerId,
      'PROJECT_ASSIGNED_TO_ASSEMBLER',
      { projectName, assemblerName },
      { 
        projectId,
        projectLeadId,
        actionUrl: `/dashboard/projects/${projectId}`,
        actionLabel: 'Start Work Session'
      }
    );
    
    // Send email notification
    const emailPromise = sendProjectAssignedEmail(
      assemblerId, 
      assemblerName, 
      projectName, 
      projectId
    );
    
    const [notificationId, emailSent] = await Promise.all([
      notificationPromise,
      emailPromise
    ]);
    
    console.log(`✅ Project Assignment Notifications Sent:
    - In-app: ${assemblerName}
    - Email: ${emailSent ? 'Sent' : 'Failed'}
    - Project: ${projectName}`);
    
    return {
      inAppNotification: !!notificationId,
      emailNotification: emailSent
    };
  } catch (error) {
    console.error('Error notifying assembler about project assignment:', error);
    throw error;
  }
}

// 3. When assembler finishes work session - notify project lead (in-app + email)
export async function notifyWorkSessionCompleted(
  projectLeadId: string,
  assemblerName: string,
  projectName: string,
  projectId: string,
  workSessionDetails: {
    duration: number; // in hours
    progress: number; // percentage
    tasksCompleted: string[];
    notes?: string;
  }
) {
  try {
    // Send in-app notification
    const notificationPromise = createNotification(
      projectLeadId,
      'WORK_SESSION_COMPLETED',
      { 
        assemblerName, 
        projectName,
        duration: workSessionDetails.duration.toFixed(1),
        progress: workSessionDetails.progress
      },
      { 
        projectId,
        assemblerId: assemblerName,
        workSessionDetails,
        actionUrl: `/dashboard/projects/${projectId}`,
        actionLabel: 'Review Work Session'
      }
    );
    
    // Send email notification
    const emailPromise = sendWorkSessionCompletedEmail(
      projectLeadId,
      assemblerName,
      projectName,
      projectId,
      workSessionDetails
    );
    
    const [notificationId, emailSent] = await Promise.all([
      notificationPromise,
      emailPromise
    ]);
    
    console.log(`✅ Work Session Completion Notifications Sent:
    - In-app: Project Lead
    - Email: ${emailSent ? 'Sent' : 'Failed'}
    - Assembler: ${assemblerName}
    - Project: ${projectName}
    - Duration: ${workSessionDetails.duration}h
    - Progress: ${workSessionDetails.progress}%`);
    
    return {
      inAppNotification: !!notificationId,
      emailNotification: emailSent
    };
  } catch (error) {
    console.error('Error notifying project lead about work session:', error);
    throw error;
  }
}

// 4. When project deadline is approaching - notify assemblers and leads (in-app + email)
export async function notifyProjectDeadlineApproaching(
  projectId: string,
  projectName: string,
  daysUntilDeadline: number,
  currentProgress: number = 0
) {
  try {
    const [assemblerIds, projectLeadIds] = await Promise.all([
      getAllAssemblers(),
      getAllProjectLeads()
    ]);
    
    // Send in-app notifications to assemblers
    const assemblerNotifications = assemblerIds.map(assemblerId => 
      createNotification(
        assemblerId,
        'PROJECT_DEADLINE_APPROACHING_ASSEMBLERS',
        { projectName, days: daysUntilDeadline },
        { 
          projectId,
          daysUntilDeadline,
          actionUrl: `/dashboard/projects/${projectId}`,
          actionLabel: 'View Project'
        }
      )
    );
    
    // Send in-app notifications to project leads
    const leadNotifications = projectLeadIds.map(leadId => 
      createNotification(
        leadId,
        'PROJECT_DEADLINE_APPROACHING_LEADS',
        { projectName, days: daysUntilDeadline, progress: currentProgress },
        { 
          projectId,
          daysUntilDeadline,
          currentProgress,
          actionUrl: `/dashboard/projects/${projectId}`,
          actionLabel: 'Manage Project'
        }
      )
    );
    
    // Send email notifications
    const allUserIds = [...assemblerIds, ...projectLeadIds];
    const isAssemblerList = [
      ...assemblerIds.map(() => true),
      ...projectLeadIds.map(() => false)
    ];
    
    const emailPromise = sendDeadlineApproachingEmails(
      allUserIds,
      projectName,
      projectId,
      daysUntilDeadline,
      currentProgress,
      isAssemblerList
    );
    
    const [assemblerResults, leadResults, emailCount] = await Promise.all([
      Promise.all(assemblerNotifications),
      Promise.all(leadNotifications),
      emailPromise
    ]);
    
    console.log(`✅ Deadline Approaching Notifications Sent:
    - In-app Assemblers: ${assemblerIds.length}
    - In-app Leads: ${projectLeadIds.length}
    - Email: ${emailCount} recipients
    - Project: ${projectName}
    - Days remaining: ${daysUntilDeadline}
    - Progress: ${currentProgress}%`);
    
    return {
      assemblersNotified: assemblerIds.length,
      leadsNotified: projectLeadIds.length,
      emailsSent: emailCount
    };
  } catch (error) {
    console.error('Error notifying about approaching deadline:', error);
    throw error;
  }
}

// 5. When project lead makes an announcement (in-app + email)
export async function notifyNewAnnouncement(
  announcementId: string,
  announcementTitle: string,
  announcementContent: string,
  projectLeadId: string,
  targetAudience: 'all' | 'assemblers' | 'leads' = 'all'
) {
  try {
    let targetUserIds: string[] = [];
    
    switch (targetAudience) {
      case 'assemblers':
        targetUserIds = await getAllAssemblers();
        break;
      case 'leads':
        targetUserIds = await getAllProjectLeads();
        break;
      case 'all':
      default:
        const [assemblers, leads] = await Promise.all([
          getAllAssemblers(),
          getAllProjectLeads()
        ]);
        targetUserIds = [...assemblers, ...leads];
        break;
    }
    
    // Don't notify the announcement creator
    targetUserIds = targetUserIds.filter(id => id !== projectLeadId);
    
    // Send in-app notifications
    const notifications = targetUserIds.map(userId => 
      createNotification(
        userId,
        'NEW_ANNOUNCEMENT',
        { announcementTitle },
        { 
          announcementId,
          projectLeadId,
          announcementContent: announcementContent.substring(0, 200), // Truncate for metadata
          actionUrl: `/dashboard/announcements/${announcementId}`,
          actionLabel: 'Read Announcement'
        }
      )
    );
    
    // Send email notifications
    const emailPromise = sendAnnouncementEmails(
      targetUserIds,
      announcementTitle,
      announcementContent,
      announcementId
    );
    
    const [notificationResults, emailCount] = await Promise.all([
      Promise.all(notifications),
      emailPromise
    ]);
    
    console.log(`✅ Announcement Notifications Sent:
    - In-app: ${targetUserIds.length} users
    - Email: ${emailCount} users
    - Title: ${announcementTitle}
    - Audience: ${targetAudience}`);
    
    return {
      inAppNotifications: targetUserIds.length,
      emailNotifications: emailCount
    };
  } catch (error) {
    console.error('Error notifying about new announcement:', error);
    throw error;
  }
}

// Real-time notification system for specific workflows

// Deadline reminder system - automated check for approaching deadlines
export async function checkAndNotifyUpcomingDeadlines() {
  try {
    console.log('Checking for upcoming deadlines...');
    
    // Query projects with deadlines in the next 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const projectsQuery = query(
      collection(db, 'projects'),
      where('deadline', '<=', threeDaysFromNow),
      where('status', '!=', 'completed')
    );
    
    const projectsSnapshot = await getDocs(projectsQuery);
    
    for (const projectDoc of projectsSnapshot.docs) {
      const project = projectDoc.data();
      const deadline = new Date(project.deadline.seconds * 1000);
      const daysUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDeadline <= 3 && daysUntilDeadline >= 0) {
        await notifyProjectDeadlineApproaching(
          projectDoc.id,
          project.name,
          daysUntilDeadline,
          project.progress || 0
        );
      }
    }
    
    console.log('Deadline check completed');
  } catch (error) {
    console.error('Error checking upcoming deadlines:', error);
  }
}