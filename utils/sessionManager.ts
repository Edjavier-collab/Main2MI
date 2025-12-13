/**
 * Session Management Utility
 * 
 * Handles token refresh, session expiry detection, and auto-save functionality
 * to prevent data loss during long practice sessions.
 */

import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export interface SessionData {
  transcript: Array<{ author: string; text: string }>;
  patient: any;
  timestamp: number;
}

const AUTO_SAVE_KEY_PREFIX = 'mi-practice-auto-save-';
const AUTO_SAVE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get a valid auth token, refreshing if necessary
 * Returns null if session is expired and cannot be refreshed
 */
export async function getValidAuthToken(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = getSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return null;
    }

    if (!session.access_token) {
      return null;
    }

    // Check if token is expired or will expire soon (within 5 minutes)
    try {
      const tokenParts = session.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = payload.exp || 0;
        const timeUntilExpiry = expiresAt - now;

        // If expired or expires within 5 minutes, refresh
        if (timeUntilExpiry < 300) {
          console.log('[sessionManager] Token expires soon, refreshing...');
          
          if (session.refresh_token) {
            const { data: { session: refreshedSession }, error: refreshError } = 
              await supabase.auth.refreshSession(session);
            
            if (refreshError || !refreshedSession?.access_token) {
              console.error('[sessionManager] Failed to refresh session:', refreshError);
              return null;
            }
            
            console.log('[sessionManager] Session refreshed successfully');
            return refreshedSession.access_token;
          } else {
            console.warn('[sessionManager] No refresh token available');
            return null;
          }
        }
      }
    } catch (parseError) {
      // If we can't parse the token, use it as-is (server will validate)
      console.warn('[sessionManager] Could not parse token, using as-is');
    }

    return session.access_token;
  } catch (error) {
    console.error('[sessionManager] Error getting auth token:', error);
    return null;
  }
}

/**
 * Check if current session is valid
 */
export async function isSessionValid(): Promise<boolean> {
  const token = await getValidAuthToken();
  return token !== null;
}

/**
 * Auto-save practice session data to localStorage
 */
export function autoSaveSession(sessionData: SessionData): void {
  try {
    const key = `${AUTO_SAVE_KEY_PREFIX}${Date.now()}`;
    const data = {
      ...sessionData,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
    
    // Clean up old auto-saves (older than expiry)
    cleanupOldAutoSaves();
    
    console.log('[sessionManager] Auto-saved session data');
  } catch (error) {
    console.error('[sessionManager] Failed to auto-save:', error);
  }
}

/**
 * Get the most recent auto-saved session
 */
export function getAutoSavedSession(): SessionData | null {
  try {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(AUTO_SAVE_KEY_PREFIX)
    );
    
    if (keys.length === 0) {
      return null;
    }

    // Get the most recent auto-save
    const sortedKeys = keys.sort((a, b) => {
      const timestampA = parseInt(a.replace(AUTO_SAVE_KEY_PREFIX, ''));
      const timestampB = parseInt(b.replace(AUTO_SAVE_KEY_PREFIX, ''));
      return timestampB - timestampA;
    });

    const mostRecentKey = sortedKeys[0];
    const data = localStorage.getItem(mostRecentKey);
    
    if (!data) {
      return null;
    }

    const sessionData = JSON.parse(data) as SessionData & { timestamp: number };
    
    // Check if auto-save is still valid (not expired)
    const age = Date.now() - sessionData.timestamp;
    if (age > AUTO_SAVE_EXPIRY_MS) {
      localStorage.removeItem(mostRecentKey);
      return null;
    }

    return {
      transcript: sessionData.transcript,
      patient: sessionData.patient,
      timestamp: sessionData.timestamp,
    };
  } catch (error) {
    console.error('[sessionManager] Failed to get auto-saved session:', error);
    return null;
  }
}

/**
 * Clear all auto-saved sessions
 */
export function clearAutoSavedSessions(): void {
  try {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(AUTO_SAVE_KEY_PREFIX)
    );
    keys.forEach(key => localStorage.removeItem(key));
    console.log('[sessionManager] Cleared all auto-saved sessions');
  } catch (error) {
    console.error('[sessionManager] Failed to clear auto-saves:', error);
  }
}

/**
 * Clean up old auto-saves (older than expiry)
 */
function cleanupOldAutoSaves(): void {
  try {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(AUTO_SAVE_KEY_PREFIX)
    );
    
    const now = Date.now();
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const sessionData = JSON.parse(data) as { timestamp: number };
          const age = now - sessionData.timestamp;
          if (age > AUTO_SAVE_EXPIRY_MS) {
            localStorage.removeItem(key);
          }
        } catch {
          // Invalid data, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('[sessionManager] Failed to cleanup old auto-saves:', error);
  }
}
