import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { 
  queueOperation, 
  processSyncQueue, 
  StreakSyncData,
  QueuedOperation 
} from '../utils/syncQueue';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: Date | null;
}

interface UseStreakReturn extends StreakData {
  isLoading: boolean;
  updateStreak: () => Promise<number>;
  processQueue: () => Promise<void>; // Process queued operations (for online sync)
}

// Storage key for anonymous/fallback streak data
const STREAK_STORAGE_KEY = 'mi-coach-streak';

/**
 * Get today's date in UTC as YYYY-MM-DD string
 */
const getTodayUTC = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Get yesterday's date in UTC as YYYY-MM-DD string
 */
const getYesterdayUTC = (): string => {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() - 1);
  return now.toISOString().split('T')[0];
};

/**
 * Parse a date string to Date object (assumes UTC)
 */
const parseUTCDate = (dateStr: string): Date => {
  return new Date(`${dateStr}T00:00:00.000Z`);
};

/**
 * Hook to manage user practice streaks
 * Tracks consecutive calendar days with at least 1 completed session
 * All date calculations are done in UTC
 */
export const useStreak = (): UseStreakReturn => {
  const { user, loading: authLoading } = useAuth();
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [longestStreak, setLongestStreak] = useState<number>(0);
  const [lastPracticeDate, setLastPracticeDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Load streak data from localStorage (fallback/anonymous)
   */
  const loadFromLocalStorage = useCallback((): StreakData => {
    try {
      const stored = localStorage.getItem(STREAK_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          currentStreak: parsed.currentStreak ?? 0,
          longestStreak: parsed.longestStreak ?? 0,
          lastPracticeDate: parsed.lastPracticeDate ? parseUTCDate(parsed.lastPracticeDate) : null,
        };
      }
    } catch (error) {
      console.error('[useStreak] Failed to parse streak from localStorage:', error);
    }
    return { currentStreak: 0, longestStreak: 0, lastPracticeDate: null };
  }, []);

  /**
   * Save streak data to localStorage
   */
  const saveToLocalStorage = useCallback((data: StreakData): void => {
    try {
      const toStore = {
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        lastPracticeDate: data.lastPracticeDate ? data.lastPracticeDate.toISOString().split('T')[0] : null,
      };
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('[useStreak] Failed to save streak to localStorage:', error);
    }
  }, []);

  /**
   * Load streak data from Supabase
   */
  const loadFromSupabase = useCallback(async (userId: string): Promise<StreakData> => {
    if (!isSupabaseConfigured()) {
      console.warn('[useStreak] Supabase not configured, using localStorage');
      return loadFromLocalStorage();
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak, last_practice_date')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Profile might not have streak columns yet - return defaults
        if (error.code === 'PGRST116' || error.message.includes('column')) {
          console.log('[useStreak] Streak columns not found, using defaults');
          return { currentStreak: 0, longestStreak: 0, lastPracticeDate: null };
        }
        console.error('[useStreak] Failed to load streak from Supabase:', error);
        return loadFromLocalStorage();
      }

      if (!data) {
        return { currentStreak: 0, longestStreak: 0, lastPracticeDate: null };
      }

      return {
        currentStreak: data.current_streak ?? 0,
        longestStreak: data.longest_streak ?? 0,
        lastPracticeDate: data.last_practice_date ? parseUTCDate(data.last_practice_date) : null,
      };
    } catch (error) {
      console.error('[useStreak] Error loading streak from Supabase:', error);
      return loadFromLocalStorage();
    }
  }, [loadFromLocalStorage]);

  /**
   * Save streak data to Supabase
   * On failure, queues the operation for retry when connectivity is restored
   */
  const saveToSupabase = useCallback(async (userId: string, data: StreakData): Promise<boolean> => {
    // Always save to localStorage first for offline access
    saveToLocalStorage(data);

    if (!isSupabaseConfigured()) {
      console.warn('[useStreak] Supabase not configured, queuing for later sync');
      queueOperation('streak', userId, {
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        lastPracticeDate: data.lastPracticeDate ? data.lastPracticeDate.toISOString().split('T')[0] : null,
      });
      return false;
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          current_streak: data.currentStreak,
          longest_streak: data.longestStreak,
          last_practice_date: data.lastPracticeDate ? data.lastPracticeDate.toISOString().split('T')[0] : null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[useStreak] Failed to save streak to Supabase:', error);
        // Queue for retry
        queueOperation('streak', userId, {
          currentStreak: data.currentStreak,
          longestStreak: data.longestStreak,
          lastPracticeDate: data.lastPracticeDate ? data.lastPracticeDate.toISOString().split('T')[0] : null,
        });
        return false;
      }
      
      console.log('[useStreak] Streak saved to Supabase successfully');
      return true;
    } catch (error) {
      console.error('[useStreak] Error saving streak to Supabase:', error);
      // Queue for retry
      queueOperation('streak', userId, {
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
        lastPracticeDate: data.lastPracticeDate ? data.lastPracticeDate.toISOString().split('T')[0] : null,
      });
      return false;
    }
  }, [saveToLocalStorage]);

  /**
   * Handler for processing queued streak operations
   */
  const handleQueuedStreakSync = useCallback(async (operation: QueuedOperation): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      return false;
    }

    const streakData = operation.data as StreakSyncData;

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          current_streak: streakData.currentStreak,
          longest_streak: streakData.longestStreak,
          last_practice_date: streakData.lastPracticeDate,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', operation.userId);

      if (error) {
        console.error('[useStreak] Failed to sync queued streak:', error);
        return false;
      }

      console.log('[useStreak] Successfully synced queued streak');
      return true;
    } catch (error) {
      console.error('[useStreak] Error syncing queued streak:', error);
      return false;
    }
  }, []);

  /**
   * Check if streak is still valid (practiced yesterday or today)
   * If not practiced yesterday and not today, streak resets to 0
   */
  const validateStreak = useCallback((data: StreakData): StreakData => {
    if (!data.lastPracticeDate) {
      return { ...data, currentStreak: 0 };
    }

    const lastPracticeDateStr = data.lastPracticeDate.toISOString().split('T')[0];
    const todayStr = getTodayUTC();
    const yesterdayStr = getYesterdayUTC();

    // If last practice was today or yesterday, streak is valid
    if (lastPracticeDateStr === todayStr || lastPracticeDateStr === yesterdayStr) {
      return data;
    }

    // Streak has broken - reset current streak but keep longest
    console.log('[useStreak] Streak broken - last practice was:', lastPracticeDateStr);
    return {
      ...data,
      currentStreak: 0,
    };
  }, []);

  /**
   * Update streak when a session is completed
   * Call this after a practice session finishes
   */
  const updateStreak = useCallback(async (): Promise<number> => {
    const todayStr = getTodayUTC();
    const todayDate = parseUTCDate(todayStr);

    // Check if already practiced today
    if (lastPracticeDate) {
      const lastPracticeDateStr = lastPracticeDate.toISOString().split('T')[0];
      if (lastPracticeDateStr === todayStr) {
        console.log('[useStreak] Already practiced today, streak unchanged');
        return currentStreak;
      }
    }

    // Calculate new streak
    let newCurrentStreak = 1;
    
    if (lastPracticeDate) {
      const lastPracticeDateStr = lastPracticeDate.toISOString().split('T')[0];
      const yesterdayStr = getYesterdayUTC();
      
      if (lastPracticeDateStr === yesterdayStr) {
        // Practiced yesterday - extend streak
        newCurrentStreak = currentStreak + 1;
      }
      // If last practice was before yesterday, streak resets to 1
    }

    const newLongestStreak = Math.max(longestStreak, newCurrentStreak);

    // Update local state (optimistic update)
    setCurrentStreak(newCurrentStreak);
    setLongestStreak(newLongestStreak);
    setLastPracticeDate(todayDate);

    const newData: StreakData = {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastPracticeDate: todayDate,
    };

    // Persist to storage
    if (user) {
      await saveToSupabase(user.id, newData);
    } else {
      saveToLocalStorage(newData);
    }

    console.log('[useStreak] Streak updated:', {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastPracticeDate: todayStr,
    });

    return newCurrentStreak;
  }, [user, currentStreak, longestStreak, lastPracticeDate, saveToSupabase, saveToLocalStorage]);

  /**
   * Process any queued streak operations (called on load and when online)
   */
  const processQueue = useCallback(async (): Promise<void> => {
    if (!user || !isSupabaseConfigured()) {
      return;
    }

    const synced = await processSyncQueue('streak', user.id, handleQueuedStreakSync);
    if (synced > 0) {
      console.log(`[useStreak] Synced ${synced} queued streak operations`);
    }
  }, [user, handleQueuedStreakSync]);

  // Load streak data on mount or when user changes
  useEffect(() => {
    if (authLoading) {
      return;
    }

    const loadStreak = async () => {
      setIsLoading(true);
      try {
        // First, try to sync any queued operations from previous failures
        if (user) {
          await processQueue();
        }

        let data: StreakData;

        if (user) {
          // Authenticated user - load from Supabase
          data = await loadFromSupabase(user.id);
        } else {
          // Anonymous user - load from localStorage
          data = loadFromLocalStorage();
        }

        // Validate streak (check if it's still active)
        const validatedData = validateStreak(data);

        // If streak was invalidated, persist the reset
        if (validatedData.currentStreak !== data.currentStreak) {
          if (user) {
            await saveToSupabase(user.id, validatedData);
          } else {
            saveToLocalStorage(validatedData);
          }
        }

        setCurrentStreak(validatedData.currentStreak);
        setLongestStreak(validatedData.longestStreak);
        setLastPracticeDate(validatedData.lastPracticeDate);
      } catch (error) {
        console.error('[useStreak] Failed to load streak:', error);
        // Default to zero streak on error
        setCurrentStreak(0);
        setLongestStreak(0);
        setLastPracticeDate(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadStreak();
  }, [user, authLoading, loadFromSupabase, loadFromLocalStorage, validateStreak, saveToSupabase, saveToLocalStorage, processQueue]);

  return {
    currentStreak,
    longestStreak,
    lastPracticeDate,
    isLoading,
    updateStreak,
    processQueue, // Expose for online sync hook
  };
};
