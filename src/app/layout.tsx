
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { AuthProvider } from '@/hooks/use-auth';
import { NotificationToast } from '@/components/notifications/notification-toast';
import { NotificationProvider } from '@/contexts/notification-context';

export const metadata: Metadata = {
  title: 'FundiFlow',
  description: 'Streamline Your Assembly Line',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <NotificationProvider>
            {children}
            <NotificationToast />
          </NotificationProvider>
        </AuthProvider>
        <Toaster />
        <SonnerToaster position="top-right" richColors />
      </body>
    </html>
  );
}
