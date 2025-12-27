import type { Metadata } from 'next';
import { Inter, Mulish } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { CookieConsent } from '@/components/ui/CookieConsent';

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const mulish = Mulish({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mulish',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MI Mastery',
  description: 'Motivational Interviewing training with AI-powered patient simulations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${mulish.variable} font-sans`}>
        <ErrorBoundary>
          <AuthProvider>
            <OfflineIndicator />
            {children}
            <CookieConsent />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
