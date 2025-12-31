'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
import { XP_LEVELS, PROFICIENCY_TIERS } from '../constants';
import {
  queueOperation,
  processSyncQueue,
  XPSyncData,
  QueuedOperation,
} from '../utils/syncQueue';

interface LevelInfo {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
}

// Professional Growth System types (Dreyfus Model)
interface ProficiencyTierInfo {
  tier: number;
  name: string;
  minHours: number;
  maxHours: number;
  description: string;
}

interface UseXPReturn {
  currentXP: number;
  currentLevel: number;
  levelName: string;
  xpToNextLevel: number;
  xpProgress: number; // 0-100 percentage within current level
  addXP: (amount: number, reason: string) => Promise<void>;
  isLoading: boolean;
  processQueue: () => Promise<void>; // Process queued operations (for online sync)
  // Professional Growth System aliases
  clinicalHours: number;  // currentXP converted to hours (XP / 10)
  currentTier: number;    // Same as currentLevel
  tierName: string;       // Same as levelName
  tierDescription: string;
  hoursToNextTier: number;
  tierProgress: number;   // Same as xpProgress
  addClinicalHours: (hours: number, reason: string) => Promise<void>;
}

// Storage key for anonymous/fallback XP data
const XP_STORAGE_KEY = 'mi-coach-xp';

// Conversion constant: 10 XP = 1 Clinical Hour
const XP_TO_HOURS_RATIO = 10;

/**
 * Get proficiency tier info from clinical hours
 */
const getTierFromHours = (hours: number): ProficiencyTierInfo => {
  for (let i = PROFICIENCY_TIERS.length - 1; i >= 0; i--) {
    if (hours >= PROFICIENCY_TIERS[i].minHours) {
      return { ...PROFICIENCY_TIERS[i] };
    }
  }
  return { ...PROFICIENCY_TIERS[0] };
};

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
      const supabase = createClient();
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
   * On failure, queues the XP delta for retry when connectivity is restored
   */
  const saveToSupabase = useCallback(async (userId: string, xp: number, xpDelta: number, reason: string): Promise<boolean> => {
    // Always save to localStorage first for offline access
    saveToLocalStorage(xp);

    if (!isSupabaseConfigured()) {
      console.warn('[useXP] Supabase not configured, queuing for later sync');
      queueOperation('xp', userId, {
        xpDelta,
        reason,
        timestamp: new Date().toISOString(),
      });
      return false;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          current_xp: xp,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[useXP] Failed to save XP to Supabase:', error);
        // Queue the delta for retry
        queueOperation('xp', userId, {
          xpDelta,
          reason,
          timestamp: new Date().toISOString(),
        });
        return false;
      }
      
      console.log('[useXP] XP saved to Supabase successfully');
      return true;
    } catch (error) {
      console.error('[useXP] Error saving XP to Supabase:', error);
      // Queue the delta for retry
      queueOperation('xp', userId, {
        xpDelta,
        reason,
        timestamp: new Date().toISOString(),
      });
      return false;
    }
  }, [saveToLocalStorage]);

  /**
   * Handler for processing queued XP operations
   * Applies the XP delta to the current server value
   */
  const handleQueuedXPSync = useCallback(async (operation: QueuedOperation): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      return false;
    }

    const xpData = operation.data as XPSyncData;

    try {
      const supabase = createClient();
      
      // First, get current XP from Supabase
      const { data: profile, error: readError } = await supabase
        .from('profiles')
        .select('current_xp')
        .eq('user_id', operation.userId)
        .single();

      if (readError) {
        console.error('[useXP] Failed to read current XP for sync:', readError);
        return false;
      }

      const currentServerXP = profile?.current_xp ?? 0;
      const newXP = currentServerXP + xpData.xpDelta;

      // Apply the delta
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          current_xp: newXP,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', operation.userId);

      if (updateError) {
        console.error('[useXP] Failed to sync queued XP:', updateError);
        return false;
      }

      console.log(`[useXP] Successfully synced queued XP: +${xpData.xpDelta} (${xpData.reason})`);
      return true;
    } catch (error) {
      console.error('[useXP] Error syncing queued XP:', error);
      return false;
    }
  }, []);

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

    // Persist to storage (pass the delta for queue if it fails)
    if (user) {
      await saveToSupabase(user.id, newXP, amount, reason);
    } else {
      saveToLocalStorage(newXP);
    }
  }, [user, currentXP, saveToSupabase, saveToLocalStorage]);

  /**
   * Process any queued XP operations (called on load and when online)
   */
  const processQueue = useCallback(async (): Promise<void> => {
    if (!user || !isSupabaseConfigured()) {
      return;
    }

    const synced = await processSyncQueue('xp', user.id, handleQueuedXPSync);
    if (synced > 0) {
      console.log(`[useXP] Synced ${synced} queued XP operations`);
      // Reload XP from Supabase to get the updated value
      const updatedXP = await loadFromSupabase(user.id);
      setCurrentXP(updatedXP);
    }
  }, [user, handleQueuedXPSync, loadFromSupabase]);

  // Load XP on mount or when user changes
  useEffect(() => {
    if (authLoading) {
      return;
    }

    const loadXP = async () => {
      setIsLoading(true);
      try {
        // First, try to sync any queued operations from previous failures
        if (user) {
          await processQueue();
        }

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
  }, [user, authLoading, loadFromSupabase, loadFromLocalStorage, processQueue]);

  // Calculate derived values (legacy XP system)
  const levelInfo = getLevelFromXP(currentXP);

  // Professional Growth System values
  const clinicalHours = currentXP / XP_TO_HOURS_RATIO;
  const tierInfo = getTierFromHours(clinicalHours);

  // Calculate hours to next tier
  const getHoursToNextTier = (): number => {
    if (tierInfo.tier === PROFICIENCY_TIERS.length) {
      return 0; // Already at max tier
    }
    const nextTierIndex = PROFICIENCY_TIERS.findIndex(t => t.tier === tierInfo.tier + 1);
    if (nextTierIndex === -1) return 0;
    return PROFICIENCY_TIERS[nextTierIndex].minHours - clinicalHours;
  };

  // Calculate tier progress percentage
  const getTierProgress = (): number => {
    if (tierInfo.tier === PROFICIENCY_TIERS.length) {
      return 100; // Max tier
    }
    const nextTierIndex = PROFICIENCY_TIERS.findIndex(t => t.tier === tierInfo.tier + 1);
    if (nextTierIndex === -1) return 100;

    const tierRange = PROFICIENCY_TIERS[nextTierIndex].minHours - tierInfo.minHours;
    const hoursIntoTier = clinicalHours - tierInfo.minHours;
    return Math.round((hoursIntoTier / tierRange) * 100);
  };

  // Add clinical hours (converts to XP internally)
  const addClinicalHours = async (hours: number, reason: string): Promise<void> => {
    const xpAmount = hours * XP_TO_HOURS_RATIO;
    await addXP(xpAmount, reason);
  };

  return {
    // Legacy XP system (for backward compatibility)
    currentXP,
    currentLevel: levelInfo.level,
    levelName: levelInfo.name,
    xpToNextLevel: getXPToNextLevel(currentXP),
    xpProgress: getXPProgress(currentXP),
    addXP,
    isLoading,
    processQueue,
    // Professional Growth System aliases
    clinicalHours,
    currentTier: tierInfo.tier,
    tierName: tierInfo.name,
    tierDescription: tierInfo.description,
    hoursToNextTier: getHoursToNextTier(),
    tierProgress: getTierProgress(),
    addClinicalHours,
  };
};
