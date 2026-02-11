/**
 * Sync Queue Utility
 *
 * Handles offline-first data synchronization for gamification features.
 * When Supabase writes fail, operations are queued in IndexedDB
 * and retried when connectivity is restored (including via Background Sync).
 *
 * Also handles auth token persistence for Service Worker authentication.
 *
 * Supports: streak updates, XP additions
 */

import { get, set, del } from 'idb-keyval';

// Storage keys for IndexedDB
const SYNC_QUEUE_KEY = 'mi-coach-sync-queue';
const AUTH_TOKEN_KEY = 'mi-coach-auth-token';
const SUPABASE_CONFIG_KEY = 'mi-coach-supabase-config';
const MIGRATION_DONE_KEY = 'mi-coach-idb-migration-done';

// Legacy localStorage key (for migration)
const LEGACY_QUEUE_KEY = 'mi-coach-sync-queue';

// Maximum retry attempts before giving up
const MAX_RETRIES = 5;

// Minimum delay between retry attempts (ms)
const MIN_RETRY_DELAY = 1000;

/**
 * Types of operations that can be queued
 */
export type SyncOperationType = 'streak' | 'xp';

/**
 * Streak update data
 */
export interface StreakSyncData {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null; // ISO date string (YYYY-MM-DD)
}

/**
 * XP update data (stores delta, not absolute value)
 */
export interface XPSyncData {
  xpDelta: number; // Amount to add
  reason: string;
  timestamp: string; // When XP was earned
}

/**
 * A queued sync operation
 */
export interface QueuedOperation {
  id: string;
  type: SyncOperationType;
  userId: string;
  data: StreakSyncData | XPSyncData;
  createdAt: string;
  retryCount: number;
  lastAttempt: string | null;
}

/**
 * Handler function for processing a queued operation
 * Returns true if sync was successful, false otherwise
 */
export type SyncHandler = (operation: QueuedOperation) => Promise<boolean>;

/**
 * Persisted auth token for Service Worker authentication
 */
export interface PersistedAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in seconds
  userId: string;
}

/**
 * Generate a unique ID for queue items
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * One-time migration from localStorage to IndexedDB
 * Runs automatically on first queue access
 */
const migrateFromLocalStorage = async (): Promise<void> => {
  try {
    // Check if migration already done
    const migrationDone = await get<boolean>(MIGRATION_DONE_KEY);
    if (migrationDone) {
      return;
    }

    // Check for localStorage data
    if (typeof window === 'undefined' || !window.localStorage) {
      await set(MIGRATION_DONE_KEY, true);
      return;
    }

    const legacyData = localStorage.getItem(LEGACY_QUEUE_KEY);
    if (legacyData) {
      try {
        const queue: QueuedOperation[] = JSON.parse(legacyData);
        if (Array.isArray(queue) && queue.length > 0) {
          await set(SYNC_QUEUE_KEY, queue);
          console.log('[syncQueue] Migrated', queue.length, 'operations from localStorage to IndexedDB');
        }
        // Clear localStorage after successful migration
        localStorage.removeItem(LEGACY_QUEUE_KEY);
      } catch (parseError) {
        console.error('[syncQueue] Failed to parse legacy queue data:', parseError);
        localStorage.removeItem(LEGACY_QUEUE_KEY);
      }
    }

    await set(MIGRATION_DONE_KEY, true);
    console.log('[syncQueue] Migration from localStorage complete');
  } catch (error) {
    console.error('[syncQueue] Migration failed:', error);
    // Don't block on migration failure
  }
};

/**
 * Get all queued operations from IndexedDB
 */
export const getQueuedOperations = async (): Promise<QueuedOperation[]> => {
  try {
    await migrateFromLocalStorage();
    const queue = await get<QueuedOperation[]>(SYNC_QUEUE_KEY);
    return queue || [];
  } catch (error) {
    console.error('[syncQueue] Failed to get queue:', error);
    return [];
  }
};

/**
 * Save queue to IndexedDB
 */
const saveQueue = async (queue: QueuedOperation[]): Promise<void> => {
  try {
    await set(SYNC_QUEUE_KEY, queue);
  } catch (error) {
    console.error('[syncQueue] Failed to save queue:', error);
  }
};

/**
 * Add an operation to the sync queue
 */
