# LeadFlow CRM — Supabase Edge Functions Reference

All functions run on Deno runtime. All must have proper CORS headers + OPTIONS handler.

## meta-webhook

**Trigger**: HTTP POST from Meta (Facebook) webhook
**Purpose**: Intake incoming leads, assign during business hours or queue for backlog

Flow:
1. Validate Meta webhook signature
2. Extract lead data (name, phone, city, state, source)
3. Check IST time (8AM-10PM = working hours)
4. If working hours: call `get_best_assignee_for_team(team_code)` → assign → push notification
5. If night hours: save with `status = 'Night_Backlog'`

## process-backlog

**Trigger**: Cron job at 10:00 AM IST daily
**Purpose**: Assign all Night_Backlog leads accumulated overnight

Flow:
1. Fetch all leads where `status = 'Night_Backlog'`
2. For each lead: call `get_best_assignee_for_team(team_code)`
3. Assign + send push notification

## send-push-notification

**Trigger**: Called by meta-webhook and process-backlog
**Purpose**: Send Web Push notification to assigned member's device

Uses VAPID keys (regenerated 2026-03-13). Reads from `push_subscriptions` table.

## check-quota-expiry

**Trigger**: Cron job at 7:00 AM IST daily
**Purpose**: Auto-deactivate users who have exhausted their lead quota

Logic: `total_leads_received >= total_leads_promised` → set `payment_status = 'expired'`, `is_active = false`

## daily-counter-reset

**Trigger**: Cron job at 12:00 AM IST (midnight)
**Purpose**: Reset `leads_today = 0` for all users
**Note**: Has 7AM safeguard — if midnight reset failed, 7AM catches it

## assign-recycled-leads

**Trigger**: Manual or scheduled
**Purpose**: Re-assign leads that were assigned but never contacted

Uses explicit `fetch()` call (NOT `supabase.functions.invoke()`) for internal calls.

## plan-expiry-notifier

**Trigger**: Scheduled
**Purpose**: Notify users when their plan is about to expire (quota nearly exhausted)

## sync-counters

**Trigger**: Manual utility
**Purpose**: Fix counter mismatches between leads table counts and user counter fields

## Cron Job Schedule

| Job | Schedule (IST) | Function |
|-----|---------------|----------|
| reset-leads-daily | 12:00 AM | `daily-counter-reset` |
| daily-quota-check | 7:00 AM | `check-quota-expiry` |
| morning-backlog | 10:00 AM | `process-backlog` |
| backlog-sweeper | Every 10 min | `process-backlog` (catch stragglers) |
