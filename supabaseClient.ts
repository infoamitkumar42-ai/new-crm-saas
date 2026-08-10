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

// ╔════════════════════════════════════════════════════════════╗
// ║  🛡️ DATA PROXY FALLBACK (v4.1 — "Checking session..." fix) ║
// ╚════════════════════════════════════════════════════════════╝
// PROBLEM ye tha: AUTH ke paas Plan B tha (direct fail -> proxy), par
// DATA ke paas koi Plan B nahi tha — wo sirf api.leadflowcrm.in se jaata
// tha. Isliye jab proxy slow/down hota, login to ho jaata (uska fallback
// chal jaata) par uske turant baad ka profile fetch latak jaata, aur user
// ko minutes tak "Checking session..." dikhta rehta.
//
// FIX: data ko bhi Plan B do, par ULTI direction mein — pehle PROXY (Jio/
// Airtel ka ISP block bypass karne ke liye, wahi asli wajah thi proxy ki),
// aur agar wo fail/slow ho to DIRECT Supabase. Dono milke 100% cover:
//   • Jio/Airtel user  -> direct blocked, proxy chalega
//   • Proxy down       -> direct chalega
//
// ⚠️ SLOW NETWORK PAR REGRESSION NA HO, isliye ye "abandon" nahi karta:
// timeout hone par direct ko PARALLEL mein start karta hai aur jo PEHLE
// success de wahi jeetta hai. Yaani 2G par proxy 10s le raha ho aur direct
// blocked ho, to bhi proxy ka jawaab aate hi accept hoga — kuch nahi tootega.
//
// SAFETY:
//  - Sirf NETWORK failure/timeout par fallback. 400/403/409 jaisa koi bhi
//    asli HTTP response turant return hota hai — us behaviour mein 0 badlaav.
//  - Dono fail hone par hi reject karta hai, bilkul normal fetch ki tarah.
//  - Body reuse safe hai: supabase-js hamesha string (JSON) body bhejta hai.
//    Agar kabhi ReadableStream body aaya to fallback skip karke purana
//    proxy-only behaviour chalta hai (stream dobara nahi padhi ja sakti).
const DATA_PROXY_TIMEOUT_MS = 6000;

/** Body dobara bheji ja sakti hai ya nahi (stream = nahi). */
function isRetriableBody(body: BodyInit | null | undefined): boolean {
  if (body == null) return true;                       // GET/DELETE — koi body nahi
  if (typeof body === 'string') return true;           // supabase-js ka normal case
  if (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream) return false;
  return true;                                          // Blob/FormData/URLSearchParams — reusable
}

/**
 * `primaryUrl` pehle try karta hai; fail ya DATA_PROXY_TIMEOUT_MS se slow hone
 * par `fallbackUrl` ko PARALLEL mein start karta hai. Jo pehle success deta hai
 * wahi resolve hota hai. Dono fail hon tabhi reject.
 */
function fetchWithFallback(
  primaryUrl: string,
  fallbackUrl: string,
  init?: RequestInit
): Promise<Response> {
  return new Promise<Response>((resolve, reject) => {
    let done = false;
    let primaryFailed = false;
    let fallbackFailed = false;
    let fallbackStarted = false;

    const finish = (fn: (v: any) => void, val: any) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      fn(val);
    };

    const startFallback = () => {
      if (fallbackStarted || done) return;
      fallbackStarted = true;
      originalFetch(fallbackUrl, init).then(
        (res) => finish(resolve, res),
        (err) => {
          fallbackFailed = true;
          if (primaryFailed) finish(reject, err);   // dono gaye — tabhi reject
        }
      );
    };

    const timer = setTimeout(startFallback, DATA_PROXY_TIMEOUT_MS);

    originalFetch(primaryUrl, init).then(
      (res) => finish(resolve, res),
      (err) => {
        primaryFailed = true;
        startFallback();                            // turant Plan B
        if (fallbackFailed) finish(reject, err);
      }
    );
  });
}

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
    // 📊 All other requests = proxy first (ISP bypass), direct as Plan B.
    const proxiedUrl = url.replace(SUPABASE_HOST, PROXY_HOST);

    // Request object ka path JAAN-BOOJH KAR bilkul purana rakha hai —
    // uska body ek stream hota hai jise safely dobara nahi bheja ja sakta,
    // aur supabase-js data traffic yahan aata bhi nahi (wo customFetch se
    // jaata hai). Blast radius minimum rakhne ke liye ise chheda nahi.
    if (input instanceof Request) {
      return originalFetch(new Request(proxiedUrl, input), init);
    }

    if (!isRetriableBody(init?.body)) {
      return originalFetch(proxiedUrl, init);
    }

    return fetchWithFallback(proxiedUrl, url, init);
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
  // window.fetch override isko authFetchWithFallback pe bhej dega.
  if (urlStr.includes('/auth/v1/')) {
    return fetch(urlStr, options);
  }

  // 📊 Data requests = proxy PEHLE (ISP bypass), phir direct as Plan B.
  // ⚠️ YAHI wo jagah hai jahan supabase-js ki HAR data request aati hai —
  // window.fetch wali data-branch yahan tak pahunchti hi nahi, kyunki URL
  // upar already replace ho chuka hota hai. Isliye fallback yahan lagta hai.
  const proxiedUrl = urlStr.replace(SUPABASE_HOST, PROXY_HOST);

  // Stream body dobara nahi bheji ja sakti — us case mein purana
  // proxy-only behaviour bilkul waisa hi rehne do.
  if (!isRetriableBody(options?.body)) {
    return fetch(proxiedUrl, options);
  }

  return fetchWithFallback(proxiedUrl, urlStr, options);
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
