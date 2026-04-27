# LeadFlow CRM — Architecture Overview

## System Summary

LeadFlow CRM distributes Facebook leads to paid network marketing subscribers
using a round-robin algorithm. Plans are quota-based (leads count), not time-based.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Hosting | Cloudflare Pages |
| Backend | Supabase (PostgreSQL + Edge Functions + Auth) |
| API Proxy | Cloudflare Worker at api.leadflowcrm.in |
| Payments | Razorpay (webhook → Cloudflare Pages Function) |
| Push Notifications | Web Push (VAPID) via Supabase Edge Function |

## Lead Flow Diagram

```
Meta Ads (Facebook Lead Form)
    ↓
meta-webhook (Supabase Edge Function)
    ↓
Check IST time:
  Working Hours (8AM-10PM IST):
    → get_best_assignee_for_team(team_code) RPC
    → Assigns to eligible user (is_active=true, is_online=true, within quota)
    → increment_user_lead_counters(user_id) RPC
    → send-push-notification Edge Function → user's device
  Night Hours (10PM-8AM IST):
    → lead.status = 'Night_Backlog' (unassigned)
    ↓
10:00 AM IST (Cron Job):
    → process-backlog Edge Function
    → Assigns Night_Backlog leads to eligible users
```

## Why Cloudflare Proxy?

Jio and Airtel (major Indian ISPs) block direct connections to Supabase.
ALL data requests go through api.leadflowcrm.in Cloudflare Worker.
Auth requests (login/session) go DIRECT to Supabase (bypass proxy).

## Key Design Decisions

1. **Quota-based plans**: `total_leads_received >= total_leads_promised` → expire.
   NOT time-based. `valid_until` is set to 2099 — it's a placeholder, IGNORED.

2. **Atomic counters**: `increment_user_lead_counters` RPC handles concurrent updates safely.
   NEVER use `supabase.from('users').update()` for counter fields.

3. **Round-robin**: `get_best_assignee_for_team(team_code)` finds the eligible user
   with fewest leads_today among active+online users in the team.

4. **DUAL FK in leads table**: Both `user_id` (legacy owner) and `assigned_to` (current).
   Always query with: `supabase.from('leads').select('*, assigned_user:users!assigned_to(*)')`

## IST Timezone Rule

All cron jobs and date comparisons MUST use:
```sql
AT TIME ZONE 'Asia/Kolkata'
```
Supabase runs in UTC — forgetting this breaks night backlog logic.
