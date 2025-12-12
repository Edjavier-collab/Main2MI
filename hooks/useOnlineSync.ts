import { useEffect, useCallback, useRef } from 'react';
import { hasPendingOperations, getPendingOperationCounts } from '../utils/syncQueue';

interface UseOnlineSyncOptions {
  /** Process queued streak operations */
  processStreakQueue?: () => Promise<void>;
  /** Process queued XP operations */
  processXPQueue?: () => Promise<void>;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
}

/**
 * Hook to trigger sync queue processing when the app comes back online
 * 
 * Listens for the browser 'online' event and processes any pending
 * sync operations that failed while offline.
 */
export const useOnlineSync = ({
  processStreakQueue,
  processXPQueue,
  isAuthenticated,
}: UseOnlineSyncOptions): void => {
  // Track if sync is in progress to prevent double-syncing
  const isSyncing = useRef(false);

  /**
   * Process all pending sync operations
   */
  const syncPendingOperations = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('[useOnlineSync] User not authenticated, skipping sync');
      return;
    }

    if (isSyncing.current) {
      console.log('[useOnlineSync] Sync already in progress, skipping');
      return;
    }

    if (!hasPendingOperations()) {
      console.log('[useOnlineSync] No pending operations to sync');
      return;
    }

    isSyncing.current = true;
    const counts = getPendingOperationCounts();
    console.log('[useOnlineSync] Starting sync of pending operations:', counts);

    try {
      // Process streak queue first (usually just one operation)
      if (processStreakQueue && counts.streak > 0) {
        console.log('[useOnlineSync] Processing streak queue...');
        await processStreakQueue();
      }

      // Process XP queue (may have multiple operations)
      if (processXPQueue && counts.xp > 0) {
        console.log('[useOnlineSync] Processing XP queue...');
        await processXPQueue();
      }

      console.log('[useOnlineSync] Sync complete');
    } catch (error) {
      console.error('[useOnlineSync] Error during sync:', error);
    } finally {
      isSyncing.current = false;
    }
  }, [isAuthenticated, processStreakQueue, processXPQueue]);

  /**
   * Handle online event
   */
  const handleOnline = useCallback(() => {
    console.log('[useOnlineSync] Connection restored, triggering sync');
    // Small delay to ensure network is stable
    setTimeout(() => {
      syncPendingOperations();
    }, 1000);
  }, [syncPendingOperations]);

  /**
   * Handle visibility change (app comes to foreground)
   * This catches cases where the user switches back to the app
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      console.log('[useOnlineSync] App became visible and online, checking for pending syncs');
      syncPendingOperations();
    }
  }, [syncPendingOperations]);

  // Set up event listeners
  useEffect(() => {
    // Listen for online event
    window.addEventListener('online', handleOnline);
    
    // Listen for visibility change (PWA coming to foreground)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check on mount if we're online and have pending operations
    if (navigator.onLine && isAuthenticated) {
      syncPendingOperations();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleOnline, handleVisibilityChange, isAuthenticated, syncPendingOperations]);
};
