/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - supabaseClient.ts v2.0                        ║
 * ║  Last Updated: January 5, 2025                             ║
 * ║  Features: Persistent session, auto refresh                ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ✅ Direct URL and Key (fallback if ENV not available)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase configuration!");
}

// ✅ Create Supabase client with PERSISTENT SESSION
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      // ✅ Store session in localStorage (persists across browser restarts)
      persistSession: true,
      
      // ✅ Custom storage key for session
      storageKey: 'leadflow-auth-session',
      
      // ✅ Use localStorage instead of sessionStorage
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      
      // ✅ Auto refresh token before it expires
      autoRefreshToken: true,
      
      // ✅ Detect session from URL (for magic links, password reset)
      detectSessionInUrl: true,
      
      // ✅ Flow type for better security
      flowType: 'pkce',
    },
    
    global: {
      headers: {
        'x-app-name': 'leadflow-crm',
      },
    },
  }
);

/**
 * Centralized logging service
 */
export async function logEvent(
  event: string, 
  payload: any, 
  userId?: string, 
  client: SupabaseClient = supabase
) {
  console.log(`[LOG]: ${event}`, payload);

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
    // Silent fail for logging
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
