# Email Notifications Setup Guide

This guide explains how to configure and use the email notification system in FundiFlow.

## 🚀 Quick Start

### 1. Environment Configuration

Copy `.env.example` to `.env.local` and configure your email provider:

```bash
cp .env.example .env.local
```

### 2. Choose Email Provider

Set `EMAIL_PROVIDER` to one of:
- `console` - Development mode (logs to console)
- `sendgrid` - SendGrid service
- `mailgun` - Mailgun service  
- `smtp` - Generic SMTP server

### 3. Provider-Specific Setup

#### Console Mode (Development)
```env
EMAIL_PROVIDER=console
FROM_EMAIL=notifications@fundiflow.com
FROM_NAME=FundiFlow
```

#### SendGrid
```env
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=your_sendgrid_api_key
FROM_EMAIL=notifications@yourdomain.com
FROM_NAME=FundiFlow
```

#### Mailgun
```env
EMAIL_PROVIDER=mailgun
EMAIL_API_KEY=your_mailgun_api_key
EMAIL_DOMAIN=your_mailgun_domain
FROM_EMAIL=notifications@yourdomain.com
FROM_NAME=FundiFlow
```

#### SMTP (Gmail, Outlook, etc.)
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com
FROM_NAME=FundiFlow
```

## 📧 Email Templates

The system includes 5 pre-built email templates:

### 1. Project Created
- **Trigger:** New project is created
- **Recipients:** All assemblers
- **Content:** Project details, creation date, action link

### 2. Project Assigned
- **Trigger:** Project assigned to assembler
- **Recipients:** Assigned assembler
- **Content:** Assignment details, project info, start link

### 3. Work Session Completed
- **Trigger:** Assembler completes work session
- **Recipients:** Project lead
- **Content:** Session summary, progress, notes, review link

### 4. Deadline Approaching
- **Trigger:** Project deadline within 3 days
- **Recipients:** Assemblers and project leads
- **Content:** Deadline info, progress status, action link

### 5. Announcement
- **Trigger:** Project lead creates announcement
- **Recipients:** Target audience (all/assemblers/leads)
- **Content:** Announcement title, preview, full link

## 🔧 Integration

### Basic Usage

```typescript
import { onProjectCreated } from '@/lib/real-time-notifications';

// When creating a project
await onProjectCreated({
  id: project.id,
  name: project.name,
  description: project.description,
  createdBy: userId,
  createdByName: userName
});
```

### All Available Functions

```typescript
import {
  onProjectCreated,
  onProjectAssigned,
  onWorkSessionCompleted,
  onDeadlineApproaching,
  onAnnouncementCreated
} from '@/lib/real-time-notifications';

// Project created
await onProjectCreated({
  id: 'project-123',
  name: 'Circuit Board Assembly',
  description: 'High-precision assembly',
  createdBy: 'user-456',
  createdByName: 'John Smith'
});

// Project assigned
await onProjectAssigned({
  projectId: 'project-123',
  projectName: 'Circuit Board Assembly',
  assemblerId: 'assembler-789',
  assemblerName: 'Jane Doe',
  assignedBy: 'lead-456'
});

// Work session completed
await onWorkSessionCompleted({
  projectId: 'project-123',
  projectName: 'Circuit Board Assembly',
  projectLeadId: 'lead-456',
  assemblerId: 'assembler-789',
  assemblerName: 'Jane Doe',
  workSessionDetails: {
    duration: 4.5,
    progress: 75,
    tasksCompleted: ['Soldering', 'Testing'],
    notes: 'All components installed successfully'
  }
});

// Deadline approaching
await onDeadlineApproaching({
  projectId: 'project-123',
  projectName: 'Circuit Board Assembly',
  daysUntilDeadline: 2,
  currentProgress: 65
});

// Announcement
await onAnnouncementCreated({
  id: 'announcement-123',
  title: 'New Safety Protocols',
  content: 'Please review the updated safety protocols...',
  createdBy: 'lead-456',
  createdByName: 'John Smith',
  targetAudience: 'all'
});
```

## 🧪 Testing

### API Testing

Test emails via API:

```bash
# Quick test (console output)
curl -X POST http://localhost:8080/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "quick"}'

