/**
 * Global Notification Integration for FundiFlow
 * 
 * This file provides easy-to-use functions that integrate email notifications
 * throughout your application. Import these functions and call them in your
 * existing business logic to automatically send both in-app and email notifications.
 */

import {
  notifyProjectCreatedToAssemblers,
  notifyProjectAssignedToAssembler,
  notifyWorkSessionCompleted,
  notifyProjectDeadlineApproaching,
  notifyNewAnnouncement
} from './notification-triggers';

// Project Management Integration
export class ProjectNotifications {
  
  /**
   * Call this when a new project is created
   * Automatically notifies all assemblers via in-app + email
   */
  static async onProjectCreated(projectData: {
    id: string;
    name: string;
    description?: string;
    createdBy: string;
    createdByName: string;
  }) {
    try {
      console.log(`🔔 Sending project creation notifications for: ${projectData.name}`);
      
      const result = await notifyProjectCreatedToAssemblers(
        projectData.name,
        projectData.id,
        projectData.createdBy
      );
      
      console.log(`✅ Project creation notifications sent:`, result);
      return result;
    } catch (error) {
      console.error('❌ Failed to send project creation notifications:', error);
      // Don't throw error to avoid breaking project creation
      return { inAppNotifications: 0, emailNotifications: 0 };
    }
  }

  /**
   * Call this when assigning a project to an assembler
   * Automatically notifies the assembler via in-app + email
   */
  static async onProjectAssigned(assignmentData: {
    projectId: string;
    projectName: string;
    assemblerId: string;
    assemblerName: string;
    assignedBy: string;
  }) {
    try {
      console.log(`🔔 Sending project assignment notifications: ${assignmentData.projectName} → ${assignmentData.assemblerName}`);
      
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
      return { inAppNotification: false, emailNotification: false };
    }
  }

  /**
   * Call this when an assembler completes a work session
   * Automatically notifies the project lead via in-app + email
   */
  static async onWorkSessionCompleted(sessionData: {
    projectId: string;
    projectName: string;
    projectLeadId: string;
    assemblerId: string;
    assemblerName: string;
    workSessionDetails: {
      duration: number; // hours
      progress: number; // percentage 0-100
      tasksCompleted: string[];
      notes?: string;
      startTime?: Date;
      endTime?: Date;
    };
  }) {
    try {
      console.log(`🔔 Sending work session completion notifications: ${sessionData.assemblerName} completed work on ${sessionData.projectName}`);
      
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
      return { inAppNotification: false, emailNotification: false };
    }
  }

  /**
   * Call this when a project deadline is approaching
   * Automatically notifies all involved users via in-app + email
   */
  static async onDeadlineApproaching(deadlineData: {
    projectId: string;
    projectName: string;
    daysUntilDeadline: number;
    currentProgress?: number;
  }) {
    try {
      console.log(`🔔 Sending deadline approaching notifications: ${deadlineData.projectName} (${deadlineData.daysUntilDeadline} days)`);
      
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
      return { assemblersNotified: 0, leadsNotified: 0, emailsSent: 0 };
    }
  }

  /**
   * Call this when creating an announcement
   * Automatically notifies target audience via in-app + email
   */
  static async onAnnouncementCreated(announcementData: {
    id: string;
    title: string;
    content: string;
    createdBy: string;
    createdByName: string;
    targetAudience?: 'all' | 'assemblers' | 'leads';
  }) {
    try {
      console.log(`🔔 Sending announcement notifications: ${announcementData.title}`);
      
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
      return { inAppNotifications: 0, emailNotifications: 0 };
    }
  }
}

// Automated deadline checking (for cron jobs)
export class AutomatedNotifications {
  
  /**
   * Check all projects for approaching deadlines
   * Call this daily via cron job or scheduled function
   */
  static async checkAllDeadlines() {
    try {
      console.log('🕐 Running automated deadline check...');
      
      // This would query your database for projects with approaching deadlines
      const projectsWithDeadlines = await this.getProjectsWithUpcomingDeadlines();
      
      let notificationsSent = 0;
      
      for (const project of projectsWithDeadlines) {
        const daysUntil = this.calculateDaysUntilDeadline(project.deadline);
        
        // Send notifications for deadlines within 3 days
        if (daysUntil <= 3 && daysUntil >= 0) {
          await ProjectNotifications.onDeadlineApproaching({
            projectId: project.id,
            projectName: project.name,
            daysUntilDeadline: daysUntil,
            currentProgress: project.progress
          });
          notificationsSent++;
        }
      }
      
      console.log(`✅ Automated deadline check completed. ${notificationsSent} notifications sent.`);
      return notificationsSent;
    } catch (error) {
      console.error('❌ Automated deadline check failed:', error);
      return 0;
    }
  }

