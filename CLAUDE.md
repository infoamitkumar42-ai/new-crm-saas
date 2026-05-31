# CLAUDE.md — LeadFlow CRM

> **READ THIS ENTIRE FILE BEFORE TOUCHING ANY CODE. If you skip this, you WILL break something.**

---

## ⛔ HARD RULES — VIOLATING ANY OF THESE = INSTANT ROLLBACK

1. **NEVER modify LOCKED files** without explicit user instruction:
   - `auth/useAuth.tsx` (v6.4) — Auth logic, session management
   - `supabaseClient.ts` (v4.0) — Supabase client with Cloudflare proxy
   - `App.tsx` — PWA cleanup logic is fragile
   - `vite.config.ts` — `injectionPoint: undefined` is intentional
   - `src/sw.ts` — Service worker, affects push notifications

2. **NEVER delete .sql, .csv, .json, .txt files from project root** — these are operational data/scripts, NOT trash.

3. **NEVER change database schema** (add/remove columns, alter tables) without showing the SQL first and getting approval.

4. **NEVER change RPC functions** without showing the full CREATE OR REPLACE and getting approval.

5. **NEVER remove or modify RLS policies** — they protect user data isolation.

6. **NEVER use `supabase.from('users').update()` for lead counters** — ALWAYS use `increment_user_lead_counters` RPC.

7. **NEVER hardcode Supabase URLs** — always use environment variables. Auth requests go DIRECT to Supabase, data requests go through `api.leadflowcrm.in` proxy.

8. **ONE CHANGE AT A TIME** — never modify more than one feature/fix per commit. If asked to do multiple things, do them sequentially with separate commits.

---

## 🔍 BEFORE YOU WRITE ANY CODE — MANDATORY CHECKLIST

```
□ Read this ENTIRE file
□ Identify which files you need to change
□ Check if any are LOCKED (see rule #1)
□ Check CHANGELOG section below for recent changes
□ Run: git status (check current state)
□ Run: git log --oneline -5 (check recent commits)
□ Show your plan to the user BEFORE writing code
□ Get explicit approval BEFORE modifying any file
```

---

## 📋 Project Overview

**LeadFlow CRM** — SaaS lead distribution platform for Network Marketing professionals.
- Receives leads from Meta (Facebook) Ads via webhook
- Distributes leads to paid subscribers using round-robin algorithm
- Plans are LEADS-BASED (not time-based): quota exhausted = plan expired

| Key | Value |
|-----|-------|
| Domain | https://leadflowcrm.in |
| API Proxy | https://api.leadflowcrm.in (Cloudflare Worker) |
| Supabase ID | vewqzsqddgmkslnuctvb |
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Hosting | Cloudflare Pages |
| Backend | Supabase (PostgreSQL + Edge Functions + Auth) |
| Payments | Razorpay |
| GitHub | github.com/infoamitkumar42-ai/new-crm-saas (branch: main) |

---

## 🏗️ Architecture — How Leads Flow

```
Meta Ads → Facebook Lead Form
    ↓
meta-webhook (Supabase Edge Function)
    ↓
Working Hours (8AM-10PM IST):
    → get_best_assignee_for_team() RPC
    → Assigns to eligible user (is_active, is_online, within quota)
    → Push notification via send-push-notification Edge Function
    ↓
Night Hours (10PM-8AM IST):
    → Status = 'Night_Backlog' (unassigned)
    ↓
10:00 AM IST (Cron Job #13):
    → process-backlog Edge Function
    → Assigns Night_Backlog leads to eligible users
```

---

## 📁 Directory Structure — WHAT EACH FOLDER DOES

