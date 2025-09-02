// Environment validation for production deployment
import { z } from 'zod';

const envSchema = z.object({
  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  
  // Firebase Configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API key is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase auth domain is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase storage bucket is required'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase messaging sender ID is required'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'Firebase app ID is required'),
  
  // Email Configuration
  EMAIL_PROVIDER: z.string().default('smtp'),
  SMTP_HOST: z.string().min(1, 'SMTP host is required'),
  SMTP_PORT: z.string().regex(/^\d+$/, 'SMTP port must be a number'),
  SMTP_USER: z.string().email('Invalid SMTP user email'),
  SMTP_PASS: z.string().min(1, 'SMTP password is required'),
  FROM_EMAIL: z.string().email('Invalid from email'),
  FROM_NAME: z.string().min(1, 'From name is required'),
  
  // Optional Configuration
  GEMINI_API_KEY: z.string().optional(),
  DEBUG_EMAIL: z.string().optional().default('false'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}\n\nPlease check your environment variables.`
      );
    }
    throw error;
  }
}

// Validate environment on module load in production
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}