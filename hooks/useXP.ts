import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { XP_LEVELS } from '../constants';

interface LevelInfo {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
}

interface UseXPReturn {
  currentXP: number;
  currentLevel: number;
  levelName: string;
  xpToNextLevel: number;
  xpProgress: number; // 0-100 percentage within current level
  addXP: (amount: number, reason: string) => Promise<void>;
  isLoading: boolean;
}

// Storage key for anonymous/fallback XP data
const XP_STORAGE_KEY = 'mi-coach-xp';

/**
 * Get level info from XP amount
 */
const getLevelFromXP = (xp: number): LevelInfo => {
  // Find the highest level the user qualifies for
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].minXP) {
      return { ...XP_LEVELS[i] };
    }
  }
  // Fallback to level 1
  return { ...XP_LEVELS[0] };
};

/**
 * Calculate XP needed to reach next level
 */
const getXPToNextLevel = (xp: number): number => {
  const currentLevel = getLevelFromXP(xp);
  
  // If at max level, return 0
  if (currentLevel.level === XP_LEVELS.length) {
    return 0;
  }
  
  // Find next level threshold
  const nextLevelIndex = XP_LEVELS.findIndex(l => l.level === currentLevel.level + 1);
  if (nextLevelIndex === -1) {
    return 0;
  }
  
  return XP_LEVELS[nextLevelIndex].minXP - xp;
};

/**
 * Calculate progress percentage within current level (0-100)
 */
const getXPProgress = (xp: number): number => {
  const currentLevel = getLevelFromXP(xp);
  
  // If at max level, return 100
  if (currentLevel.level === XP_LEVELS.length) {
    return 100;
  }
  
  const nextLevelIndex = XP_LEVELS.findIndex(l => l.level === currentLevel.level + 1);
  if (nextLevelIndex === -1) {
    return 100;
  }
  
  const levelRange = XP_LEVELS[nextLevelIndex].minXP - currentLevel.minXP;
  const xpIntoLevel = xp - currentLevel.minXP;
  
  return Math.round((xpIntoLevel / levelRange) * 100);
};

/**
 * Hook to manage user XP and levels
 * Tracks experience points and calculates level from XP thresholds
 */
export const useXP = (): UseXPReturn => {
  const { user, loading: authLoading } = useAuth();
  const [currentXP, setCurrentXP] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Load XP from localStorage (fallback/anonymous)
   */
  const loadFromLocalStorage = useCallback((): number => {
    try {
      const stored = localStorage.getItem(XP_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.currentXP ?? 0;
      }
    } catch (error) {
      console.error('[useXP] Failed to parse XP from localStorage:', error);
    }
    return 0;
  }, []);

  /**
   * Save XP to localStorage
   */
  const saveToLocalStorage = useCallback((xp: number): void => {
    try {
      localStorage.setItem(XP_STORAGE_KEY, JSON.stringify({ currentXP: xp }));
    } catch (error) {
      console.error('[useXP] Failed to save XP to localStorage:', error);
    }
  }, []);

  /**
   * Load XP from Supabase
   */
  const loadFromSupabase = useCallback(async (userId: string): Promise<number> => {
    if (!isSupabaseConfigured()) {
      console.warn('[useXP] Supabase not configured, using localStorage');
      return loadFromLocalStorage();
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('current_xp')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Column might not exist yet
        if (error.code === 'PGRST116' || error.message.includes('column')) {
          console.log('[useXP] XP column not found, using defaults');
          return 0;
        }
        console.error('[useXP] Failed to load XP from Supabase:', error);
        return loadFromLocalStorage();
      }

      return data?.current_xp ?? 0;
    } catch (error) {
      console.error('[useXP] Error loading XP from Supabase:', error);
      return loadFromLocalStorage();
    }
  }, [loadFromLocalStorage]);

  /**
   * Save XP to Supabase
   */
  const saveToSupabase = useCallback(async (userId: string, xp: number): Promise<void> => {
    if (!isSupabaseConfigured()) {
      console.warn('[useXP] Supabase not configured, saving to localStorage only');
      saveToLocalStorage(xp);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          current_xp: xp,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[useXP] Failed to save XP to Supabase:', error);
        saveToLocalStorage(xp);
      } else {
        console.log('[useXP] XP saved to Supabase successfully');
        // Also save to localStorage for offline access
        saveToLocalStorage(xp);
      }
    } catch (error) {
      console.error('[useXP] Error saving XP to Supabase:', error);
      saveToLocalStorage(xp);
    }
  }, [saveToLocalStorage]);

  /**
   * Add XP to the user's total
   */
  const addXP = useCallback(async (amount: number, reason: string): Promise<void> => {
    if (amount <= 0) {
      console.warn('[useXP] Attempted to add non-positive XP:', amount);
      return;
    }

    const newXP = currentXP + amount;
    const oldLevel = getLevelFromXP(currentXP);
    const newLevel = getLevelFromXP(newXP);

    // Optimistic update
    setCurrentXP(newXP);

    // Log XP gain
    console.log('[useXP] XP added:', {
      amount,
      reason,
      oldXP: currentXP,
      newXP,
      leveledUp: newLevel.level > oldLevel.level,
      newLevel: newLevel.name,
    });

    // Persist to storage
    if (user) {
      await saveToSupabase(user.id, newXP);
    } else {
      saveToLocalStorage(newXP);
    }
  }, [user, currentXP, saveToSupabase, saveToLocalStorage]);

  // Load XP on mount or when user changes
  useEffect(() => {
    if (authLoading) {
      return;
    }

    const loadXP = async () => {
      setIsLoading(true);
      try {
        let xp: number;

        if (user) {
          xp = await loadFromSupabase(user.id);
        } else {
          xp = loadFromLocalStorage();
        }

        setCurrentXP(xp);
      } catch (error) {
        console.error('[useXP] Failed to load XP:', error);
        setCurrentXP(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadXP();
  }, [user, authLoading, loadFromSupabase, loadFromLocalStorage]);

  // Calculate derived values
  const levelInfo = getLevelFromXP(currentXP);

  return {
    currentXP,
    currentLevel: levelInfo.level,
    levelName: levelInfo.name,
    xpToNextLevel: getXPToNextLevel(currentXP),
    xpProgress: getXPProgress(currentXP),
    addXP,
    isLoading,
  };
};
