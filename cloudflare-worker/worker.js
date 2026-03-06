/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🛡️ Cloudflare Worker - LeadFlow CRM Supabase Proxy v3.0  ║
 * ║  Domain: api.leadflowcrm.in                                ║
 * ║  Target: vewqzsqddgmkslnuctvb.supabase.co                 ║
 * ║                                                            ║
 * ║  Fixes:                                                    ║
 * ║  ✅ Client disconnect handling (399 errors)                ║
 * ║  ✅ AbortError graceful handling                           ║
 * ║  ✅ apikey header fallback from env                        ║
 * ║  ✅ CORS preflight handling                                ║
 * ║  ✅ Timeout handling with AbortController                  ║
 * ╚════════════════════════════════════════════════════════════╝
 * 
 * ENVIRONMENT VARIABLES (set in Cloudflare Dashboard):
 *   SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

const SUPABASE_HOST = 'vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_ORIGIN = `https://${SUPABASE_HOST}`;

// Hardcoded fallback if env var not set
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4';

// CORS headers for all responses
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, X-Client-Info, x-supabase-api-version',
    'Access-Control-Expose-Headers': 'Content-Range, X-Total-Count',
    'Access-Control-Max-Age': '86400',
};

export default {
    async fetch(request, env) {
        // ── CORS Preflight ──
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        // Get anon key from env or fallback
        const ANON_KEY = env?.SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

        try {
            // ── Build proxied URL ──
            const url = new URL(request.url);
            url.hostname = SUPABASE_HOST;
            url.protocol = 'https:';

            // ── Build headers ──
            const newHeaders = new Headers(request.headers);
            newHeaders.set('Host', SUPABASE_HOST);
            newHeaders.set('Origin', SUPABASE_ORIGIN);

            // 🛡️ FIX: Ensure apikey header is always present
            if (!newHeaders.get('apikey')) {
                newHeaders.set('apikey', ANON_KEY);
            }

            // 🛡️ FIX: Ensure Authorization header has Bearer token
            if (!newHeaders.get('Authorization')) {
                newHeaders.set('Authorization', `Bearer ${ANON_KEY}`);
            }

            // Remove headers that can cause issues
            newHeaders.delete('cf-connecting-ip');
            newHeaders.delete('cf-ipcountry');
            newHeaders.delete('cf-ray');
            newHeaders.delete('cf-visitor');

            // ── Timeout handling with AbortController ──
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            try {
                const response = await fetch(url.toString(), {
                    method: request.method,
                    headers: newHeaders,
                    body: request.method !== 'GET' && request.method !== 'HEAD'
                        ? request.body
                        : undefined,
                    signal: controller.signal,
                    redirect: 'follow',
                });

                clearTimeout(timeoutId);

                // ── Build response with CORS ──
                const responseHeaders = new Headers(response.headers);
                Object.entries(CORS_HEADERS).forEach(([key, value]) => {
                    responseHeaders.set(key, value);
                });

                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: responseHeaders,
                });

            } catch (fetchError) {
                clearTimeout(timeoutId);

                // 🛡️ FIX: Handle AbortError (timeout) gracefully
                if (fetchError.name === 'AbortError') {
                    return new Response(
                        JSON.stringify({ error: 'Gateway Timeout', message: 'Request to Supabase timed out after 30s' }),
                        { status: 504, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
                    );
                }

                // 🛡️ FIX: Handle client disconnection gracefully
                if (fetchError.message?.includes('client disconnected') ||
                    fetchError.message?.includes('network connection lost') ||
                    fetchError.message?.includes('The script will never generate a response')) {
                    // Client already gone — just return a minimal response (it won't be received anyway)
                    return new Response(null, { status: 499, headers: CORS_HEADERS });
                }

                throw fetchError; // Re-throw unexpected errors
            }

        } catch (error) {
            // 🛡️ GLOBAL ERROR HANDLER — never crash the worker
            console.error('[Worker Error]', error.name, error.message);

            // Client disconnect — return silently
            if (error.message?.includes('client disconnected') ||
                error.name === 'AbortError') {
                return new Response(null, { status: 499, headers: CORS_HEADERS });
            }

            return new Response(
                JSON.stringify({
                    error: 'Proxy Error',
                    message: error.message || 'Unknown worker error',
                    hint: 'If this persists, try refreshing the app'
                }),
                {
                    status: 502,
                    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
                }
            );
        }
    }
};