# Basic email test
curl -X POST http://localhost:8080/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "basic", "recipientEmail": "test@example.com"}'

# All tests
curl -X POST http://localhost:8080/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "all", "recipientEmail": "test@example.com"}'
```

### Code Testing

```typescript
import { runAllEmailTests, quickEmailTest } from '@/lib/email-test';

// Quick console test
await quickEmailTest();

// Full test suite
await runAllEmailTests('test@example.com');
```

### UI Testing

Visit `/dashboard/settings/notifications` and click "Test Emails" button.

## 👤 User Preferences

Users can manage email preferences at `/dashboard/settings/notifications`:

- **Master Toggle:** Enable/disable all emails
- **Individual Types:** Control specific notification types
- **Always On:** In-app notifications cannot be disabled

### Preference Storage

Preferences are stored in Firestore:

```typescript
// Collection: userPreferences
// Document ID: userId
{
  emailNotifications: {
    emailEnabled: true,
    projectCreated: true,
    projectAssigned: true,
    workSessionCompleted: true,
    deadlineApproaching: true,
    announcements: true
  }
}
```

## 🔒 Security Features

### Unsubscribe Links
All emails include unsubscribe links:
- Manage preferences: `/dashboard/settings/notifications`
- Direct unsubscribe: `/unsubscribe?token=<encoded_user_id>`

### Email Validation
- Valid email format checking
- User existence verification
- Preference checking before sending

### Rate Limiting
- Prevents spam and abuse
- Respects user preferences
- Logs all email activities

## 📊 Monitoring

### Logging
All email operations are logged:

```
📧 Email sent via SendGrid to user@example.com
📧 Email skipped for user@example.com - user preferences disabled for projectCreated
❌ Email failed: Invalid recipient email
```

### Metrics to Track
- Delivery rates by provider
- User preference changes
- Bounce rates
- Unsubscribe rates
- Error rates by notification type

## 🚨 Troubleshooting

### Common Issues

**Emails not sending:**
1. Check environment variables
2. Verify API keys
3. Test with console mode first
4. Check user email preferences

**Template errors:**
1. Verify all template variables are provided
2. Check for syntax errors in templates
3. Test with simple content first

**User not receiving emails:**
1. Check user exists in database
2. Verify user has valid email
3. Check user preferences
4. Verify email provider configuration

### Debug Mode

Enable debug logging:

```typescript
// Set in environment
DEBUG_EMAIL=true

// Or in code
process.env.DEBUG_EMAIL = 'true';
```

### Test Commands

```bash
# Test specific notification type
npm run test:email:project-created
npm run test:email:work-session
npm run test:email:deadline

# Test email provider
npm run test:email:sendgrid
npm run test:email:mailgun
npm run test:email:smtp
```

## 📈 Production Deployment

### Pre-deployment Checklist

- [ ] Email provider configured
- [ ] API keys secured
- [ ] Templates tested
- [ ] User preferences working
- [ ] Unsubscribe links functional
- [ ] Error handling implemented
- [ ] Monitoring setup
- [ ] Rate limiting configured

### Environment Variables

Ensure these are set in production:

```env
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=***
FROM_EMAIL=notifications@yourdomain.com
FROM_NAME=YourCompany
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Monitoring Setup

1. Set up email delivery monitoring
2. Configure error alerting
3. Track user engagement metrics
4. Monitor bounce rates
5. Set up performance dashboards

## 🔄 Maintenance

### Regular Tasks

- Monitor email delivery rates
- Update templates as needed
- Review user preferences
- Clean up old notification data
- Update provider configurations

### Template Updates

To modify email templates:

1. Edit templates in `src/lib/email-notifications.ts`
2. Test changes with `quickEmailTest()`
3. Deploy and monitor delivery rates

### Adding New Notification Types

1. Add template to `EMAIL_TEMPLATES`
2. Create sending function
3. Add to preferences interface
4. Update settings UI
5. Add integration function
6. Write tests

## 📞 Support

For email system issues:

1. Check server logs for errors
2. Test with console mode
3. Verify environment configuration
4. Check user preferences
5. Test with different providers

---

**Last Updated:** January 2024  
**Version:** 1.0.0