# Firebase Firestore Indexes Setup

## Required Indexes for FundiFlow Notifications

To resolve the Firestore index errors, you need to create the following composite indexes:

### 1. Notifications Index
**Collection:** `notifications`
**Fields:**
- `userId` (Ascending)
- `createdAt` (Descending)

### 2. Notifications Unread Index
**Collection:** `notifications`
**Fields:**
- `userId` (Ascending)
- `isRead` (Ascending)
- `createdAt` (Descending)

## How to Create Indexes

### Method 1: Using Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your `fundiflow` project
3. Navigate to **Firestore Database** → **Indexes**
4. Click **Create Index**
5. Set Collection ID to `notifications`
6. Add the fields as specified above
7. Click **Create**

### Method 2: Using the Error Link
When you see the error in the console, click the provided link. It will automatically create the required index.

### Method 3: Using Firebase CLI
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore in your project
firebase init firestore

# Deploy indexes (after creating firestore.indexes.json)
firebase deploy --only firestore:indexes
```

### Method 4: firestore.indexes.json
Create a `firestore.indexes.json` file in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "isRead",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## Additional Indexes for Other Collections

### Projects Index
**Collection:** `projects`
**Fields:**
- `userId` (Ascending)
- `createdAt` (Descending)

### Workers Index
**Collection:** `workers`
**Fields:**
- `userId` (Ascending)
- `name` (Ascending)

## Index Creation Time
- Simple indexes: Usually created within minutes
- Complex indexes: Can take up to several hours for large datasets
- You'll receive an email when the index is ready

## Troubleshooting
1. **Index still building**: Wait for the index to complete building
2. **Permission errors**: Ensure you have Firestore Admin permissions
3. **Query still failing**: Clear browser cache and restart your development server

## Fallback Strategy
The notification system has been updated with fallback queries that work without indexes:
- Client-side sorting when server-side ordering fails
- Error handling for missing indexes
- Graceful degradation of functionality

This ensures your app continues to work even while indexes are being created.