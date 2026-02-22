/// <reference lib="webworker" />

import type { InstallSerwistOptions } from '@serwist/sw';
import { installSerwist } from '@serwist/sw';
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from 'serwist';
import { get, set } from 'idb-keyval';

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: InstallSerwistOptions['precacheEntries'];
};

// ============================================================================
// Types (shared with syncQueue.ts)
// ============================================================================

interface PersistedAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

type SyncOperationType = 'streak' | 'xp';

interface StreakSyncData {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
}

interface XPSyncData {
  xpDelta: number;
  reason: string;
  timestamp: string;
}

interface QueuedOperation {
  id: string;
  type: SyncOperationType;
  userId: string;
  data: StreakSyncData | XPSyncData;
  createdAt: string;
  retryCount: number;
  lastAttempt: string | null;
}

// IndexedDB keys (must match syncQueue.ts)
const SYNC_QUEUE_KEY = 'mi-coach-sync-queue';
const AUTH_TOKEN_KEY = 'mi-coach-auth-token';
const SUPABASE_CONFIG_KEY = 'mi-coach-supabase-config';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// ============================================================================
// Static assets to precache (fallback when __SW_MANIFEST is undefined)
// ============================================================================

const staticAssets = [
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
  { url: '/manifest.json', revision: '1' },
];

// ============================================================================
// Install Serwist with Runtime Caching
// ============================================================================

installSerwist({
  precacheEntries: self.__SW_MANIFEST ?? staticAssets,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // 1. StaleWhileRevalidate for Next.js API routes
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/'),
      handler: new StaleWhileRevalidate({
        cacheName: 'api-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          }),
        ],
      }),
    },

    // 2. NetworkFirst for Supabase API calls
    {
      matcher: ({ url }) => url.hostname.includes('supabase.co'),
      handler: new NetworkFirst({
        cacheName: 'supabase-cache',
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          }),
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
        ],
      }),
    },

    // 3. CacheFirst for images
    {
      matcher: ({ request }) => request.destination === 'image',
      handler: new CacheFirst({
        cacheName: 'image-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          }),
        ],
      }),
    },

    // 4. CacheFirst for Font Awesome CDN (Google Fonts handled by next/font at build time)
    {
      matcher: ({ url }) =>
        url.hostname === 'cdnjs.cloudflare.com',
      handler: new CacheFirst({
        cacheName: 'cdn-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          }),
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
        ],
      }),
    },

    // 5. CacheFirst for Lottie JSON animations
    {
      matcher: ({ url }) =>
        url.pathname.endsWith('.json') && url.pathname.includes('animation'),
      handler: new CacheFirst({
        cacheName: 'lottie-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          }),
        ],
      }),
    },
  ],
});

// ============================================================================
// Background Sync
// ============================================================================

/**
 * Process queued operations when sync event fires
 */
async function processBackgroundSync(): Promise<void> {
  console.log('[SW] Processing background sync queue...');

  // Get persisted auth token from IndexedDB
  const authToken = await get<PersistedAuthToken>(AUTH_TOKEN_KEY);

  if (!authToken) {
    console.warn('[SW] No auth token available for background sync');
    return;
  }

  // Check if token is expired (with 5 minute buffer)
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (authToken.expiresAt - nowSeconds < 300) {
    console.warn('[SW] Auth token expired or expiring soon, cannot sync');
    // Token refresh requires user interaction, so we'll skip for now
    // The main thread will refresh and re-persist on next app open
    return;
  }

  // Get queued operations
  const queue = (await get<QueuedOperation[]>(SYNC_QUEUE_KEY)) || [];

  if (queue.length === 0) {
    console.log('[SW] No operations to sync');
    return;
  }

  console.log(`[SW] Processing ${queue.length} queued operations`);

  // Get Supabase config from IndexedDB (stored by main app)
  const supabaseConfig = await get<SupabaseConfig>(SUPABASE_CONFIG_KEY);
  if (!supabaseConfig?.url || !supabaseConfig?.anonKey) {
    console.error('[SW] Supabase config not available in IndexedDB');
    return;
  }

  const successfulIds: string[] = [];

  for (const operation of queue) {
    try {
      const success = await syncOperation(
        operation,
        authToken.accessToken,
        supabaseConfig.url,
        supabaseConfig.anonKey
      );
      if (success) {
        successfulIds.push(operation.id);
      }
    } catch (error) {
      console.error('[SW] Failed to sync operation:', operation.id, error);
    }
  }

  // Remove successful operations from queue
  if (successfulIds.length > 0) {
    const remainingQueue = queue.filter((op) => !successfulIds.includes(op.id));
    await set(SYNC_QUEUE_KEY, remainingQueue);
    console.log(
      `[SW] Synced ${successfulIds.length} operations, ${remainingQueue.length} remaining`
    );
  }
}

/**
 * Sync a single operation to Supabase
 */
async function syncOperation(
  operation: QueuedOperation,
  accessToken: string,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<boolean> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    apikey: supabaseAnonKey,
  };

  if (operation.type === 'streak') {
    const streakData = operation.data as StreakSyncData;
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?user_id=eq.${operation.userId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          current_streak: streakData.currentStreak,
          longest_streak: streakData.longestStreak,
          last_practice_date: streakData.lastPracticeDate,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      console.error('[SW] Streak sync failed:', response.status);
      return false;
    }

    console.log('[SW] Streak synced successfully');
    return true;
  }

  if (operation.type === 'xp') {
    const xpData = operation.data as XPSyncData;

    // First, get current XP
    const getResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?user_id=eq.${operation.userId}&select=current_xp`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!getResponse.ok) {
      console.error('[SW] Failed to get current XP:', getResponse.status);
      return false;
    }

    const profiles = await getResponse.json();
    const currentXP = profiles[0]?.current_xp ?? 0;
    const newXP = currentXP + xpData.xpDelta;

    // Update with new XP
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?user_id=eq.${operation.userId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          current_xp: newXP,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!updateResponse.ok) {
      console.error('[SW] XP sync failed:', updateResponse.status);
      return false;
    }

    console.log(`[SW] XP synced successfully: +${xpData.xpDelta} (${xpData.reason})`);
    return true;
  }

  return false;
}

// Listen for sync events
self.addEventListener('sync', (event) => {
  if ((event as SyncEvent).tag === 'sync-queue') {
    event.waitUntil(processBackgroundSync());
  }
});

// Optional: Periodic background sync (requires permission)
self.addEventListener('periodicsync', (event) => {
  if ((event as PeriodicSyncEvent).tag === 'periodic-queue-sync') {
    event.waitUntil(processBackgroundSync());
  }
});

// Type declarations for sync events
interface SyncEvent extends ExtendableEvent {
  tag: string;
}

interface PeriodicSyncEvent extends ExtendableEvent {
  tag: string;
}
