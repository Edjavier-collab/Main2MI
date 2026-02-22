import path from 'path';
import { fileURLToPath } from 'url';
import withSerwistInit from '@serwist/next';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  additionalPrecacheEntries: [
    // PWA icons
    { url: '/icons/icon-72x72.png', revision: '1' },
    { url: '/icons/icon-96x96.png', revision: '1' },
    { url: '/icons/icon-128x128.png', revision: '1' },
    { url: '/icons/icon-144x144.png', revision: '1' },
    { url: '/icons/icon-152x152.png', revision: '1' },
    { url: '/icons/icon-192x192.png', revision: '1' },
    { url: '/icons/icon-384x384.png', revision: '1' },
    { url: '/icons/icon-512x512.png', revision: '1' },
    { url: '/icons/icon-maskable-192x192.png', revision: '1' },
    { url: '/icons/icon-maskable-512x512.png', revision: '1' },
    { url: '/icons/shortcut-practice.png', revision: '1' },
    { url: '/icons/shortcut-history.png', revision: '1' },
    // Manifest
    { url: '/manifest.json', revision: '1' },
  ],
  // Disable SW only in npm run dev (not in build)
  disable: false,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fix 2: Explicitly map env vars so they are available
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Import alias configuration for Turbopack (Next.js 16+)
  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  // Import alias configuration for Webpack (fallback)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; img-src 'self' data: https://*.supabase.co https://*.stripe.com; connect-src 'self' https://*.supabase.co https://*.stripe.com https://api.stripe.com https://fonts.googleapis.com https://fonts.gstatic.com; frame-src 'self' https://js.stripe.com;"
          }
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
