import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; img-src 'self' data: https://*.supabase.co https://*.stripe.com; connect-src 'self' https://*.supabase.co https://*.stripe.com https://api.stripe.com; frame-src 'self' https://js.stripe.com;"
          }
        ],
      },
    ];
  },
};

export default nextConfig;
