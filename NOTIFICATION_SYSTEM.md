# Real-Time Notification System

This document explains the comprehensive notification system implemented for assemblers and project leads.

## 🔔 Notification Workflows

### 1. Project Created → All Assemblers
**When:** A new project is created  
**Recipients:** All assemblers  
**Delivery:** In-app + Email  
**Content:** Project name, description, created by

### 2. Project Assignment → Assembler
**When:** A project is assigned to a specific assembler  
**Recipients:** The assigned assembler  
**Delivery:** In-app + Email  
**Content:** Project details, assignment info, deadline

### 3. Work Session Completed → Project Lead
**When:** An assembler completes a work session  
**Recipients:** The project lead  
**Delivery:** In-app + Email  
**Content:** Assembler name, hours worked, progress, tasks completed, notes

### 4. Deadline Approaching → All Involved
**When:** Project deadline is within 3 days  
**Recipients:** Assemblers and project leads on the project  
**Delivery:** In-app + Email  
**Content:** Project name, days remaining, current progress

### 5. Announcement → Target Audience
**When:** Project lead makes an announcement  
**Recipients:** All users, assemblers only, or project leads only  
**Delivery:** In-app + Email  
**Content:** Announcement title and message

## 🏗️ System Architecture

### Core Files
- `src/lib/real-time-notifications.ts` - Main integration functions
- `src/lib/notification-triggers.ts` - Notification workflow logic
- `src/lib/email-notifications.ts` - Email templates and sending
- `src/hooks/use-notifications.ts` - React hook for notifications
- `src/contexts/notification-context.tsx` - React context provider

### Components
- `src/components/notifications/notification-bell.tsx` - Header notification bell
- `src/components/notifications/notification-list.tsx` - Notification dropdown
- `src/components/notifications/notification-center.tsx` - Full notification page
- `src/components/notifications/notification-demo.tsx` - Stats and overview

### Database
- **Collection:** `notifications`
- **Indexes:** Configured in `firestore.indexes.json`
- **Real-time:** Uses Firestore real-time listeners

## 🚀 Quick Integration

### 1. Project Creation
```typescript
import { onProjectCreated } from '@/lib/real-time-notifications';

// After creating a project in your database
await onProjectCreated({
  id: newProject.id,
  name: newProject.name,
  description: newProject.description,
  createdBy: userId,
  createdByName: userName
});
```

### 2. Work Session Completion
```typescript
import { onWorkSessionCompleted } from '@/lib/real-time-notifications';

// After saving work session to database
await onWorkSessionCompleted({
  projectId: session.projectId,
  projectName: project.name,
  projectLeadId: project.leadId,
  assemblerId: session.assemblerId,
  assemblerName: assembler.name,
  workSessionDetails: {
    duration: 4.5,
    progress: 75,
    tasksCompleted: ['Task 1', 'Task 2'],
    notes: 'Work completed successfully'
  }
});
```

### 3. Project Assignment
```typescript
import { onProjectAssigned } from '@/lib/real-time-notifications';

// After assigning project to assembler
await onProjectAssigned({
  projectId: 'project-123',
  projectName: 'Circuit Board Assembly',
  assemblerId: 'assembler-456',
  assemblerName: 'Jane Doe',
  assignedBy: 'lead-789'
});
```

## 📧 Email Notifications

### Templates
- **Project Created:** Welcome email with project details
- **Project Assigned:** Assignment confirmation with project info
- **Work Session Completed:** Detailed report for project lead
- **Deadline Approaching:** Urgent reminder with timeline
- **Announcement:** Formatted announcement content

### Configuration
Email notifications are sent via the email service configured in `src/lib/email-notifications.ts`. Update the email templates and SMTP settings as needed.

## 🔄 Real-Time Updates

### Frontend
- Uses Firestore real-time listeners
- Automatic UI updates when notifications arrive
- Cached for performance with 2-minute TTL
- Unread count updates in real-time

### Backend
- Notifications stored in Firestore
- Composite indexes for efficient queries
- Automatic cleanup of old notifications (optional)

## 🎯 User Experience

### Notification Bell
- Shows unread count badge
- Dropdown with recent notifications
- Mark as read functionality
- Link to full notification center

### Notification Center
- Complete notification history
- Filter by type and status
- Bulk mark as read
- Detailed notification content

### Email Integration
- HTML and text versions
- Professional templates
- Unsubscribe links (optional)
- Delivery tracking (optional)

## 🔧 Configuration

### Firebase Setup
1. Ensure Firestore is configured
2. Deploy indexes: `firebase deploy --only firestore:indexes`
3. Set up authentication
4. Configure email service

### Environment Variables
```env
# Email service configuration
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
FROM_EMAIL=notifications@yourdomain.com
```

## 📊 Monitoring

### Logs
All notification operations are logged with:
- ✅ Success indicators
- ❌ Error indicators  
- 🔔 Notification triggers
- 📧 Email sending status

### Analytics
Track notification metrics:
- Delivery rates
- Read rates
- User engagement
- Error rates

## 🧪 Testing

### Manual Testing
1. Create a test project
2. Assign it to a test assembler
3. Complete a work session
4. Check notifications appear in UI
5. Verify emails are sent

### Automated Testing
```typescript
// Example test
import { onProjectCreated } from '@/lib/real-time-notifications';

test('should send notifications when project is created', async () => {
  const result = await onProjectCreated({
    id: 'test-project',
    name: 'Test Project',
    description: 'Test Description',
    createdBy: 'test-user',
    createdByName: 'Test User'
  });
  
  expect(result.inAppNotifications).toBeGreaterThan(0);
  expect(result.emailNotifications).toBeGreaterThan(0);
});
```

## 🔮 Future Enhancements

### Planned Features
- Push notifications for mobile
- SMS notifications for urgent items
- Notification preferences per user
- Digest emails (daily/weekly summaries)
- Advanced filtering and search
- Notification templates customization

### Scalability
- Batch notification processing
- Queue system for high volume
- Database partitioning
- CDN for email assets

## 🆘 Troubleshooting

### Common Issues

**Notifications not appearing:**
- Check Firestore rules
- Verify user authentication
- Check browser console for errors
- Ensure real-time listener is active

**Emails not sending:**
- Verify SMTP configuration
- Check email service logs
- Validate email addresses
- Test email service connectivity

**Performance issues:**
- Check Firestore indexes
- Monitor cache hit rates
- Optimize notification queries
- Consider pagination for large datasets

### Debug Mode
Enable debug logging:
```typescript
// Add to your app initialization
console.log('🔔 Notification system debug mode enabled');
```

## 📞 Support

For issues or questions about the notification system:
1. Check the logs for error messages
2. Review the integration examples
3. Test with minimal data first
4. Check Firebase console for data
5. Verify email service status

---

**Last Updated:** January 2024  
**Version:** 1.0.0