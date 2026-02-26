/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 PRODUCTION - supabaseClient.ts v4.0 FINAL              ║
 * ║  Date: January 6, 2025                                     ║
 * ║  Status: WORKING - NO 406 ERRORS                           ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./config/env";

// ✅ FIXED CLIENT - No more 406 errors
export const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      storageKey: 'leadflow-auth-session',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },

    global: {
      headers: {
        'X-Client-Info': 'leadflow-crm'
      },
    },

    db: {
      schema: 'public'
    }
  }
);

/**
 * Centralized logging
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
    console.debug('Log insert failed:', err);
  }
}

/**
 * Check auth
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
