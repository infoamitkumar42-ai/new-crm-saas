/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 PRODUCTION - supabaseClient.ts v4.0 FINAL              ║
 * ║  Date: January 6, 2025                                     ║
 * ║  Status: WORKING - NO 406 ERRORS                           ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./config/env";

/**
 * 🛡️ CUSTOM FETCH: Force ALL Supabase requests through Cloudflare proxy.
 * 
 * WHY: The Supabase JS SDK internally constructs URLs for auth token refresh,
 * PKCE exchange, and JWKS fetching that may bypass the configured base URL.
 * This wrapper intercepts EVERY request and rewrites supabase.co → proxy.
 * This fixes Jio/Airtel ISP blocks that cannot reach supabase.co directly.
 */
const customFetch = (url: RequestInfo | URL, options?: RequestInit) => {
  const urlString = url.toString();
  const modifiedUrl = urlString.replace(
    'vewqzsqddgmkslnuctvb.supabase.co',
    'api.leadflowcrm.in'
  );
  return fetch(modifiedUrl, options);
};

// ✅ MAIN CLIENT — All requests forced through Cloudflare proxy, Realtime DISABLED
export const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      storageKey: 'leadflow-auth',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },

    global: {
      fetch: customFetch,
      headers: {
        'X-Client-Info': 'leadflow-crm'
      },
    },

    db: {
      schema: 'public'
    },

    // 🔇 DISABLE Realtime/WebSocket completely — stops console WS errors
    realtime: {
      params: {
        eventsPerSecond: -1
      }
    }
  }
);

// 🔇 Realtime DISABLED — alias for backward compatibility (no separate WS client needed)
export const supabaseRealtime = supabase;

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
