# FundiFlow Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
- [Vercel Account](https://vercel.com)
- [Firebase Project](https://console.firebase.google.com)
- SMTP Email Provider (Gmail, SendGrid, etc.)

### 1-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/fundiflow)

### Manual Deployment

#### Step 1: Prepare Your Environment
```bash
# Run deployment check
npm run deploy:check

# This will verify:
# ✅ TypeScript compilation
# ✅ ESLint validation  
# ✅ Production build
# ✅ Required files
# ✅ Environment configuration
```

#### Step 2: Deploy to Vercel
1. **Connect Repository**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework: Next.js (auto-detected)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install` (auto-detected)
   
   **Note**: Vercel should auto-detect these settings. If not, set them manually.

#### Step 3: Environment Variables
In Vercel Dashboard → Project Settings → Environment Variables, add each variable individually:

**Required Variables:**
| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API key | All |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` | All |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your Firebase project ID | All |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` | All |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID | All |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your Firebase app ID | All |
| `EMAIL_PROVIDER` | `smtp` | All |
| `SMTP_HOST` | `smtp.gmail.com` | All |
| `SMTP_PORT` | `587` | All |
| `SMTP_USER` | Your email address | All |
| `SMTP_PASS` | Your app password | All |
| `FROM_EMAIL` | Your from email | All |
| `FROM_NAME` | `FundiFlow` | All |
| `DEBUG_EMAIL` | `false` | Production |

**Optional Variables:**
| Name | Value | Environment |
|------|-------|-------------|
| `GEMINI_API_KEY` | Your Gemini API key | All |

**Important Notes:**
- Set `NEXT_PUBLIC_APP_URL` to your actual Vercel domain after deployment
- Use "All Environments" for most variables unless specified
- For `SMTP_PASS`, use an app-specific password, not your regular email password

#### Step 4: Firebase Setup
```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# Update Firebase Auth domains
# Add your Vercel domain to Firebase Console → Authentication → Settings → Authorized domains
```

#### Step 5: Deploy
Push to your main branch or click "Deploy" in Vercel dashboard.

## 🔧 Configuration Files

### `vercel.json`
- Build and deployment configuration
- Environment variable mapping
- Function timeout settings
- Routing rules

### `next.config.ts`
- Production optimizations enabled
- Image optimization configured
- Performance enhancements
- Security headers

### Firebase Files
- `firebase.json` - Firebase project configuration
- `firestore.rules` - Database security rules
- `firestore.indexes.json` - Database indexes

## 📊 Health Check

After deployment, verify your app is working:
```
GET https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": "connected",
    "email": "configured"
  }
}
```

## 🛡️ Security Checklist

- [ ] Environment variables set in Vercel (not in code)
- [ ] Firebase security rules deployed
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] No sensitive data in client-side code
- [ ] SMTP credentials secured
- [ ] API routes protected with authentication

## 📈 Performance Features

### Enabled Optimizations:
- **Code Splitting**: Automatic vendor/common chunks
- **Tree Shaking**: Removes unused code
- **Image Optimization**: Next.js Image component
- **Console Removal**: Production builds remove logs
- **Package Optimization**: Optimized imports
- **Compression**: Gzip/Brotli enabled
- **CDN**: Global content delivery

### Monitoring:
- Built-in performance dashboard
- Real-time error tracking
- User analytics (Firebase)
- Health check endpoint

## 🔄 CI/CD Pipeline

### Automatic Deployment:
- Push to `main` branch → Auto deploy
- Pull requests → Preview deployments
- Environment-specific builds

### Manual Deployment:
```bash
# Pre-deployment check
npm run deploy:check

# Manual deploy via Vercel CLI
npx vercel --prod
```

## 🐛 Troubleshooting

### Common Issues:

**Build Failures:**
```bash
# Check locally first
npm run build
npm run typecheck
npm run lint
```

**Environment Issues:**
- Verify all required env vars are set
- Check Firebase project permissions
- Test SMTP credentials

**Database Connection:**
- Verify Firestore rules
- Check Firebase project ID
- Ensure indexes are deployed

### Debug Commands:
```bash
# Local production build
npm run build && npm start

# Check deployment readiness
npm run deploy:check

# Test email functionality
npm run test:email your@email.com
```

## 📞 Support

- **Vercel Issues**: [Vercel Documentation](https://vercel.com/docs)
- **Firebase Issues**: [Firebase Documentation](https://firebase.google.com/docs)
- **Next.js Issues**: [Next.js Documentation](https://nextjs.org/docs)

## 🎯 Post-Deployment

1. **Test Core Features**:
   - User registration/login
   - Project creation
   - Dashboard functionality
   - Email notifications

2. **Monitor Performance**:
   - Check Vercel Analytics
   - Monitor Firebase usage
   - Review error logs

3. **Set Up Monitoring**:
   - Configure uptime monitoring
   - Set up error alerts
   - Monitor email delivery

---

**Need Help?** Check the detailed guides in `docs/deployment/` directory.