export const queueOperation = async (
  type: SyncOperationType,
  userId: string,
  data: StreakSyncData | XPSyncData
): Promise<void> => {
  const queue = await getQueuedOperations();

  // For streak updates, replace any existing streak operation for this user
  // (only the latest streak state matters)
  if (type === 'streak') {
    const filteredQueue = queue.filter(
      op => !(op.type === 'streak' && op.userId === userId)
    );
    filteredQueue.push({
      id: generateId(),
      type,
      userId,
      data,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      lastAttempt: null,
    });
    await saveQueue(filteredQueue);
    console.log('[syncQueue] Queued streak update for user:', userId);

    // Request background sync
    await requestBackgroundSync();
    return;
  }

  // For XP additions, queue each one separately (they're cumulative)
  queue.push({
    id: generateId(),
    type,
    userId,
    data,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    lastAttempt: null,
  });
  await saveQueue(queue);
  console.log('[syncQueue] Queued XP addition for user:', userId);

  // Request background sync
  await requestBackgroundSync();
};

/**
 * Remove an operation from the queue (after successful sync)
 */
export const removeFromQueue = async (operationId: string): Promise<void> => {
  const queue = await getQueuedOperations();
  const filtered = queue.filter(op => op.id !== operationId);
  await saveQueue(filtered);
};

/**
 * Update an operation's retry count
 */
const updateRetryCount = async (operationId: string): Promise<void> => {
  const queue = await getQueuedOperations();
  const updated = queue.map(op => {
    if (op.id === operationId) {
      return {
        ...op,
        retryCount: op.retryCount + 1,
        lastAttempt: new Date().toISOString(),
      };
    }
    return op;
  });
  await saveQueue(updated);
};

/**
 * Remove operations that have exceeded max retries
 */
const pruneFailedOperations = async (): Promise<void> => {
  const queue = await getQueuedOperations();
  const pruned = queue.filter(op => op.retryCount < MAX_RETRIES);
  const removed = queue.length - pruned.length;
  if (removed > 0) {
    console.warn('[syncQueue] Pruned', removed, 'operations that exceeded max retries');
    await saveQueue(pruned);
  }
};

/**
 * Get queued operations for a specific type and user
 */
export const getQueuedOperationsForUser = async (
  type: SyncOperationType,
  userId: string
): Promise<QueuedOperation[]> => {
  const queue = await getQueuedOperations();
  return queue.filter(op => op.type === type && op.userId === userId);
};

/**
 * Process all queued operations of a specific type for a user
 *
 * @param type - The type of operations to process
 * @param userId - The user's ID
 * @param handler - Function to handle each operation (should return true on success)
 * @returns Number of successfully processed operations
 */
export const processSyncQueue = async (
  type: SyncOperationType,
  userId: string,
  handler: SyncHandler
): Promise<number> => {
  // Prune old failed operations first
  await pruneFailedOperations();

  const operations = await getQueuedOperationsForUser(type, userId);

  if (operations.length === 0) {
    return 0;
  }

  console.log(`[syncQueue] Processing ${operations.length} queued ${type} operations`);

  let successCount = 0;

  for (const operation of operations) {
    // Skip if recently attempted (prevent hammering on repeated failures)
    if (operation.lastAttempt) {
      const lastAttemptTime = new Date(operation.lastAttempt).getTime();
      const timeSinceAttempt = Date.now() - lastAttemptTime;
      const backoffDelay = MIN_RETRY_DELAY * Math.pow(2, operation.retryCount);

      if (timeSinceAttempt < backoffDelay) {
        console.log(`[syncQueue] Skipping ${operation.id} - too soon since last attempt`);
        continue;
      }
    }

    try {
      const success = await handler(operation);

      if (success) {
        await removeFromQueue(operation.id);
        successCount++;
        console.log(`[syncQueue] Successfully synced ${type} operation:`, operation.id);
      } else {
        await updateRetryCount(operation.id);
        console.warn(`[syncQueue] Failed to sync ${type} operation:`, operation.id);
      }
    } catch (error) {
      await updateRetryCount(operation.id);
      console.error(`[syncQueue] Error processing ${type} operation:`, error);
    }
  }

  return successCount;
};

/**
 * Check if there are any pending operations in the queue
 */
