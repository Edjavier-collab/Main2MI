'use client';

import { useEffect } from 'react';
import { Workbox } from 'workbox-window';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Only register in production (SW is disabled in dev via next.config.mjs)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[PWA] Service worker disabled in development');
      return;
    }

    const wb = new Workbox('/sw.js');

    // Show update prompt when new SW is waiting
    wb.addEventListener('waiting', () => {
      console.log('[PWA] New content available, prompting user to refresh');

      // Auto-update: skip waiting immediately
      // For a more controlled update, you could show a UI prompt instead
      wb.messageSkipWaiting();
    });

    // Reload when new SW takes control
    wb.addEventListener('controlling', () => {
      console.log('[PWA] New service worker activated, reloading...');
      window.location.reload();
    });

    // Log registration success
    wb.addEventListener('activated', (event) => {
      if (event.isUpdate) {
        console.log('[PWA] Service worker updated');
      } else {
        console.log('[PWA] Service worker activated for first time');
      }
    });

    // Register the service worker
    wb.register()
      .then((registration) => {
        if (!registration) {
          console.warn('[PWA] Service worker registration returned undefined');
          return;
        }

        console.log('[PWA] Service worker registered:', registration.scope);

        // Check if Background Sync is supported
        if ('sync' in registration) {
          console.log('[PWA] Background sync is supported');
        }

        // Request periodic sync permission (optional)
        if ('periodicSync' in registration) {
          navigator.permissions
            .query({ name: 'periodic-background-sync' as PermissionName })
            .then((status) => {
              if (status.state === 'granted') {
                (
                  registration as ServiceWorkerRegistration & {
                    periodicSync: { register: (tag: string, options: { minInterval: number }) => Promise<void> };
                  }
                ).periodicSync
                  .register('periodic-queue-sync', {
                    minInterval: 24 * 60 * 60 * 1000, // 24 hours
                  })
                  .then(() => {
                    console.log('[PWA] Periodic background sync registered');
                  })
                  .catch((error) => {
                    console.log('[PWA] Periodic sync registration failed:', error);
                  });
              }
            })
            .catch(() => {
              // Periodic sync permission not available
            });
        }
      })
      .catch((error) => {
        console.error('[PWA] Service worker registration failed:', error);
      });
  }, []);

  // This component doesn't render anything
  return null;
}
