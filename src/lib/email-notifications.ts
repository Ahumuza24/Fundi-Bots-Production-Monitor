// Email notification service for FundiFlow
// SMTP-based email system with user preferences and professional templates

interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

interface EmailRecipient {
  email: string;
  name: string;
  userId: string;
}

interface EmailConfig {
  provider: 'sendgrid' | 'mailgun' | 'smtp' | 'console';
  apiKey?: string;
  domain?: string;
  fromEmail: string;
  fromName: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
}

interface EmailPreferences {
  projectCreated: boolean;
  projectAssigned: boolean;
  workSessionCompleted: boolean;
  deadlineApproaching: boolean;
  announcements: boolean;
  emailEnabled: boolean;
}

// Professional email templates for all notification types
export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  PROJECT_CREATED_FOR_ASSEMBLERS: {
    subject: 'New Project Available - {projectName}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">🔧 New Project Available</h2>
        <p>Hello {assemblerName},</p>
        <p>A new project "<strong>{projectName}</strong>" has been created and is now available for assignment.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3>Project Details:</h3>
          <ul>
            <li><strong>Project Name:</strong> {projectName}</li>
            <li><strong>Created:</strong> {createdDate}</li>
            <li><strong>Status:</strong> Available for Assignment</li>
          </ul>
        </div>
        <p>
          <a href="{actionUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Project Details
          </a>
        </p>
        <p>Best regards,<br>FundiFlow Team</p>
      </div>
    `,
    textContent: `
New Project Available - {projectName}

Hello {assemblerName},

A new project "{projectName}" has been created and is now available for assignment.

Project Details:
- Project Name: {projectName}
- Created: {createdDate}
- Status: Available for Assignment

View project details: {actionUrl}

Best regards,
FundiFlow Team
    `
  },

  PROJECT_ASSIGNED_TO_ASSEMBLER: {
    subject: 'Project Assigned - {projectName}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16a34a;">✅ Project Assigned to You</h2>
        <p>Hello {assemblerName},</p>
        <p>You have been assigned to work on project "<strong>{projectName}</strong>".</p>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3>Assignment Details:</h3>
          <ul>
            <li><strong>Project:</strong> {projectName}</li>
            <li><strong>Assigned Date:</strong> {assignedDate}</li>
            <li><strong>Expected Start:</strong> As soon as possible</li>
          </ul>
        </div>
        <p>Please review the project details and start your work session when ready.</p>
        <p>
          <a href="{actionUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Start Work Session
          </a>
        </p>
        <p>Best regards,<br>FundiFlow Team</p>
      </div>
    `,
    textContent: `
Project Assigned - {projectName}

Hello {assemblerName},

You have been assigned to work on project "{projectName}".

Assignment Details:
- Project: {projectName}
- Assigned Date: {assignedDate}
- Expected Start: As soon as possible

Please review the project details and start your work session when ready.

Start work session: {actionUrl}

Best regards,
FundiFlow Team
    `
  },

  WORK_SESSION_COMPLETED: {
    subject: 'Work Session Completed - {projectName}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">📋 Work Session Completed</h2>
        <p>Hello Project Lead,</p>
        <p><strong>{assemblerName}</strong> has completed a work session on project "<strong>{projectName}</strong>".</p>
        <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3>Session Summary:</h3>
          <ul>
            <li><strong>Assembler:</strong> {assemblerName}</li>
            <li><strong>Duration:</strong> {duration} hours</li>
            <li><strong>Progress:</strong> {progress}%</li>
            <li><strong>Completed:</strong> {completedDate}</li>
          </ul>
          <p><strong>Notes:</strong> {notes}</p>
        </div>
        <p>
          <a href="{actionUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review Work Session
          </a>
        </p>
        <p>Best regards,<br>FundiFlow Team</p>
      </div>
    `,
    textContent: `
Work Session Completed - {projectName}

Hello Project Lead,

{assemblerName} has completed a work session on project "{projectName}".

Session Summary:
- Assembler: {assemblerName}
- Duration: {duration} hours
- Progress: {progress}%
- Completed: {completedDate}
- Notes: {notes}

Review work session: {actionUrl}

Best regards,
FundiFlow Team
    `
  },

  PROJECT_DEADLINE_APPROACHING: {
    subject: '⚠️ Deadline Alert - {projectName} ({days} days remaining)',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">⚠️ Project Deadline Approaching</h2>
        <p>Hello {recipientName},</p>
        <p>This is a reminder that project "<strong>{projectName}</strong>" is due in <strong>{days} days</strong>.</p>
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3>Project Status:</h3>
          <ul>
            <li><strong>Project:</strong> {projectName}</li>
            <li><strong>Days Remaining:</strong> {days}</li>
            <li><strong>Current Progress:</strong> {progress}%</li>
            <li><strong>Deadline:</strong> {deadlineDate}</li>
          </ul>
        </div>
        <p>{actionMessage}</p>
        <p>
          <a href="{actionUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            {actionButtonText}
          </a>
        </p>
        <p>Best regards,<br>FundiFlow Team</p>
      </div>
    `,
    textContent: `
Project Deadline Approaching - {projectName}

Hello {recipientName},

This is a reminder that project "{projectName}" is due in {days} days.

Project Status:
- Project: {projectName}
- Days Remaining: {days}
- Current Progress: {progress}%
- Deadline: {deadlineDate}

{actionMessage}

{actionButtonText}: {actionUrl}

Best regards,
FundiFlow Team
    `
  },

  NEW_ANNOUNCEMENT: {
    subject: '📢 New Announcement - {announcementTitle}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed;">📢 New Announcement</h2>
        <p>Hello {recipientName},</p>
        <p>A new announcement has been posted by the project lead.</p>
        <div style="background-color: #faf5ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
          <h3>{announcementTitle}</h3>
          <p>{announcementPreview}...</p>
        </div>
        <p>
          <a href="{actionUrl}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Read Full Announcement
          </a>
        </p>
        <p>Best regards,<br>FundiFlow Team</p>
      </div>
    `,
    textContent: `
New Announcement - {announcementTitle}

Hello {recipientName},

A new announcement has been posted by the project lead.

{announcementTitle}
{announcementPreview}...

Read full announcement: {actionUrl}

Best regards,
FundiFlow Team
    `
  }
};

// Get email configuration from environment variables
function getEmailConfig(): EmailConfig {
  const provider = (process.env.EMAIL_PROVIDER || 'console') as EmailConfig['provider'];

  return {
    provider,
    apiKey: process.env.EMAIL_API_KEY,
    domain: process.env.EMAIL_DOMAIN,
    fromEmail: process.env.FROM_EMAIL || 'notifications@fundiflow.com',
    fromName: process.env.FROM_NAME || 'FundiFlow',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS
  };
}

// Get user email and name from Firebase
async function getUserEmailInfo(userId: string): Promise<EmailRecipient | null> {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase');

    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      console.warn(`User ${userId} not found in database`);
      return null;
    }

    const userData = userDoc.data();

    if (!userData.email) {
      console.warn(`User ${userId} has no email address`);
      return null;
    }

    return {
      email: userData.email,
      name: userData.name || userData.displayName || userData.email.split('@')[0],
      userId
    };
  } catch (error) {
    console.error('Error fetching user email info:', error);
    return null;
  }
}

// Get user email preferences
async function getUserEmailPreferences(userId: string): Promise<EmailPreferences> {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase');

    const prefsDoc = await getDoc(doc(db, 'userPreferences', userId));

    if (prefsDoc.exists()) {
      const prefs = prefsDoc.data().emailNotifications || {};
      return {
        projectCreated: prefs.projectCreated !== false,
        projectAssigned: prefs.projectAssigned !== false,
        workSessionCompleted: prefs.workSessionCompleted !== false,
        deadlineApproaching: prefs.deadlineApproaching !== false,
        announcements: prefs.announcements !== false,
        emailEnabled: prefs.emailEnabled !== false
      };
    }

    // Default preferences (all enabled)
    return {
      projectCreated: true,
      projectAssigned: true,
      workSessionCompleted: true,
      deadlineApproaching: true,
      announcements: true,
      emailEnabled: true
    };
  } catch (error) {
    console.error('Error fetching email preferences:', error);
    // Default to enabled on error
    return {
      projectCreated: true,
      projectAssigned: true,
      workSessionCompleted: true,
      deadlineApproaching: true,
      announcements: true,
      emailEnabled: true
    };
  }
}

// Replace template variables with actual values
function replaceTemplateVariables(template: string, variables: Record<string, any>): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, String(value));
  });
  return result;
}



// Console logging (for development/testing)
async function logEmailToConsole(
  recipient: EmailRecipient,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<boolean> {
  console.log('\n📧 EMAIL NOTIFICATION (Console Mode)');
  console.log('=====================================');
  console.log(`To: ${recipient.name} <${recipient.email}>`);
  console.log(`Subject: ${subject}`);
  console.log('\n--- TEXT CONTENT ---');
  console.log(textContent);
  console.log('\n--- HTML CONTENT ---');
  console.log(htmlContent.substring(0, 200) + '...');
  console.log('=====================================\n');
  return true;
}

// API-based email sending (client-safe)
async function sendEmailViaAPI(
  recipient: EmailRecipient,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<boolean> {
  try {
    console.log(`📧 Sending email via API to ${recipient.email}`);
    
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipient.email,
        subject,
        html: htmlContent,
        text: textContent
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`📧 Email sent successfully via API to ${recipient.email}:`, result.messageId);
      return true;
    } else {
      console.error('📧 Email API error:', result.error, result.details);
      return false;
    }
  } catch (error) {
    console.error('📧 Email API request error:', error);
    return false;
  }
}

// Main email sending function
async function sendEmail(
  recipient: EmailRecipient,
  subject: string,
  htmlContent: string,
  textContent: string
): Promise<boolean> {
  try {
    const config = getEmailConfig();

    // Validate recipient
    if (!recipient.email || !recipient.email.includes('@')) {
      console.error('Invalid recipient email:', recipient.email);
      return false;
    }

    // Choose email provider
    switch (config.provider) {
      case 'smtp':
        // Use API for SMTP to avoid client-side issues
        return await sendEmailViaAPI(recipient, subject, htmlContent, textContent);
      
      case 'console':
      default:
        return await logEmailToConsole(recipient, subject, htmlContent, textContent);
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

// Check if user should receive email for specific notification type
async function shouldSendEmail(userId: string, notificationType: keyof EmailPreferences): Promise<boolean> {
  const preferences = await getUserEmailPreferences(userId);
  return preferences.emailEnabled && preferences[notificationType];
}

// Enhanced email sending with preferences check
async function sendEmailWithPreferences(
  recipient: EmailRecipient,
  subject: string,
  htmlContent: string,
  textContent: string,
  notificationType: keyof EmailPreferences
): Promise<boolean> {
  try {
    console.log(`📧 Checking email preferences for ${recipient.email} (${notificationType})`);
    
    // Check if user wants to receive this type of email
    const shouldSend = await shouldSendEmail(recipient.userId, notificationType);

    if (!shouldSend) {
      console.log(`📧 Email skipped for ${recipient.email} - user preferences disabled for ${notificationType}`);
      return false;
    }

    console.log(`📧 Email preferences OK for ${recipient.email}, proceeding to send`);

    // Add unsubscribe link to email content
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${Buffer.from(recipient.userId).toString('base64')}`;

    const enhancedHtmlContent = htmlContent + `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        <p>You received this email because you're subscribed to FundiFlow notifications.</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/notifications" style="color: #2563eb;">Manage email preferences</a> | 
          <a href="${unsubscribeUrl}" style="color: #6b7280;">Unsubscribe</a>
        </p>
      </div>
    `;

    const enhancedTextContent = textContent + `\n\n---\nYou received this email because you're subscribed to FundiFlow notifications.\nManage preferences: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/notifications\nUnsubscribe: ${unsubscribeUrl}`;

    const result = await sendEmail(recipient, subject, enhancedHtmlContent, enhancedTextContent);
    console.log(`📧 Final email send result for ${recipient.email}: ${result ? 'SUCCESS' : 'FAILED'}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error sending email with preferences:', error);
    return false;
  }
}

// Main email notification functions
export async function sendProjectCreatedEmail(
  assemblerIds: string[],
  projectName: string,
  projectId: string
): Promise<number> {
  console.log(`📧 sendProjectCreatedEmail called with ${assemblerIds.length} assembler IDs:`, assemblerIds);
  
  const template = EMAIL_TEMPLATES.PROJECT_CREATED_FOR_ASSEMBLERS;
  const promises = assemblerIds.map(async (assemblerId, index) => {
    console.log(`📧 Processing assembler ${index + 1}/${assemblerIds.length}: ${assemblerId}`);
    
    const recipient = await getUserEmailInfo(assemblerId);
    if (!recipient) {
      console.warn(`⚠️ No email info found for assembler: ${assemblerId}`);
      return false;
    }

    console.log(`📧 Found recipient: ${recipient.name} <${recipient.email}>`);

    const variables = {
      assemblerName: recipient.name,
      projectName,
      createdDate: new Date().toLocaleDateString(),
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${projectId}`
    };

    const subject = replaceTemplateVariables(template.subject, variables);
    const htmlContent = replaceTemplateVariables(template.htmlContent, variables);
    const textContent = replaceTemplateVariables(template.textContent, variables);

    console.log(`📧 Sending email to ${recipient.email} with subject: ${subject}`);
    const result = await sendEmailWithPreferences(recipient, subject, htmlContent, textContent, 'projectCreated');
    console.log(`📧 Email result for ${recipient.email}: ${result ? 'SUCCESS' : 'FAILED'}`);
    
    return result;
  });

  const results = await Promise.all(promises);
  const successCount = results.filter(Boolean).length;
  console.log(`📧 Email sending complete: ${successCount}/${assemblerIds.length} emails sent successfully`);
  
  return successCount;
}