```
new-crm-saas/
├── auth/useAuth.tsx              # 🔒 LOCKED — Auth provider + session management
├── supabaseClient.ts             # 🔒 LOCKED — Supabase client + Cloudflare proxy
├── App.tsx                       # 🔒 FRAGILE — Router + PWA cleanup
├── vite.config.ts                # 🔒 FRAGILE — PWA config (injectionPoint: undefined)
├── src/sw.ts                     # 🔒 FRAGILE — Service worker for push notifications
│
├── views/
│   ├── AdminDashboard.tsx        # Admin panel — ALL admin features
│   ├── MemberDashboard.tsx       # User dashboard — leads view
│   ├── ManagerDashboard.tsx      # Manager dashboard
│   ├── Dashboard.tsx             # Smart router by role
│   ├── Landing.tsx               # Public landing page
│   ├── Auth.tsx                  # Login/Signup page
│   └── Settings.tsx              # User settings
│
├── components/
│   ├── LeadAlert.tsx             # Foreground lead notification + Mixkit sound
│   ├── Sidebar.tsx               # Navigation sidebar
│   ├── Subscription.tsx          # Plan/subscription UI
│   └── SmartRenewalBanner.tsx    # Renewal prompt
│
├── hooks/
│   ├── usePushNotification.ts    # Push notification hook (v7)
│   └── useNotification.ts       # In-app notification hook
│
├── config/env.ts                 # Environment config (VITE_ vars)
├── types.ts                      # TypeScript interfaces
├── index.tsx                     # React DOM entry
├── index.css                     # Global styles
│
├── supabase/functions/           # Edge Functions (Deno runtime)
│   ├── meta-webhook/             # Lead intake from Meta Ads
│   ├── process-backlog/          # Night backlog processor
│   ├── send-push-notification/   # Push notification sender
│   ├── check-quota-expiry/       # Daily quota check (cron)
│   ├── daily-counter-reset/      # Reset leads_today (cron)
│   └── sync-counters/            # Counter sync utility
│
├── functions/api/                # Cloudflare Pages Functions
│   ├── razorpay-webhook.ts       # Payment webhook handler
│   └── [[path]].ts               # Catch-all proxy (legacy)
│
├── cloudflare-worker/            # Supabase proxy worker code
├── api/                          # Legacy Vercel functions (NOT active)
├── public/                       # Static assets, PWA icons
└── *.sql, *.csv, *.json, *.txt   # Operational scripts — DO NOT DELETE
```

---

## 🗄️ Database Schema

### users (main table)
| Column | Type | Purpose |
|--------|------|---------|
| id | UUID PK | Supabase Auth UID |
| email, name | TEXT | Identity |
| role | TEXT | admin / manager / member |
| team_code | TEXT | TEAMFIRE / TEAMSIMRAN / GJ01TEAMFIRE |
| plan_name | TEXT | starter / supervisor / weekly_boost / turbo_boost / manager / none |
| payment_status | TEXT | active / inactive / expired |
| is_active | BOOLEAN | Can receive leads |
| is_online | BOOLEAN | Currently accepting leads |
| daily_limit | INTEGER | Max leads per day for this plan |
| leads_today | INTEGER | Leads received today (resets at midnight) |
| total_leads_promised | INTEGER | Total quota from all payments |
| total_leads_received | INTEGER | Total leads delivered so far |
| valid_until | TIMESTAMPTZ | Set to 2099 (placeholder, IGNORED — use quota instead) |
| is_plan_pending | BOOLEAN | Payment done, plan not yet active |
| plan_activation_time | TIMESTAMPTZ | When pending plan activates |
| filters | JSONB | City/source targeting filters |

### leads
| Column | Type | Purpose |
|--------|------|---------|
| id | UUID PK | Lead ID |
| name, phone, city, state | TEXT | Lead info |
| status | TEXT | New / Fresh / Night_Backlog / Queued / Assigned |
| source | TEXT | Facebook page/campaign name |
| user_id | UUID FK | Original owner (legacy) |
| assigned_to | UUID FK | Currently assigned user |
| notes | TEXT | User's notes on lead |
| created_at, assigned_at | TIMESTAMPTZ | Timestamps |

> ⚠️ **DUAL FK BUG**: `leads` has BOTH `user_id` and `assigned_to` pointing to `users`. Always disambiguate:
> ```typescript
> supabase.from('leads').select('*, assigned_user:users!assigned_to(name, email)')
> ```

