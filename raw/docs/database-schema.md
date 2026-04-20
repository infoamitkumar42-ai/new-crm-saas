# LeadFlow CRM — Database Schema Reference

Supabase project ID: vewqzsqddgmkslnuctvb

## Table: users

Primary table — stores subscribers + their plan/quota state.

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID PK | Supabase Auth UID |
| email | TEXT | Login email |
| name | TEXT | Display name |
| role | TEXT | `admin` / `manager` / `member` |
| team_code | TEXT | `TEAMFIRE` / `TEAMSIMRAN` / `GJ01TEAMFIRE` |
| plan_name | TEXT | `starter` / `supervisor` / `weekly_boost` / `turbo_boost` / `manager` / `none` |
| payment_status | TEXT | `active` / `inactive` / `expired` |
| is_active | BOOLEAN | Can receive leads (admin toggle) |
| is_online | BOOLEAN | User is currently accepting leads |
| daily_limit | INTEGER | **TOTAL leads for plan** (NOT per-day!) — RPC divides internally |
| leads_today | INTEGER | Leads received today — resets at midnight by cron |
| total_leads_promised | INTEGER | Total quota from all payments |
| total_leads_received | INTEGER | Total leads delivered — compare with promised to expire |
| valid_until | TIMESTAMPTZ | Set to 2099 — PLACEHOLDER, IGNORED for expiry |
| is_plan_pending | BOOLEAN | Payment done, plan not yet activated |
| plan_activation_time | TIMESTAMPTZ | When pending plan activates |
| filters | JSONB | City/source targeting filters for lead routing |

**CRITICAL**: `daily_limit` stores the TOTAL plan leads, not the daily limit.

## Table: leads

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID PK | Lead ID |
| name | TEXT | Lead's name |
| phone | TEXT | Lead's phone number |
| city | TEXT | Lead's city |
| state | TEXT | Lead's state |
| status | TEXT | `New` / `Fresh` / `Night_Backlog` / `Queued` / `Assigned` |
| source | TEXT | Facebook page or campaign name |
| user_id | UUID FK | **LEGACY** original owner |
| assigned_to | UUID FK | **CURRENT** assigned user |
| notes | TEXT | Member's notes on lead |
| created_at | TIMESTAMPTZ | When lead came in |
| assigned_at | TIMESTAMPTZ | When lead was assigned |

**⚠️ DUAL FK BUG**: Both `user_id` and `assigned_to` point to `users` table.
Always use named join to avoid PGRST201 error:
```typescript
supabase.from('leads').select('*, assigned_user:users!assigned_to(name, email)')
```

## Table: payments

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID PK | Payment record |
| user_id | UUID FK | Who paid |
| amount | NUMERIC | Amount in ₹ |
| status | TEXT | `captured` / `pending` / `failed` |
| plan_name | VARCHAR | Plan purchased |
| razorpay_payment_id | VARCHAR | Razorpay reference |
| raw_payload | JSONB | Full Razorpay webhook payload |

## Table: push_subscriptions

| Column | Type | Purpose |
|--------|------|---------|
| user_id | UUID FK | Subscriber |
| endpoint | TEXT | FCM/Web Push URL |
| p256dh | TEXT | Encryption public key |
| auth | TEXT | Encryption auth secret |

## Key RPC Functions

| Function | Purpose | Can Modify? |
|----------|---------|-------------|
| `get_best_assignee_for_team(team_code)` | Round-robin — next eligible user | ⛔ NO |
| `get_admin_dashboard_data()` | Admin stats — requires auth check | ⛔ NO |
| `increment_user_lead_counters(p_user_id)` | Atomic counter update | ⛔ NO |
| `upsert_push_subscription()` | Save/update push subscription | Medium risk |
| `assign_lead_atomically()` | Atomic lead insert + counter update | ⛔ NO |

## Plan Configurations

| Plan | Price | Daily Limit | Total Leads | daily_limit stored |
|------|-------|-------------|-------------|-------------------|
| starter | ₹999 | 5/day | 55 total | 55 |
| supervisor | ₹1,999 | 7/day | 115 total | 115 |
| weekly_boost | ₹1,999 | 14/day | 92-100 total | 92 |
| turbo_boost | ₹2,499 | 14/day | 108 total | 108 |
| manager | ₹2,999 | 7/day | 176 total | 176 |
