// Global type declarations for FundiFlow

// Extend the global namespace for better TypeScript support
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // App Configuration
      NEXT_PUBLIC_APP_URL: string;
      NODE_ENV: 'development' | 'production' | 'test';
      
      // Firebase Configuration
      NEXT_PUBLIC_FIREBASE_API_KEY: string;
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
      NEXT_PUBLIC_FIREBASE_APP_ID: string;
      
      // Email Configuration
      EMAIL_PROVIDER: string;
      SMTP_HOST: string;
      SMTP_PORT: string;
      SMTP_USER: string;
      SMTP_PASS: string;
      FROM_EMAIL: string;
      FROM_NAME: string;
      DEBUG_EMAIL: string;
      
      // Firebase Admin SDK Configuration
      FIREBASE_PROJECT_ID: string;
      FIREBASE_PRIVATE_KEY_ID: string;
      FIREBASE_PRIVATE_KEY: string;
      FIREBASE_CLIENT_EMAIL: string;
      FIREBASE_CLIENT_ID: string;
      
      // Optional Configuration
      GEMINI_API_KEY?: string;
    }
  }
}

// Module declarations for dynamic imports
declare module 'nodemailer' {
  interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
    service?: string;
  }

  interface MailOptions {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }

  interface Transporter {
    sendMail(mailOptions: MailOptions): Promise<any>;
  }

  interface NodemailerStatic {
    createTransport(options: TransportOptions): Transporter;
  }

  const nodemailer: NodemailerStatic;
  export default nodemailer;
}

export {};