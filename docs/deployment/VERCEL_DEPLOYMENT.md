# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Firebase Project**: Ensure your Firebase project is set up with:
   - Firestore Database
   - Authentication
   - Storage (if using file uploads)
3. **SMTP Provider**: Configure email service (Gmail, SendGrid, etc.)

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select "FundiFlow" project

### 2. Configure Environment Variables

In Vercel dashboard, go to Project Settings > Environment Variables and add:

#### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### App Configuration
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

#### Email Configuration
```
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com
FROM_NAME=FundiFlow
DEBUG_EMAIL=false
```

#### AI Configuration (Optional)
```
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Deploy Firebase Rules and Indexes

Before deploying to Vercel, ensure Firebase is properly configured:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### 4. Deploy to Vercel

1. **Automatic Deployment**: Push to your main branch
2. **Manual Deployment**: Click "Deploy" in Vercel dashboard

### 5. Post-Deployment Configuration

#### Update Firebase Auth Domain
1. Go to Firebase Console > Authentication > Settings
2. Add your Vercel domain to "Authorized domains":
   - `your-app.vercel.app`
   - `your-custom-domain.com` (if using custom domain)

#### Update CORS Settings (if needed)
If using Firebase Storage, update CORS settings:

```json
[
  {
    "origin": ["https://your-app.vercel.app"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

## Build Configuration

The project is configured with:

- **Framework**: Next.js 15 with App Router
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Node Version**: 18.x (recommended)

## Performance Optimizations

### Enabled Features:
- **Code Splitting**: Automatic vendor and common chunks
- **Tree Shaking**: Removes unused code
- **Image Optimization**: Next.js Image component
- **Console Removal**: Production builds remove console logs
- **Package Optimization**: Optimized imports for large packages

### Vercel-Specific Optimizations:
- **Edge Runtime**: API routes optimized for edge
- **ISR**: Incremental Static Regeneration for dynamic content
- **CDN**: Global content delivery network

## Monitoring and Analytics

### Built-in Monitoring:
- **Real-time Performance**: Dashboard performance metrics
- **Error Tracking**: Client-side error boundaries
- **User Analytics**: Firebase Analytics integration

### Vercel Analytics (Optional):
Add to your project for additional insights:
```bash
npm install @vercel/analytics
```

## Custom Domain Setup

1. **Add Domain**: Vercel Dashboard > Domains
2. **Configure DNS**: Point your domain to Vercel
3. **SSL Certificate**: Automatically provisioned
4. **Update Environment**: Update `NEXT_PUBLIC_APP_URL`

## Troubleshooting

### Common Issues:

#### Build Failures
- Check TypeScript errors: `npm run typecheck`
- Verify all dependencies are installed
- Check environment variables are set

#### Firebase Connection Issues
- Verify Firebase config in environment variables
- Check Firebase project permissions
- Ensure Firestore rules allow read/write

#### Email Not Working
- Verify SMTP credentials
- Check email provider settings
- Test with `DEBUG_EMAIL=true`

### Debug Commands:
```bash
# Local build test
npm run build

# Type checking
npm run typecheck

# Lint checking
npm run lint
```

## Security Checklist

- [ ] Environment variables are set in Vercel (not in code)
- [ ] Firebase rules are properly configured
- [ ] SMTP credentials are secure (use app passwords)
- [ ] No sensitive data in client-side code
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] CORS properly configured

## Backup and Recovery

### Database Backup:
- Firebase automatically backs up Firestore
- Export data regularly for additional safety

### Code Backup:
- Repository is backed up on GitHub
- Vercel maintains deployment history

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Review Firebase console for errors
3. Check browser console for client-side issues
4. Refer to Next.js and Firebase documentation