export const hasPendingOperations = async (): Promise<boolean> => {
  const queue = await getQueuedOperations();
  return queue.length > 0;
};

/**
 * Get count of pending operations by type
 */
export const getPendingOperationCounts = async (): Promise<Record<SyncOperationType, number>> => {
  const queue = await getQueuedOperations();
  return {
    streak: queue.filter(op => op.type === 'streak').length,
    xp: queue.filter(op => op.type === 'xp').length,
  };
};

/**
 * Clear all queued operations (use with caution)
 */
export const clearQueue = async (): Promise<void> => {
  await del(SYNC_QUEUE_KEY);
  console.log('[syncQueue] Queue cleared');
};

/**
 * Clear queued operations for a specific user (e.g., on logout)
 */
export const clearQueueForUser = async (userId: string): Promise<void> => {
  const queue = await getQueuedOperations();
  const filtered = queue.filter(op => op.userId !== userId);
  await saveQueue(filtered);
  console.log('[syncQueue] Cleared queue for user:', userId);
};

// ============================================================================
// Auth Token Persistence for Service Worker
// ============================================================================

/**
 * Persist auth token to IndexedDB for Service Worker access
 * Call this when user signs in or token refreshes
 */
export const persistAuthToken = async (token: PersistedAuthToken): Promise<void> => {
  try {
    await set(AUTH_TOKEN_KEY, token);
    console.log('[syncQueue] Auth token persisted to IndexedDB');
  } catch (error) {
    console.error('[syncQueue] Failed to persist auth token:', error);
  }
};

/**
 * Get persisted auth token from IndexedDB
 * Used by Service Worker for authenticated background requests
 */
export const getPersistedAuthToken = async (): Promise<PersistedAuthToken | null> => {
  try {
    const token = await get<PersistedAuthToken>(AUTH_TOKEN_KEY);
    return token || null;
  } catch (error) {
    console.error('[syncQueue] Failed to get persisted auth token:', error);
    return null;
  }
};

/**
 * Clear persisted auth token from IndexedDB
 * Call this when user signs out
 */
export const clearPersistedAuthToken = async (): Promise<void> => {
  try {
    await del(AUTH_TOKEN_KEY);
    console.log('[syncQueue] Cleared persisted auth token');
  } catch (error) {
    console.error('[syncQueue] Failed to clear auth token:', error);
  }
};

/**
 * Check if persisted auth token is expired
 */
export const isAuthTokenExpired = async (): Promise<boolean> => {
  const token = await getPersistedAuthToken();
  if (!token) return true;

  // Token expiresAt is in seconds, Date.now() is in milliseconds
  const nowSeconds = Math.floor(Date.now() / 1000);
  // Consider expired if less than 5 minutes remaining
  return token.expiresAt - nowSeconds < 300;
};

// ============================================================================
// Supabase Config Persistence for Service Worker
// ============================================================================

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Persist Supabase config to IndexedDB for Service Worker access
 * Call this on app initialization
 */
export const persistSupabaseConfig = async (config: SupabaseConfig): Promise<void> => {
  try {
    await set(SUPABASE_CONFIG_KEY, config);
    console.log('[syncQueue] Supabase config persisted to IndexedDB');
  } catch (error) {
    console.error('[syncQueue] Failed to persist Supabase config:', error);
  }
};

/**
 * Get persisted Supabase config from IndexedDB
 */
export const getPersistedSupabaseConfig = async (): Promise<SupabaseConfig | null> => {
  try {
    const config = await get<SupabaseConfig>(SUPABASE_CONFIG_KEY);
    return config || null;
  } catch (error) {
    console.error('[syncQueue] Failed to get Supabase config:', error);
    return null;
  }
};

// ============================================================================
// Background Sync
// ============================================================================

/**
 * Request a background sync when online
 * Falls back gracefully if Background Sync API is unavailable
 */
export const requestBackgroundSync = async (): Promise<void> => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if Background Sync is supported
    if ('sync' in registration) {
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-queue');
      console.log('[syncQueue] Background sync requested');
    } else {
      console.log('[syncQueue] Background Sync not supported');
    }
  } catch (error) {
    // Background sync registration can fail if:
    // - User is offline (that's fine, SW will sync when online)
    // - Permission denied
    // - Not in secure context
    console.log('[syncQueue] Background sync request failed (will retry when online):', error);
  }
};
