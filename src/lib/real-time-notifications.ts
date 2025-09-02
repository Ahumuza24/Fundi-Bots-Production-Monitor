import {
  notifyProjectCreatedToAssemblers,
  notifyProjectAssignedToAssembler,
  notifyWorkSessionCompleted,
  notifyProjectDeadlineApproaching,
  notifyNewAnnouncement,
  checkAndNotifyUpcomingDeadlines
} from './notification-triggers';

/**
 * Real-time notification service for integrating with your application workflows
 * 
 * This service provides easy-to-use functions that can be called from your
 * project creation, work session, and other business logic to trigger
 * the appropriate notifications automatically.
 */

// 1. Call this when creating a new project
export async function onProjectCreated(projectData: {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdByName: string;
}) {
  try {
    console.log(`🔔 Triggering notifications for new project: ${projectData.name}`);
    
    const result = await notifyProjectCreatedToAssemblers(
      projectData.name,
      projectData.id,
      projectData.createdBy
    );
    
    console.log(`✅ Project creation notifications sent:`, result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send project creation notifications:', error);
    throw error;
  }
}

// 2. Call this when assigning a project to an assembler
export async function onProjectAssigned(assignmentData: {
  projectId: string;
  projectName: string;
  assemblerId: string;
  assemblerName: string;
  assignedBy: string;
}) {
  try {
    console.log(`🔔 Triggering notifications for project assignment: ${assignmentData.projectName} → ${assignmentData.assemblerName}`);
    
    const result = await notifyProjectAssignedToAssembler(
      assignmentData.assemblerId,
      assignmentData.assemblerName,
      assignmentData.projectName,
      assignmentData.projectId,
      assignmentData.assignedBy
    );
    
    console.log(`✅ Project assignment notifications sent:`, result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send project assignment notifications:', error);
    throw error;
  }
}

// 3. Call this when an assembler completes a work session
export async function onWorkSessionCompleted(sessionData: {
  projectId: string;
  projectName: string;
  projectLeadId: string;
  assemblerId: string;
  assemblerName: string;
  workSessionDetails: {
    duration: number; // in hours
    progress: number; // percentage 0-100
    tasksCompleted: string[];
    notes?: string;
    startTime?: Date;
    endTime?: Date;
  };
}) {
  try {
    console.log(`🔔 Triggering notifications for completed work session: ${sessionData.assemblerName} on ${sessionData.projectName}`);
    
    const result = await notifyWorkSessionCompleted(
      sessionData.projectLeadId,
      sessionData.assemblerName,
      sessionData.projectName,
      sessionData.projectId,
      sessionData.workSessionDetails
    );
    
    console.log(`✅ Work session completion notifications sent:`, result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send work session completion notifications:', error);
    throw error;
  }
}

// 4. Call this when a project deadline is approaching (can be automated with cron job)
export async function onDeadlineApproaching(deadlineData: {
  projectId: string;
  projectName: string;
  daysUntilDeadline: number;
  currentProgress?: number;
}) {
  try {
    console.log(`🔔 Triggering notifications for approaching deadline: ${deadlineData.projectName} (${deadlineData.daysUntilDeadline} days)`);
    
    const result = await notifyProjectDeadlineApproaching(
      deadlineData.projectId,
      deadlineData.projectName,
      deadlineData.daysUntilDeadline,
      deadlineData.currentProgress || 0
    );
    
    console.log(`✅ Deadline approaching notifications sent:`, result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send deadline approaching notifications:', error);
    throw error;
  }
}

// 5. Call this when a project lead makes an announcement
export async function onAnnouncementCreated(announcementData: {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdByName: string;
  targetAudience?: 'all' | 'assemblers' | 'leads';
  projectId?: string; // if announcement is project-specific
}) {
  try {
    console.log(`🔔 Triggering notifications for new announcement: ${announcementData.title}`);
    
    const result = await notifyNewAnnouncement(
      announcementData.id,
      announcementData.title,
      announcementData.content,
      announcementData.createdBy,
      announcementData.targetAudience || 'all'
    );
    
    console.log(`✅ Announcement notifications sent:`, result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send announcement notifications:', error);
    throw error;
  }
}

// 6. Automated deadline checking (call this from a scheduled job)
export async function checkDeadlines() {
  try {
    console.log('🔔 Running automated deadline check...');
    
    await checkAndNotifyUpcomingDeadlines();
    
    console.log('✅ Automated deadline check completed');
  } catch (error) {
    console.error('❌ Failed to run automated deadline check:', error);
    throw error;
  }
}

/**
 * Integration Examples:
 * 
 * // In your project creation API/function:
 * import { onProjectCreated } from '@/lib/real-time-notifications';
 * 
 * async function createProject(projectData) {
 *   // ... create project in database
 *   
 *   // Trigger notifications
 *   await onProjectCreated({
 *     id: newProject.id,
 *     name: newProject.name,
 *     description: newProject.description,
 *     createdBy: userId,
 *     createdByName: user.name
 *   });
 * }
 * 
 * // In your work session completion API/function:
 * import { onWorkSessionCompleted } from '@/lib/real-time-notifications';
 * 
 * async function completeWorkSession(sessionData) {
 *   // ... save work session to database
 *   
 *   // Trigger notifications
 *   await onWorkSessionCompleted({
 *     projectId: session.projectId,
 *     projectName: project.name,
 *     projectLeadId: project.leadId,
 *     assemblerId: session.assemblerId,
 *     assemblerName: assembler.name,
 *     workSessionDetails: {
 *       duration: session.duration,
 *       progress: session.progress,
 *       tasksCompleted: session.tasks,
 *       notes: session.notes
 *     }
 *   });
 * }
 * 
 * // For automated deadline checking (in a cron job or scheduled function):
 * import { checkDeadlines } from '@/lib/real-time-notifications';
 * 
 * // Run this daily
 * await checkDeadlines();
 */

export default {
  onProjectCreated,
  onProjectAssigned,
  onWorkSessionCompleted,
  onDeadlineApproaching,
  onAnnouncementCreated,
  checkDeadlines
};