export async function sendProjectAssignedEmail(
  assemblerId: string,
  assemblerName: string,
  projectName: string,
  projectId: string
): Promise<boolean> {
  const recipient = await getUserEmailInfo(assemblerId);
  if (!recipient) return false;

  const template = EMAIL_TEMPLATES.PROJECT_ASSIGNED_TO_ASSEMBLER;
  const variables = {
    assemblerName,
    projectName,
    assignedDate: new Date().toLocaleDateString(),
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${projectId}`
  };

  const subject = replaceTemplateVariables(template.subject, variables);
  const htmlContent = replaceTemplateVariables(template.htmlContent, variables);
  const textContent = replaceTemplateVariables(template.textContent, variables);

  return sendEmailWithPreferences(recipient, subject, htmlContent, textContent, 'projectAssigned');
}

export async function sendWorkSessionCompletedEmail(
  projectLeadId: string,
  assemblerName: string,
  projectName: string,
  projectId: string,
  workSessionDetails: any
): Promise<boolean> {
  const recipient = await getUserEmailInfo(projectLeadId);
  if (!recipient) return false;

  const template = EMAIL_TEMPLATES.WORK_SESSION_COMPLETED;
  const variables = {
    assemblerName,
    projectName,
    duration: workSessionDetails.duration,
    progress: workSessionDetails.progress,
    completedDate: new Date().toLocaleDateString(),
    notes: workSessionDetails.notes || 'No additional notes provided.',
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${projectId}`
  };

  const subject = replaceTemplateVariables(template.subject, variables);
  const htmlContent = replaceTemplateVariables(template.htmlContent, variables);
  const textContent = replaceTemplateVariables(template.textContent, variables);

  return sendEmailWithPreferences(recipient, subject, htmlContent, textContent, 'workSessionCompleted');
}