### payments
| Column | Type | Purpose |
|--------|------|---------|
| id | UUID PK | Payment record |
| user_id | UUID FK | Who paid |
| amount | NUMERIC | Amount in ₹ |
| status | TEXT | captured / pending / failed |
| plan_name | VARCHAR | Plan purchased |
| razorpay_payment_id | VARCHAR | Razorpay reference |
| raw_payload | JSONB | Full webhook data |

### push_subscriptions
| Column | Type | Purpose |
|--------|------|---------|
| user_id | UUID FK | Subscriber |
| endpoint | TEXT | FCM push URL |
| p256dh, auth | TEXT | Encryption keys |

---

## 🔧 Key RPC Functions — DO NOT MODIFY WITHOUT APPROVAL

| Function | Purpose | Critical? |
|----------|---------|-----------|
| `get_best_assignee_for_team(team_code)` | Finds next eligible user for lead assignment | ⛔ YES |
| `get_admin_dashboard_data()` | Admin stats (secured with auth check) | ⛔ YES |
| `increment_user_lead_counters(p_user_id)` | Atomically updates leads_today + total_leads_received | ⛔ YES |
| `upsert_push_subscription()` | Save/update push subscription | Medium |
| `assign_lead_atomically()` | Atomic lead insert + counter update | ⛔ YES |

---

## ⏰ Cron Jobs

| Job | Schedule (IST) | Purpose |
|-----|---------------|---------|
| reset-leads-daily | 12:00 AM | Reset leads_today to 0 for all users |
| daily-quota-check | 7:00 AM | Auto-deactivate users who exhausted quota |
| morning-backlog | 10:00 AM | Assign Night_Backlog leads |
| backlog-sweeper | Every 10 min | Catch leftover unassigned leads |

---

## 💰 Plan Configuration

### Monthly Growth Plans
| Plan | Price | Duration | Daily Limit | Fresh Leads | Replacement | total_leads_promised (DB) |
|------|-------|----------|-------------|-------------|-------------|--------------------------|
| starter | ₹999 | 10 days | 5 | 45 | 5 | **50** |
| supervisor | ₹1,499 | 15 days | 7 | 70 | 10 | **80** |
| manager | ₹2,999 | 20 days | 8 | 160 | 16 | **176** |

### Weekly Booster Plans
| Plan | Price | Duration | Daily Limit | Fresh Leads | Replacement | total_leads_promised (DB) |
|------|-------|----------|-------------|-------------|-------------|--------------------------|
| weekly_boost | ₹1,999 | 7 days | 12 | 84 | 8 | **92** |
| turbo_boost | ₹2,499 | 7 days | 14 | 98 | 10 | **108** |

> **Welcome Bonus:** +5 extra leads FREE for new users (added to total_leads_promised at first activation).

> **CRITICAL**: `total_leads_promised` in DB = Fresh Leads + Replacement (e.g. weekly_boost = 84+8 = 92). `daily_limit` in DB = Daily Limit column above. Supervisor price changed from ₹1,999 → ₹1,499 (2026-05-25).

---

## 🔑 Business Logic Rules

1. **Plan Expiry**: `total_leads_received >= total_leads_promised` → Expire. NOT time-based.
2. **Pause/Resume**: `is_active` + `is_online` both must be true to receive leads.
3. **Night Hours**: 10PM-8AM IST → leads saved as Night_Backlog, assigned at 10AM.
4. **ISP Bypass**: All data requests go through `api.leadflowcrm.in` Cloudflare proxy because Jio/Airtel block Supabase.
5. **Counters**: ALWAYS use RPC `increment_user_lead_counters`, never direct UPDATE.

---

## 🔒 Security Notes

- `get_admin_dashboard_data()` requires authenticated admin user
- RLS enabled on leads, users tables
- Anon key returns empty results (by design)
- Service role key required for full access
- Auth requests bypass proxy → go direct to Supabase

---

## 📝 CHANGELOG — Recent Changes (Update this after every change)

