import { useState, useEffect, useCallback } from 'react';
import { UserTier } from '../types';
import { getUserProfile, createUserProfile } from '../services/databaseService';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured, getSupabaseClient } from '../lib/supabase';

// Cache for server-verified premium status
interface PremiumVerification {
  isPremium: boolean;
  tier: string;
  verifiedAt: string;
  expiresAt: number; // timestamp when cache expires
}

const VERIFICATION_CACHE_KEY = 'mi-coach-premium-verification';
const VERIFICATION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached verification if still valid
 */
const getCachedVerification = (): PremiumVerification | null => {
  try {
    const cached = localStorage.getItem(VERIFICATION_CACHE_KEY);
    if (cached) {
      const verification = JSON.parse(cached) as PremiumVerification;
      if (verification.expiresAt > Date.now()) {
        return verification;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
};

/**
 * Cache verification result
 */
const cacheVerification = (verification: Omit<PremiumVerification, 'expiresAt'>): void => {
  try {
    const cached: PremiumVerification = {
      ...verification,
      expiresAt: Date.now() + VERIFICATION_CACHE_TTL,
    };
    localStorage.setItem(VERIFICATION_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore cache errors
  }
};

/**
 * Clear verification cache
 */
const clearVerificationCache = (): void => {
  try {
    localStorage.removeItem(VERIFICATION_CACHE_KEY);
  } catch {
    // Ignore cache errors
  }
};

/**
 * Hook to manage user tier state and updates
 * Handles loading tier from Supabase, localStorage fallback, and tier updates
 * 
 * SECURITY: Premium status is verified server-side via Edge Function
 * Client-side state is used for optimistic UI but never trusted for gating
 */
export const useTierManager = () => {
  const { user, loading: authLoading } = useAuth();
  const [userTier, setUserTier] = useState<UserTier>(UserTier.Free);
  const [isPremiumVerified, setIsPremiumVerified] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  /**
   * Verify premium status via Edge Function (server-side, cannot be spoofed)
   * Falls back to database tier if Edge Function is unavailable
   */
  const verifyPremiumStatus = useCallback(async (forceRefresh = false, databaseTier?: UserTier): Promise<boolean> => {
    if (!user || !isSupabaseConfigured()) {
      setIsPremiumVerified(false);
      return false;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedVerification();
      if (cached) {
        console.log('[useTierManager] Using cached premium verification:', cached.isPremium);
        setIsPremiumVerified(cached.isPremium);
        return cached.isPremium;
      }
    }

    setIsVerifying(true);

    try {
      const supabase = getSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        console.warn('[useTierManager] No access token available for verification');
        // Fallback to database tier if available
        if (databaseTier === UserTier.Premium) {
          console.log('[useTierManager] Falling back to database tier (premium)');
          setIsPremiumVerified(true);
          return true;
        }
        setIsPremiumVerified(false);
        return false;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/verify-premium-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Edge Function unavailable (404, 500, etc.) - fallback to database tier
        console.warn('[useTierManager] Edge Function unavailable (status:', response.status, '), falling back to database tier');
        if (databaseTier === UserTier.Premium) {
          console.log('[useTierManager] Database tier is premium, trusting it as fallback');
          setIsPremiumVerified(true);
          cacheVerification({
            isPremium: true,
            tier: 'premium',
            verifiedAt: new Date().toISOString(),
          });
          return true;
        }
        // User is free tier in database, so they're definitely not premium
        setIsPremiumVerified(false);
        return false;
      }

      const data = await response.json();
      const isPremium = data.isPremium === true;

      console.log('[useTierManager] Server verified premium status:', isPremium);

      // Cache the verification
      cacheVerification({
        isPremium,
        tier: data.tier || 'free',
        verifiedAt: data.verifiedAt || new Date().toISOString(),
      });

      setIsPremiumVerified(isPremium);
      
      // Also update the tier state to match server
      if (isPremium) {
        setUserTier(UserTier.Premium);
        localStorage.setItem('mi-coach-tier', UserTier.Premium);
      } else {
        setUserTier(UserTier.Free);
        localStorage.setItem('mi-coach-tier', UserTier.Free);
      }

      return isPremium;
    } catch (error) {
      // Network error, Edge Function not deployed, etc. - fallback to database tier
      console.warn('[useTierManager] Error verifying premium status, falling back to database tier:', error);
      if (databaseTier === UserTier.Premium) {
        console.log('[useTierManager] Database tier is premium, trusting it as fallback');
        setIsPremiumVerified(true);
        cacheVerification({
          isPremium: true,
          tier: 'premium',
          verifiedAt: new Date().toISOString(),
        });
        return true;
      }
      // User is free tier in database, so they're definitely not premium
      setIsPremiumVerified(false);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [user]);

  // Load user tier from localStorage when the app starts (optimistic UI only)
  useEffect(() => {
    // For anonymous users, always use Free tier
    // For authenticated users, load from localStorage as fallback (will be overridden by server)
    if (!user) {
      setUserTier(UserTier.Free);
      setIsPremiumVerified(false);
      clearVerificationCache();
    } else {
      // Authenticated user - load saved tier from localStorage (fallback, will be overridden by server)
      const savedTier = localStorage.getItem('mi-coach-tier') as UserTier;
      if (savedTier && Object.values(UserTier).includes(savedTier)) {
        setUserTier(savedTier);
      }
    }
  }, [user]);

  // Load user tier from Supabase and verify server-side after authentication
  useEffect(() => {
    if (!user || authLoading) {
      return;
    }

    const loadAndVerifyTier = async () => {
      let databaseTier: UserTier = UserTier.Free;
      
      try {
        console.log('[useTierManager] Loading tier from Supabase for user:', user.id);
        const profile = await getUserProfile(user.id);
        
        if (profile && profile.tier) {
          console.log('[useTierManager] Loaded tier from Supabase:', profile.tier);
          databaseTier = profile.tier as UserTier;
          setUserTier(databaseTier);
          localStorage.setItem('mi-coach-tier', profile.tier);
        } else {
          console.log('[useTierManager] No profile found. Creating new profile with Free tier.');
          // Create a new profile for the user
          const newProfile = await createUserProfile(user.id, UserTier.Free);
          if (newProfile && newProfile.tier) {
            databaseTier = newProfile.tier as UserTier;
            setUserTier(databaseTier);
            localStorage.setItem('mi-coach-tier', newProfile.tier);
          } else {
            // Fallback to Free tier if creation fails
            setUserTier(UserTier.Free);
            localStorage.setItem('mi-coach-tier', UserTier.Free);
          }
        }

        // After loading from Supabase, verify server-side for premium users
        // Pass the database tier so we can fallback if Edge Function is unavailable
        await verifyPremiumStatus(false, databaseTier);
      } catch (error) {
        console.error('[useTierManager] Failed to load tier from Supabase:', error);
        // Fallback to localStorage or Free
        const savedTier = localStorage.getItem('mi-coach-tier') as UserTier;
        if (savedTier && Object.values(UserTier).includes(savedTier)) {
          setUserTier(savedTier);
          databaseTier = savedTier;
        } else {
          setUserTier(UserTier.Free);
          localStorage.setItem('mi-coach-tier', UserTier.Free);
        }
        // Try to verify with the fallback tier
        await verifyPremiumStatus(false, databaseTier);
      }
    };

    loadAndVerifyTier();
  }, [user, authLoading, verifyPremiumStatus]);

  /**
   * Update tier and sync to localStorage
   */
  const updateTier = useCallback((newTier: UserTier) => {
    setUserTier(newTier);
    localStorage.setItem('mi-coach-tier', newTier);
    // Clear verification cache when tier changes - will re-verify on next check
    clearVerificationCache();
    setIsPremiumVerified(false);
  }, []);

  /**
   * Refresh tier from Supabase and re-verify
   */
  const refreshTier = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const profile = await getUserProfile(user.id);
      if (profile && profile.tier) {
        const databaseTier = profile.tier as UserTier;
        updateTier(databaseTier);
        // Re-verify server-side, passing database tier as fallback
        await verifyPremiumStatus(true, databaseTier);
        return databaseTier;
      }
    } catch (error) {
      console.error('[useTierManager] Failed to refresh tier:', error);
    }
    return null;
  }, [user, updateTier, verifyPremiumStatus]);

  return {
    userTier,
    setUserTier: updateTier,
    refreshTier,
    // New exports for server-side verification
    isPremiumVerified,
    isVerifying,
    verifyPremiumStatus,
  };
};