export async function sendDeadlineApproachingEmails(
  userIds: string[],
  projectName: string,
  projectId: string,
  daysUntilDeadline: number,
  currentProgress: number,
  isAssemblerList: boolean[]
): Promise<number> {
  const template = EMAIL_TEMPLATES.PROJECT_DEADLINE_APPROACHING;
  const promises = userIds.map(async (userId, index) => {
    const recipient = await getUserEmailInfo(userId);
    if (!recipient) return false;

    const isAssembler = isAssemblerList[index];
    const variables = {
      recipientName: recipient.name,
      projectName,
      days: daysUntilDeadline,
      progress: currentProgress,
      deadlineDate: new Date(Date.now() + daysUntilDeadline * 24 * 60 * 60 * 1000).toLocaleDateString(),
      actionMessage: isAssembler ? 'Please ensure your work is completed on time.' : 'Please review the project status and take necessary actions.',
      actionButtonText: isAssembler ? 'View Project' : 'Manage Project',
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${projectId}`
    };

    const subject = replaceTemplateVariables(template.subject, variables);
    const htmlContent = replaceTemplateVariables(template.htmlContent, variables);
    const textContent = replaceTemplateVariables(template.textContent, variables);

    return sendEmailWithPreferences(recipient, subject, htmlContent, textContent, 'deadlineApproaching');
  });

  const results = await Promise.all(promises);
  return results.filter(Boolean).length;
}

export async function sendAnnouncementEmails(
  userIds: string[],
  announcementTitle: string,
  announcementContent: string,
  announcementId: string
): Promise<number> {
  const template = EMAIL_TEMPLATES.NEW_ANNOUNCEMENT;
  const promises = userIds.map(async (userId) => {
    const recipient = await getUserEmailInfo(userId);
    if (!recipient) return false;

    const variables = {
      recipientName: recipient.name,
      announcementTitle,
      announcementPreview: announcementContent.substring(0, 150),
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/announcements/${announcementId}`
    };

    const subject = replaceTemplateVariables(template.subject, variables);
    const htmlContent = replaceTemplateVariables(template.htmlContent, variables);
    const textContent = replaceTemplateVariables(template.textContent, variables);

    return sendEmailWithPreferences(recipient, subject, htmlContent, textContent, 'announcements');
  });

  const results = await Promise.all(promises);
  return results.filter(Boolean).length;
}

