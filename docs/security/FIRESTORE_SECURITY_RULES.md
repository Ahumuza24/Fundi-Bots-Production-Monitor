# Firestore Security Rules Documentation

## 🔒 Security Overview

These Firestore rules implement **maximum security** with role-based access control (RBAC) for the FundiFlow application.

## 🎭 User Roles

### Admin Role
- **Full access** to all collections
- Can create, read, update, delete all documents
- Can manage users and assign roles
- Access to system logs and audit trails

### Assembler Role
- **Limited access** based on assignments
- Can only access projects they're assigned to
- Can manage their own work sessions
- Can read their own notifications and profile

### Unauthenticated Users
- **No access** to any data
- Must authenticate to access any resources

## 📋 Collection Security Rules

### 👥 Users Collection (`/users/{userId}`)

**Read Access:**
- ✅ Users can read their own profile
- ✅ Admins can read all user profiles
- ❌ Users cannot read other users' profiles

**Write Access:**
- ✅ Users can create their own profile during signup
- ✅ Admins can create any user profile
- ✅ Users can update their own profile (except role)
- ✅ Admins can update any user profile
- ✅ Only admins can delete users

**Validation:**
- Required fields: `name`, `email`, `role`, `createdAt`
- Role must be: `admin` or `assembler`
- Email and name must be strings
- CreatedAt must be timestamp

### 📁 Projects Collection (`/projects/{projectId}`)

**Read Access:**
- ✅ Admins can read all projects
- ✅ Users can read projects they're assigned to
- ✅ Project creators can read their own projects
- ❌ Unassigned users cannot read projects

**Write Access:**
- ✅ Only admins can create projects
- ✅ Admins and project creators can update projects
- ✅ Only admins can delete projects

**Validation:**
- Required fields: `name`, `description`, `status`, `createdAt`, `createdBy`
- Status must be: `Planning`, `In Progress`, `Completed`, `On Hold`
- All required fields must be proper types

### 👷 Workers Collection (`/workers/{workerId}`)

**Read Access:**
- ✅ Admins can read all workers
- ✅ Workers can read their own profile
- ❌ Workers cannot read other workers' profiles

**Write Access:**
- ✅ Only admins can create worker profiles
- ✅ Admins can update any worker
- ✅ Workers can update limited fields in their own profile
- ✅ Only admins can delete workers

**Worker Self-Update Fields:**
- `name`, `phone`, `updatedAt`, `timeLoggedSeconds`, `pastPerformance`

### ⏱️ Work Sessions Collection (`/work-sessions/{sessionId}`)

**Read Access:**
- ✅ Admins can read all work sessions
- ✅ Workers can read their own work sessions
- ✅ Users can read sessions for projects they're assigned to
- ❌ Unrelated users cannot read work sessions

**Write Access:**
- ✅ Workers can create their own work sessions
- ✅ Admins can create any work session
- ✅ Workers can update their own work sessions
- ✅ Admins can update any work session
- ✅ Admins and session owners can delete work sessions

### 🔔 Notifications Collection (`/notifications/{notificationId}`)

**Read Access:**
- ✅ Admins can read all notifications
- ✅ Users can read their own notifications
- ❌ Users cannot read others' notifications

**Write Access:**
- ✅ Admins can create notifications
- ✅ System can create notifications (with validation)
- ✅ Users can update their own notifications (mark as read)
- ✅ Users can delete their own notifications

**Notification Types:**
- `info`, `warning`, `error`, `success`

### 📊 Reports Collection (`/reports/{reportId}`)

**Read Access:**
- ✅ Admins can read all reports
- ✅ Users can read reports they have access to
- ✅ Report creators can read their own reports

**Write Access:**
- ✅ Only admins can create reports
- ✅ Only admins can update reports
- ✅ Only admins can delete reports

### 📝 System Logs Collection (`/system-logs/{logId}`)

**Access:**
- ✅ Only admins have full access
- ❌ All other users denied

### 🔍 Audit Trail Collection (`/audit-trail/{auditId}`)

**Read Access:**
- ✅ Only admins can read audit trail

**Write Access:**
- ✅ System can create audit entries
- ❌ No updates or deletes (immutable audit trail)

## 🛡️ Security Features

### 1. Role-Based Access Control (RBAC)
```javascript
function isAdmin() {
  return isAuthenticated() && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### 2. Data Validation
- Required field validation
- Type checking
- Enum validation for status fields
- Timestamp validation

### 3. Ownership Checks
```javascript
function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}
```

### 4. Project Assignment Validation
```javascript
function isAssignedToProject(projectId) {
  return isAuthenticated() && 
         request.auth.uid in get(/databases/$(database)/documents/projects/$(projectId)).data.assignedWorkerIds;
}
```

### 5. Field-Level Security
- Users can only update specific fields in their own documents
- Role changes require admin privileges
- Sensitive fields protected from modification

## 🚨 Security Principles Applied

### 1. **Principle of Least Privilege**
- Users only get minimum necessary access
- No blanket permissions
- Explicit deny for undefined paths

### 2. **Defense in Depth**
- Multiple validation layers
- Authentication + authorization + validation
- Immutable audit trail

### 3. **Data Integrity**
- Required field validation
- Type checking
- Business rule enforcement

### 4. **Audit and Monitoring**
- Immutable audit trail
- System logs for admin access
- User action tracking

## 🔧 Deployment Commands

Deploy these rules to your Firebase project:

```bash
# Deploy rules only
firebase deploy --only firestore:rules

# Deploy rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Test rules locally (optional)
firebase emulators:start --only firestore
```

## 🧪 Testing Security Rules

### Test Admin Access:
```javascript
// Should succeed
await firebase.firestore().collection('users').get();
await firebase.firestore().collection('projects').add({...});
```

### Test Assembler Access:
```javascript
// Should succeed - own profile
await firebase.firestore().doc(`users/${currentUserId}`).get();

// Should fail - other user's profile
await firebase.firestore().doc(`users/${otherUserId}`).get();
```

### Test Unauthenticated Access:
```javascript
// Should fail
await firebase.firestore().collection('projects').get();
```

## ⚠️ Important Notes

1. **Initial Admin Setup**: You'll need to manually create the first admin user in Firebase Console
2. **Role Assignment**: Only admins can change user roles
3. **Data Migration**: Existing data must comply with new validation rules
4. **Performance**: Rules with `get()` calls may impact performance - monitor usage
5. **Testing**: Always test rules in Firebase emulator before deploying

## 🔄 Rule Updates

When updating rules:

1. **Test in emulator first**
2. **Deploy to staging environment**
3. **Verify functionality**
4. **Deploy to production**
5. **Monitor for errors**

## 📞 Emergency Access

If you get locked out:

1. **Firebase Console**: Use Firebase Console to manually update user roles
2. **Admin SDK**: Use Firebase Admin SDK with service account
3. **Support**: Contact Firebase support for critical issues

These rules provide **maximum security** while maintaining functionality for your FundiFlow application! 🔒