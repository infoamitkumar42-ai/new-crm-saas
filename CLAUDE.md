# CLAUDE.md — LeadFlow CRM

> **READ THIS ENTIRE FILE BEFORE TOUCHING ANY CODE. If you skip this, you WILL break something.**

---

## ⛔ HARD RULES — VIOLATING ANY OF THESE = INSTANT ROLLBACK

0. **ALWAYS use PR workflow — NEVER push directly to `main`**:
   - All changes must go on a feature branch
   - Create a GitHub PR, then merge the PR into `main`
   - Direct push to `main` is FORBIDDEN

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

### 2026-08-14 — Email match-key extended to `send-crm-conversion` + 44 leads backfilled
- **Follow-up to the email-CAPI fix above (same day).** That fix only covered `sheet-lead-intake`'s
  initial 'Lead' event. Checked `send-crm-conversion` (fires QualifiedLead/ClosedDeal/FollowUp on
  status change, origin-pixel-matched) — the events ad optimization actually relies on — and found
  it had **no email match-key either**, and didn't even select `lead_details` from the `leads` table.
- **Fix**: `send-crm-conversion` now selects `lead_details`, reads `lead_details.Email` (same key
  `sheet-lead-intake` writes), validates it, hashes it, and adds `em` to `user_data` — same pattern
  as the sheet-intake fix. `npm run build` clean.
- **Root cause of the missing patch**: the Apps Script (Google-side, outside this repo) never read
  or forwarded an email column at all — confirmed by reading the actual deployed `Code.gs` (v7) the
  admin pasted. Sent a v8 patch (adds `email` to `buildColMap()` + the payload) — admin deployed it
  to the Apps Script project directly.
- **Backfill**: sent a small read-only diagnostic Apps Script function to dump phone+email pairs
  from the Sheet's "new all form" tab (the only tab with an Email column) — 44 pairs found, all 44
  matched existing CRM leads by phone, all had `lead_details.Email` missing. Backfilled via a single
  `UPDATE ... WHERE lead_details ? 'Email' IS FALSE` (JSONB merge, no schema change, no overwrite of
  existing keys). Verified 44/44 rows updated correctly.
- ⚠️ This backfill only fixes **display/data** for those 44 leads and any *future* status-change CAPI
  event on them — it does **not** retroactively resend the initial 'Lead' CAPI event (already sent
  without `em` when each lead was first assigned; Meta doesn't accept event replay for match-key
  corrections). Going forward (patched Apps Script + this fix), new leads get email end-to-end.
- Sent updated `send-crm-conversion` file for manual deploy (MCP `deploy_edge_function` still
  blocked, `-32003`) — not yet live-verified (needs a real status-change event on a lead with email).

### 2026-08-14 — Email CAPI match-key added for sheet-sourced leads (`sheet-lead-intake`)
- **Follow-up to the new form_id 27622038114105519 restriction (same day, see entry below).** Admin
  added an Email field to the new form and asked whether it reaches CRM/CAPI for match-quality —
  live check found **0/20 real leads from this form had an email captured anywhere**: `sheet-lead-
  intake` never read `body.email` at all (silently dropped), and the CAPI payload (`sendCapiLeadEvent`)
  had no `em` (hashed email) field to begin with, regardless of whether the Sheet forwarded it.
- **Fix**: `buildLeadDetails()` now also captures `email` -> `lead_details.Email` (JSONB, no schema
  change). `sendCapiLeadEvent()` takes a new optional `email` param, validates it looks like a real
  email (`isValidEmail` — junk values never get hashed/sent), and adds a hashed `em` array to the
  CAPI `user_data` alongside the existing ph/fn/ln/ct/st/external_id keys — same match-quality
  reasoning as the 2026-08-08 v9 CAPI upgrade. Applies to **every** sheet-sourced lead (not just this
  one form_id) — harmless no-op for forms that don't send an email field.
- ⚠️ **Apps Script side still needs a manual check/patch (outside this repo)** — the Sheet's Apps
  Script must forward the new Email column as a JSON key literally named `email` in the POST body
  it sends to `sheet-lead-intake`, or this fix has nothing to read. Not verified from this session
  (no Apps Script access) — admin needs to confirm the column is being forwarded correctly.
- `npm run build` clean before merge. Sent updated file for manual deploy (MCP `deploy_edge_function`
  still blocked, `-32003`) — not yet live-verified (no real lead with an email has come in yet).

### 2026-08-14 — New mixed-gender form (27622038114105519) restricted to TEAMFIRE + TEAMSIMRAN
- **Admin set up a new Meta ad account/form** for MIXED (male+female) leads, routed through the
  same Google Sheet integration already used for the women-only forms. Requirement: unlike the
  women-only forms, this one must NEVER reach ECO@WIN12/ECOKULWINDER (Simar's/Kulwinder singh's
  dedicated pools) — only `TEAMFIRE` and `TEAMSIMRAN` are eligible.
- **Fix (`sheet-lead-intake` + `process-backlog`)**: new `RESTRICTED_TEAM_FORM_IDS` map
  (`'27622038114105519' -> ['TEAMFIRE','TEAMSIMRAN']`) overrides whatever team_code the
  `sheet_intake_token` itself carries, so this form's routing is correct regardless of which
  existing integration/secret the Apps Script ends up sending it through. This form is NOT
  women-only, so it takes the normal (non-priority) assignment branch in both functions — the
  restriction only narrows the eligible team pool, nothing else about the flow changes. Women-only
  form logic (`WOMEN_ONLY_FORM_IDS`, priority-manager routing) is completely untouched.
- ⚠️ **`TEAMSIMRAN` currently has 0 active users** (23 total, checked live) — until someone on that
  team is active/paid, this form's leads will effectively land on TEAMFIRE only, exactly matching
  the admin's own fallback expectation. No further code change needed when TEAMSIMRAN gets active
  members — they'll automatically join the pool.
- `npm run build` clean before merge. Sent both files for manual deploy (MCP `deploy_edge_function`
  still returns `-32003 requires approval` this session) — not yet live-verified via test invocation,
  pending admin's deploy confirmation.

### 2026-08-13 — August offer extended 2 more days (PR #146) + urgency push notifications
- **Offer extension**: `config/offer.ts` `OFFER.endsAt` → `2026-08-15T23:59:59+05:30` (was
  `2026-08-12T23:59:59+05:30`, already expired by ~11h when caught). `OFFER_ACTIVE` unchanged.
  Backend `PLAN_CONFIG` (`functions/api/razorpay-webhook.ts` + `razorpay-reconcile`) doesn't
  auto-expire on `endsAt` and was already giving correct offer quota throughout — full audit found
  **0 mismatches** between backend quota and what active users actually have (`daily_limit`/
  `total_leads_promised` all correctly synced to their plan via `trg_sync_user_plan_fields`).
- **Urgency push notifications** sent to the 8 active users with lowest remaining lifetime quota
  (`total_leads_promised - actual leads <= 30`) via `send-push-notification`'s direct `user_id`
  payload branch. 5 delivered successfully (PRIYA/goyal.misspriya, Ankush, Ajay kumar, Sameer,
  Ansh). **3 users have no push subscription at all** (Priya Goyal — 13 pending, Asha — 23,
  Priya Bhatiya — 21) — flagged to admin to reach them another way (WhatsApp/direct message).

### 2026-08-11 — RENEWAL-WHILE-ACTIVE FIX: no more instant cutoff mid-day (PRs #137, #138)
- **Follow-up to Ravenjeet Kaur's mid-day renewal cutoff (see earlier entry same day).** Admin
  asked for a permanent fix: an active, currently-earning user who renews/upgrades should finish
  today at their CURRENT plan's pace, and only switch to the new plan starting tomorrow — not get
  instantly deactivated and cut off mid-day like the webhook did before.
- **First proposed a simpler "instant merge" design — admin correctly rejected it.** Would have
  immediately dropped `daily_limit` to the new (possibly lower) plan's value mid-day, which breaks
  badly if the user already received more today than the new limit (e.g. offer-plan daily_limit=26,
  already at 20 today, renews to starter's daily_limit=9 — instantly shows "9" while already at
  20). Admin's proposed fix instead: keep today's plan/pace completely untouched, add the new
  plan's quota into the cumulative total (as already happens), and only flip `plan_name`/
  `daily_limit`/etc at the existing next-day-7-AM-IST cutover point.
- **New column `pending_plan_name`** (nullable text, migration
  `20260811160500_add_pending_plan_name.sql`) — stores the new plan's name for this "deferred
  renewal" case only. NULL for everyone else (brand-new signups, already-inactive renewals) —
  zero behavior change for those, verified by reading every code path that touches `plan_name`.
- **`functions/api/razorpay-webhook.ts`**: now checks the user's CURRENT `is_active`/
  `payment_status` before building the update. If they're already active+earning
  (`wasActiveEarning`), the PATCH body no longer touches `is_active`/`is_online`/`plan_name`/
  `daily_limit`/`plan_weight`/etc — it only adds the new quota to `total_leads_promised`
  (cumulative, unchanged) and stashes the new plan in `pending_plan_name` with the SAME
  `plan_activation_time` (tomorrow 7 AM IST) already computed. Brand-new/inactive-renewal path is
  byte-for-byte the same as before (separate branch, untouched).
- **`supabase/functions/check-quota-expiry/index.ts`**: its existing 7-AM-IST pending-activation
  step now also applies `pending_plan_name -> plan_name` (sequential, one row at a time, only for
  the subset that has a non-null `pending_plan_name`) right after flipping `is_active=true`.
  `trg_sync_user_plan_fields` (already-existing BEFORE UPDATE trigger) auto-derives
  `daily_limit`/`plan_weight`/etc from `plan_config` off the new `plan_name` — no manual config
  lookup needed in this function.
