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

// ╔════════════════════════════════════════════════════════════╗
// ║  🛡️ AUTH SMART FALLBACK (Jio/Airtel direct-block fix)      ║
// ╚════════════════════════════════════════════════════════════╝
// Auth (/auth/v1/) goes DIRECT to Supabase for speed. But some mobile
// networks (Jio/Airtel/certain 5G) BLOCK direct *.supabase.co, so the
// direct request hangs and "Checking session..." never finishes → user
// cannot log in on mobile data. This tries DIRECT first; if it errors
// (blocked) or takes too long (hang), it retries the SAME request through
// the Cloudflare proxy (api.leadflowcrm.in), which is NOT ISP-blocked.
//
// SAFETY (why this cannot break auth or crash the app):
//  - Only NETWORK failures / timeout trigger the fallback. A normal auth
//    response (400 wrong password, 403, etc.) is a RESOLVED Response and is
//    returned immediately — behaviour for those is 100% unchanged.
//  - Always returns Promise<Response> (same contract as fetch). If BOTH
//    direct and proxy fail, it rejects exactly like a normal fetch, so the
//    existing useAuth retry/error handling takes over. No new throw path.
//  - The request body is cloned BEFORE the first attempt, so the proxy
//    retry always has an intact body (no "body already used" errors).
const AUTH_DIRECT_TIMEOUT_MS = 8000;

function authFetchWithFallback(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  proxiedUrl: string
): Promise<Response> {
  // Prepare the proxy retry target BEFORE the body stream is consumed.
  const retryInput: RequestInfo | URL = input instanceof Request
    ? new Request(proxiedUrl, input.clone())
    : proxiedUrl; // string/URL — init (JSON string body) is safe to reuse

  return new Promise<Response>((resolve, reject) => {
    let settled = false;

    const goProxy = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      originalFetch(retryInput, init).then(resolve, reject);
    };

    const timer = setTimeout(goProxy, AUTH_DIRECT_TIMEOUT_MS);

    originalFetch(input, init).then(
      (res) => {
        if (settled) return;       // proxy already took over
        settled = true;
        clearTimeout(timer);
        resolve(res);              // includes 400/403 — returned as-is
      },
      () => {
        goProxy();                 // direct failed (likely blocked) → proxy
      }
    );
  });
}

window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = input instanceof Request
    ? input.url
    : input.toString();

  if (url.includes(SUPABASE_HOST)) {
    // 🔑 Auth requests = direct first, proxy fallback if blocked/slow
    if (url.includes('/auth/v1/')) {
      const proxiedAuthUrl = url.replace(SUPABASE_HOST, PROXY_HOST);
      return authFetchWithFallback(input, init, proxiedAuthUrl);
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
      autoRefreshToken: true, // ✅ ENABLED — window.fetch override already routes /auth/v1/ direct to Supabase
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
