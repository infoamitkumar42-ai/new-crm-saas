# Known Issues — Do NOT Fix Unless Asked

These are documented intentional behaviors or accepted limitations.

## 1. Admin Session Expires (~1hr)

**Symptom**: Admin dashboard stops loading after ~1 hour
**Cause**: `autoRefreshToken: false` in useAuth.tsx — intentional
**Workaround**: Reload the page
**Why not fixed**: Changing useAuth.tsx risks breaking session logic

## 2. Dashboard Polls 30+ Times in Console

**Symptom**: Browser console shows 30+ Supabase requests per minute
**Cause**: 20-second polling interval — intentional for real-time lead updates
**Status**: NOT a bug, working as designed

## 3. "Auth lock 5000ms" Warnings

**Symptom**: Console warnings about auth lock timeout
**Cause**: React Strict Mode + polling creates double-render race
**Status**: Cosmetic only, no functional impact

## 4. ERR_NETWORK_CHANGED on Mobile

**Symptom**: Network errors when mobile users switch between WiFi/4G
**Cause**: Supabase connection drops on network change
**Why unfixable**: Would require modifying locked supabaseClient.ts

## 5. Orphan Leads Modal Shows Empty

**Symptom**: Admin stats card shows orphan count, but modal is empty
**Root Cause**: Stats card queries `leads` table; modal queries `orphan_leads` table
**Status**: Known mismatch, tables are out of sync
**Fix**: Requires schema change — get approval first

## Recently Fixed (2026-03-13)

- Push notifications broken → VAPID keys regenerated, fixed
- Admin RPC security hole → auth check added to get_admin_dashboard_data()
- Counter mismatch → increment_user_lead_counters RPC fixed
- Night backlog status mismatch → 'night_backlog' vs 'Night_Backlog' standardized
- Razorpay webhook URL → moved to Cloudflare Pages Function