// Email testing function
export async function sendTestEmail(recipientEmail: string): Promise<boolean> {
  console.log(`🧪 Sending test email to: ${recipientEmail}`);
  
  const subject = '🧪 FundiFlow Email Test';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">🎉 Email Test Successful!</h2>
      <p>Hello Test User,</p>
      <p>This is a test email to verify that your FundiFlow email notifications are working correctly.</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>Test Details:</h3>
        <ul>
          <li><strong>Sent:</strong> ${new Date().toLocaleString()}</li>
          <li><strong>Provider:</strong> SMTP via API</li>
          <li><strong>Status:</strong> ✅ Working</li>
        </ul>
      </div>
      <p>If you received this email, your notification system is configured correctly!</p>
      <p>Best regards,<br>FundiFlow Team</p>
    </div>
  `;

  const textContent = `
FundiFlow Email Test

Hello Test User,

This is a test email to verify that your FundiFlow email notifications are working correctly.

Test Details:
- Sent: ${new Date().toLocaleString()}
- Provider: SMTP via API
- Status: ✅ Working

If you received this email, your notification system is configured correctly!

Best regards,
FundiFlow Team
  `;

  try {
    const result = await sendEmailViaAPI(
      { email: recipientEmail, name: 'Test User', userId: 'test-user' },
      subject,
      htmlContent,
      textContent
    );
    
    console.log(`🧪 Test email result: ${result ? 'SUCCESS' : 'FAILED'}`);
    return result;
  } catch (error) {
    console.error('🧪 Test email error:', error);
    return false;
  }
}