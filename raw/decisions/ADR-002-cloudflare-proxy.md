# ADR-002: Cloudflare Worker Proxy for Supabase

**Date**: 2025
**Status**: Active

## Decision

All database/API requests go through `api.leadflowcrm.in` (Cloudflare Worker).
Auth requests (login, session refresh) go DIRECT to Supabase.

## Context

Jio and Airtel (India's biggest ISPs — covering ~70% of mobile users) block direct
connections to Supabase domains. This caused the app to be completely unusable for
most subscribers who are on mobile data.

## Consequences

- `supabaseClient.ts` is LOCKED — proxy logic is fragile, do NOT modify.
- Auth URLs bypass proxy (Supabase auth domain is not blocked).
- NEVER hardcode Supabase URLs — always use `VITE_SUPABASE_URL` env var.
- The Cloudflare Worker code is in `cloudflare-worker/` folder.

## Config (env.ts)

```typescript
// Data requests → Cloudflare proxy
VITE_API_URL=https://api.leadflowcrm.in

// Auth requests → direct Supabase  
VITE_SUPABASE_URL=https://vewqzsqddgmkslnuctvb.supabase.co
```
