# Environment Variables Security Guide

## 🔒 Understanding NEXT_PUBLIC_ Variables

### What NEXT_PUBLIC_ Means
Variables prefixed with `NEXT_PUBLIC_` are **exposed to the browser** and can be seen by anyone who visits your website. This is by design in Next.js for client-side functionality.

## ✅ Safe NEXT_PUBLIC_ Variables (Firebase Client Config)

These Firebase variables are **SAFE** to expose publicly:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Why Firebase Client Config is Safe:

1. **Designed for Public Use**: Firebase client configuration is meant to be public
2. **Protected by Security Rules**: Your Firestore security rules control access, not the API key
3. **Domain Restrictions**: You can restrict usage to specific domains in Firebase Console
4. **Authentication Required**: The API key alone cannot access your data without proper authentication

### Firebase Security Model:
```
Client API Key + Domain + Authentication + Security Rules = Secure Access
```

## ❌ Variables That Should NEVER be NEXT_PUBLIC_

These should remain server-side only (no NEXT_PUBLIC_ prefix):

```env
# ❌ NEVER expose these
SMTP_PASS=your_email_password
GEMINI_API_KEY=your_ai_api_key
FIREBASE_ADMIN_SDK_KEY=your_admin_key
DATABASE_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_live_...
```

## 🛡️ Security Best Practices

### 1. Firebase Security Rules
Your main security comes from Firestore rules, not hiding the API key:

```javascript
// Example secure Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects require authentication
    match /projects/{projectId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2. Firebase Console Security Settings

1. **Restrict API Key Usage**:
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Edit your API key
   - Add HTTP referrer restrictions (your domain)

2. **Authentication Domain Restrictions**:
   - Firebase Console → Authentication → Settings
   - Only add your actual domains to "Authorized domains"

### 3. Environment Variable Checklist

| Variable | Safe for NEXT_PUBLIC_ | Reason |
|----------|----------------------|---------|
| `FIREBASE_API_KEY` | ✅ Yes | Client-side Firebase config |
| `FIREBASE_PROJECT_ID` | ✅ Yes | Public identifier |
| `FIREBASE_AUTH_DOMAIN` | ✅ Yes | Public domain |
| `APP_URL` | ✅ Yes | Public URL |
| `SMTP_PASSWORD` | ❌ No | Server credentials |
| `GEMINI_API_KEY` | ❌ No | Paid API access |
| `JWT_SECRET` | ❌ No | Authentication security |

## 🔍 How to Verify What's Exposed

### Check in Browser DevTools:
1. Open your deployed app
2. Press F12 → Console
3. Type: `console.log(process.env)`
4. Only NEXT_PUBLIC_ variables should appear

### Check Network Tab:
1. F12 → Network tab
2. Look at any request
3. Check if sensitive data is in request headers/body

## 🚨 What to Do If You Exposed Sensitive Data

### If you accidentally made sensitive data public:

1. **Immediately Rotate Keys**:
   ```bash
   # For Firebase (if you exposed admin keys)
   # Generate new service account key in Firebase Console
   
   # For API keys
   # Regenerate in respective service console
   ```

2. **Update Environment Variables**:
   - Remove NEXT_PUBLIC_ prefix from sensitive variables
   - Update all deployment environments

3. **Redeploy**:
   ```bash
   # Force new deployment
   git commit --allow-empty -m "Security: Rotate exposed keys"
   git push
   ```

## ✅ Current FundiFlow Configuration Status

Your current setup is **SECURE** because:

1. **Only Safe Variables are Public**: Firebase client config is designed to be public
2. **Sensitive Data is Server-Side**: SMTP credentials, API keys are not NEXT_PUBLIC_
3. **Firebase Rules Protect Data**: Your Firestore rules control access, not the API key
4. **Domain Restrictions**: Can be configured in Firebase Console

## 📋 Security Audit Checklist

- [ ] Only Firebase client config uses NEXT_PUBLIC_
- [ ] SMTP credentials are server-side only
- [ ] API keys (Gemini, etc.) are server-side only
- [ ] Firestore security rules are properly configured
- [ ] Firebase domains are restricted to your app
- [ ] No sensitive data in client-side code
- [ ] Environment variables validated before deployment

## 🔗 Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Next.js Environment Variables Guide](https://nextjs.org/docs/basic-features/environment-variables)
- [Google Cloud API Key Security](https://cloud.google.com/docs/authentication/api-keys)

## 💡 Pro Tips

1. **Use Firebase App Check** for additional security (optional)
2. **Monitor Firebase Usage** to detect unusual activity
3. **Regular Security Audits** of your Firestore rules
4. **Keep Dependencies Updated** for security patches
5. **Use TypeScript** for compile-time security checks