- **`razorpay-reconcile`** (the 15-min backup poller) — admin pasted its current source, applied
  the identical `wasActiveEarning` branch (same `pending_plan_name` stash, same untouched
  brand-new/inactive-renewal path), and **committed it to this repo for the first time**
  (`supabase/functions/razorpay-reconcile/index.ts` — previously lived only on Supabase Dashboard
  with no history, same as `send-crm-conversion` before it). `RAZORPAY_KEY_ID`/`SECRET` and
  `PLAN_CONFIG` copied byte-for-byte from the pasted source — verified against the pasted code to
  confirm no accidental drift in live credentials or plan numbers (the exact BUG-013 risk this
  file's own header warns about). Now a payment picked up by either the webhook OR the reconcile
  poller gets identical deferred-renewal treatment.
- **DB mechanism live-tested before wiring into either function**: created a throwaway test user
  in the exact "deferred renewal" state (active, `plan_name='weekly_boost'`,
  `pending_plan_name='starter'`, `is_plan_pending=true`, `plan_activation_time` in the past), ran
  the same two-step SQL check-quota-expiry will run — confirmed `plan_name` switched to
  `'starter'`, `pending_plan_name` cleared to NULL, `daily_limit` auto-synced 26→9 and
  `plan_weight` 7→1 (starter's correct values) via the trigger, and `is_active` stayed `true`
  throughout (no cutoff at any point). Test row deleted immediately after (`auth.users` +
  `public.users`), 0 left over.
  `npm run build` + `tsc --noEmit` both clean (only pre-existing baseline Deno-import noise, no
  new errors) before merge.
- **Live-verified after deploy**: `functions/api/razorpay-webhook.ts` confirmed live on Cloudflare
  Pages Production at the exact merged commit. `check-quota-expiry` verified with a second
  throwaway test user by invoking the actual **deployed** function (not a local simulation) —
  same result as the DB-mechanism dry run, confirming the real production code works end-to-end.
  Test row deleted after, drift/over-quota re-checked at 0. `razorpay-reconcile` deployed by admin
  directly (no live-invoke test — would have hit the real Razorpay API — reviewed by diff instead).
- Deployed manually via Supabase Dashboard / Cloudflare Pages — MCP `deploy_edge_function` still
  returns `-32003 requires approval` this session.

### 2026-08-13 — Simar's idle team added to the 2 new forms' priority pool (PR #144)
- **Follow-up, same day.** Once the old ad account stopped generating leads, Simar's original team
  (Priya Bhatiya, Parwati, Baljinder kaur) had **zero leads all day** — their dedicated form
  (`26784403284560247`) simply had no incoming traffic anymore, while the 2 new forms' priority
  pool (Kulwinder singh's team only, per PR #142) kept getting leads. Not a bug — a routing gap
  the new-form fix didn't address.
- **Admin decision**: the 2 new forms should now share priority between **both** dedicated teams
  (Simar's + Kulwinder singh's), fairest-first across the combined pool — whoever has more room
  gets the lead. The **old** form stays Simar-exclusive, unchanged (no reason to touch what still
  works).
- **Fix**: `WOMEN_FORM_PRIORITY_MANAGER` values changed from a single manager ID to an array.
  `findManagerScopedAssignee` (`sheet-lead-intake`) and `isPriorityForForm` (`process-backlog`)
  generalized to accept multiple manager IDs, so the priority-pool query naturally spans both
  teams and picks whoever has the lowest fill-ratio. Fallback (`TEAMFIRE`) still only triggers
  once **both** teams are full. `npm run build` + `tsc --noEmit` clean before merge.
- **No backlog to redistribute at the time of the fix** (checked — 0 rows in Night_Backlog/Queued),
  so nothing needed manual reassignment; the 3 idle members will start receiving leads
  automatically as soon as the deploy goes live and new leads arrive.
- Sent both files for manual deploy (MCP `deploy_edge_function` still blocked, `-32003`).

### 2026-08-13 — WRONG PRIORITY MANAGER on the 2 new women-only forms (PR #142)
- **Follow-up bug found immediately after deploying #139/#140.** Live-verified 5 leads leaked to
  TEAMFIRE within ~15 min of that deploy going live, then 2 more leaked to Simar's own team
  (Priya Bhatiya, Priya Goyal) while this fix was being written — both leaks from the SAME root
  cause, caught live via direct queries.
- **Root cause:** the previous fix correctly recognized the 2 new form_ids as women-only, but the
  priority-check still only looked for **Simar's** `manager_id`. The 2 new forms actually belong
  to a **different manager** — **Kulwinder singh (ks6315077@gmail.com)**, who manages both
  `ECO@WIN12` and `ECOKULWINDER` — confirmed by looking up the `manager_id` on the leads that had
  already leaked. Zero eligible candidates were ever found under Simar for these 2 forms, so every
  lead fell straight through to general TEAMFIRE routing instead of Kulwinder's team.
- **Fix:** `WOMEN_FORM_PRIORITY_MANAGER` now maps each form_id to its **own** dedicated manager
  (Simar for the original form, Kulwinder singh for the 2 new ones) in both `sheet-lead-intake`
  and `process-backlog`. `WOMEN_FORM_MANAGER_IDS` (both managers) is used for excluding
  dedicated-team members from non-women-only leads, so the two pools never cross-pollinate —
  fallback always lands in the general team pool (TEAMFIRE), never the other manager's team.
- **All 7 leaked leads manually corrected** (sequential SQL, never pg_net-fanned-out) — 5 moved
  off TEAMFIRE, 2 moved off Simar's team, all onto Kulwinder singh's team per the admin's explicit
  priority order (ECO@WIN12/ECOKULWINDER first, TEAMFIRE only as fallback). Final state: **56
  leads** across the 2 new forms, 100% on Kulwinder singh's team, 0 on TEAMFIRE, 0 on Simar's team.
- Full re-verify after: counter drift **0**, over-quota active users **0**, users over
  `daily_limit` **0**, duplicate phones today **0**.
- **This is the SECOND deploy-then-leak cycle for this same feature** — flagged clearly to admin:
  every live lead continues routing on the OLD (buggy) logic until this fix is actually deployed
  (MCP `deploy_edge_function` still blocked, `-32003 requires approval`). Sent both files again,
  marked urgent.

### 2026-08-13 — Old ECO@WIN12 ad account disabled — 2 replacement forms wired up (PRs #139, #140)
- Old ad account got disabled (Meta policy, one ad flagged). Admin set up **two** new ad
  accounts/forms for the same women-only audience: `1771429337239760` and (found live before
  admin mentioned it) `28656339480638911`, both on the same Google Sheet (new tabs, same sheet —
  no Apps Script change needed) and the same CAPI dataset (`2334725197446887`, confirmed via
  Lead Integration screenshot — Business-Manager-level pixel, survives the ad-account swap).
- `WOMEN_ONLY_FORM_ID` (single string) → `WOMEN_ONLY_FORM_IDS` (array, `.includes()`) in both
  `sheet-lead-intake` and `process-backlog`. Old ID kept (existing/queued leads still carry it).
- **47 leads had already landed under the 3rd form_id (`28656339480638911`) before it was
  recognized** — went through normal team routing instead of the women's-priority path (found
  via routine "check Google Sheet leads" query, admin hadn't yet mentioned this 2nd new form).
  Admin's instruction for this batch specifically: today's 10 newly-activated users (5 new
  ECOKULWINDER signups + 5 ECO@WIN12 renewals — Prema, Toshiba, Jiya, Mansi, jayashri, Shagufta,
  Kulwinder, Lalita, Bhairulal, Suraj) get first priority, TEAMFIRE only as fallback if their
  capacity runs out — a one-time override for today's backlog, not a permanent code change
  (permanent behavior for this form_id follows the same Simar-priority-then-fallback pattern as
  the other 2 women-only forms).
  - Un-assigned 3 leads that had landed on non-priority TEAMFIRE members (Himanshu, Ravenjeet,
    Harmandeep) via the still-undeployed old code, then sequentially (never pg_net-fanned-out)
    redistributed all 47 across the 10 priority users by fill-ratio. Priority pool's combined
    free capacity (124) comfortably covered the 47 — TEAMFIRE fallback never triggered.
  - **2 more leads leaked to TEAMFIRE (Asha, Himanshu) mid-fix** — arrived live via
    `sheet-lead-intake` while the code fix was committed but not yet deployed (MCP
    `deploy_edge_function` still blocked, admin deploys manually). Caught and reassigned to the
    priority pool the same way. Final split: all 49 leads on the 10 priority users, 0 on
    TEAMFIRE, drift 0, no one over `daily_limit`.
  - ⚠️ **This leak stops once the admin deploys the updated files** — sent both function files
    for manual deploy, flagged urgency since every live lead until then still routes on the old
    2-form-ID logic.

### 2026-08-11 — 8 leads found missing from Meta's Google Sheet + women-only-form routing audit
- **Admin uploaded a Meta CSV export (44 leads, 10-Aug, women-only form
  `26784403284560247`, "team simar ad campaing", 3 ad variants).** Cross-checked against the
  CRM: 36/44 present (8 assigned, 27 Queued/Night_Backlog, 1 Invalid), **8/44 completely
  missing from the CRM.**
- **Root cause confirmed via two Apps Script diagnostics run by admin (not an Apps Script or CRM
  bug):**
  - `runMissingCheck()` searched all live tabs for the 8 missing phones — **0 found anywhere**
    (Sheet1 correctly excluded as dead/legacy). They never reached the Google Sheet at all.
  - `LEADFLOW STATUS` check showed both live tabs **fully synced**: `"Fresh lead form | 10/05/26"`
    95 rows/pointer 95/pending 0, `"new form"` 381 rows/pointer 381/pending 0 — Apps Script has
    processed every row that ever existed in the Sheet, zero backlog on its side.
  - Conclusion: the gap is **upstream of our system entirely** — Meta's own Lead-Ads-to-Sheet
    write step silently dropped these 8 specific leads before Apps Script could ever see them.
    Same failure class as the documented 30-hour outage (2026-08-09/10), just much smaller in
    scale this time (8 leads over ~16h, intermittent, not a full break). No code fix possible on
    our side for Meta's own write reliability.
  - The 7-day Apps Script error rate (0.25%, ~6 failed runs) admin flagged as a possible cause
    was a red herring here — irrelevant once confirmed the rows never reached the Sheet.
- **Recovered:** all 8 leads manually inserted from the CSV's own data (name, phone, city/state,
  education/profession/DOB, correct `form_id`) as `status='Queued'` — same recovery pattern as
  the earlier 152-lead outage import. Will route automatically via the existing Simar-first /
  general-pool-fallback logic in `process-backlog` once daily capacity frees. Zero duplicates
  verified before insert (checked all 8 phones against existing `leads` rows).
- **Separately audited the women-only-form routing "leak" the admin flagged** (male/non-Simar
  users receiving this form's leads despite the block). Confirmed via code read
  (`sheet-lead-intake` + `process-backlog`) this is the **existing approved fallback design**
  (2026-08-08 decision: Simar's team gets first refusal, then the lead falls through to the
  general eligible pool once Simar's team is at capacity, rather than sitting in `Queued`
  forever). Admin re-confirmed this is exactly the wanted behavior ("block ni karna baki team ko
  leads lene ke liye... na queued mein rakhna hai") — **no code change made**, current behavior
  already matches the requirement.
  - Historical scale check: over 4 days, 61 of 111 form-id leads (55%) fell through to the
    general pool — expected given Simar's team is only 4 active users (36 leads/day capacity)
    against this form's volume (44 leads in a single day's CSV alone).
  - Spot-checked several fallback instances against Simar-team members' daily counts at that
    exact moment — some showed apparent free capacity (e.g. Parwati/Baljinder kaur at 0/9) yet
    the lead still fell through. Traced the assignment function (`findManagerScopedAssignee`) —
    query logic itself is correct (requires `is_active`+`is_online`+`payment_status='active'`,
    picks lowest fill-ratio first). Most likely explanation is those users were briefly
    **offline** at that exact moment — `is_online` has no historical log
    (`last_active_at` is NULL for all checked users), so this can't be proven retroactively.
    Not a confirmed bug; flagged for future traceability (optional: add a log line recording
    which Simar candidates were considered + their online state, offered to admin, no decision
    yet).

### 2026-08-11 — `handle_new_user()` ROOT CAUSE FIXED — team_code NULL bug will not recur
- **Follow-up to the entry directly below.** Root cause found: it was never a random "sync gap" —
  `handle_new_user()` had an **explicit, deliberate block**:
  ```sql
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'member') = 'member' THEN
      v_team_code := NULL;
  END IF;
  ```
  guaranteeing `team_code = NULL` for **every single new member signup**, 100% of the time — not
  a rare glitch. Comment in the old code suggests the original design intended member routing to
  resolve team via `manager_id`, but the actual lead-routing code (`get_best_assignee_for_team`
  RPC, `process-backlog`, `sheet-lead-intake`) all filter on `u.team_code` directly, never via a
  manager join — hence the mismatch, and why this kept resurfacing (3 confirmed hits: 07-Jul,
  08-Aug, 11-Aug).
- **Fix (approved, full `CREATE OR REPLACE` shown before applying per rule 4)**: removed the
  member→NULL override. `team_code` is now taken directly from signup metadata for both member
  and manager roles, exactly matching what the signup form already sends (verified every prior
  audit case had the correct value sitting unused in `raw_user_meta_data`). Nothing else in the
  function changed.
  **Live-tested**: inserted a throwaway `auth.users` row with `role:'member',
  team_code:'TESTTEAM_VERIFY'` — resulting `public.users` row correctly showed
  `team_code='TESTTEAM_VERIFY'` (previously would've been NULL). Test rows deleted immediately
  after (`auth.users` + `public.users`), 0 left over.
- **Batch-fixed all 34 previously-flagged `team_code IS NULL` members** (from the wider audit) by
  setting each from their own `raw_user_meta_data.team_code` — same precedent fix, just applied to
  all of them now instead of one at a time. All 34 were unpaid/inactive so this was zero-risk
  (no live routing changed for them). Only `canary-test-samson@...` remains NULL — a monitoring
  test account whose metadata never had a team_code to begin with; correctly left alone.
- **Parampreet kaur topped up to her full daily quota**: was 5/9, given 4 more from the eligible
  TEAMFIRE/ECO@WIN12 backlog (excluding the women-only form, she's not Simar-scoped) — now
  **9/9**, `total_leads_received` (9) matches actual lead count exactly.
- **Full re-verify**: counter drift **0**, over-quota active users **0**, `team_code IS NULL`
  members remaining **1** (the canary account, expected).

### 2026-08-11 — Parampreet kaur (parampreetk082@gmail.com) — signup-sync gap, 3rd occurrence
- **Symptom:** admin asked why she (starter plan, August-offer `daily_limit=9`) had only 5 leads
  today despite being active/online.
- **ROOT CAUSE — same `handle_new_user()` signup-sync gap as Priya Bhatiya (2026-07-07) and
  Harmandeep kaur (2026-08-08), 3rd confirmed case.** `auth.users.raw_user_meta_data.team_code`
  correctly had `'TEAMFIRE'` from signup (2026-08-10), but it was never synced into
  `public.users.team_code` — that column was **NULL**. With no team_code, she was invisible to
  every team-based routing check (`get_best_assignee_for_team` RPC, `process-backlog`'s team
  filter, `sheet-lead-intake`'s team check) — her 5 leads so far leaked through some permissive
  fallback path rather than normal routing, well under her offer `daily_limit=9`.
- **Fix:** `team_code` set to `'TEAMFIRE'` from her own signup metadata (not defaulted) — same
  precedent fix pattern as the two earlier cases. She's now eligible for normal team-based
  round-robin.
- **Wider audit re-run**: 34 more `team_code IS NULL` users found, but every one of them is either
  `plan_name='none'` (never paid) or `is_active=false`/`payment_status≠'active'` — none currently
  lose leads from this. One exception to watch: `kajal123@gmail.com` has `plan_name='supervisor'`
  set but is inactive — would hit the same bug if ever reactivated without a team_code fix first.
  Not batch-fixed this time (flagged to admin, offered as a zero-risk follow-up); the underlying
  `handle_new_user()` trigger itself still isn't patched, so **this will keep recurring for every
  new signup** until that's fixed — 3 independent hits now (07-Jul, 08-Aug, 11-Aug).

### 2026-08-11 — Ravenjeet Kaur mid-day renewal cutoff — temp override, over-assign found + fixed, cleanly resolved
- **Symptom:** admin asked why `ravenjeetkaur@gmail.com` (weekly_boost regular, TEAMFIRE) stopped
  getting leads today despite having 152 leads of quota left.
- **ROOT CAUSE (not a bug — a design gap):** `functions/api/razorpay-webhook.ts` (line ~220-256)
  applies the SAME "deactivate now, activate tomorrow 7 AM IST" logic to **every** payment,
  including renewals of an **already-active, currently-earning** user. She had already received
  12 leads today (well within her weekly_boost `daily_limit=26`) when a new payment for a
  **different, lower** plan (`supervisor`, ₹1,499, `daily_limit=11`) landed at 15:00:02 IST. The
  webhook instantly set `is_active=false`, `is_online=false`, `is_plan_pending=true`,
  `plan_activation_time='tomorrow 07:00 IST'` — cutting her off from the rest of TODAY's leads
  even though her prior plan still had quota and daily capacity left. `total_leads_promised`
  (1217) / `total_leads_received` (1065) confirmed no drift, no quota-expiry — purely a timing
  side-effect of the renewal webhook's blanket next-day-activation rule.
- ⚠️ **Wider pattern, not Ravenjeet-specific**: any active user who renews/upgrades mid-day gets
  the same instant cutoff, losing the rest of that day's already-active-plan capacity. Flagged to
  admin; **not fixed** (would need a deliberate webhook logic change — separate approval, out of
  scope for today's ask).
- **Admin decision**: reactivate her for the REST of today only (not a permanent fix). Discovered
  `trg_sync_user_plan_fields` (BEFORE UPDATE trigger) force-overwrites `daily_limit`/`plan_weight`
  from `plan_config` on every single `users` UPDATE keyed off `plan_name` — so simply flipping
  `is_active=true` would NOT have worked; the trigger would keep re-locking `daily_limit` to
  supervisor's 11, and she was already at 12/11 for the day (blocked instantly by
  `trg_check_limit_insert`'s actual-COUNT(*) check).
  **Fix applied**: temporarily set `plan_name='weekly_boost'` (her real plan for the rest of
  today) so the trigger sets `daily_limit=26`/`plan_weight=7`, plus `is_active=true`,
  `is_online=true`, `is_plan_pending=false`, `plan_activation_time=NULL`.
  `total_leads_promised`/`total_leads_received` were **NOT touched** — her real cumulative quota
  (1217/1065) is unaffected by this display-plan swap.
- ⚠️ **Second bug found — the temp override caused a real over-assignment (12→30 actual, 4 over
  the agreed 26 cap).** Root cause: the renewal webhook's `leads_today: 0` reset wiped out the
  fact she'd already received 12 leads earlier today — it did **not** reset the DB's actual lead
  count (still 12), only the `leads_today` counter column. `process-backlog`'s own internal
  per-run capacity check reads that counter (`freshUser.leads_today`, not actual `COUNT(*)`), so
  it thought she had a full 0→26 window instead of 12→26. A burst of 18 Sheet leads landed almost
  simultaneously (`15:40:01–15:40:02` IST — near-concurrent inserts, each transaction's snapshot
  not yet seeing the others' commits, the same race-condition class as the documented pg_net-fanout
  bug, this time from real concurrent webhook traffic hitting a suddenly-very-available, high
  `plan_weight` user). Net result: 12 (before reset) + 18 (after) = 30, 4 over the intended cap.
  `trg_check_limit_update`'s actual-COUNT(*) check should have blocked once she hit 26 but the
  near-simultaneous transactions each read a stale pre-commit count, exactly like the earlier
  documented race.
- **Fix applied**: capacity-checked the whole ECO@WIN12/TEAMFIRE pool — found **0 free daily slots
  anywhere else** (every other active user was exactly at their own `daily_limit`), so reassigning
  the 4 excess leads to someone else would have just pushed the over-quota problem onto a different
  user. Instead, un-assigned the 4 **most recently landed** leads (the literal overflow, fairest —
  last-in-first-out) back to `Night_Backlog` (`assigned_to`/`user_id` → NULL) so they flow normally
  once capacity frees at the midnight IST reset, same as any other backlog lead — no one else's
  quota touched. Verified: her `today_actual` back to exactly **26**, `total_leads_received` (1079)
  matches actual lead count exactly (drift 0).
- **Cleanly resolved (no more manual-revert dependency)**: restored her to the **exact original
  pending state** the webhook had set before the temp override — `plan_name='supervisor'`,
  `is_active=false`, `is_online=false`, `is_plan_pending=true`,
  `plan_activation_time='2026-08-12T01:30:00Z'` (unchanged from the original payment, = tomorrow
  07:00 IST). `daily_limit` auto-synced back to `11` via `trg_sync_user_plan_fields`.
  `total_leads_promised`/`total_leads_received` (1217/1079) untouched throughout — her real quota
  accounting was never at risk.
  **This means tomorrow's existing `daily-quota-check` cron (jobid 14, 7:00 AM IST) will activate
  her automatically** (`is_plan_pending=true AND plan_activation_time<=now` is exactly what that
  cron already looks for) — **no manual SQL needed anymore**, the earlier-flagged manual-revert
  task is no longer outstanding.
- Full system re-verify after all of the above: counter drift **0**, over-quota active users **0**,
  users over their `daily_limit` **0**.

### 2026-08-11 — NIGHT_BACKLOG PERMANENTLY STUCK: root cause + fix (PR #129)
- **Symptom:** sheet leads sat in `Night_Backlog`/`Queued` for days and the 10 AM cron +
  10-min sweeper never placed them, even though TEAMFIRE had free daily slots all day.
- **ROOT CAUSE — source-label vs `sheet_intake_tokens` routing mismatch.**
  `process-backlog`'s `resolveTeamCodes()` derived the allowed team list from the lead's
  `source` string: `'GoogleSheet-ECO@WIN12'` → `['ECO@WIN12']`. But that label deliberately
  carries **only the first team** — it was shortened on 2026-08-06 (`teamCode.split(',')[0]`)
  so the label wouldn't read `GoogleSheet-ECO@WIN12,TEAMFIRE`. The **real** routing lives in
  `sheet_intake_tokens.team_code` = `'ECO@WIN12,TEAMFIRE'`.
  So live intake (`sheet-lead-intake`) could place a sheet lead with **either** team, while the
  backlog sweeper could only ever place it with **ECO@WIN12 — 3 active users, 27 slots/day**,
  who saturate every single day. Effective backlog pool was 3 users / 27 slots instead of
  **21 users / 263 slots**. This also explains why Simar's team kept getting old mixed leads all
  day: backlog leads had nowhere else to go. ⚠️ **Pattern to remember: never derive routing from
  a display/label string — read the table the live path reads.**
- **Fix:** `resolveTeamCodes()` now takes a `sheetTeamMap` built once per run from
  `sheet_intake_tokens` (inactive tokens skipped), keyed *first team → full team list*. If no
  token matches, it falls back to the old label-derived behaviour so nothing regresses.
  Meta-page routing and the form-based Simar/Priya-Goyal exclusion are untouched.
- **Backlog cleared the same hour** via an equivalent **sequential** SQL pass (one assignment
  visible to the next — per the standing "never fan out lead assignment through `pg_net`" rule),
  using the token table for team resolution and preserving the form-based exclusion.
  **214 → 70 backlog, 129+ leads distributed.**
- **Verified after:** today 299 assigned = **243 fresh-Sheet + 56 fresh-Meta-webhook + 0
  recycled** (recycle pool is still `enabled:false`); counter drift **0**; over-quota active
  users **0**; users over `daily_limit` **0**.
- ⚠️ **The remaining ~70 are capacity-blocked, not bug-blocked** — sheet-eligible pool is
  263 daily slots and all 263 were consumed. They flow at the midnight IST reset. The real
  constraint is now the same one flagged 2026-08-08: incoming volume exceeds what active
  buyers can absorb.
- Deployed manually via Supabase Dashboard — MCP `deploy_edge_function` / `get_edge_function`
  still return `-32003 requires approval` in this session.

### 2026-08-10 (evening) — SHEET INTAKE OUTAGE RESOLVED + Apps Script v7
- **ROOT CAUSE (30-hour outage, 9 Aug 10:59 → 10 Aug 18:18):** Meta's Google-Sheet
  authorization expired ("Authorisation required… reauthorise with Google Sheets" on the
  Lead Integration page). Meta kept collecting leads but stopped writing them to the Sheet.
  **Nothing on our side was broken** — Apps Script ran every 10 min and returned "Completed"
  each time, CRM endpoint was healthy, intake token active. Proof: the Sheet's own last row
  (`2026-08-09T00:28:44-05:00` = 10:58:44 IST) matched the CRM's last lead (10:59:02 IST)
  to within 18 seconds, and sheet rows (1932) ≈ CRM sheet-leads (1936) — i.e. every row that
  ever reached the Sheet had been processed. ⚠️ **Diagnostic lesson**: consistent 2-4s
  "Completed" runs mean *no new rows found*, not "working" — a silent-success failure mode.
- ⚠️ **Reconnecting RESTRUCTURED the spreadsheet.** Admin removed + re-created the
  integration, and Meta then created **one tab per form** — `new form` (18 cols) and
  `Fresh lead form | 10/05/26` (20 cols) — while the old `Sheet1` (25 cols) went dead.
  This is exactly the column-layout risk that was flagged before the Remove.
- **Apps Script v6 → v7 (complete rewrite, deployed by admin).** v6 read only `Sheet1` and
  had **hardcoded column positions** (`FORM_OVERRIDES`), so post-restructure it silently sent
  0 leads. v7:
  - reads **all tabs** except `Sheet1`, so a future new form/tab needs no code change;
  - builds the column map **from header names**, not positions — `FORM_OVERRIDES` is now
    obsolete and deliberately removed (the new per-form tabs have headers that match their
    data exactly, verified from a live header dump);
  - keeps a **per-tab pointer** (v6's single global pointer had stuck on `Sheet1` and
    blocked everything);
  - **advances the pointer only on HTTP 200**, so a CRM/network failure re-sends next run
    instead of silently dropping the lead (v6's real risk);
  - `MAX_PER_RUN=60` guards the 6-min Apps Script timeout; LockService prevents overlap;
  - filters Meta's `"You don't have enough permissions"` cell text and `<test lead>` rows so
    they never become lead details.
  - Live-verified: 26 leads sent, **26 assigned, 0 Invalid, 0 Queued**, counter drift 0,
    and both forms' fields captured correctly (women's form → Education/Profession/
    Experience/DOB/State; normal form → Education/Experience/City).
- **Manual CSV recovery of the outage backlog: 152 leads imported and assigned.**
  136 normal-form + 16 women's-form leads from Meta CSV exports.
  - ⚠️ **Mistake made and fixed:** the first attempt pushed leads through
    `sheet-lead-intake` via `net.http_post` in paced batches. `pg_net` is **async**, so ~29
    concurrent requests all read the same stale per-user lead count and **29 of 32 leads
    landed on one user** (Ravenjeet Kaur, 39 vs her limit of 26). Caught immediately,
    un-assigned all 29 (counters verified back to exact prior values, drift 0), and redid the
    whole distribution with a **sequential SQL loop in one transaction**, where each
    assignment is visible to the next iteration. Final spread was correct and within every
    daily limit. **Never fan out lead assignment through pg_net — it cannot be paced safely.**
  - ⚠️ **`trg_check_limit_insert` enforces `users.daily_limit` and IGNORES
    `daily_limit_override`.** Any capacity calculation must use `daily_limit` or the trigger
    will reject the insert (hit live with Ansh: override 12, daily_limit 9).
  - The 16 women's-form leads were assigned to Simar's team + Priya Goyal **4 each via a
    one-time daily-limit override** (admin decision — they were all already at 9/9). Used the
    documented checklist: `ALTER TABLE leads DISABLE TRIGGER trg_check_limit_update` … re-enable,
    all wrapped in a single `BEGIN/COMMIT` so the trigger can never be left disabled if
    anything fails. `total_leads_promised` was **not** touched (they had 40-72 lifetime quota
    left, so no auto-deactivation risk). Trigger confirmed re-enabled afterwards.
- **Duplicate audit (admin asked).** No lead was assigned twice: zero repeated phones among
  today's 178 leads. However **3 phones** in the imported set belong to people who had already
  submitted before and are held by other agents (`7738782904` now with 3 agents; `9204174123`
  already `Contacted` by another agent). This is the documented 2026-08-06 rule working as
  intended (repeat form-fills are treated as fresh leads, double-calling risk accepted), not a
  bug. Wider context: **93 phones system-wide sit with 2+ active agents — only 2 came from
  today's import, 91 pre-date it.** Flagged to admin; no cleanup done yet.

### 2026-08-10
- **ADMIN-CONTROLLED RECYCLE POOL — steps 1 & 2 of 3 live (PRs #122, #123).** Admin decision:
  recycled leads sirf TEAMFIRE ko jaani chahiye (ECO@WIN12 + Simar ke managed users ko bilkul
  nahi), abhi mostly fresh leads rakhni hain, aur admin dashboard se ek soft on/off switch chahiye
  jisse zaroorat par har user ko 2-4 recycled leads mil sakein.
  - **Step 1 (DB, PR #122)**: naya `system_config` row `recycled_pool_control` =
    `{"enabled": false, "max_per_user_per_day": 3, "allowed_team_codes": ["TEAMFIRE"]}` + 2 RLS
    policies. **No schema change** (`system_config` already had `config_key`/`config_value` jsonb).
    ⚠️ **Key finding**: `system_config` had **RLS ENABLED with ZERO policies**, so the frontend
    (anon/authenticated key) could not read or write it at all — only service_role could. Without
    the new policies an admin toggle would have rendered, accepted clicks, and **silently done
    nothing**. Policies are scoped to `config_key = 'recycled_pool_control'` ONLY, and use
    `is_admin()` (role='admin' only, hardened `search_path`) rather than `is_admin_or_manager()`
    so managers can't alter lead distribution. No INSERT/DELETE policy — admin can update that one
    row, never create/remove config rows. Verified live via simulated JWTs: admin sees exactly 1
    row (other 14 invisible), admin UPDATE on `distribution_enabled` affects **0 rows**, member
    sees **0 rows**, and service_role still sees all 15 rows incl. `plan_fresh_config` so the
    recycler is unaffected. Migration recorded at
    `supabase/migrations/20260810120000_add_recycled_pool_control_config.sql`.
  - **Step 2 (`assign-recycled-leads`, PR #123)**: function ab wo config padhta hai. Teen rules —
    (a) **master switch**, (b) **team allowlist** plus an independent `manager_id` guard so Simar's
    users stay excluded even if their `team_code` ever changes, (c) **per-DAY cap**.
    ⚠️ **Real bug found and fixed here**: the old cap was **per-batch**, and the cron runs 6×/day,
    so turbo_boost users were getting up to 24/day — live check that afternoon showed Kajal /
    Mary Janjot / Nitinluthra had **already received 12 recycled leads that day**. The new code
    counts today's already-assigned recycled leads (one aggregate query, keyed by user) and caps
    against that, applied in **both** the boost and old-plan branches so it holds even if
    `OFFER_MODE` is ever flipped to false.
    **Fail-safe**: missing row, read error, non-positive cap, or empty team list all resolve to
    **OFF**. Fresh lead distribution (`meta-webhook`, `sheet-lead-intake`, `process-backlog`,
    `get_best_assignee_for_team`) is untouched by this function and keeps running regardless.
    Deployed manually via Supabase Dashboard (MCP `deploy_edge_function` / `apply_migration` /
    `get_edge_function` / `get_logs` all still return `-32003 requires approval` this session).
    Live-verified both states: OFF → `pool_enabled:false` + 0 leads; ON → `users_processed: 21`
    (exactly the 21 TEAMFIRE users, zero ECO@WIN12, matching an independent SQL simulation) with
    `leads_assigned: 0` because every one of them was already at/over the 3/day cap. That zero is
    also positive proof the per-user counter reads correctly — had the map been broken/empty,
    `dayCapRemaining` would have been 3 and leads *would* have gone out. Config restored to
    `enabled:false` after testing; counter drift re-verified **0**; all ECO@WIN12/Simar users
    confirmed at `recycled_today = 0`.
  - ⚠️ **Deliberately NOT done**: nobody's `recycled_leads_quota` was reduced. That's a delivery
    promise to paying offer users (**1,516 leads currently owed** across active members) — the
    master switch controls *pace* without breaking the commitment. The pre-existing recycle-pool
    over-commitment warning (1,085 owed vs ~790 pool, flagged 2026-08-08) still stands.
  - **Step 3 (admin dashboard UI, PR #125)**: naya `components/RecyclePoolControl.tsx` — ON/OFF
    switch, 1–5 ka per-user-per-day cap, aur har active member ka daily view (effective daily
    limit, aaj deliver hui fresh vs recycled split, bachi hui, lifetime quota remaining) + ek
    4-stat rollup. Allowed teams **read-only** dikhte hain (SQL se hi badalte hain) taaki UI se
    galti se lead distribution widen na ho jaye.
    ⚠️ **Silent-failure guard (important pattern)**: RLS bina error diye **0 rows** update kar
    sakti hai. Isliye har save ke baad component value ko **dobara padh kar compare** karta hai —
    agar persist nahi hui to explicit error dikhta hai, jhoota "Saved" kabhi nahi. Yehi bug-class
    thi jiski wajah se step 1 zaroori tha.
    Aaj ke numbers `leads` table se actual count hote hain, `leads_today` counter par bharosa
    nahi (CLAUDE.md DATABASE REPORTING RULES).
    **Blast radius jaan-boojh kar chhota**: `AdminDashboard.tsx` mein sirf **2 lines** (import +
    render) — component apna data khud fetch karta hai, us file ki baaki logic bilkul untouched.
    (Us file ke apne header mein "🔒 LOCKED v2.0" likha hai, par CLAUDE.md ki official LOCKED
    list mein wo nahi hai — phir bhi minimum-touch approach liya gaya.)
    Verified: `npm run build` clean; admin JWT se `users` (27) + aaj ki `leads` (173) readable;
    component jo **exact** write karta hai (poora `config_value` object replace, `jsonb_set` nahi)
    wo admin ke roop mein **1 row** update karta hai; panel ke totals independent SQL se
    cross-check kiye (400 daily limit, 62 fresh, 93 recycled, 245 remaining, 27 active members);
    saare tests ke baad live config abhi bhi `enabled:false` — koi residue nahi.
- **August offer extended 2 more days + `getOfferForPlan()` endsAt bug fixed (PR #120).**
  Live check found `OFFER.endsAt` (2026-08-09 23:59 IST) had already passed while `OFFER_ACTIVE`
  was still `true` — `isOfferLive()` (endsAt-aware) correctly hid the dashboard `OfferBanner.tsx`
  and the Subscription page's top gradient banner, but `getOfferForPlan()` (used by
  `Subscription.tsx`'s pricing cards) only ever checked `OFFER_ACTIVE`, never `endsAt` — a bug
  flagged-but-not-fixed back on 2026-08-06. Result: cards kept showing the "🔥 AUGUST OFFER" badge
  and inflated lead-counts even after the offer had technically expired. Admin decision: keep the
  offer live 2 more days AND fix the bug. `OFFER.endsAt` → 2026-08-12 23:59 IST;
  `getOfferForPlan()` now derives from `isOfferLive()` like the banner does, so cards and banner
  can never drift out of sync again. Backend (`functions/api/razorpay-webhook.ts` `PLAN_CONFIG` +
  DB `plan_config` table) deliberately **not touched** — verified both still hold offer-era quota
  values with no expiry logic tied to them at all, so new payments were already getting offer
  quota throughout — exactly matching "keep offer live," nothing to fix there. `npm run build`
  verified clean before merge. ⚠️ Recycle-pool over-commitment flagged 2026-08-08 (1,085 owed vs
  ~790 pool, not widened) still applies and is now more relevant with 2 extra offer days — not
  re-verified or fixed here, flagging again so it isn't missed.
- **`sheet-lead-intake` v11 + `process-backlog` — pawangoyal1927@gmail.com (Priya Goyal, TEAMFIRE,
  not managed by Simar) added to the women-only-form priority pool.** Admin request: route her the
  same as Simar's managed team for the ECO@WIN12 women-only form (`form_id=26784403284560247`),
  without changing her `manager_id` (would incorrectly move her under Simar for reporting purposes
  elsewhere). Implemented via a new explicit `EXTRA_WOMEN_FORM_USER_IDS` list checked alongside
  `manager_id === SIMAR_MANAGER_ID` in both functions' priority-pool and other-form-exclusion
  logic. Deployed manually via Supabase Dashboard (MCP `deploy_edge_function`/`get_edge_function`
  calls returned `MCP error -32003: MCP tool call requires approval` repeatedly this session, never
  resolved) — admin pasted the code in directly. Live-verified: with Simar's actual team fully
  saturated (9/9 daily_limit each) and Priya Goyal holding spare capacity, a real test lead with
  the women-only form_id was correctly assigned to her; test lead deleted and her counters
  (`leads_today`, `total_leads_received`) reverted afterward, drift re-checked at 0.
  ⚠️ **Not fully "ecowin-exclusive" yet**: her `team_code` is still `TEAMFIRE`, so she remains
  eligible for native `meta-webhook`-sourced TEAMFIRE leads and `assign-recycled-leads` recycled
  leads — full exclusivity would need `get_best_assignee_for_team` RPC changes (rule 4 approval
  required), not done, flagged to admin, no decision yet.
- ⚠️ **ECO@WIN12 Google-Sheet intake channel found dead ~25+ hours** (last lead received
  2026-08-09 10:59 AM IST, zero since — confirmed again still zero as of this entry). Root cause
  not yet found: `sheet_intake_tokens` is active, function deploy is confirmed working (see above
  test), so the break is upstream — most likely the Apps Script `checkNewLeads` trigger itself
  (admin showed a Google Apps Script dashboard screenshot citing a "0.19–0.22% error rate," which
  is misleadingly low — real DB evidence shows a near-total outage, not a minor error rate). Needs
  the actual error text from the Apps Script Executions tab (no Apps Script MCP access in this
  session) — admin asked to check and hasn't reported back yet. **Real ad spend is being wasted**
  while this is unresolved (see the 10-Aug ads report cross-check below).
- **10-Aug ads status report cross-checked against DB — large, real discrepancy found.** Report
  claimed 2,280 combined Meta leads (Aug 5–10, both ad accounts) — actual CRM count is only **948
  (41%)**, 1,332 (58%) never arrived. Two separate causes, not "duplicates" (duplicate/invalid rate
  in what DID arrive was negligible, ~1–3%/~3–6%): (1) **Account 2 (Team Ecosystem, routes via
  `GoogleSheet-ECO@WIN12`)** — 653 actual vs 1,704 claimed (62% missing), exactly matching the sheet
  intake outage above (0 leads received Aug 10 despite 162 claimed that day). (2) **Account 1
  (Himanshu, native `meta-webhook`)** — 287 actual vs 576 claimed, but the gap is a suspiciously
  uniform ~48–52% every single day, not random loss — hypothesis (code-evidenced, not yet confirmed
  via Meta Ads Manager since `Meta_Ads` MCP connector isn't authorized in this session):
  `meta-webhook`'s CAPI `Lead` event uses `event_id: lead_${leadId}_${timestamp}`, which does NOT
  match/dedupe against Meta's own native `leadgen_id` — Meta's own "Leads" count in Ads Manager may
  be counting the native in-platform lead AND our server-side CAPI echo as two separate leads,
  inflating the reported total ~2x. Not fixed or further investigated — flagged to admin only.

### 2026-08-09
- **`components/StaleLeadReminder.tsx` v2 — upgraded to a locked "briefing card" (PR #118).**
  Admin decision: soft nudges (v1's instantly-dismissible popup) were not moving the needle — a
  live check on 2026-08-08 showed 20 of 22 notified agents' stale-lead backlog *growing* through
  the day despite repeated pushes, only 2 improving. Rather than a hard eligibility gate (rejected
  after live data showed **28/28 currently-active members would fail a zero-tolerance check**,
  which would have stopped all new-lead distribution — see below), the softer escalation shipped:
  the popup now locks its only dismiss button for 5 seconds (countdown ring + label, no X button,
  no other early-close path) and explains *why* status updates matter (better Meta signal → higher
  lead quality → more deals closed — copy deliberately reframed off "leads are cheap" and onto
  conversion outcomes) before letting the agent through. Still a **soft** nudge: same `staleCount`
  prop, same once-per-IST-day sessionStorage dismiss, zero changes to any lead-assignment RPC/
  function. `npm run build` verified clean before merge.
- ⚠️ **Hard eligibility gate (blocking new leads until this month's leads are updated) — explored,
  NOT built.** Live-verified before any code was written: right now 100% of active members (28/28)
  have at least one August lead still sitting in `Assigned`/`Fresh`. A zero-tolerance version of
  this gate would have made every active member ineligible simultaneously, i.e. new fresh/recycled
  leads would have nowhere to go — a worse outcome than the problem it was meant to fix. Also found:
  enforcing it correctly would require the exact same exclusion logic independently in **4** places
  (`get_best_assignee_for_team` RPC, `sheet-lead-intake`'s inline logic, `process-backlog`'s inline
  logic, `assign-recycled-leads`'s inline logic — confirmed each has its own separate eligibility
  query, none share the RPC). Admin's call: ship the softer briefing-card escalation first, watch
  real compliance data for a few days, revisit a threshold-based (not zero-tolerance) gate only if
  that still isn't enough.

### 2026-08-08
- **August offer RE-EXTENDED by 2 days** (PR #109) — `endsAt` = 2026-08-09 23:59 IST,
  `OFFER_ACTIVE=true`, `razorpay-webhook.ts` + `razorpay-reconcile` (v5) `PLAN_CONFIG` restored to
  offer values, `views/Landing.tsx` cards restored. Recycle-pool was **deliberately NOT widened**
  for this extension (admin said pool will be recalculated separately later) — see capacity warning
  below.
- ⚠️ **Recycle-pool is over-committed — flagged, not fixed.** Existing offer-era users are already
  owed **1,085** recycled leads but the live pool (current narrow criteria) only has **~790**.
  Widening the RPC age-window would raise it to ~1,548 (Pool D). Until that's done, some paying
  offer users may not be able to complete their promised total. Do NOT assume capacity is fine.
- **`stale-lead-reminder` v2** deployed + cron (jobid 27) changed from daily → **every 10 min**:
  - Only **current IST month** leads counted (old backlog leads deliberately ignored — nagging about
    months-old leads is bad UX and they're not actionable).
  - **Per-user cooldown (3h)** via the pre-existing, previously-unused `notification_logs` table
    (no schema change). Without this, a 10-min cron = ~144 push/day/user, agents would mute
    notifications entirely — which would also kill the NEW LEAD alerts they depend on.
    Change `REMINDER_COOLDOWN_HOURS` in the function to tune frequency, not the cron interval.
  - Working-hours guard (8 AM–10 PM IST).
  - Verified live: first run notified 19 users; immediate second run sent **0** (cooldown held).
  - ⚠️ Cron `jobname` still reads `stale-lead-reminder-daily` — it is NOT daily anymore (pg_cron
    has no rename; left as-is to avoid unschedule/reschedule risk). Don't be misled by the name.
  - `views/MemberDashboard.tsx` popup uses the same current-month rule (PR #110).
- Supabase Pro limits checked for the 10-min cron: ~3.2k queries/day + ~2.5k edge invocations/day
  against a 2M/month allowance — **no plan-limit concern**. The constraint was UX, not quota.
- Harmandeep kaur (`harmankaur6661@gmail.com`) had `team_code=NULL` — same signup-sync gap as Priya
  Bhatiya. Her `auth.users.raw_user_meta_data` correctly had `TEAMFIRE`; set from that. This is now
  the **second** confirmed case — a wider audit of `team_code IS NULL` paying users is still pending.
- Offer broadcast push sent to **51 users** (TEAMFIRE / ECO@WIN12 / ECOKULWINDER / ALPHAECO, plus
  anyone who signed up since 2026-06-01). **Gujarat teams excluded** (`GJ01TEAMFIRE` etc. — they had
  zero push subscribers anyway) and `demo@gmail.com` excluded. Copy said "kal raat tak" (accurate to
  the real `endsAt`) rather than "last 24 hours", which would have been ~14h off. Note: live
  subscriber count dropped 51 → 46 during the send because `send-push-notification` auto-deletes
  expired/410 tokens — normal self-cleaning, those users had uninstalled the app.
- ⚠️ **Night_Backlog pile-up found (flagged, will self-clear):** 143 leads in `Night_Backlog`, of
  which **55 were 1–2 days old** (5 from 06-Aug, 50 from 07-Aug). Root cause is **daily-limit
  saturation, not a bug**: total team capacity is 289/day and on 07-Aug it was fully consumed
  (21 of 22 users hit their exact `daily_limit`), because recycled leads and fresh leads compete for
  the same `daily_limit` slots. So the 10 AM `morning-backlog` cron had nowhere to place them.
  Capacity at time of check today: 289 total, 19 used — the backlog should clear at the 10 AM run.
  **Underlying tension remains**: incoming volume + recycler output exceeds what active buyers can
  absorb, so fresh leads age 1–2 days before delivery (colder leads, wasted ad spend).
- **`sheet-lead-intake` v6→v8 — form-based manager routing + CAPI signal + mutual exclusivity**
  (PRs #112, #113, #114). Admin need: leads from a specific Meta form (women/girls-only) must go
  ONLY to users managed by simar@forever.com (`SIMAR_MANAGER_ID`), while leads from every OTHER
  form (including a confirmed second form_id, `2419407918566414`, tied to a second page — also
  connected to this same sheet/system, needs no special routing of its own) must NEVER land with
  Simar's managed users — full mutual exclusivity, not just one-directional.
  - **v6**: added form-based routing (initial `WOMEN_ONLY_FORM_ID` guess was wrong — see v7) via
    new inline `findManagerScopedAssignee()` (manager-scoped fairness check, no fallback to the
    general pool if nobody under Simar is eligible — a leak would defeat the whole point). Also
    added the FIRST-EVER Meta CAPI signal for this Google-Sheet lead channel (`sendCapiLeadEvent()`)
    — verified zero CAPI code existed here before, despite a `pixel_config` row for team_code
    ECO@WIN12 existing live since 2026-07-08.
  - **v7**: `WOMEN_ONLY_FORM_ID` corrected `2419407918566414` → `26784403284560247`. The wrong value
    was inferred from an unrelated Apps Script column-mapping override comment; admin caught it via
    a real Meta ad screenshot showing the actual running ad's `form_id`. Redeployed same-turn given
    live misrouting risk.
  - **v8**: two fixes. (1) The normal (non-women's-form) branch called the shared
    `get_best_assignee_for_team` RPC directly, which has no way to exclude Simar's managed users —
    Priya Bhatiya was still eligible there, violating the mutual-exclusivity requirement. Fixed with
    a new inline `findTeamAssigneeExcludingManager()` mirroring the RPC's exact 2-pass eligibility/
    fairness logic (60%/100% daily-limit gate, `fill_ratio ASC, plan_weight DESC`) plus a manager
    exclusion — kept inline, not an RPC change, per rule 4, so it only affects this intake channel.
    (2) `sendCapiLeadEvent`'s initial 'Lead' event matched pixel by a static first-team label
    (always 'ECO@WIN12') regardless of actual assignment, while the SAME lead's later status-change
    CAPI events (`send-crm-conversion`) correctly match by the actual assignee's `team_code` —
    verified live this often resolves to TEAMFIRE's pixel since ECO@WIN12 has almost no active
    members. A lead's CAPI events could split across two pixels, fragmenting Meta's signal. Fixed:
    now fetches the actually-assigned user's `team_code` fresh and fans out to every matching active
    pixel (same team_code-match + dedupe-by-pixel_id approach as `send-crm-conversion`), so a lead's
    whole CAPI lifecycle always lands on the same pixel(s).
  - Apps Script needs a small patch to forward `form_id` in its webhook payload (sent to admin
    separately) — the CRM-side form_id constant was fixed in v7 after that patch was sent, but the
    patch itself is form-id-agnostic so it didn't need resending.
  - Live-tested (v8): non-women's-form lead correctly assigned to a normal TEAMFIRE user, not
    anyone under Simar; women-only-form lead correctly stayed within Simar's team (queued, since
    Priya Bhatiya was at her exact daily limit at test time — confirms the no-fallback rule, not a
    bug). Test leads deleted, counters reverted, drift re-verified 0.
  - **Still open, not yet actioned**: admin mentioned an ad_id (`ag:120254621573720309`) "needs
    adding too" — exact required action is unclear and not yet implemented; needs clarification
    before doing anything with it (no ad_id field currently flows through this intake payload at
    all).
- **`send-crm-conversion` v4→v5 — ORIGIN-BASED pixel matching (ECO@WIN12's pixel was dead for 7
  days).** Admin noticed ECO@WIN12's dataset had received nothing since 01-Aug. Root cause was NOT
  a broken pixel/token: this function matched the pixel by the **assigned agent's** `team_code`, but
  sheet leads are generated by ECO@WIN12's own ads and mostly *worked* by TEAMFIRE agents (verified:
  last 7 days, 356 sheet leads → TEAMFIRE users vs only 19 → ECO@WIN12 users). So conversions from
  ads ECO@WIN12 paid for were being credited to TEAMFIRE's pixel, and the account actually paying
  had no signal to optimise on — directly raising its CPL, while TEAMFIRE's pixel was polluted.
  Fix: for leads whose `source` is `GoogleSheet-<originTeam>`, match the pixel by that **origin**
  team only. Every other lead keeps the exact v4 matching (page_name OR assignee team_code),
  untouched. If an origin team has no active pixel row the event logs `skipped_no_pixel` rather
  than falling back to the worker's pixel (wrong-account signal is worse than none). Live-verified:
  a sheet lead assigned to a TEAMFIRE agent now sends `QualifiedLead` to pixel `2334725197446887`
  (TEAM ECO SIMAR), `result='sent'`, real `fbtrace_id`. **This function is now tracked in the repo**
  (`supabase/functions/send-crm-conversion/`) — previously it lived only on Supabase with no history.
- **`sheet-lead-intake` v9→v10 — women-only form now FALLS BACK instead of queuing.** v6's
  no-fallback rule was my own over-strict reading; the admin never asked for it. Live effect: Priya
  Bhatiya (the only active user under Simar, `daily_limit=9`) fills up long before that form's daily
  volume, so women's leads piled into `Queued` — and **nothing ever re-processes `Queued` leads**
  (unlike `Night_Backlog`, which the 10 AM cron sweeps), so they would have rotted there
  permanently. Correct rule per admin: Simar's team gets **first refusal**, and once their daily
  limit is full the rest flow to the normal pool like any other lead. The reverse rule is unchanged
  and still strict — other forms never reach Simar's managed users. Both live-verified with test
  leads (women's form → Manav/TEAMFIRE via fallback; normal form → Prince/TEAMFIRE; neither under
  Simar). Test leads deleted, counters reverted, drift 0.
- **v9 CAPI match-quality fix (`meta-webhook` v38 + `sheet-lead-intake` v9)**: the initial `Lead`
  event used `action_source: 'crm'`, which is **not a valid Meta enum** — `send-crm-conversion` v3
  had already found and fixed this for status-change events, but the fix was never ported to either
  channel's initial Lead event. Evidence it was silently failing: Meta's Events list for TEAMFIRE's
  pixel shows only QualifiedLead/FollowUp/ClosedDeal and **no `Lead` row at all**, despite 150+
  fresh leads/day being assigned. Also enriched `user_data` with `ln`, `st` and `external_id` to
  match what `send-crm-conversion` already sends. Note `capi_event_log`'s CHECK constraint only
  allows the 3 status events, so `Lead` events are never logged there — this was invisible from the
  DB and only surfaced from a Meta screenshot.
- **Apps Script v6 deployed** (admin applied): now forwards `form_id` in the webhook payload.
  Verified live — `form_id` populated from 15:40 IST onward; before that all 514 recent sheet leads
  had `form_id IS NULL`, meaning the women's-form routing had been completely inert since it was
  built. ⚠️ **`FORM_OVERRIDES` in that script must NOT be removed** — I briefly disabled it on a
  wrong assumption (that it was dead code because `form_id` wasn't in the payload). It is not dead:
  `resolveMapForRow()` reads `form_id` straight from the **sheet row** (col 8), never from the
  payload, so it has always been active. The two forms genuinely occupy different columns —
  normal form (`2419407918566414`): name col14, phone col15, city col16; women's form
  (`26784403284560247`): name col15, phone col16, dob col17, state col18. Removing the override
  makes every normal-form lead's name `p:+91…` and its phone the city → instant `Invalid`.
- DB: 4 women's-form leads stuck in `Queued` were assigned one-at-a-time via
  `get_best_assignee_for_team` (sequential, so round-robin fairness held — all 4 went to different
  users). Drift re-verified 0.
- **`process-backlog` — form-based manager routing added (mirrors `sheet-lead-intake` v10).** The
  backlog sweeper had no form awareness, so it was a hole in the mutual-exclusivity rule: a
  normal-form lead that queued could be handed to one of Simar's managed users at the next 10 AM
  run, and a women's-form lead got no priority for Simar's team. Now: women's form → Simar's team
  first refusal, then full-pool fallback; every other form → Simar's users excluded. Applied **only
  when the lead carries a `form_id`** — leads created before the Apps Script started forwarding it
  (2026-08-08 ~15:40 IST) keep the pre-existing behaviour, since guessing would either starve
  Simar's team or leak leads to it; that legacy set only shrinks. Deploy verified live (the new
  `form` counter appears in the function's own debug output) and the partition verified by SQL
  simulation (normal form → 22 eligible / Priya blocked; women's form → Priya first; fallback → 22).
  End-to-end assignment proof waits for capacity to reset at midnight IST.
  - ⚠️ **The repo copy of `process-backlog` was STALE before this change** — it still had the old
    hardcoded Himanshu/Simran manager logic, while the deployed version had been rewritten to use a
    generic `resolveTeamCodes()` team filter (detectable because the live debug output returns a
    `team` key where the repo version returns `manager`). The current file is now built on the real
    deployed source. **Before editing any Edge Function, verify the repo copy matches what is live**
    — several functions here have been edited directly in the Supabase dashboard.
- **`process-backlog` already sweeps `Queued` leads** (`status IN ('New','Night_Backlog','Queued')`)
  — an earlier claim in this session that nothing re-processes `Queued` was wrong. Queued sheet
  leads were piling up purely because of zero daily capacity, not a missing sweep: a live invocation
  returned `leads_found: 100, distributed: 0` with `capacity: 22` of 23 users rejected.
- ⚠️ **Capacity, not routing, is now the binding constraint.** 169 sheet leads sit unassigned
  (126 `Night_Backlog` + 43 `Queued`) against only **19 slots of daily capacity left** across 22
  active users. The women's form alone is ~2/3 of sheet volume (~80/day) versus Simar's team
  capacity of 9/day. No code change fixes this — it needs more active users or less ad spend.

### 2026-08-07
- **August offer ended, then found: recycler cron was wrongly disabled with it.** Offer-end initially
  disabled cron job 22 (`recycled-afternoon-batch`) too, thinking it was purely offer-specific. Caught
  before real damage: 25 active offer-era users still had large unclaimed `recycled_leads_quota`
  (e.g. Mandeep kaur/Kajal/Mary Janjot/Nitinluthra owed 127 each) — leaving the cron off would have
  permanently stranded their promised total (RPC's fresh-quota gate would eventually block further
  fresh leads too, since `fresh_leads_received` never increments in practice). Cron re-enabled,
  manually triggered once to verify (41 recycled leads assigned across 8 users, counter drift 0,
  0 over-quota), and 6 automatic runs/day (11AM–9PM) continue as before. Recycler is NOT purely
  offer-specific — normal (pre-offer) `PLAN_CONFIG` also has non-zero `recycled_count` per plan.
- **Own mistake, caught and fixed same-day**: while manually verifying the recycler re-enable,
  triggered a `demo@gmail.com` test-payment reprocessing bug — deleting a `payments` row (done
  yesterday to "revert" the ₹1 Razorpay test) broke `razorpay-reconcile`'s idempotency check
  (dedupes on `razorpay_payment_id` existing in `payments`), so its 15-min cron re-discovered the
  same payment on Razorpay's side as "new" and fully re-activated the demo account with real offer
  quota overnight — it then received 1 real recycled lead ("Rani") that should have gone to an
  actual paying member. Fixed: reassigned that lead to a real user (Harmandeep kaur, lowest fill
  ratio), reverted demo account to its true original state (`is_active=false`, `total_leads_promised=50`),
  fixed `recycled_leads_received` counters on both sides. Counter drift re-verified: 0. **Lesson**:
  never delete a `payments` row to "undo" a test/reconcile-processed payment — it breaks the
  self-healing dedup and causes reprocessing. Correct the affected `users` row fields directly instead
  and leave the `payments` row in place as history.
- Priya Bhatiya (`pbhatiya769@gmail.com`, real ₹999 starter payment, signed up 2026-06-26) had
  `team_code=NULL` — meaning zero fresh leads could ever route to her (recycled-only). Root cause:
  her `auth.users.raw_user_meta_data` had the correct signup-time team (`ECO@WIN12`) but it was never
  synced into `public.users.team_code`. Fixed by setting it from the metadata (not defaulted to
  TEAMFIRE) — now eligible via the existing `ECO@WIN12,TEAMFIRE` multi-team routing. Worth a wider
  audit: other `team_code IS NULL` paying/active users may have the same signup-sync gap.
- **New feature**: stale-lead status reminder (CAPI quality). Agents often call/WhatsApp a lead and
  never update its status afterward — no status change means `trg_send_crm_conversion` never fires,
  so Meta CAPI never gets a quality signal for that lead. Soft-nudge approach (PR #107): dashboard
  popup (`components/StaleLeadReminder.tsx`, mounted in `MemberDashboard.tsx`) shown to an agent when
  they have leads at `status='Assigned'/'Fresh'` for 24h+, re-appears each new IST day until resolved
  (sessionStorage-scoped dismiss, not permanent). Paired with a new `stale-lead-reminder` Edge
  Function + daily cron (jobid 27, 12 PM IST) sending the same nudge as a push notification —
  manually verified live (200, notified 22 users with real stale leads).
- **Razorpay account migration**: switched to a new Razorpay account (LeadFlow Technologies,
  proprietorship, GST-registered, live mode). Updated: Cloudflare Pages env vars
  (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `VITE_RAZORPAY_KEY_ID`, `RAZORPAY_WEBHOOK_SECRET`),
  `config/env.ts` fallback `RAZORPAY_KEY_ID`, `razorpay-reconcile` edge function's hardcoded keys.
  End-to-end verified with a real ₹1 test payment (Payment Link, `demo@gmail.com` test account) —
  webhook + reconcile backup both confirmed working after Cloudflare Pages redeploy; test payment
  and its quota effect on the demo account fully reverted afterward.
- **August offer ended** (PR #105). Only NEW payments from now on get normal (pre-offer) quota —
  `config/offer.ts` `OFFER_ACTIVE=false`, `functions/api/razorpay-webhook.ts` + `razorpay-reconcile`
  (v4) `PLAN_CONFIG` reverted, `views/Landing.tsx` pricing cards reverted, recycler cron (job 22)
  disabled. **Existing offer-era users' `total_leads_promised`/`daily_limit` deliberately untouched**
  — verified post-revert (Mandeep kaur, Kajal still `daily_limit=33`, Gurdeep still `9`). DB
  `plan_config` table was **deliberately NOT reverted** — see `OFFER-PLAYBOOK.md` header for why
  (the `sync_user_plan_fields` trigger reads it live on every `users` UPDATE, not just at signup;
  reverting it now would silently drop existing offer users' `daily_limit` on their next lead).
  **Follow-up still pending**: `plan_config` table needs a proper cohort-safe revert so *new*
  post-offer signups also get the correct (lower) `daily_limit` pacing — right now new starter/etc.
  buyers still get offer-era daily_limit even though their `total_leads_promised` is correctly capped
  at the normal (lower) total, so no over-delivery, just faster-than-advertised pacing until fixed.
- **Bug found (not yet fixed, flagged only)**: `getOfferForPlan()` in `config/offer.ts` only checked
  `OFFER_ACTIVE`, never the `endsAt` date — so `Subscription.tsx`'s pricing-card offer overlay would
  never auto-expire on its own even after `endsAt` passed (only the top banner's `isOfferLive()` did).
  Moot now that `OFFER_ACTIVE=false`, but worth fixing before ever relying on `endsAt` alone again.

### 2026-08-06
- DB: 13 leads from earlier today that were wrongly stuck at `status='Duplicate'` (created before the
  v37/v5 deploy went live) manually reassigned via the same `get_best_assignee_for_team` RPC, one at a
  time (sequential, so round-robin fairness stayed intact — no single user got a bulk dump). Counter
  drift check re-run after: 0 mismatches. **Follow-up fix**: initially wrote an audit note into
  `leads.notes` for these 13 ("Manually reassigned... v37 retroactive fix") — forgot `notes` renders
  directly on the member dashboard lead card, so this internal admin note was visible to the assigned
  agents. Cleared (`notes = NULL`) on all 13 same-day. Lesson: `leads.notes` is user-facing, never use
  it for internal/audit annotations.
- Himanshu Sharma's `total_leads_promised = 1,000,001` confirmed by admin as an **intentional
  unlimited-quota override**, not corrupted data (see Known Issues #6) — do not flag or "fix" in
  future reports.
- **Deliberate business-rule change (admin decision, not a bug)**: `status='Duplicate'` removed
  from both `meta-webhook` (v36→v37) and `sheet-lead-intake` (v4→v5). Purana behavior: same phone
  number kabhi bhi pehle system mein aaya ho (chahe mahino purana), naya submission ko forever
  `Duplicate` status pe insert karta tha aur **kabhi kisi ko assign nahi hota tha**. Caught via
  direct comparison against real Meta Ads Manager screenshots — genuine same-day leads (4 of 30 for
  TEAMFIRE, 2 of 25 for Digital Skills India) were sitting unassigned in the CRM despite being real,
  fresh prospect interest. Naya behavior: sirf ek **10-minute retry guard** rehta hai (Meta/Apps
  Script ke webhook double-fire se bachata hai), genuine repeat form-fills ab bilkul fresh lead ki
  tarah normal round-robin (`get_best_assignee_for_team`) se assign hote hain — koi special-casing
  original owner ko nahi milti (explicit admin choice, double-calling risk accepted). PR #101.
- DB: `razorpay-reconcile` v2 redeployed with corrected 5-plan offer `PLAN_CONFIG` — this function
  (15-min cron, direct Razorpay API poll) turned out to be processing most live payments, since the
  Cloudflare webhook (`functions/api/razorpay-webhook.ts`) has a documented history of silent
  failures (BUG-006). It had its own separate, never-updated `PLAN_CONFIG` copy that was missed
  during the August offer rollout, causing two real paying offer-customers (Ravenjeet Kaur, Kajal)
  to receive stale/wrong quota — corrected manually for both, then the function's config fixed to
  match `functions/api/razorpay-webhook.ts` exactly.
- DB: `get_best_assignee_for_team` RPC — `ORDER BY` precedence swapped from `plan_weight DESC,
  fill_ratio ASC` to **`fill_ratio ASC, plan_weight DESC`** (both PASS 1 and PASS 2). Old order gave
  high-tier users strict priority regardless of how many leads they'd already received today,
  causing total starvation for low-tier users on low-volume days (observed: one user 11 leads,
  another 0). New order is proportional-fairness-first (whoever's furthest from their daily quota
  goes first), with plan tier only deciding ties.
- DB: Himanshu Sharma's stale `daily_limit=14` (should've been 33 after the offer) traced to a
  hardcoded per-user-ID special case inside `sync_user_plan_fields` trigger that hadn't re-fired
  since the plan_config update. Fixed via harmless self-`UPDATE` to force re-sync. Also reset his
  `fresh_leads_quota` (not the old `PRIORITY_USER_BLOCKED` hardcoded-14-cap flag in meta-webhook,
  which would've bypassed round-robin fairness) so he participates normally via the RPC path.
- DB: `sheet_intake_tokens.team_code` for ECO@WIN12 changed to `'ECO@WIN12,TEAMFIRE'` (multi-team
  routing, already supported by the RPC) — ECO@WIN12 has zero active members, so its Google-Sheet
  leads were landing in `Queued` forever instead of auto-routing to TEAMFIRE. Also fixed a resulting
  cosmetic bug: one lead's `source` got polluted as `'GoogleSheet-ECO@WIN12,TEAMFIRE'` because the
  function's fallback label used the full multi-team string — `sheet-lead-intake` now uses only the
  first team in the list for the source label (`teamCode.split(',')[0].trim()`).

### 2026-08-04
- **BUG-012**: `App.tsx` ka `lazyWithRetry` deploy ke baad aane wale chunk-404 pe **crash screen**
  dikha raha tha, silent refresh ke bajaye. Do wajah: (1) `try/catch` rejection ko handle kar leta
  tha isliye `index.html` ka strong boot-recovery (`unhandledrejection` par cache-clear +
  cache-busting reload) kabhi trigger hi nahi hota tha; (2) `return window.location.reload()`
  `undefined` return karta hai, jo React ne lazy component samajh kar turant render kiya aur
  reload hone se pehle hi ErrorBoundary mein gir gaya. Fix: caches clear + `?_r=` cache-busting
  reload + `return new Promise<never>(() => {})` taaki React reload tak wait kare. Sentry
  `da7394b932b5448cb45d8709b1245798` (Chrome Mobile/Android) se pakda gaya. Sirf `lazyWithRetry`
  block badla — PWA cleanup, router, auth sab untouched.
- **AUGUST OFFER LIVE — SABHI 5 plans pe** promotional quota (price same, leads badhi, ₹11/lead):
  starter 50→90 (daily 5→9), supervisor 80→136 (6→11), weekly_boost 92→181 (12→26),
  turbo_boost 108→227 (14→33), manager 160→272 (8→14).
  Fresh lead count har plan mein unchanged hai — extra leads recycled pool se aati hain
  isliye ad-cost (COGS) nahi badhta. **Poora ON/OFF runbook: `OFFER-PLAYBOOK.md`.**
  ⚠️ Pool capacity: manager ka ek buyer 196 recycled khata hai, turbo 134 — isliye safe
  buyer-capacity ~16 hai (pool 1,132). 16+ sales pe Pool D (1,996) pe shift karna hoga.
  - `config/offer.ts` CREATED — `OFFER_ACTIVE` master switch + offer numbers (UI ka single source of truth)
  - `components/OfferBanner.tsx` CREATED — dashboard banner (countdown + dismiss, localStorage-backed)
  - `components/Subscription.tsx`, `views/MemberDashboard.tsx`, `views/Landing.tsx` — offer UI
  - `functions/api/razorpay-webhook.ts` — `PLAN_CONFIG` quota (sirf NAYE payments pe lagta hai;
    maujooda active users ka `total_leads_promised` nahi badalta). Purani values file mein
    comment ki hui hain revert ke liye.
  - Landing page pe "Fresh Leads/Day" → "Leads/Day" kiya, kyunki offer mein leads ka ek hissa
    recycled pool se aata hai.
- **BUG-011**: `assign_recycled_leads` RPC live mein hamesha **0 leads** return kar raha tha —
  Gujarat-exclusion filter NULL-unsafe tha (`NOT (l.state ILIKE ... OR ...)`; `state` NULL hone par
  poora expression NULL → har row drop). Eligible pool ke saare 1,046 leads mein `state` NULL tha.
  `COALESCE(l.state,'')`/`COALESCE(l.city,'')` se fix. Pool **0 → 1,140**. Recycler agar bina is fix
  ke ON kar dete to silently kuch bhi assign na hota aur offer under-deliver kar jata.
- DB: `assign_recycled_leads` RPC ka age-window widen kiya — purani window (2–6 mahine, 3 teams)
  **OR** July ki Call Back leads (sabhi teams, dates hard-coded `2026-07-01`–`2026-08-01`).
  Baaki saare guards as-is — khaas taur pe `u.is_active=false OR payment_status IN ('expired','inactive')`,
  yaani **active member se lead kabhi nahi cheeni jaati** (13 aisi July leads deliberately chhodi gayi).
- DB: `plan_config` + `system_config.plan_fresh_config` — offer numbers. Backup:
  `offer_backup_20260804` table (plan_config, system_config, cron job 22, RPC ki purani definition).
- Edge Function `assign-recycled-leads` v11→v12 — naya `OFFER_MODE` flag: boost plans ka
  day-3/5/7 gate bypass (us schedule se weekly_boost ko sirf 12 recycled milti thi, chahiye 97) aur
  `recycled_daily` ki `/2` halving hatai (wo 2-batch-per-day setup ka tha; morning batch jobid 21
  2026-06-06 ko delete ho chuki hai).
- DB: cron job 22 `recycled-afternoon-batch` **activate** (roz 3:30 PM IST). Note: `UPDATE cron.job`
  pe permission nahi hai — `SELECT cron.alter_job(22, active := true/false)` use karo.
- Live test: 8 recycled leads assign hui (Gurdeep 4, Jasnoor 4) — `assigned_at` aaj ka, `created_at`
  original (July) surakshit, `status='Fresh'`, notes clear, purane owner sab inactive, counter drift 0.
- **Recycled leads ka timestamp**: UI already `assigned_at` display karta hai (`MemberDashboard.tsx:1271`),
  `created_at` nahi — isliye recycled lead user ko aaj ki hi dikhti hai. `created_at` deliberately
  untouched rakha gaya (duplicate-detection, date-wise audit queries, CAPI event_time aur khud
  recycler ka age-window usi par depend karte hain).

### 2026-07-14
- `views/MemberDashboard.tsx`: lead qualifying details (lead_details JSONB) redesigned — truncating 2-column grey grid replaced with flex-wrap colored chip badges (🎂 age teal, 💼 profession violet, 🎓 education indigo, 🌱 Fresher amber / ⭐ Experienced green). Raw values normalized at display time only (DB untouched): Meta age buckets `18_-_25` → "18–25 yrs", DOB → computed age, snake_case → Title Case, junk values (Yes/Ye/blank) hidden, unknown future fields → generic chip. `lead_details` field also added to the `Lead` TS interface (was missing).
- `views/MemberDashboard.tsx`: lead action buttons redesigned — Call + WhatsApp are now full-width primary buttons with always-visible labels (labels were `hidden sm:inline`, i.e. invisible on mobile); WhatsApp uses the official brand glyph (new inline `WhatsAppIcon` SVG component, brand green #25D366) instead of generic `MessageSquare`; Note/Report are compact 52px secondary buttons with mini-labels.
- `PRD-B2C.md` CREATED (draft v0.1) — B2C/individual pay-per-lead marketplace PRD: wallet + honest lead-tiering (Exclusive/Shared/Rotation), DIRECT pool architecture, MVP scope, 10 open decision points pending founder brainstorm. NOT final — do not build from it until locked to v1.0.

### 2026-07-09
- Supabase Edge Function `send-crm-conversion` — no code change, but `pixel_config` gained a new active row: `pixel_id=2334725197446887` ("TEAM ECO SIMAR"), `team_code='ECO@WIN12'` — ECO@WIN12's leads now get real CAPI coverage (previously 100% `skipped_no_pixel`). Verified live with a real Meta test event before relying on it.
- DB: manual backfill — ECO@WIN12's only pre-existing missed Interested/Follow-up/Closed tag (Lovepreet Kaur, from before the pixel existed) sent successfully once the pixel went active.
- DB: `handle_new_user()` trigger fixed — was hardcoding `total_leads_promised=50` for every new signup regardless of payment, even though `payment_status`/`plan_name` correctly showed unpaid. This phantom 50 got silently added on top of the real plan quota the first time an affected user actually paid (cumulative-safety math treats it as legitimate pre-existing quota). Changed default to `0`. See `bugfix.md` BUG-010.
- DB: Bhawna chawla (bhanupari23@gmail.com) — real ₹999 starter payment on 2026-07-08 had been double-credited (`total_leads_promised=100` instead of 50) by the above bug; corrected to 50. Also assigned `team_code='ECO@WIN12'` (was NULL / unrouted) per admin instruction so she now receives that team's leads.
- DB: manual lead assignment — 8 ECO@WIN12 leads stuck in `Queued` status (team's daily capacity exhausted by a Night_Backlog catch-up that morning) were round-robin assigned across the 3 active members (`trg_check_limit_update` disabled/re-enabled per the standard manual-assignment checklist), one-time daily-limit top-up only, not a permanent `daily_limit` change.
- DB: `mnkaur5678@gmail.com` (Amandeep kaur) password reset via `auth.users.encrypted_password` (bcrypt, `pgcrypto`'s `crypt()`) — same pattern as the earlier Sukhmani account creation.
- DB: BUG-010 retroactive cleanup — the `handle_new_user()` fix only covers *future* signups; found (via a dashboard screenshot showing "50 total left" on Amandeep's `Plan Inactive` screen) that 34 pre-existing unpaid accounts still carried the phantom `total_leads_promised=50` from before the fix. Corrected all 34 to `0`, strictly scoped to accounts with zero captured payments ever (verified individually — real paying/expired users' legitimate cumulative quota was left untouched). See `bugfix.md` BUG-010 follow-up.

### 2026-07-07
- Supabase Edge Function `razorpay-reconcile` CREATED (v1, `verify_jwt: false`) — polls Razorpay's `/v1/payments` API directly every 15 min and backfills any `captured` payment missing from the `payments` table, using the same `PLAN_CONFIG`/baseline-cumulative-quota/next-day-7AM-IST-activation logic as `razorpay-webhook.ts`. Idempotent (dedupes on `razorpay_payment_id`), always returns HTTP 200.
- DB: `pg_cron` job `razorpay-reconcile-15min` created (jobid=26, `*/15 * * * *`) to invoke the above function automatically.
- Reason: Razorpay webhook (`functions/api/razorpay-webhook.ts`) failed silently a second time on 2026-07-07 (2 real payments — SEEMA RANI `pay_TAaIC81bqGq1ZA`, Ravenjeet Kaur `pay_TAa7wUU9qCp8MV` — went unprocessed) despite the 2026-06-06 www-redirect fix. No Razorpay tool exposes webhook delivery logs, so this adds a self-healing safety net instead of relying solely on webhook delivery. See `bugfix.md` BUG-006 for full details and verification queries.
- Note: Razorpay API keys are hardcoded as constants inside `razorpay-reconcile` (no Supabase secrets-manager tool available in this environment) — same pattern already used for other credentials (CAPI tokens) in this project.
- **Razorpay live API key regenerated** (new key_id `rzp_live_TAhoGz0Jx9Do7e`) — propagated to all locations that needed it:
  - Cloudflare Pages env (Production): `RAZORPAY_KEY_ID` (newly added — did not exist before), `RAZORPAY_KEY_SECRET` (updated existing var), `VITE_RAZORPAY_KEY_ID` (updated existing var, build-time) — all updated then a fresh Pages redeploy triggered (required, since Cloudflare Pages only applies env/secret changes to deployments made *after* the change).
  - `config/env.ts`: hardcoded fallback `RAZORPAY_KEY_ID` (only used if `VITE_RAZORPAY_KEY_ID` is unset at build time) updated from stale `rzp_live_RnAEaa2JKAP8Ow` to the new key — see `bugfix.md` BUG-007.
  - Supabase `razorpay-reconcile` — already had the new key (deployed with it directly).
  - `RAZORPAY_WEBHOOK_SECRET` is a separate credential (signature verification only) and is unaffected by key_id/key_secret regeneration — not touched.
- DB: `handle_new_user()` trigger function fixed — was hardcoding `is_active=true` for every new signup regardless of payment, contradicting its own correctly-set `payment_status='inactive'`/`plan_name='none'` on the same row. Changed to `is_active=false`. See `bugfix.md` BUG-008.
- DB: 11 unpaid signup accounts (TEAMFIRE's Sangeeta + ALPHAECO's 10 — Sukhmani + 9 manager-linked, all verified zero rows in `payments`) deactivated (`is_active=false`). 12 more from the same audit (ECO@WIN12 x7, ECO-SUKH2022 x4, DIGFIG x1 — Rahul) were flagged as the same issue and deactivated in a same-day follow-up pass, after re-verifying zero `payments` rows each. Total across both passes: 23 unpaid signups corrected. `SELECT COUNT(*) FROM users WHERE role='member' AND is_active=true AND payment_status='inactive' AND plan_name='none'` confirmed 0 remaining.
- Supabase Edge Function `send-crm-conversion` v3→v4 — added `'FollowUp'` event, correctly mapped to `status='Follow-up'` (📅 — a lead who showed real interest and is now being nurtured; **distinct from `status='Call Back'`** 🔄, which is just scheduling/logistics and is NOT wired to any CAPI event). `capi_event_log_event_name_check` CHECK constraint updated to allow it.
- DB: new trigger `trg_send_crm_conversion` (`AFTER UPDATE ON leads`) created — calls `send-crm-conversion` server-side via `net.http_post` whenever `status` changes to `Interested`/`Follow-up`/`Closed`. Replaces the old frontend fire-and-forget call (`views/MemberDashboard.tsx` — removed, was `supabase.functions.invoke(...).catch(() => {})`), which audit found could silently never fire (found via `capi_event_log`: a lead tagged `Interested` on 07-06 with zero log entry at all). See `bugfix.md` BUG-009 (includes a same-day correction: first version wrongly mapped `Call Back`→`FollowUp` instead of `Follow-up`→`FollowUp`; 3 leads were sent to Meta under the wrong event name before this was caught — cannot be retracted, documented in bugfix.md).
- Backfill: 5 Interested/Closed leads + 12 Follow-up leads tagged since the active Pixel's creation (2026-06-30) that were missing a `sent` `capi_event_log` row were re-sent — 16/17 succeeded (real Meta `fbtrace_id`s), 1 correctly `skipped_no_pixel` (ECO@WIN12 has no active Pixel/CAPI config, same known gap as before). Deliberately did NOT backfill the full historical gap (881 Interested + 70 Closed + 590 Call Back + 361 Follow-up, mostly pre-dating the current Pixel) — sending months-old CRM outcomes to Meta with a synthetic "now" `event_time` risks skewing signal quality / ad-account review for zero benefit.

### 2026-06-06
- functions/api/[[path]].ts: DELETED — was catch-all proxy to dead Vercel URL, intercepting /api/razorpay-webhook and returning 403 → caused Razorpay to auto-disable webhook after 5 failures
- functions/api/create-order.ts: CREATED — Cloudflare Pages Function for server-side Razorpay order creation; uses env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID fallback
- functions/api/razorpay-webhook.ts: env var fallbacks added — RAZORPAY_WEBHOOK_SECRET and SUPABASE_SERVICE_ROLE_KEY now also check VITE_ prefixed versions (Cloudflare Pages only exposes VITE_ vars by default)
- components/Subscription.tsx: error handling fixed — no longer crashes on non-JSON error responses from /api/create-order
- DB: plan_config table corrected — weekly_boost weight 5→7, total_leads 110→92; supervisor total_leads 105→80; manager weight 5→10 (highest priority)
- DB: recycled-morning-batch cron (jobid=21) deleted permanently — no recycle leads to go out
- DB: All active users recycled_leads_quota = 0 — blocks future recycle lead assignment
- DB: trg_sync_user_plan_fields trigger discovered — overrides plan_weight/daily_limit from plan_config table on every UPDATE; direct SET of these fields is overridden
- DB: Saijel Goel (saijelgoel4@gmail.com) — manually activated weekly_boost (pay_SyDMbJHz4jBGDd ₹1,999); total_leads_promised corrected to 325 (remaining=92)
- DB: PRACHI GARG (prachigarg@flp.com) — manually activated manager (pay_SyDIeM4Wudy5NH ₹2,999); total_leads_promised=264 (remaining=159)
- DB: Saloni Rajput — deactivated, total_leads_promised set to actual (remaining=0); fresh plan will add on top on renewal
- DB: Himanshu Sharma (sharmahimanshu9797) — is_online=true, now receiving leads
- DB: Asha — total_leads_promised corrected to 274 (remaining=50 exact)
- Cloudflare: "Force WWW" redirect rule reversed — was non-www→www (broken); now www→non-www (correct); fixes Sentry TypeError 'text/html' MIME error on iOS Safari

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
6. **Himanshu Sharma (sharmahimanshu9797@gmail.com)** has `total_leads_promised = 1,000,001` —
   this is an **intentional admin-set "unlimited" override**, confirmed by the admin 2026-08-06,
   NOT corrupted data. Do NOT flag this as a data anomaly, do NOT "fix"/reduce it, and do NOT
   compare his `quota_remaining` against other users' plan-based quotas in reports — he's a
   deliberate special case. His `daily_limit` still applies normally (syncs from `plan_config`
   like any other user); only his *total* quota ceiling is intentionally unlimited.

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
| BUG-006 | 2026-07-07 | Razorpay webhook silently drops captured payments, no self-healing | New `razorpay-reconcile` Edge Function + `pg_cron` every 15 min |
| BUG-007 | 2026-07-07 | Stale hardcoded Razorpay key fallback in `config/env.ts` after live key regeneration | Fallback updated to new key_id |
| BUG-008 | 2026-07-07 | New signups defaulted to `is_active=true` with zero payment (free leads) | `handle_new_user()` trigger — `is_active` hardcoded value `true` → `false` |
| BUG-009 | 2026-07-07 | Meta CAPI signal silently never fires for some Interested/Closed tags (fire-and-forget frontend call) | New `trg_send_crm_conversion` DB trigger, server-side + `FollowUp` event added (correctly mapped to `Follow-up` status, not `Call Back`) |
| BUG-010 | 2026-07-09 | Phantom `total_leads_promised=50` at signup doubles quota on first real payment | `handle_new_user()` — default `50` → `0` |
| BUG-011 | 2026-08-04 | `assign_recycled_leads` RPC silently returned 0 leads (NULL-unsafe `NOT (col ILIKE ...)` filter) | `COALESCE(l.state,'')` / `COALESCE(l.city,'')` — pool 0 → 1,140 |
| BUG-012 | 2026-08-04 | Chunk-load failure after deploy showed crash screen instead of auto-recovering | `App.tsx` `lazyWithRetry` — cache clear + cache-busting reload + pending promise |

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
