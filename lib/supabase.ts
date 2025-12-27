import { createBrowserClient, createServerClient } from '@supabase/ssr';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Get Supabase URL from environment variables
const getSupabaseUrl = (): string => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    const errorMessage = 'NEXT_PUBLIC_SUPABASE_URL is required but not found. Please set it in your .env.local file.\n\n' +
      'Setup instructions:\n' +
      '1. Create a .env.local file in the project root directory\n' +
      '2. Add this line:\n' +
      '   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url\n' +
      '3. Get your project URL from: https://app.supabase.com/project/_/settings/api\n' +
      '4. Restart your development server';
    
    if (isDevelopment) {
      console.warn('⚠️ [supabase] Supabase URL Missing:', errorMessage);
    }
    console.error('[supabase] Supabase URL check failed');
    throw new Error(errorMessage);
  }
  
  // Validate URL format
  const trimmedUrl = supabaseUrl.trim();
  if (!trimmedUrl || trimmedUrl.length === 0) {
    const errorMessage = 'NEXT_PUBLIC_SUPABASE_URL is set but appears to be empty. Please check your .env.local file.';
    if (isDevelopment) {
      console.warn('⚠️ [supabase] Invalid Supabase URL:', errorMessage);
    }
    throw new Error(errorMessage);
  }
  
  // Log status in development
  if (isDevelopment) {
    console.log('[supabase] Supabase URL found:', trimmedUrl);
  }
  
  return trimmedUrl;
};

// Get Supabase anonymous key from environment variables
const getSupabaseAnonKey = (): string => {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!anonKey) {
    const errorMessage = 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required but not found. Please set it in your .env.local file.\n\n' +
      'Setup instructions:\n' +
      '1. Create a .env.local file in the project root directory\n' +
      '2. Add this line:\n' +
      '   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key\n' +
      '3. Get your anon key from: https://app.supabase.com/project/_/settings/api\n' +
      '4. Restart your development server';
    
    if (isDevelopment) {
      console.warn('⚠️ [supabase] Supabase Anon Key Missing:', errorMessage);
    }
    console.error('[supabase] Supabase anon key check failed');
    throw new Error(errorMessage);
  }
  
  // Validate key format
  const trimmedKey = anonKey.trim();
  if (!trimmedKey || trimmedKey.length === 0) {
    const errorMessage = 'NEXT_PUBLIC_SUPABASE_ANON_KEY is set but appears to be empty. Please check your .env.local file.';
    if (isDevelopment) {
      console.warn('⚠️ [supabase] Invalid Supabase Anon Key:', errorMessage);
    }
    throw new Error(errorMessage);
  }
  
  // Log status in development (only show prefix, never expose full key)
  if (isDevelopment) {
    console.log('[supabase] Supabase anon key found:', {
      hasKey: true,
      keyLength: trimmedKey.length,
      keyPrefix: `${trimmedKey.substring(0, 20)}...`
    });
  }
  
  return trimmedKey;
};

// Check if Supabase is configured (lazy check)
export const isSupabaseConfigured = (): boolean => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const hasUrl = !!(supabaseUrl && supabaseUrl.trim());
  const hasKey = !!(supabaseAnonKey && supabaseAnonKey.trim());
  
  return hasUrl && hasKey;
};

/**
 * Create browser client for client components
 * Use this in client components and hooks
 */
export function createClient() {
  return createBrowserClient(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  );
}

/**
 * Create server client for server components and server actions
 * Use this in server components and API routes
 */
export async function createServerSupabaseClient() {
  // Dynamic import to avoid bundling server-only code in client
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  return createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Handle error silently in server context
            console.error('[supabase] Error setting cookies:', error);
          }
        },
      },
    }
  );
}

// Legacy export for backwards compatibility (use createClient() instead)
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabaseClient = () => {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
};

// Export as default for backwards compatibility
export { getSupabaseClient as supabase };
