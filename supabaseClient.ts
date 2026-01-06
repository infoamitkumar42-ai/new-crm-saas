/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 PRODUCTION - supabaseClient.ts v3.0                    ║
 * ║  Last Updated: January 6, 2025                             ║
 * ║  Features: Persistent session, fixed headers, proper types ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./config/env";

// ✅ Create Supabase client with PERSISTENT SESSION & FIXED HEADERS
export const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      // ✅ Store session in localStorage (persists across browser restarts)
      persistSession: true,
      
      // ✅ Custom storage key for session
      storageKey: 'leadflow-auth-session',
      
      // ✅ Use localStorage
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      
      // ✅ Auto refresh token before it expires
      autoRefreshToken: true,
      
      // ✅ Detect session from URL (for password reset, etc.)
      detectSessionInUrl: true,
      
      // ✅ PKCE flow for security
      flowType: 'pkce',
    },
    
    global: {
      headers: {
        'x-app-name': 'leadflow-crm',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    },
    
    db: {
      schema: 'public'
    },
    
    // ✅ Realtime config
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

/**
 * Centralized logging service
 * Fixed syntax error in console.log
 */
export async function logEvent(
  event: string, 
  payload: any, 
  userId?: string, 
  client: SupabaseClient = supabase
) {
  console.log(`[LOG]: ${event}`, payload);  // ✅ Fixed: was console.log`...` (template literal)

  try {
    let targetUserId = userId;

    if (!targetUserId && typeof window !== 'undefined') {
      const { data } = await client.auth.getSession();
      targetUserId = data.session?.user?.id;
    }

    if (targetUserId) {
      await client.from('logs').insert({
        user_id: targetUserId,
        action: event,
        details: payload,
        created_at: new Date().toISOString()
      });
    }
  } catch (err) {
    // Silent fail - logs are not critical
    console.debug('Log insert failed:', err);
  }
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch {
    return false;
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
};

/**
 * Get current user profile (with retry)
 */
export const getCurrentUserProfile = async (retries = 2) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    for (let attempt = 0; attempt < retries; attempt++) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) return data;
      
      // Wait before retry
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return null;
  } catch {
    return null;
  }
};
