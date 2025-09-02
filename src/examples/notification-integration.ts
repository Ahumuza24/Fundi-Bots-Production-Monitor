/**
 * Integration Examples for Real-Time Notification System
 * 
 * This file shows how to integrate the notification system into your
 * existing project workflows. Copy these examples into your actual
 * project creation, work session, and other business logic files.
 */

import {
  onProjectCreated,
  onProjectAssigned,
  onWorkSessionCompleted,
  onDeadlineApproaching,
  onAnnouncementCreated,
  checkDeadlines
} from '@/lib/real-time-notifications';

// Example 1: Project Creation
// Call this in your project creation API route or function
export async function createProjectExample() {
  // Your existing project creation logic
  const newProject = {
    id: 'project-123',
    name: 'Circuit Board Assembly',
    description: 'High-precision circuit board assembly for automotive application',
    createdBy: 'user-456',
    createdByName: 'John Smith',
    deadline: new Date('2024-12-31'),
    // ... other project fields
  };
  
  // Save project to database (your existing code)
  // await saveProjectToDatabase(newProject);
  
  // 🔔 Trigger notifications to all assemblers
  try {
    await onProjectCreated({
      id: newProject.id,
      name: newProject.name,
      description: newProject.description,
      createdBy: newProject.createdBy,
      createdByName: newProject.createdByName
    });
    
    console.log('✅ Project created and notifications sent');
  } catch (error) {
    console.error('❌ Failed to send project creation notifications:', error);
    // Handle error (maybe show toast to user)
  }
}

// Example 2: Project Assignment
// Call this when assigning a project to an assembler
export async function assignProjectExample() {
  const assignmentData = {
    projectId: 'project-123',
    projectName: 'Circuit Board Assembly',
    assemblerId: 'assembler-789',
    assemblerName: 'Jane Doe',
    assignedBy: 'lead-456'
  };
  
  // Save assignment to database (your existing code)
  // await saveAssignmentToDatabase(assignmentData);
  
  // 🔔 Trigger notification to the assigned assembler
  try {
    await onProjectAssigned(assignmentData);
    
    console.log('✅ Project assigned and notification sent');
  } catch (error) {
    console.error('❌ Failed to send project assignment notification:', error);
  }
}

// Example 3: Work Session Completion
// Call this when an assembler completes a work session
export async function completeWorkSessionExample() {
  const sessionData = {
    projectId: 'project-123',
    projectName: 'Circuit Board Assembly',
    projectLeadId: 'lead-456',
    assemblerId: 'assembler-789',
    assemblerName: 'Jane Doe',
    workSessionDetails: {
      duration: 4.5, // hours
      progress: 75, // percentage
      tasksCompleted: [
        'Soldered main components',
        'Tested circuit continuity',
        'Applied protective coating'
      ],
      notes: 'All components installed successfully. Ready for quality check.',
      startTime: new Date('2024-01-15T09:00:00'),
      endTime: new Date('2024-01-15T13:30:00')
    }
  };
  
  // Save work session to database (your existing code)
  // await saveWorkSessionToDatabase(sessionData);
  
  // 🔔 Trigger notification to project lead
  try {
    await onWorkSessionCompleted(sessionData);
    
    console.log('✅ Work session completed and notification sent to project lead');
  } catch (error) {
    console.error('❌ Failed to send work session completion notification:', error);
  }
}

// Example 4: Deadline Approaching (Manual Trigger)
// Call this to manually check for approaching deadlines
export async function checkProjectDeadlinesExample() {
  const projectsWithApproachingDeadlines = [
    {
      projectId: 'project-123',
      projectName: 'Circuit Board Assembly',
      daysUntilDeadline: 3,
      currentProgress: 65
    },
    {
      projectId: 'project-456',
      projectName: 'Motor Assembly',
      daysUntilDeadline: 1,
      currentProgress: 90
    }
  ];
  
  // 🔔 Trigger deadline notifications
  for (const project of projectsWithApproachingDeadlines) {
    try {
      await onDeadlineApproaching(project);
      console.log(`✅ Deadline notification sent for ${project.projectName}`);
    } catch (error) {
      console.error(`❌ Failed to send deadline notification for ${project.projectName}:`, error);
    }
  }
}

