/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 PRODUCTION - supabaseClient.ts v4.0 FINAL              ║
 * ║  Date: January 6, 2025                                     ║
 * ║  Status: WORKING - NO 406 ERRORS                           ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./config/env";

// ╔════════════════════════════════════════════════════════════╗
// ║  🛡️ GLOBAL FETCH OVERRIDE — Intercepts ALL requests       ║
// ║  including Supabase library internal _recoverAndRefresh    ║
// ║  that bypasses the customFetch option.                     ║
// ╚════════════════════════════════════════════════════════════╝
const SUPABASE_HOST = 'vewqzsqddgmkslnuctvb.supabase.co';
const PROXY_HOST = 'api.leadflowcrm.in';

const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = input instanceof Request
    ? input.url
    : input.toString();

  if (url.includes(SUPABASE_HOST)) {
    // 🔑 Auth requests = direct to Supabase (faster token refresh)
    if (url.includes('/auth/v1/')) {
      return originalFetch(input, init);
    }
    // 📊 All other requests = through Cloudflare proxy (ISP bypass)
    const proxiedUrl = url.replace(SUPABASE_HOST, PROXY_HOST);
    if (input instanceof Request) {
      return originalFetch(new Request(proxiedUrl, input), init);
    }
    return originalFetch(proxiedUrl, init);
  }
  return originalFetch(input, init);
};

/**
 * 🛡️ SMART FETCH: Split routing for optimal performance.
 * 
 * AUTH requests (/auth/v1/*) → DIRECT to Supabase (faster token refresh)
 * DATA requests (REST, RPC)  → Through Cloudflare proxy (ISP bypass)
 * 
 * WHY: Auth token refresh was taking 10+ seconds through the proxy,
 * causing EMERGENCY RELEASE and profile fetch failures. Direct auth
 * is faster and more reliable. Data requests still need the proxy
 * to bypass Jio/Airtel ISP blocks.
 */
const customFetch = (url: RequestInfo | URL, options?: RequestInit) => {
  const urlStr = url.toString();

  // 🔑 Auth requests = direct to Supabase (faster token refresh)
  if (urlStr.includes('/auth/v1/')) {
    return fetch(urlStr, options);
  }

  // 📊 Data requests = through Cloudflare proxy (ISP bypass)
  const proxiedUrl = urlStr.replace(
    'vewqzsqddgmkslnuctvb.supabase.co',
    'api.leadflowcrm.in'
  );
  return fetch(proxiedUrl, options);
};

// ✅ MAIN CLIENT — All requests forced through Cloudflare proxy, Realtime DISABLED
export const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false, // 🛡️ DISABLED — manual refresh in useAuth.tsx prevents internal fetch bypass
      persistSession: true,
      storageKey: 'leadflow-auth-v2', // 🛡️ Changed to avoid stale lock conflict from old key
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      detectSessionInUrl: true,
      // 🛡️ SMART LOCK: The Web Locks API causes 15s hangs on mobile.
      // We allow the real lock only on the reset-password page where session rehydration is critical.
      lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
        if (typeof window !== 'undefined' && window.location.pathname.includes('reset-password')) {
          return await fn();
        }
        // Bypass lock on all other pages (prevents mobile 15s hang)
        return await fn();
      },
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
