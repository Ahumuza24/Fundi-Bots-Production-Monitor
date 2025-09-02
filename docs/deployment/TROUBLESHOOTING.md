# Deployment Troubleshooting

## Common Vercel Deployment Issues

### 1. Environment Variable Errors

**Error**: `Environment Variable "NEXT_PUBLIC_APP_URL" references Secret "next_public_app_url", which does not exist.`

**Solution**: 
- Don't use the `@secret_name` syntax in `vercel.json`
- Set environment variables directly in Vercel Dashboard
- Go to Project Settings → Environment Variables
- Add each variable individually with its actual value

### 2. Build Failures

**Error**: `Module not found` or `Cannot resolve module`

**Solution**:
```bash
# Test build locally first
npm run build

# Check for TypeScript errors
npm run typecheck

# Fix any import issues
npm run lint
```

### 3. Firebase Connection Issues

**Error**: `Firebase: Error (auth/invalid-api-key)`

**Solution**:
- Verify Firebase API key is correct
- Check Firebase project ID matches
- Ensure all Firebase environment variables are set
- Add Vercel domain to Firebase Auth authorized domains

### 4. SMTP Email Issues

**Error**: `Error: Invalid login` or email not sending

**Solution**:
- Use app-specific password for Gmail (not regular password)
- Verify SMTP settings are correct
- Test locally with `npm run test:email`
- Check email provider's security settings

### 5. Database Permission Errors

**Error**: `Missing or insufficient permissions`

**Solution**:
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Check rules in Firebase Console
# Ensure authenticated users have proper access
```

## Step-by-Step Deployment Fix

### 1. Clean Vercel Configuration
Remove any `@secret` references from `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 2. Set Environment Variables in Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable individually:

**Example for Firebase API Key:**
- Name: `NEXT_PUBLIC_FIREBASE_API_KEY`
- Value: `AIzaSyC...` (your actual API key)
- Environment: All Environments

### 3. Redeploy

After setting all environment variables:
1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger deployment

### 4. Verify Deployment

Check these endpoints after deployment:
- `https://your-app.vercel.app/api/health` - Should return healthy status
- `https://your-app.vercel.app/login` - Should load login page
- `https://your-app.vercel.app/dashboard` - Should redirect to login if not authenticated

## Environment Variables Checklist

Copy this checklist and verify each variable is set in Vercel:

**Firebase Configuration:**
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

**App Configuration:**
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NODE_ENV` (set to "production")

**Email Configuration:**
- [ ] `EMAIL_PROVIDER` (set to "smtp")
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASS`
- [ ] `FROM_EMAIL`
- [ ] `FROM_NAME`
- [ ] `DEBUG_EMAIL` (set to "false")

**Optional:**
- [ ] `GEMINI_API_KEY`

## Firebase Setup Checklist

**Firestore Rules:**
```bash
firebase deploy --only firestore:rules
```

**Firestore Indexes:**
```bash
firebase deploy --only firestore:indexes
```

**Authentication Domains:**
1. Go to Firebase Console → Authentication → Settings
2. Add your Vercel domain to "Authorized domains"
3. Add both:
   - `your-app.vercel.app`
   - `your-custom-domain.com` (if using custom domain)

## Local Testing Before Deployment

Always test locally before deploying:

```bash
# 1. Check environment variables
cp .env.local.example .env.local
# Edit .env.local with your values

# 2. Test build
npm run build

# 3. Test production locally
npm run start

# 4. Run deployment check
npm run deploy:check
```

## Getting Help

If you're still having issues:

1. **Check Vercel Deployment Logs:**
   - Go to Vercel Dashboard → Deployments
   - Click on failed deployment
   - Check build logs for specific errors

2. **Check Browser Console:**
   - Open your deployed app
   - Check browser console for client-side errors

3. **Test API Endpoints:**
   - Visit `/api/health` to check server status
   - Check network tab for failed API calls

4. **Firebase Console:**
   - Check Firestore for data
   - Verify authentication is working
   - Check usage quotas

## Common Error Messages and Solutions

| Error | Solution |
|-------|----------|
| `Module not found: Can't resolve '@/...'` | Check TypeScript paths in `tsconfig.json` |
| `Firebase: Error (auth/invalid-api-key)` | Verify Firebase API key in environment variables |
| `SMTP Error: Invalid login` | Use app-specific password for email |
| `Missing or insufficient permissions` | Deploy Firestore rules |
| `Function exceeded maximum duration` | Check API route performance |
| `Build failed` | Run `npm run build` locally to debug |