// Example 5: Automated Deadline Checking (Cron Job)
// Set this up to run daily via cron job or scheduled function
export async function dailyDeadlineCheck() {
  try {
    console.log('🕐 Running daily deadline check...');
    
    // This function automatically queries projects and sends notifications
    await checkDeadlines();
    
    console.log('✅ Daily deadline check completed');
  } catch (error) {
    console.error('❌ Daily deadline check failed:', error);
  }
}

// Example 6: Announcement Creation
// Call this when a project lead creates an announcement
export async function createAnnouncementExample() {
  const announcementData = {
    id: 'announcement-123',
    title: 'New Safety Protocols',
    content: 'Please review the updated safety protocols for the assembly line. All assemblers must complete the safety training by Friday.',
    createdBy: 'lead-456',
    createdByName: 'John Smith',
    targetAudience: 'assemblers' as const, // 'all' | 'assemblers' | 'leads'
    projectId: undefined // optional: if announcement is project-specific
  };
  
  // Save announcement to database (your existing code)
  // await saveAnnouncementToDatabase(announcementData);
  
  // 🔔 Trigger notifications to target audience
  try {
    await onAnnouncementCreated(announcementData);
    
    console.log('✅ Announcement created and notifications sent');
  } catch (error) {
    console.error('❌ Failed to send announcement notifications:', error);
  }
}

// Example 7: React Component Integration
// How to use in a React component
export function ProjectCreationForm() {
  const handleSubmit = async (formData: any) => {
    try {
      // Create project
      const project = await createProject(formData);
      
      // Trigger notifications
      await onProjectCreated({
        id: project.id,
        name: project.name,
        description: project.description,
        createdBy: project.createdBy,
        createdByName: project.createdByName
      });
      
      // Show success message
      // toast.success('Project created and notifications sent!');
      
    } catch (error) {
      console.error('Failed to create project:', error);
      // toast.error('Failed to create project');
    }
  };
  
  // Return your form JSX here
  return null;
}

// Example 8: API Route Integration (Next.js)
export async function projectCreationAPIRoute(req: any, res: any) {
  try {
    const projectData = req.body;
    
    // Create project in database
    const newProject = await createProject(projectData);
    
    // Trigger notifications (don't await to avoid blocking response)
    onProjectCreated({
      id: newProject.id,
      name: newProject.name,
      description: newProject.description,
      createdBy: newProject.createdBy,
      createdByName: newProject.createdByName
    }).catch(error => {
      console.error('Failed to send notifications:', error);
      // Log error but don't fail the API response
    });
    
    res.status(201).json({ success: true, project: newProject });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
}

// Helper function to create a project (placeholder)
async function createProject(projectData: any) {
  // Your database creation logic here
  return {
    id: 'generated-id',
    ...projectData,
    createdAt: new Date()
  };
}

/**
 * Setup Instructions:
 * 
 * 1. Import the notification functions in your existing files:
 *    import { onProjectCreated, onWorkSessionCompleted } from '@/lib/real-time-notifications';
 * 
 * 2. Call the appropriate function after your business logic:
 *    - onProjectCreated() after creating a project
 *    - onProjectAssigned() after assigning a project
 *    - onWorkSessionCompleted() after completing work session
 *    - onAnnouncementCreated() after creating announcement
 * 
 * 3. Set up automated deadline checking:
 *    - Create a cron job or scheduled function
 *    - Call checkDeadlines() daily
 * 
 * 4. Handle errors appropriately:
 *    - Log errors for debugging
 *    - Don't let notification failures break your main workflow
 *    - Consider showing user feedback for notification status
 * 
 * 5. Test the system:
 *    - Create test projects and assignments
 *    - Check that notifications appear in the UI
 *    - Verify email notifications are sent
 *    - Test real-time updates
 */