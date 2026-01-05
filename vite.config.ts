import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    // Load environment variables from .env, .env.local, .env.[mode], .env.[mode].local
    const env = loadEnv(mode, process.cwd(), '');
    
    // Debug: Log if API keys are found (only in dev mode, and don't log the actual keys)
    if (mode === 'development') {
        const hasGeminiKey = !!(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY);
        console.log(`[Vite Config] GEMINI_API_KEY ${hasGeminiKey ? 'found' : 'NOT FOUND'}`);
        if (!hasGeminiKey) {
            console.warn('[Vite Config] Warning: GEMINI_API_KEY not found in environment variables');
        }

        const hasSupabaseUrl = !!env.VITE_SUPABASE_URL;
        const hasSupabaseAnonKey = !!env.VITE_SUPABASE_ANON_KEY;
        console.log(`[Vite Config] VITE_SUPABASE_URL ${hasSupabaseUrl ? 'found' : 'NOT FOUND'}`);
        console.log(`[Vite Config] VITE_SUPABASE_ANON_KEY ${hasSupabaseAnonKey ? 'found' : 'NOT FOUND'}`);
        if (!hasSupabaseUrl || !hasSupabaseAnonKey) {
            console.warn('[Vite Config] Warning: Supabase credentials not fully configured in environment variables');
        }
    }
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.svg', 'icons/*.png', 'icons/*.svg'],
          manifest: {
            name: 'MI Mastery',
            short_name: 'MI Mastery',
            description: 'Motivational Interviewing training with AI-powered patient simulations',
            theme_color: '#0ea5e9',
            background_color: '#f8fafc',
            display: 'standalone',
            orientation: 'portrait-primary',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: '/icons/icon-72x72.png',
                sizes: '72x72',
                type: 'image/png'
              },
              {
                src: '/icons/icon-96x96.png',
                sizes: '96x96',
                type: 'image/png'
              },
              {
                src: '/icons/icon-128x128.png',
                sizes: '128x128',
                type: 'image/png'
              },
              {
                src: '/icons/icon-144x144.png',
                sizes: '144x144',
                type: 'image/png'
              },
              {
                src: '/icons/icon-152x152.png',
                sizes: '152x152',
                type: 'image/png'
              },
              {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/icon-384x384.png',
                sizes: '384x384',
                type: 'image/png'
              },
              {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/icon-maskable-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ]
          },
          workbox: {
            // SPA fallback for offline navigation
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [
              /^\/api/,
              /^\/functions/,
              /stripe\.com/,
              /js\.stripe\.com/,
              /m\.stripe\.network/
            ],
            // Clean up old caches
            cleanupOutdatedCaches: true,
            // Cache strategies
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
            runtimeCaching: [
              {
                // Never cache Stripe - critical for payments
                urlPattern: /^https:\/\/.*stripe\.(com|network)/i,
                handler: 'NetworkOnly'
              },
              {
                // Handle Gemini API - network only with graceful offline error
                urlPattern: /^https:\/\/generativelanguage\.googleapis\.com/i,
                handler: 'NetworkOnly',
                options: {
                  networkTimeoutSeconds: 15
                }
              },
              {
                // Cache Supabase API responses
                urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'supabase-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 // 24 hours
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                // Cache Google Fonts
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                // Cache Font Awesome
                urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'fontawesome-cache',
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                // Cache Tailwind CDN script
                urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'tailwind-cdn-cache',
                  networkTimeoutSeconds: 5,
                  expiration: {
                    maxEntries: 5,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                // Cache React + other modules loaded from CDN via import maps
                urlPattern: /^https:\/\/aistudiocdn\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'module-cdn-cache',
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                // Cache images
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'image-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                  }
                }
              }
            ],
            // Skip waiting and claim clients immediately
            skipWaiting: true,
            clientsClaim: true
          },
          devOptions: {
            enabled: true, // Enable in dev mode for testing
            type: 'module'
          }
        })
      ],
      define: {
        'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Code splitting configuration
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-supabase': ['@supabase/supabase-js'],
              'vendor-stripe': ['@stripe/stripe-js'],
              'vendor-genai': ['@google/genai']
            }
          }
        },
        // Generate sourcemaps for production
        sourcemap: true,
        // Minify CSS
        cssMinify: true
      }
    };
});