  // Helper methods (implement these with your database queries)
  private static async getProjectsWithUpcomingDeadlines() {
    // TODO: Implement your database query here
    // Example:
    // const threeDaysFromNow = new Date();
    // threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    // return await db.collection('projects')
    //   .where('deadline', '<=', threeDaysFromNow)
    //   .where('status', '!=', 'completed')
    //   .get();
    
    return []; // Placeholder
  }

  private static calculateDaysUntilDeadline(deadline: Date): number {
    return Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }
}

// Integration examples for common use cases
export const IntegrationExamples = {
  
  // Example: Project creation in your API route
  async createProjectAPI(req: any, res: any) {
    try {
      const projectData = req.body;
      const currentUser = req.user; // Your auth middleware
      
      // 1. Create project in database (your existing logic)
      const newProject = await this.saveProjectToDatabase(projectData);
      
      // 2. Send notifications (new addition)
      await ProjectNotifications.onProjectCreated({
        id: newProject.id,
        name: newProject.name,
        description: newProject.description,
        createdBy: currentUser.id,
        createdByName: currentUser.name
      });
      
      // 3. Return response
      res.status(201).json({ success: true, project: newProject });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create project' });
    }
  },

  // Example: Work session completion in your UI
  async completeWorkSession(sessionData: any) {
    try {
      // 1. Save work session (your existing logic)
      const completedSession = await this.saveWorkSessionToDatabase(sessionData);
      
      // 2. Send notifications (new addition)
      await ProjectNotifications.onWorkSessionCompleted({
        projectId: sessionData.projectId,
        projectName: sessionData.projectName,
        projectLeadId: sessionData.projectLeadId,
        assemblerId: sessionData.assemblerId,
        assemblerName: sessionData.assemblerName,
        workSessionDetails: {
          duration: sessionData.duration,
          progress: sessionData.progress,
          tasksCompleted: sessionData.tasksCompleted,
          notes: sessionData.notes
        }
      });
      
      return completedSession;
    } catch (error) {
      console.error('Failed to complete work session:', error);
      throw error;
    }
  },

  // Example: Project assignment in your UI
  async assignProject(assignmentData: any) {
    try {
      // 1. Save assignment (your existing logic)
      const assignment = await this.saveAssignmentToDatabase(assignmentData);
      
      // 2. Send notifications (new addition)
      await ProjectNotifications.onProjectAssigned({
        projectId: assignmentData.projectId,
        projectName: assignmentData.projectName,
        assemblerId: assignmentData.assemblerId,
        assemblerName: assignmentData.assemblerName,
        assignedBy: assignmentData.assignedBy
      });
      
      return assignment;
    } catch (error) {
      console.error('Failed to assign project:', error);
      throw error;
    }
  },

  // Placeholder database functions (implement with your actual database)
  async saveProjectToDatabase(projectData: any) {
    return { id: 'new-project-id', ...projectData };
  },

  async saveWorkSessionToDatabase(sessionData: any) {
    return { id: 'new-session-id', ...sessionData };
  },

  async saveAssignmentToDatabase(assignmentData: any) {
    return { id: 'new-assignment-id', ...assignmentData };
  }
};

// React Hook for easy component integration
export function useNotificationIntegration() {
  return {
    notifyProjectCreated: ProjectNotifications.onProjectCreated,
    notifyProjectAssigned: ProjectNotifications.onProjectAssigned,
    notifyWorkSessionCompleted: ProjectNotifications.onWorkSessionCompleted,
    notifyDeadlineApproaching: ProjectNotifications.onDeadlineApproaching,
    notifyAnnouncementCreated: ProjectNotifications.onAnnouncementCreated
  };
}

// Export everything for easy importing
export default {
  ProjectNotifications,
  AutomatedNotifications,
  IntegrationExamples,
  useNotificationIntegration
};