### 2026-05-31
- hooks/usePushNotification.ts: lazy-init isSubscribed=true immediately when permission=granted + push_subscription_active flag set → eliminates 1-3s Enable banner flash for returning users
- hooks/usePushNotification.ts: set push_subscription_active localStorage flag on subscribe, clear on unsubscribe
- components/NotificationBanner.tsx: dismissed initializes to true when Notification.permission=granted; hide_push_prompt flag set on subscribe success (not just manual dismiss)
- supabaseClient.ts: autoRefreshToken=true — window.fetch already routes /auth/v1/ direct, auto-refresh now safe. Prevents next-day logout.
- components/LeadAlert.tsx: fix polling to use assigned_to + assigned_at (was user_id + created_at) — manual/recycle leads now trigger in-app dashboard alert
- DB: trigger_push_notification() updated — now guards INSERT (assigned_to not null) AND UPDATE (assigned_to changed)
- DB: on_lead_updated_push trigger created — AFTER UPDATE on leads → push sent for manual/recycle assignments
- DB: new_lead_notification trigger deleted — had trailing dash in URL, never worked
- Edge Function send-push-notification v14 deployed — handles payload.type=UPDATE same as INSERT


### 2026-05-24
- auth/useAuth.tsx: instant restore from localStorage (loading screen fix for returning users)
- App.tsx: Force Refresh now preserves Supabase auth tokens (was silently logging users out)
- PwaInstallPrompt.tsx: 3-platform detection (Android / iOS Safari / iOS Chrome with guidance)
- DB: 14 non-May-paying users deactivated, quota zeroed
- DB: 28 May mis-routed leads reassigned round-robin to active users
- DB: RLS enabled on push_subscriptions_backup_20260502 + notifications_backup_20260502
- DB: Komal bishnoi (kb817949) — 35 leads credit added (weekly_boost underdelivery fix)
- DB: Ajay kumar, Reetika, Harmandeep kaur (deeprandhawa1604) re-activated (had quota remaining)
- CLAUDE.md: Added DATABASE REPORTING RULES section (accuracy mandatory)
- DB: 57 counter mismatches synced (total_leads_received = actual leads, 0 mismatches now)
- DB: 10 over-quota active users deactivated (Bug #2 fix)
- DB: trigger_update_user_lead_count updated — added decrement logic when lead reassigned AWAY from user
- DB: check_lead_limit_before_insert/update fixed — now uses actual COUNT(*) with IST date instead of stale leads_today counter (Bug #3 fix)
- DB: process_stuck_lead (trg_safety_net_assign) fixed — removed double-increment of leads_today (Bug #4 fix)
- DB: get_best_assignee_for_team RPC fixed — PASS 2 plan_weight ordering now ASC (consistent with PASS 1, was DESC) (Bug #5 fix)

### 2026-03-25
- Duplicate check on 69 new leads: 45 duplicates found, 24 clean

### 2026-03-13
- Push notifications complete overhaul (VAPID keys regenerated)
- Admin RPC security hole patched (auth check added)
- Counter mismatch fix (increment_user_lead_counters RPC)
- Night backlog fix (status mismatch + cron schedule)
- Razorpay webhook URL fix (direct Supabase URL)
- Daily quota expiry cron created (Job #14)
- 5 users manually activated (UPI payments)
- plan_analytics populated in admin dashboard RPC

---

## ⚠️ Known Issues — DO NOT TRY TO FIX UNLESS ASKED

1. `autoRefreshToken: false` in useAuth — admin session expires after ~1hr (workaround: reload)
2. Dashboard polls 30+ times in console — intentional 20s polling, NOT a bug
3. Auth lock "5000ms" warnings — React Strict Mode + polling, cosmetic only
4. ERR_NETWORK_CHANGED — mobile network switching, unfixable without changing locked files
5. Orphan leads modal shows empty — stats card queries leads table, modal queries orphan_leads table (mismatch)

---

## 🚫 COMMON MISTAKES LLMs MAKE — AVOID THESE

1. **Adding `import` for packages not in package.json** — check package.json first
2. **Using `localStorage` in service worker** — SW has no localStorage access
3. **Calling `supabase.auth.getUser()` instead of `getSession()`** — getUser() causes 403 on expired tokens
4. **Forgetting `AT TIME ZONE 'Asia/Kolkata'`** in SQL date comparisons — all IST logic must use timezone
5. **Writing `supabase.from('leads').select('*, users(*)')` without disambiguating FK** — causes PGRST201
6. **Modifying env.ts to add hardcoded URLs** — use VITE_ environment variables
7. **Creating new Edge Functions without proper CORS headers** — all functions need OPTIONS handler
8. **Using `NOW()` in cron jobs without timezone conversion** — Supabase runs in UTC

---

## 🗄️ DATABASE REPORTING RULES — ACCURACY MANDATORY

> These rules exist because wrong DB reports cause real business loss. Follow them every single time.

### User Identification
- **ALWAYS use `email` to identify users, NEVER `name`** — multiple users can have the same name (e.g. two "Harmandeep kaur", two "Kajal", two "Saloni Rajput", two "Komal bishnoi", two "Himanshu Sharma")
- When showing reports, always include email alongside name

### Counter Verification (MANDATORY before any report)
- **NEVER trust `total_leads_received` counter alone** — always cross-verify with actual lead count:
  ```sql
  SELECT u.total_leads_received as counter, COUNT(l.id) as actual,
         (u.total_leads_received - COUNT(l.id)) as diff
  FROM users u LEFT JOIN leads l ON l.assigned_to = u.id
  WHERE u.email = 'x@x.com' GROUP BY u.total_leads_received;
  ```
- If `diff != 0` → counter is corrupted, report actual lead count, flag the mismatch
- The authoritative quota formula is: `total_leads_promised - COUNT(actual leads)`, NOT `total_leads_promised - total_leads_received`

### "Who expired on date X" Queries
- **NEVER use `CURRENT_DATE` to check who expired on a past date** — that gives today's snapshot
- To check who expired ON a specific date, filter by `updated_at` or check leads assigned up to that date
- Correct approach: compare actual lead count at point-in-time, not current counter

### Status Audit Rule
- Before reporting any user as "expired" or "active", run this check:
  ```sql
  CASE
    WHEN actual_leads >= promised AND is_active = true  THEN '⚠️ SHOULD BE INACTIVE'
    WHEN actual_leads < promised  AND is_active = false AND payment_status='active' THEN '⚠️ SHOULD BE ACTIVE'
    ELSE '✅ OK'
  END
  ```
- Fix mismatches immediately before reporting

### Plan daily_limit Values (Actual DB values)
| Plan | daily_limit in DB | total_leads_promised |
|------|------------------|----------------------|
| starter | 5 | 50 |
| supervisor | 7 | 80 |
| weekly_boost | 12 | 92 |
| turbo_boost | 14 | 108 |
| manager | 8 | 176 |

### Key DB Triggers on `leads` table
- `trg_check_limit_insert` (BEFORE INSERT) — blocks new lead if user at daily limit. Uses actual `COUNT(*)` from leads table with IST date (NOT `leads_today` counter).
- `trg_check_limit_update` (BEFORE UPDATE) — blocks reassignment if user at daily limit. Uses actual `COUNT(*)`. Disable for admin overrides: `ALTER TABLE leads DISABLE TRIGGER trg_check_limit_update;` — **always re-enable immediately after**
- `trigger_update_user_lead_count` (AFTER UPDATE/INSERT) — auto-increments `leads_today` + `total_leads_received` when `assigned_to` changes. Also auto-deactivates when `total_leads_received >= total_leads_promised`. **Do NOT also call `increment_user_lead_counters` — that would double-count**
- `trg_safety_net_assign` (BEFORE INSERT) — safety net for leads inserted with `status='New'`. Does NOT manually update counters — lets AFTER trigger handle it.
- When manually assigning leads via DO block: update `total_leads_promised` FIRST (before assignment) to prevent auto-deactivation trigger mid-loop

### Manual Lead Assignment Checklist
```
□ Disable trg_check_limit_update
□ Update total_leads_promised for all target users FIRST (+N per user)
□ Run round-robin UPDATE on leads (trigger handles counters automatically)
□ Re-enable trg_check_limit_update immediately
□ Verify: SELECT actual_leads, counter, quota_remaining for each affected user
□ Report with email + name + actual count
```

---

## 🐛 Bug Fix History — See `bugfix.md`

> **ALL developers and LLMs: Read `bugfix.md` before debugging ANY issue.**

The file `bugfix.md` (project root) is the authoritative log of every bug found and fixed in this system. It contains:
- Root cause analysis for each bug
- Exact SQL/code used to fix it
- Verification queries to re-run and confirm fix is still live
- Historical over-delivery analysis (why 100+ past users got extra leads)

**Two critical audit queries always available in `bugfix.md`:**

```sql
-- 1. Counter drift check (run anytime, should always return 0 rows)
SELECT u.email, u.total_leads_received AS counter, COUNT(l.id) AS actual,
       u.total_leads_received - COUNT(l.id) AS drift
FROM users u LEFT JOIN leads l ON l.assigned_to = u.id
WHERE u.role = 'member'
GROUP BY u.id, u.email, u.name, u.total_leads_received
HAVING u.total_leads_received != COUNT(l.id);

-- 2. Over-quota active users (run weekly, should always return 0 rows)
SELECT email, name, total_leads_promised,
       (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) AS actual_leads
FROM users u
WHERE is_active = true AND total_leads_promised > 0
  AND (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) >= total_leads_promised;
```

**Rule: After fixing any bug, add an entry to `bugfix.md` immediately with date, root cause, fix SQL, and verification query.**

### Bug Fix Index (Quick Reference)

| ID | Date | Summary | Fixed In |
|----|------|---------|----------|
| BUG-001 | 2026-05-24 | `total_leads_received` counter drifts from actual lead count | `trigger_update_user_lead_count` + one-time sync |
| BUG-002 | 2026-05-24 | 10 over-quota users stayed active (business loss) | Manual deactivation query |
| BUG-003 | 2026-05-24 | Daily limit trigger used stale `leads_today` (IST/UTC gap) | `check_lead_limit_before_insert` → now uses COUNT(*) |
| BUG-004 | 2026-05-24 | Safety net trigger double-incremented `leads_today` | `process_stuck_lead` — removed manual UPDATE |
| BUG-005 | 2026-05-24 | `get_best_assignee_for_team` PASS 2 had reversed ordering | RPC PASS 2 `plan_weight DESC` → `ASC` |

---

## 🧪 Post-Change Verification Checklist

After ANY code change, verify these work:
```
□ Admin dashboard loads without errors
□ Member dashboard shows assigned leads
□ New webhook lead gets assigned correctly
□ Push notification fires on lead assignment
□ Payment webhook activates user plan
□ leads_today counter increments correctly
□ total_leads_received counter increments correctly
□ Night backlog leads get assigned at 10AM
```

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph (881+ nodes, 7700+ edges, 205 files).
ALWAYS use the code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### Graph Tools Priority (MANDATORY)

Before ANY file read/grep/glob operation:
1. Call `detect_changes_tool` (for change review)
2. OR `get_impact_radius_tool` (for modification impact)
3. OR `semantic_search_nodes_tool` (for code discovery)
4. OR `get_architecture_overview_tool` (for structural questions)

Only use Read/Grep/Glob on files the graph output specifically suggests.

If graph returns empty/stale, run: `code-review-graph build --repo <repo_root>`
Never assume graph is empty without verifying with `list_graph_stats_tool` first.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on session start (via `.claude/hooks/session-start.sh`).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

### Graph Maintenance

- **Auto-update**: Session-start hook runs incremental update automatically.
- **Full rebuild** (if corrupt/missing): `rm -rf .code-review-graph/ && code-review-graph build --repo .`
- **CLI location**: `/root/.cache/uv/archive-v0/-gSBb1nTsdSZGbMYd1r21/bin/code-review-graph`
- **Stats check**: `list_graph_stats_tool` — should show 800+ nodes if healthy.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
