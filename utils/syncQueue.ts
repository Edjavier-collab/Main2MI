/**
 * Sync Queue Utility
 * 
 * Handles offline-first data synchronization for gamification features.
 * When Supabase writes fail, operations are queued in localStorage
 * and retried when connectivity is restored.
 * 
 * Supports: streak updates, XP additions
 */

// Storage key for the sync queue
const SYNC_QUEUE_KEY = 'mi-coach-sync-queue';

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
 * Generate a unique ID for queue items
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all queued operations from localStorage
 */
export const getQueuedOperations = (): QueuedOperation[] => {
  try {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[syncQueue] Failed to parse queue:', error);
    return [];
  }
};

/**
 * Save queue to localStorage
 */
const saveQueue = (queue: QueuedOperation[]): void => {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[syncQueue] Failed to save queue:', error);
  }
};

/**
 * Add an operation to the sync queue
 */
export const queueOperation = (
  type: SyncOperationType,
  userId: string,
  data: StreakSyncData | XPSyncData
): void => {
  const queue = getQueuedOperations();
  
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
    saveQueue(filteredQueue);
    console.log('[syncQueue] Queued streak update for user:', userId);
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
  saveQueue(queue);
  console.log('[syncQueue] Queued XP addition for user:', userId);
};

/**
 * Remove an operation from the queue (after successful sync)
 */
export const removeFromQueue = (operationId: string): void => {
  const queue = getQueuedOperations();
  const filtered = queue.filter(op => op.id !== operationId);
  saveQueue(filtered);
};

/**
 * Update an operation's retry count
 */
const updateRetryCount = (operationId: string): void => {
  const queue = getQueuedOperations();
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
  saveQueue(updated);
};

/**
 * Remove operations that have exceeded max retries
 */
const pruneFailedOperations = (): void => {
  const queue = getQueuedOperations();
  const pruned = queue.filter(op => op.retryCount < MAX_RETRIES);
  const removed = queue.length - pruned.length;
  if (removed > 0) {
    console.warn('[syncQueue] Pruned', removed, 'operations that exceeded max retries');
    saveQueue(pruned);
  }
};

/**
 * Get queued operations for a specific type and user
 */
export const getQueuedOperationsForUser = (
  type: SyncOperationType,
  userId: string
): QueuedOperation[] => {
  return getQueuedOperations().filter(
    op => op.type === type && op.userId === userId
  );
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
  pruneFailedOperations();
  
  const operations = getQueuedOperationsForUser(type, userId);
  
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
        removeFromQueue(operation.id);
        successCount++;
        console.log(`[syncQueue] Successfully synced ${type} operation:`, operation.id);
      } else {
        updateRetryCount(operation.id);
        console.warn(`[syncQueue] Failed to sync ${type} operation:`, operation.id);
      }
    } catch (error) {
      updateRetryCount(operation.id);
      console.error(`[syncQueue] Error processing ${type} operation:`, error);
    }
  }
  
  return successCount;
};

/**
 * Check if there are any pending operations in the queue
 */
export const hasPendingOperations = (): boolean => {
  return getQueuedOperations().length > 0;
};

/**
 * Get count of pending operations by type
 */
export const getPendingOperationCounts = (): Record<SyncOperationType, number> => {
  const queue = getQueuedOperations();
  return {
    streak: queue.filter(op => op.type === 'streak').length,
    xp: queue.filter(op => op.type === 'xp').length,
  };
};

/**
 * Clear all queued operations (use with caution)
 */
export const clearQueue = (): void => {
  localStorage.removeItem(SYNC_QUEUE_KEY);
  console.log('[syncQueue] Queue cleared');
};

/**
 * Clear queued operations for a specific user (e.g., on logout)
 */
export const clearQueueForUser = (userId: string): void => {
  const queue = getQueuedOperations();
  const filtered = queue.filter(op => op.userId !== userId);
  saveQueue(filtered);
  console.log('[syncQueue] Cleared queue for user:', userId);
};
