import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { BADGES, BadgeDefinition, getBadgeById } from '../constants';

interface UnlockedBadge extends BadgeDefinition {
  unlockedAt: Date;
  seen: boolean;
}

interface BadgeCheckContext {
  streak: number;
  totalSessions: number;
}

interface UseBadgesReturn {
  unlockedBadges: UnlockedBadge[];
  newlyUnlockedBadges: UnlockedBadge[];
  checkAndUnlockBadges: (context: BadgeCheckContext) => Promise<BadgeDefinition[]>;
  markBadgeAsSeen: (badgeId: string) => Promise<void>;
  markAllBadgesAsSeen: () => Promise<void>;
  isLoading: boolean;
}

// Storage key for anonymous/fallback badge data
const BADGES_STORAGE_KEY = 'mi-coach-badges';

interface StoredBadge {
  badgeId: string;
  unlockedAt: string;
  seen: boolean;
}

/**
 * Hook to manage user badges
 * Tracks badge unlocks and provides methods to check/unlock badges
 */
export const useBadges = (): UseBadgesReturn => {
  const { user, loading: authLoading } = useAuth();
  const [unlockedBadges, setUnlockedBadges] = useState<UnlockedBadge[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Convert stored badge data to UnlockedBadge
   */
  const toUnlockedBadge = (badgeId: string, unlockedAt: Date, seen: boolean): UnlockedBadge | null => {
    const badge = getBadgeById(badgeId);
    if (!badge) return null;
    return {
      ...badge,
      unlockedAt,
      seen,
    };
  };

  /**
   * Load badges from localStorage (fallback/anonymous)
   */
  const loadFromLocalStorage = useCallback((): UnlockedBadge[] => {
    try {
      const stored = localStorage.getItem(BADGES_STORAGE_KEY);
      if (stored) {
        const parsed: StoredBadge[] = JSON.parse(stored);
        return parsed
          .map(b => toUnlockedBadge(b.badgeId, new Date(b.unlockedAt), b.seen))
          .filter((b): b is UnlockedBadge => b !== null);
      }
    } catch (error) {
      console.error('[useBadges] Failed to parse badges from localStorage:', error);
    }
    return [];
  }, []);

  /**
   * Save badges to localStorage
   */
  const saveToLocalStorage = useCallback((badges: UnlockedBadge[]): void => {
    try {
      const toStore: StoredBadge[] = badges.map(b => ({
        badgeId: b.id,
        unlockedAt: b.unlockedAt.toISOString(),
        seen: b.seen,
      }));
      localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('[useBadges] Failed to save badges to localStorage:', error);
    }
  }, []);

  /**
   * Load badges from Supabase
   */
  const loadFromSupabase = useCallback(async (userId: string): Promise<UnlockedBadge[]> => {
    if (!isSupabaseConfigured()) {
      console.warn('[useBadges] Supabase not configured, using localStorage');
      return loadFromLocalStorage();
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_id, unlocked_at, seen')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) {
        // Table might not exist yet
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.log('[useBadges] user_badges table not found, using defaults');
          return [];
        }
        console.error('[useBadges] Failed to load badges from Supabase:', error);
        return loadFromLocalStorage();
      }

      if (!data) return [];

      return data
        .map(row => toUnlockedBadge(row.badge_id, new Date(row.unlocked_at), row.seen))
        .filter((b): b is UnlockedBadge => b !== null);
    } catch (error) {
      console.error('[useBadges] Error loading badges from Supabase:', error);
      return loadFromLocalStorage();
    }
  }, [loadFromLocalStorage]);

  /**
   * Save a single badge to Supabase
   */
  const saveBadgeToSupabase = useCallback(async (userId: string, badgeId: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badgeId,
          unlocked_at: new Date().toISOString(),
          seen: false,
        });

      if (error) {
        // Ignore duplicate key errors (badge already unlocked)
        if (error.code === '23505') {
          console.log('[useBadges] Badge already unlocked:', badgeId);
          return false;
        }
        console.error('[useBadges] Failed to save badge to Supabase:', error);
        return false;
      }

      console.log('[useBadges] Badge saved to Supabase:', badgeId);
      return true;
    } catch (error) {
      console.error('[useBadges] Error saving badge to Supabase:', error);
      return false;
    }
  }, []);

  /**
   * Check conditions and unlock any new badges
   */
  const checkAndUnlockBadges = useCallback(async (context: BadgeCheckContext): Promise<BadgeDefinition[]> => {
    const { streak, totalSessions } = context;
    const unlockedIds = new Set(unlockedBadges.map(b => b.id));
    const newlyUnlocked: BadgeDefinition[] = [];

    // Check streak badges
    const streakBadges = BADGES.filter(b => b.category === 'streak');
    for (const badge of streakBadges) {
      if (!unlockedIds.has(badge.id) && streak >= badge.requirement) {
        newlyUnlocked.push(badge);
      }
    }

    // Check milestone badges
    const milestoneBadges = BADGES.filter(b => b.category === 'milestone');
    for (const badge of milestoneBadges) {
      if (!unlockedIds.has(badge.id) && totalSessions >= badge.requirement) {
        newlyUnlocked.push(badge);
      }
    }

    if (newlyUnlocked.length === 0) {
      return [];
    }

    // Unlock the new badges
    const now = new Date();
    const newUnlockedBadges: UnlockedBadge[] = newlyUnlocked.map(badge => ({
      ...badge,
      unlockedAt: now,
      seen: false,
    }));

    // Update state optimistically
    const updatedBadges = [...unlockedBadges, ...newUnlockedBadges];
    setUnlockedBadges(updatedBadges);

    // Persist to storage
    if (user) {
      for (const badge of newlyUnlocked) {
        await saveBadgeToSupabase(user.id, badge.id);
      }
    }
    // Always save to localStorage (for offline access or anonymous users)
    saveToLocalStorage(updatedBadges);

    console.log('[useBadges] Newly unlocked badges:', newlyUnlocked.map(b => b.name));
    return newlyUnlocked;
  }, [user, unlockedBadges, saveBadgeToSupabase, saveToLocalStorage]);

  /**
   * Mark a badge as seen
   */
  const markBadgeAsSeen = useCallback(async (badgeId: string): Promise<void> => {
    // Update local state
    const updatedBadges = unlockedBadges.map(b =>
      b.id === badgeId ? { ...b, seen: true } : b
    );
    setUnlockedBadges(updatedBadges);
    saveToLocalStorage(updatedBadges);

    // Update in Supabase
    if (user && isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        await supabase
          .from('user_badges')
          .update({ seen: true })
          .eq('user_id', user.id)
          .eq('badge_id', badgeId);
      } catch (error) {
        console.error('[useBadges] Failed to mark badge as seen:', error);
      }
    }
  }, [user, unlockedBadges, saveToLocalStorage]);

  /**
   * Mark all badges as seen
   */
  const markAllBadgesAsSeen = useCallback(async (): Promise<void> => {
    // Update local state
    const updatedBadges = unlockedBadges.map(b => ({ ...b, seen: true }));
    setUnlockedBadges(updatedBadges);
    saveToLocalStorage(updatedBadges);

    // Update in Supabase
    if (user && isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        await supabase
          .from('user_badges')
          .update({ seen: true })
          .eq('user_id', user.id)
          .eq('seen', false);
      } catch (error) {
        console.error('[useBadges] Failed to mark all badges as seen:', error);
      }
    }
  }, [user, unlockedBadges, saveToLocalStorage]);

  // Load badges on mount or when user changes
  useEffect(() => {
    if (authLoading) {
      return;
    }

    const loadBadges = async () => {
      setIsLoading(true);
      try {
        let badges: UnlockedBadge[];

        if (user) {
          badges = await loadFromSupabase(user.id);
        } else {
          badges = loadFromLocalStorage();
        }

        setUnlockedBadges(badges);
      } catch (error) {
        console.error('[useBadges] Failed to load badges:', error);
        setUnlockedBadges([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBadges();
  }, [user, authLoading, loadFromSupabase, loadFromLocalStorage]);

  // Compute newly unlocked (unseen) badges
  const newlyUnlockedBadges = unlockedBadges.filter(b => !b.seen);

  return {
    unlockedBadges,
    newlyUnlockedBadges,
    checkAndUnlockBadges,
    markBadgeAsSeen,
    markAllBadgesAsSeen,
    isLoading,
  };
};
