import type { Metadata, Viewport } from 'next';
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
  title: 'MI Mastery - Professional AI Training',
  description: 'Master Motivational Interviewing with realistic AI-powered patient simulations. Build confidence through practice.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
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
            <OfflineIndicator />

            {/* Header / Top Navigation */}
            <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 pt-safe-top shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all border-b border-neutral-200/50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-xl shadow-md border border-white/10">
                    M
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display font-extrabold text-lg tracking-tight text-text-primary leading-tight">
                      MI Mastery
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted leading-tight">
                      Training Portal
                    </span>
                  </div>
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
