import type { Metadata, Viewport } from 'next';
import { Inter, Mulish } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { ServiceWorkerRegistration } from '@/components/ui/ServiceWorkerRegistration';

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* PWA Meta Tags */}
        <meta name="application-name" content="MI Mastery" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MI Mastery" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0ea5e9" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />

        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={`${inter.variable} ${mulish.variable} font-sans antialiased text-text-primary bg-bg-main min-h-screen flex flex-col`}>
        <ErrorBoundary>
          <AuthProvider>
            <ServiceWorkerRegistration />
            <OfflineIndicator />

            {/* Header / Top Navigation */}
            <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 pt-safe-top shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all border-b border-neutral-200/50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    M
                  </div>
                  <span className="font-display font-bold text-lg tracking-tight text-text-primary">
                    MI Mastery
                  </span>
                </div>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow w-full max-w-7xl mx-auto flex flex-col pb-safe-bottom relative px-[var(--inset-x-mobile)] sm:px-[var(--inset-x-tablet)]">
              {children}
            </main>

            <CookieConsent />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
