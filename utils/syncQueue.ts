/**
 * Auth Token Persistence for Service Worker
 *
 * Persists auth tokens and Supabase config to IndexedDB
 * so the Service Worker can make authenticated requests.
 */

import { get, set, del } from 'idb-keyval';

const AUTH_TOKEN_KEY = 'mi-coach-auth-token';
const SUPABASE_CONFIG_KEY = 'mi-coach-supabase-config';

export interface PersistedAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const persistAuthToken = async (token: PersistedAuthToken): Promise<void> => {
  try {
    await set(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('[syncQueue] Failed to persist auth token:', error);
  }
};

export const clearPersistedAuthToken = async (): Promise<void> => {
  try {
    await del(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('[syncQueue] Failed to clear auth token:', error);
  }
};

export const clearQueueForUser = async (_userId: string): Promise<void> => {
  // No-op: gamification queue removed
};

export const persistSupabaseConfig = async (config: SupabaseConfig): Promise<void> => {
  try {
    await set(SUPABASE_CONFIG_KEY, config);
  } catch (error) {
    console.error('[syncQueue] Failed to persist Supabase config:', error);
  }
};

export const getPersistedSupabaseConfig = async (): Promise<SupabaseConfig | null> => {
  try {
    const config = await get<SupabaseConfig>(SUPABASE_CONFIG_KEY);
    return config || null;
  } catch {
    return null;
  }
};

export const getPersistedAuthToken = async (): Promise<PersistedAuthToken | null> => {
  try {
    const token = await get<PersistedAuthToken>(AUTH_TOKEN_KEY);
    return token || null;
  } catch {
    return null;
  }
};
