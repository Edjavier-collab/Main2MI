import { getSessionCount, getUserSessions } from './databaseService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { UserTier, Session } from '@/types';

// Free tier limit: 3 sessions per month
const FREE_TIER_MONTHLY_LIMIT = 3;

// localStorage key for anonymous sessions
const ANONYMOUS_SESSIONS_KEY = 'mi-coach-anonymous-sessions';

/**
 * Get the start of the current month in ISO format
 */
const getCurrentMonthStart = (): Date => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
};

/**
 * Get anonymous sessions from localStorage
 */
const getAnonymousSessions = (): Session[] => {
    try {
        const sessionsJson = localStorage.getItem(ANONYMOUS_SESSIONS_KEY);
        if (!sessionsJson) {
            return [];
        }
        return JSON.parse(sessionsJson) as Session[];
    } catch (error) {
        console.error('[subscriptionService] Error loading anonymous sessions from localStorage:', error);
        return [];
    }
};

/**
 * Get count of anonymous sessions this month
 */
const getAnonymousSessionsThisMonth = (): number => {
    try {
        const sessions = getAnonymousSessions();
        const now = new Date();
        const monthStart = getCurrentMonthStart();
        
        const sessionsThisMonth = sessions.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= monthStart && sessionDate <= now && session.tier === UserTier.Free;
        });
        
        return sessionsThisMonth.length;
    } catch (error) {
        console.error('[subscriptionService] Error counting anonymous sessions this month:', error);
        return 0;
    }
};

/**
 * Check if anonymous user can start a new session
 */
export const canStartSessionAnonymous = (userTier: UserTier): boolean => {
    try {
        console.log('[subscriptionService] Checking if anonymous user can start session:', { userTier });

        // Premium users have unlimited sessions (shouldn't happen for anonymous, but handle it)
        if (userTier === UserTier.Premium) {
            console.log('[subscriptionService] Anonymous premium user - unlimited sessions');
            return true;
        }

        // Free users have a monthly limit
        if (userTier === UserTier.Free) {
            const sessionsThisMonth = getAnonymousSessionsThisMonth();
            const canStart = sessionsThisMonth < FREE_TIER_MONTHLY_LIMIT;
            
            console.log('[subscriptionService] Anonymous free user - sessions this month:', sessionsThisMonth, 'limit:', FREE_TIER_MONTHLY_LIMIT, 'can start:', canStart);
            return canStart;
        }

        // Unknown tier - default to allowing
        console.warn('[subscriptionService] Unknown user tier for anonymous user:', userTier);
        return true;
    } catch (error) {
        console.error('[subscriptionService] Error checking if anonymous user can start session:', error);
        // Fail-open for anonymous users
        return true;
    }
};

/**
 * Get remaining free sessions for anonymous user
 */
export const getRemainingFreeSessionsAnonymous = (): number => {
    try {
        console.log('[subscriptionService] Getting remaining free sessions for anonymous user');
        
        const sessionsThisMonth = getAnonymousSessionsThisMonth();
        const remaining = Math.max(0, FREE_TIER_MONTHLY_LIMIT - sessionsThisMonth);
        
        console.log('[subscriptionService] Anonymous remaining free sessions:', remaining);
        return remaining;
    } catch (error) {
        console.error('[subscriptionService] Error getting remaining free sessions for anonymous user:', error);
        // On error, return 0 to be conservative
        return 0;
    }
};

/**
 * Check if user can start a new session based on their tier and current month's usage
 * Supports both authenticated (with userId) and anonymous (without userId) users
 */
export const canStartSession = async (userId: string | null, userTier: UserTier): Promise<boolean> => {
    // If no userId, treat as anonymous user
    if (!userId) {
        return canStartSessionAnonymous(userTier);
    }

    try {
        console.log('[subscriptionService] Checking if user can start session:', { userId, userTier });

        // Premium users have unlimited sessions
        if (userTier === UserTier.Premium) {
            console.log('[subscriptionService] Premium user - unlimited sessions');
            return true;
        }

        // Free users have a monthly limit
        if (userTier === UserTier.Free) {
            const sessionsThisMonth = await getSessionsThisMonth(userId);
            const canStart = sessionsThisMonth < FREE_TIER_MONTHLY_LIMIT;
            
            console.log('[subscriptionService] Free user - sessions this month:', sessionsThisMonth, 'limit:', FREE_TIER_MONTHLY_LIMIT, 'can start:', canStart);
            return canStart;
        }

        // Unknown tier - default to allowing (or could throw error)
        console.warn('[subscriptionService] Unknown user tier:', userTier);
        return true;
    } catch (error) {
        console.error('[subscriptionService] Error checking if user can start session:', error);
        // If Supabase is configured, fail-closed (deny session) on errors to prevent abuse
        // If Supabase is not configured, fail-open to allow mock/offline testing
        const shouldFailClosed = isSupabaseConfigured();
        console.warn('[subscriptionService] Using', shouldFailClosed ? 'fail-closed' : 'fail-open', 'strategy');
        return !shouldFailClosed;
    }
};

/**
 * Get count of free sessions used this month
 */
export const getSessionsThisMonth = async (userId: string): Promise<number> => {
    try {
        console.log('[subscriptionService] Getting sessions this month for user:', userId);
        
        const monthStart = getCurrentMonthStart();
        const count = await getSessionCount(userId, monthStart);
        
        console.log('[subscriptionService] Sessions this month:', count);
        return count;
    } catch (error) {
        console.error('[subscriptionService] Error getting sessions this month:', error);
        // Fallback: try to get count from all sessions
        try {
            const allSessions = await getUserSessions(userId);
            const now = new Date();
            const monthStart = getCurrentMonthStart();
            const sessionsThisMonth = allSessions.filter(session => {
                const sessionDate = new Date(session.date);
                return sessionDate >= monthStart && sessionDate <= now;
            });
            return sessionsThisMonth.length;
        } catch (fallbackError) {
            console.error('[subscriptionService] Fallback also failed:', fallbackError);
            return 0;
        }
    }
};

/**
 * Get remaining free sessions for the current month
 * Supports both authenticated (with userId) and anonymous (without userId) users
 */
export const getRemainingFreeSessions = async (userId: string | null): Promise<number> => {
    // If no userId, treat as anonymous user
    if (!userId) {
        return getRemainingFreeSessionsAnonymous();
    }

    try {
        console.log('[subscriptionService] Getting remaining free sessions for user:', userId);
        
        const sessionsThisMonth = await getSessionsThisMonth(userId);
        const remaining = Math.max(0, FREE_TIER_MONTHLY_LIMIT - sessionsThisMonth);
        
        console.log('[subscriptionService] Remaining free sessions:', remaining);
        return remaining;
    } catch (error) {
        console.error('[subscriptionService] Error getting remaining free sessions:', error);
        // On error, return 0 to be conservative
        return 0;
    }
};

