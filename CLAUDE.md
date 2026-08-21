# CLAUDE.md — LeadFlow CRM

> **READ THIS ENTIRE FILE BEFORE TOUCHING ANY CODE. If you skip this, you WILL break something.**

> ### 📍 Start with `AGENTS.md`, not here
>
> This file is the **long-form reference and changelog** — dense, historical, and best skimmed for
> the area you are touching. The tool-neutral entry point for anyone (or any agent) working on
> this repo is:
>
> | File | Purpose |
> |---|---|
> | **[`AGENTS.md`](./AGENTS.md)** | Rules + the traps that have actually caused damage. Read first. |
> | [`docs/SYSTEM-OVERVIEW.md`](./docs/SYSTEM-OVERVIEW.md) | How the system works end to end. |
> | [`docs/AGENT-PROTOCOL.md`](./docs/AGENT-PROTOCOL.md) | Required workflow for making and proving a change. |
> | [`bugfix.md`](./bugfix.md) | Every bug ever found. Check before debugging. |
> | [`docs/sessions/`](./docs/sessions/) | Per-session logs, including dead ends worth not repeating. |
>
> The hard rules below are duplicated in `AGENTS.md`. If the two ever disagree, fix both.

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

### 2026-08-21 — UNITEDECOSYSTEM added to the ECO@WIN12 women's-form pool as an EQUAL member
- **Why**: Kirti's own ad (form `1377999317060769`) was shut down by the admin — CPL too high, poor
  results. UNITEDECOSYSTEM's 31 active members (279/day capacity, **2,749 leads still owed**) had no
  other supply, so they needed to come onto the ECO@WIN12 sheet alongside Simar's, Kulwinder singh's
  and Kamaldeep's teams.
- ⚠️ **Admin's first instruction was "UNITEDECOSYSTEM first priority, TEAMFIRE hata do" — measured
  against live volume BEFORE building, and it would have starved three teams.** This form supplies
  **~167 leads/day** (7-day actual, form `28656339480638911`), while UNITEDECOSYSTEM **alone can
  absorb 279/day**. Strict first-refusal would have consumed the entire daily supply and left
  ECO@WIN12 / ECOKULWINDER / FASTMOVERS — **15 paying members, 853 leads owed, currently taking
  ~139/day between them** — at exactly **zero**. Shown to admin with the numbers; admin chose equal
  round-robin, and chose to **keep TEAMFIRE as the end fallback** rather than removing it.
- **Implemented**: `KIRTI_MANAGER_ID` (`kirtidkgiri@gmail.com`) added to
  `WOMEN_FORM_PRIORITY_MANAGER` for both live women-only forms, in `sheet-lead-intake` **and**
  `process-backlog`. Added as a **manager**, not hardcoded user ids (same reasoning as the 2026-08-18
  Kulvir case) — all 36 UNITEDECOSYSTEM members sit under her, so future signups join automatically.
  No strict-priority code needed: the existing lowest-fill-ratio pass gives UNITEDECOSYSTEM the
  largest share anyway, purely because their capacity is largest.
- ⚠️ **DB change was ALSO required — code alone would have silently failed on the backlog path.**
  `process-backlog` applies its `teamCodesForLead` filter **before** the priority narrowing, so
  UNITEDECOSYSTEM would have been dropped before `isPriorityForForm` ever ran. Exactly the gap
  documented for FASTMOVERS on 2026-08-18. Fixed by `sheet_intake_tokens.team_code` →
  `'ECO@WIN12,TEAMFIRE,FASTMOVERS,UNITEDECOSYSTEM'`. ECO@WIN12 stays **first** in that list so the
  `source` label (`GoogleSheet-ECO@WIN12`) and therefore the CAPI pixel match are unaffected.
- ⚠️ **`KIRTI_MANAGER_ID` deliberately NOT added to `WOMEN_FORM_MANAGER_IDS`** (the exclusion list).
  UNITEDECOSYSTEM has its own non-women-only form which takes the normal branch — adding her there
  would have excluded her own team from their own form's leads.
- **Verified by SQL simulation of the new pool**: UNITEDECOSYSTEM 31 users/279 cap → ~106 leads/day
  (63%), FASTMOVERS 7/67 → ~25, ECOKULWINDER 5/47 → ~18, ECO@WIN12 4/38 → ~14, plus Priya Goyal
  (the `EXTRA_WOMEN_FORM_USER_IDS` entry) → ~3.
- ⚠️ **SUPPLY IS THE REAL CONSTRAINT, NOT ROUTING.** Pool demand is **422/day** against **167/day**
  supply — 40% coverage. UNITEDECOSYSTEM's members are on `starter` (9/day promised, 90 in 10 days);
  at ~106/day across 31 people that's **~3.4/day each, so ~25 days instead of 10**. Clearing all
  3,602 owed leads across the four teams takes **~21 days** at current volume. Recommended to the
  admin: scale the **existing** ECO@WIN12 campaign ~2.5x rather than launching a new one — Kirti's
  new-campaign experiment is exactly what just failed on CPL, while this campaign is proven.

### 2026-08-20 — BUG-017: reactivation deadlock in `update_user_lead_count` — 23 paying members stuck "Plan Inactive" with real quota left
- **Found from a member screenshot** (Ajay kumar, `ajayk783382@gmail.com`) — dashboard showed
  "Plan Inactive" with **17 leads still left (719/736)**, not quota-exhausted. Admin asked to fix
  him AND check whether the underlying logic could do this to anyone else who genuinely deserves
  leads.
- **Root cause — `trigger_update_user_lead_count`'s DECREMENT branch (fires when a lead is taken
  away from a user — reassignment, recycling, any admin correction) required `payment_status =
  'active'` to reactivate someone.** But `payment_status='inactive'` is exactly what the trigger's
  own INCREMENT branch sets when it first deactivates someone for hitting quota. So once a user was
  correctly deactivated for exhausting their quota, and LATER had a lead removed from their count
  for any reason (genuinely reopening room under their `total_leads_promised`), this trigger could
  never bring them back — its own condition required the state only a successful reactivation would
  produce. `payment_status` also wasn't written at all in this branch, only `is_active` — so even
  fixing the condition alone would've left `is_active=true` next to a stale `payment_status=
  'inactive'`, which every OTHER query that filters on `payment_status` (`check-quota-expiry`,
  `plan-expiry-notifier`) would still treat as inactive.
- **Scale**: live query found **23 real paying members** in exactly this signature
  (`is_active=false`, `payment_status='inactive'`, real `plan_name`, `total_leads_received <
  total_leads_promised`) — quota owed ranged 1 to 67 leads, **~323 leads total** being wrongly
  withheld. Not every one of the 23 is provably caused by this exact mechanism — this repo has a
  long history of one-off manual SQL corrections (`MASTER_FIX_LEADS.sql` etc.) that could
  independently leave the same signature — but this is a real, reproducible bug in an always-on
  trigger, and it's the only currently-active code path that can produce this outcome.
- **Fix**: decrement branch's reactivation condition now checks `plan_name <> 'none' AND
  total_leads_promised > 0 AND (actual count) < total_leads_promised` (same intent check the
  increment branch and `check-quota-expiry`'s own activation pass already use) instead of requiring
  `payment_status = 'active'`, and now sets `payment_status = 'active'` alongside `is_active = true`
  so both fields land in the same consistent state every other activation path already produces.
  Increment branch and all counter math untouched.
  `supabase/migrations/20260820134500_fix_reactivation_deadlock.sql` (full `CREATE OR REPLACE`,
  admin-approved per rule 4).
- ⚠️ **BATCH CORRECTION WAS TOO BROAD — admin caught it, 13 of the 23 reverted the same evening.**
  The batch pass filtered ONLY on "quota remaining > 0" and never checked **when the user last
  paid**. That swept in long-dormant accounts alongside genuine current customers: MUSKAN (last
  payment **13-Feb**, last lead 27-Apr), PRIYA GOYAL/`priyajotgoyal` (last payment **14-Feb**, last
  lead 28-Feb), Reetika + Saloni Rajput (May), Saijel Goel + PRACHI GARG + Simranjit kaur + Rajni +
  Sanju rani (June), Arsh adiwal + Goldy + Seema Rani (10-Jul), Suman (14-Jul). Several had been
  **deliberately** closed out months earlier — CLAUDE.md's own 2026-06-06 entry records Saloni
  Rajput being deactivated with `total_leads_promised` set to actual (remaining **0**); her current
  67 "remaining" is phantom, created later when leads were reassigned AWAY from her, not quota she
  was ever owed. Reactivating these would have handed out free leads.
- **Reverted** all 13 pre-August payers back to `is_active=false`, `is_online=false`,
  `payment_status='inactive'`. Verified first that **only Suman had received anything** (2 leads at
  21:00 IST, which took her to exactly 132/132 — naturally quota-complete, so no correction owed);
  the other 12 got **zero** leads, so the revert is clean with no lead movement to undo.
- **10 genuine August-cycle payers kept active** (last payment 3–6 Aug, still receiving leads
  normally): Gurdeep Kaur, Sameer, Ajay kumar, Priya Goyal (`pawangoyal1927`), Manav, Ankush, PRIYA
  (`goyal.misspriya`), Ansh, Nitinluthra, Jasnoor Kaur. Ajay kumar — the original report that
  surfaced this bug — is in this group and correctly stays active with his 17 leads.
- ⚠️ **LESSON — "quota remaining" alone does NOT mean "deserves leads".** `total_leads_promised`
  minus `total_leads_received` can be inflated by leads being reassigned away from a user (the
  decrement path), by historical manual SQL corrections, or by an admin closing an account without
  zeroing quota. Any future batch reactivation MUST also check last captured payment date, and
  should be shown to the admin as a list before being applied — not applied and then reported.
- **Verified after revert**: counter drift 0, over-quota active users 0, 0 users left in the
  `is_active=true`/`is_online=false` desync state.
- ⚠️ **v2, SAME DAY — admin's follow-up ("kya unka quota pending tha?") found where phantom quota
  actually comes from, AND that the v1 trigger fix was itself dangerous.**
  **`assign_recycled_leads` MOVES a lead, it does not COPY it** — it UPDATEs `leads.assigned_to`
  from the expired owner to the paying user. So every recycle fires this same trigger's DECREMENT
  branch on the expired owner, dropping their `total_leads_received` and opening phantom room under
  their unchanged `total_leads_promised`. Live proof — phantom quota tracks leads-recycled-away
  almost exactly: Saloni Rajput 67 vs **70**, PRACHI GARG 49 vs **69**, Payal 88 vs **136**, MUSKAN
  10 vs **34**. System-wide **3,013 leads recycled from 164 users**.
  **The v1 fix removed `payment_status='active'` from the decrement branch's reactivation — which
  was a genuine deadlock, but ALSO the only guard stopping recycling from resurrecting expired
  users.** The recycler is **enabled** (`recycled_pool_control.enabled=true`, cron 6×/day,
  TEAMFIRE), so v1 would have silently reactivated expired accounts several times a day — the exact
  thing just reverted above, but automatic and unattended. Caught before any recycler run hit it.
  **v2 fix**: reactivation now also requires `NOT (NEW.lead_type='recycled' AND NEW.original_user_id
  IS NOT DISTINCT FROM OLD.assigned_to)`. Genuine admin corrections still reactivate; recycling
  never does.
- **Phantom quota cleaned up (admin-requested)**: 51 expired members held **659 leads** of phantom
  quota — all set to `total_leads_promised = total_leads_received` (remaining **0**). Currently
  active paying members deliberately NOT touched (SEEMA RANI 143, Ravenjeet Kaur 86, Ajay kumar 17
  are also recycle-inflated, but they're live customers — separate admin decision).
  **Verified**: expired-with-quota 0, drift 0, over-quota 0, 70 active+paying members.
- ⚠️ **STILL OPEN — design question, NOT fixed**: recycling still MOVES instead of COPYING, so it
  will keep deflating original owners' counters on every run. Zeroing cleaned up today's damage, not
  the mechanism. Making `assign_recycled_leads` INSERT a new row for the receiving user (leaving the
  original owner's row intact) would stop phantom quota at the source — but that's an RPC change
  needing explicit approval (rule 4) with its own consequences: duplicate phone rows in `leads`,
  lead-count/duplicate-detection reporting, CAPI `event_id` uniqueness. Needs a deliberate decision.
- Full details + verification SQL: `bugfix.md` **BUG-017**.

### 2026-08-19 (late night) — UNITEDECOSYSTEM priority-pool bug found + fixed (code review self-catch) + CAPI pixel-match fix
- **Found while doing the admin-requested "review the deploy carefully" pass on the UNITEDECOSYSTEM
  setup from earlier tonight.** The `RESTRICTED_TEAM_FORM_IDS['1377999317060769']` entry I wrote a
  few hours earlier carried a comment claiming "UNITEDECOSYSTEM first, TEAMFIRE only once full" —
  but `RESTRICTED_TEAM_FORM_IDS` pools ALL its listed teams into one combined fill-ratio pass
  (`findTeamAssigneeExcludingManager` in sheet-lead-intake, the `eligible` filter in
  process-backlog). That means a TEAMFIRE agent with a lower fill-ratio at that instant could win a
  lead over an UNITEDECOSYSTEM agent sitting at 0% — comment described the intent, the code never
  implemented it. Caught before any real leads were routed under it (activation is tomorrow 7 AM
  IST) — own mistake, corrected same night.
- **Fix**: new separate map `PRIORITY_TEAM_FORM_IDS` (form_id → ordered team list) in both
  `sheet-lead-intake` and `process-backlog`. Teams are tried ONE AT A TIME, exclusively — the next
  team only runs if the current one has nobody eligible right now — same "first refusal, then
  fallback" shape as the women-only forms' priority-manager pattern, just team-scoped instead of
  manager-scoped since UNITEDECOSYSTEM has no other lead source to be mutually-exclusive against.
  `1377999317060769` moved out of `RESTRICTED_TEAM_FORM_IDS` into the new map.
- **Separate, real (pre-existing) bug also found and fixed in the same review**: `sheet-lead-intake`'s
  `sendCapiLeadEvent()` matched the initial `Lead` CAPI event's pixel by the ASSIGNED agent's
  `team_code`, while `send-crm-conversion` (fires later on status changes) matches by the lead's
  ORIGIN team parsed from `source` — a v5 fix from 2026-08-09 that this function never received.
  Whenever a sheet-sourced lead falls back cross-team — now expected for UNITEDECOSYSTEM leads
  landing on TEAMFIRE agents — the initial `Lead` event went to one pixel and every later
  QualifiedLead/FollowUp/Closed event went to another, splitting one lead's signal across two ad
  accounts. Now both functions match by origin team.
- Both fixes are code-only, sent to admin for manual deploy (MCP `deploy_edge_function` still
  requires approval this session, same as all session). Neither fix has gone live yet — flagging
  clearly so nobody assumes tomorrow's UNITEDECOSYSTEM activation already has correct priority
  routing until the deploy is confirmed.
- Also fixed same night: **Simran** (`manukamboj8000@gmail.com`, TEAMFIRE) — `is_online` set back to
  `true` (was `false` with `is_active=true`, 12 quota remaining). Investigated whether this was
  self-inflicted per admin's suspicion: every `is_online`-writing code path in the app (member pause
  toggle, admin Quick Edit, admin activation, `check-quota-expiry`, `plan-expiry-notifier`,
  `razorpay-webhook`, `razorpay-reconcile`) writes `is_active`/`is_online` together, to the same
  value — there is no path that can produce this exact mismatch. No audit trail survived (the
  midnight counter-reset cron overwrites `updated_at` for every user, including hers, before the
  desync's real timestamp could be read). Most likely a residual case the 16-Aug BUG-014 sweep
  missed, or a direct DB edit — not something she did through the app.

### 2026-08-19 (21:00 IST) — Himanshu Sharma ab pakka 14 leads/din par (trigger fix, admin-approved)
- **Admin ka faisla**: Himanshu ko **original turbo_boost pace = 14/din** par rakhna hai, August
  offer wala 33/din **nahi**. Baaki kuch nahi chhedna.
- **Symptom**: admin panel par **23/14** dikh raha tha — jaise limit paar kar li ho.
- ⚠️ **Par leak nahi hua tha**: us din ki saari 23 leads **09:15–18:18** ke beech mili, jab uska
  `daily_limit` abhi **33** tha. **18:47** ko wo 14 ho gaya, aur uske baad **0** leads mili.
  Ratio isliye galat lagta tha kyunki limit baad mein badli, leads baad mein nahi aayi.
- **ROOT CAUSE — `sync_user_plan_fields()` ki Himanshu-wali branch `plan_config` padh rahi thi**:
  ```sql
  SELECT daily_leads INTO pc FROM plan_config WHERE plan_name = NEW.plan_name;
  NEW.daily_limit := COALESCE(pc.daily_leads, 14);   -- 14 sirf FALLBACK tha
  ```
  `plan_config.turbo_boost` mein offer ka **33** hai, to ye lookup hamesha **33** deta tha — 14
  kabhi lagta hi nahi tha. Branch ki exact logic alag se chala kar verify kiya: **33 nikla**.
  Aur ye trigger `BEFORE INSERT OR UPDATE` hai **bina kisi column filter ke**, yaani har lead
  assignment (jo counters update karta hai) uske `daily_limit` ko chupchaap 33 par le jaata tha.
- **Fix**: us branch mein `NEW.daily_limit := 14;` hardcode kar diya. `plan_config` se padhna
  "ye user offer se bahar hai" express kar hi nahi sakta — jo yahan bilkul yahi chahiye tha.
  `plan_weight := 7` waisa hi hai (uski purani custom priority, `plan_config` ke 9 se alag).
- **Verified (apply karne ke baad)**:
  - Himanshu par harmless self-UPDATE → trigger chala → `daily_limit` **14 hi raha** ✔
  - **Mandeep kaur** (doosri turbo_boost user, control case) → **33 / weight 9** par hi rahi ✔
  - Baaki saare active/paid users vs `plan_config`: **0 daily_limit mismatch, 0 plan_weight
    mismatch** ✔
  - Counter drift **0**, over-quota active users **0** ✔
- `leads_today` counter mein **koi drift nahi tha** (23 counter = 23 actual) — usme kuch fix karne
  ki zaroorat nahi thi. Aaj ka 23/14 raat 12 baje ke reset se apne aap saaf ho jayega, aur kal se
  use **14/din hi** milengi.
- Migration record: `supabase/migrations/20260819210000_himanshu_daily_limit_hardcode.sql`
  (verification SQL uske andar hai). RPC change tha — admin ki explicit approval lekar kiya
  (rule #4).
- ⚠️ **Isi check ke dauran mila (fix NAHI kiya)**: **Simran** (`manukamboj8000@gmail.com`,
  TEAMFIRE) `is_active=true` par `is_online=false` hai — wahi BUG-014 wala pattern, jisme user
  har routing path se invisible ho jaata hai. 12 quota bacha hai. Uski row **20:50 IST** ko update
  hui thi (mere change se pehle aur unrelated — ye trigger `is_online` ko chhuta hi nahi). Admin
  se poocha hai ki usne khud pause kiya hai ya ye desync hai.

### 2026-08-19 — August offer 25-Aug tak extend (kal raat se silently OFF tha)
- **Offer live UI mein band ho chuka tha**: `OFFER.endsAt` abhi bhi `2026-08-18T23:59:59+05:30` tha,
  aur aaj 19-Aug hai — `isOfferLive()` raat ko hi `false` ho gaya, yaani top banner + pricing-card
  ka "AUGUST OFFER" badge dono chhup gaye aur cards base `plan.duration`/`baseTotalLeads` par wapas
  chale gaye. Ye wahi endsAt-aware behaviour hai jo 2026-08-10 ko fix hua tha — sahi kaam kar raha
  hai, bas fresh extension chahiye tha. (Yehi 3rd baar hua hai — 13, 16 aur ab 19 Aug.)
- **Fix**: `OFFER.endsAt` → `2026-08-25T23:59:59+05:30` (6 din). `OFFER_ACTIVE` already `true`,
  untouched. `config/offer.ts`-only change — koi Edge Function deploy nahi, agli Cloudflare Pages
  build par live.
- ⚠️ **Backend par koi gap nahi tha**: `PLAN_CONFIG` (`functions/api/razorpay-webhook.ts` +
  `razorpay-reconcile`) `endsAt` par auto-expire nahi karta, isliye aaj ki **5 payments ko offer
  quota hi mila** (starter → `total_leads_promised=90`, `daily_limit=9`, base 50/5 nahi). Live
  verify kiya — kuch backfill/correct karne ki zaroorat nahi.
- `npm run build` clean (1862 modules).

### 2026-08-19 — Manager panel: 2 fixes (PR #164 data accuracy, PR #165 plan badge)
- **PR #164 — counts `user_id` ki jagah `assigned_to` par**: `views/ManagerDashboard.tsx` ke teeno
  count queries (total / Interested / Closed) `user_id` par thi. `leads` mein dono FK hain
  (CLAUDE.md ka documented DUAL FK issue): `user_id` = original/legacy owner (recycle ya reassign
  par NAHI badalta), `assigned_to` = abhi kiske paas hai (har routing path yahi set karta hai).
  Live check: TEAMFIRE ke **15+ members galat** the, **55 leads tak** ka farak dono directions mein
  — Ankush 270 vs asli 325, Mandeep kaur 651 vs asli 598, Paramjeet kaur 157 vs 107, Ajay kumar 673
  vs 722. Member dashboard aur admin reports pehle se `assigned_to` par the, ab manager panel bhi
  match karta hai. Admin ne khud screenshot se ye pakda tha.
- **PR #165 — expired members ka plan naam ab nahi dikhta**: `plan_name` expire hone par clear nahi
  hota (renewal ke liye jaan-boojh kar last plan yaad rakhta hai), aur badge seedha wahi render
  karta tha — isliye Mary Janjot (`maryjanjot9@gmail.com`, quota 227/227 poori, `is_active=false`,
  `payment_status='inactive'`) panel mein "turbo_boost" subscriber lag rahi thi. Ab plan naam SIRF
  `payment_status==='active'` par dikhta hai; warna `total_leads_promised > 0` ho to **"Expired"**,
  nahi to **"No Plan"** (dono neutral grey, taaki plan tier se confuse na ho). Desktop table +
  mobile card dono par.
- ⚠️ **`total_leads_promised` se farak karna zaroori tha**: kuch purane rows par `plan_name` set hai
  par payment kabhi hui hi nahi — live mein TEAMFIRE ke 2 aise users (`kiran@gmail.com`,
  `simrankaurdee9@gmail.com`: `plan_name='starter'`, 0 captured payments, `promised=0`). Unhe
  "Expired" dikhana galat hota, wo "No Plan" hain. Yahi admin ko "plan liya but total leads 0" laga
  tha.
- **9 asli DB rows par verify kiya**: Mary Janjot + Priya Goyal → "Expired"; Kiran/Simran (stale
  plan_name) + Pinki dhiman/Gurpreet kaur (kabhi plan nahi) → "No Plan"; Harmandeep/Gurmansingh
  (active) → apna plan; **Bhawna Gousar (aaj pay kiya, kal 7 AM activate)** → "starter", "Expired"
  NAHI (ye case important tha).
- `TeamMember` interface mein `total_leads_promised` + `interested_leads` add kiye (`select('*')`
  pehle se laata tha) — is file ke 2 pre-existing tsc errors bhi clear (12 → 10). Build clean.
- **Rule #8 follow kiya** — dono alag commits/PRs mein.

### 2026-08-19 — 🚨 UNITEDECOSYSTEM: 5 paying users, ZERO routing (FASTMOVERS bug ka repeat)
- **Aaj 5 payments aayi, sab UNITEDECOSYSTEM (Kirti giri ki team)** — ₹4,995, 450 leads quota:
  `mamtasharmax8419@gmail.com` (Neeraj lata), `hkaur20674@gmail.com` (Harpreet kaur),
  `gousarshanu@gmail.com` (Bhawna Gousar), `kirtigiri9416@gmail.com` (Kirti),
  `sweety.saini1988@gmail.com` (Sweety saini). Sab sahi pending state mein —
  `is_plan_pending=true`, **20-Aug 07:00 IST ko activate honge**.
- ⚠️ **`UNITEDECOSYSTEM` KISI BHI routing path mein nahi hai** — live verify kiya:
  - `meta_pages.team_id` → sirf TEAMFIRE, TEAMSIMRAN, GJ01TEAMFIRE, TEAMRAJ ❌
  - `sheet_intake_tokens.team_code` → `'ECO@WIN12,TEAMFIRE,FASTMOVERS'` ❌
  - `WOMEN_FORM_PRIORITY_MANAGER` → Kirti giri list mein nahi ❌
  - `recycled_pool_control.allowed_team_codes` → `['TEAMFIRE']` ❌
  Yaani kal 7 AM se ye 5 activate honge aur inhe **0 leads** milengi — bilkul wahi jo 2026-08-18 ko
  FASTMOVERS ke saath hua tha.
- **Abhi FIX NAHI kiya** — admin se poocha hai ki inhe women's-form priority pool mein daalna hai
  (ECO@WIN12/ECOKULWINDER/FASTMOVERS ke saath equal) ya general TEAMFIRE-fallback pool mein. Deadline
  kal 7 AM IST.
- ⚠️ **Naam ka confusion (rule: hamesha email se identify karo)**: `kirtigiri9416@gmail.com` (Kirti,
  MEMBER, aaj paid) aur `kirtidkgiri@gmail.com` (Kirti giri, MANAGER of UNITEDECOSYSTEM) **do alag
  log hain**. Same team, lagbhag same naam.

### 2026-08-19 — BUG-016: ASLI root cause mila — profile cache har app-open par wipe (87 users)
- **Ye wo bug hai jo BUG-015 ke dono fixes ne MISS kiya tha.** Admin ne console log bheja, usse
  poori chain saaf ho gayi. Symptom: "Checking session… / Connecting to secure server…" par minutes
  tak atka, ya login page par wapas.
- **ROOT CAUSE — `auth/useAuth.tsx` ka "legacy dummy profile" cleanup asli profiles ko maar raha
  tha.** Condition sirf 4 fields dekhti thi: `daily_limit=0 && leads_today=0 &&
  total_leads_received=0 && payment_status='inactive'`. Ye ek **asli admin/manager/unpaid-member
  row ka bilkul normal state** hai (admin leads leta hi nahi → counters hamesha 0, payment_status
  'inactive'). Live DB: **87 users** match kar rahe the — **2 admin, 13 manager, 72 member**.
- **Kaise ye "logout"/"hang" banta tha** (poori chain, console log se confirm):
  1. Cache wipe → `profileRef.current` null → `initializeAuth()` ka **instant restore skip**
  2. `cachedProfile` bhi null → **optimistic load skip** → blocking `await loadUserProfile()`
  3. Us waqt token dead ho (`400 Invalid Refresh Token: Refresh Token Not Found`) → RLS 0 rows →
     **`users` 406 "Cannot coerce the result to a single JSON object"**
  4. `fetchProfile` ka stale-cache fallback bhi **khaali** (abhi to wipe kiya tha)
  5. `profile` null → `isAuthenticated = !!session && !!profile` **false** → atka ya login par wapas
- ⚠️ **Kyun ye "random" lagta tha**: paying members (`daily_limit=9`, `total_leads_received=300+`,
  `payment_status='active'`) kabhi match nahi karte the — unhe ye bug lagbhag kabhi nahi dikha.
  Sirf admin/manager/unpaid ko dikhta tha, isliye reproduce karna mushkil tha.
- ⚠️ **`createTempProfile()` — jo wo dummy banata tha — poore codebase mein kahin call hi nahi
  hota** (dead code, grep se confirm). Teeno `writeProfileCache` call sites sirf **asli DB rows**
  likhte hain. Yaani ye heuristic ka original purpose khatam ho chuka tha; ab wo **sirf asli
  profiles** ko match kar sakti thi — pure nuksaan.
- **Fix**: condition ko dummy ke **poore signature** se match karaya — `createTempProfile()` hamesha
  `is_active: true`, `total_leads_promised: 50`, khali `sheet_url` likhta tha; ye teeno ek asli row
  mein saath nahi aate. Purana dummy (agar kahin pada ho) abhi bhi saaf hota hai.
- **Verified**: live DB par tightened condition se **0 real users** match (purani se 87 karte the);
  6-case logic test sab pass (admin row → keep, jo pehle WIPE tha; unpaid member → keep, pehle
  WIPE; manager/paying member/naya signup → keep; asli legacy dummy → abhi bhi WIPE).
  `npm run build` clean (1862 modules), `tsc --noEmit` mein 0 naya error (sirf `views/Auth.tsx` ka
  pre-existing duplicate-import baseline noise).
- LOCKED file (`auth/useAuth.tsx`) — admin ki explicit approval lekar badla gaya (rule #1).
- Poori details + verification SQL: `bugfix.md` **BUG-016**.

### 2026-08-19 — ⚠️ BADI KHOJ: `lock` option supabase-js 2.39.0 mein KABHI forward nahi hota
- **BUG-015 ke Option B (PR #161) ko revert (PR #162) karte waqt mila — aur isne poori picture
  badal di.** `supabase-js@2.39.0` ka `_initSupabaseAuthClient()` sirf 7 options forward karta hai
  (`autoRefreshToken, persistSession, detectSessionInUrl, storage, storageKey, flowType, debug`)
  aur **`lock` ko silently drop** kar deta hai (type definition mein hai, implementation mein nahi).
  `gotrue-js@2.98.0` (GoTrueClient.ts:337-342) phir default par girta hai → **`navigatorLock`**.
- ⚠️ Matlab **`navigator.locks` shuru se hi chal raha tha** — wahi API jise CLAUDE.md "mobile par
  15s hang" ke liye blame karti hai. Jo "SMART LOCK bypass" us hang se bachne ke liye likha gaya
  tha, wo **kabhi lagu hi nahi hua** — dead config.
- **Proof (live console log)**: `@supabase/gotrue-js: Lock "lock:leadflow-auth-v2" was not released
  within 5000ms … Forcefully acquiring the lock to recover.` — ye `navigatorLock` ka apna message
  hai, aur 5000ms `gotrue-js` ka default `lockAcquireTimeout`. Saath `getSession() timed out after
  15s` ×2.
- ⚠️ **Isliye PR #161 (mutex) bhi dead code tha** — kabhi chala hi nahi, na kuch fix kiya na toda.
  Uska revert (#162) bhi functionally no-op. Jo "raat ko B lagaya, subah issue aaya" correlation
  dikha tha, wo **coincidence** thi, cause nahi. **Sabak: koi bhi auth-lock theory pehle verify
  karo ki wo config live mein pahunch bhi rahi hai ya nahi.**
- **Abhi FIX NAHI kiya** (alag decision chahiye, alag commit — rule #8). Options: (B) `createClient`
  ke baad `supabase.auth.lock` directly assign karo — par `acquireTimeout === 0` par
  `LockAcquireTimeoutError` **throw karna zaroori** hai warna `_autoRefreshTokenTick()`
  (GoTrueClient.ts:2976) skip hone ke bajaye queue hoga; (C) `supabase-js` upgrade (bada risk).

### 2026-08-18 — BUG-015: random logout / "wapas login page" loop — refresh-token RACE fixed (v6.5)
- **Symptom (admin's own words)**: app ya browser mein login karne ke baad jab dubara dashboard
  kholo to logout ho jaata hai, dubara login karo to phir login page par wapas; background mein
  notification banner chalta rehta hai. Mobile data par zyada, WiFi par bhi kabhi-kabhi. Android
  aur iOS dono. Pehle ke "permanent solutions" (BUG-012 chunk recovery, PWA/SW cache cleanup) se
  kabhi theek nahi hua — kyunki wo saare **loading/chunk** layer ke fixes the, ye **auth** layer
  ka bug hai. Screenshots: "Loading workspace… / Checking session…" par atka hua.
- **ROOT CAUSE — do independent callers ek hi rotating refresh_token par**:
  1. `supabaseClient.ts` mein `autoRefreshToken: true` (supabase-js ka apna background timer)
  2. `auth/useAuth.tsx` `initializeAuth()` ka **manual** block: "agar token 10 min mein expire ho
     raha hai to khud `supabase.auth.refreshSession()` kar lo"
  App resume hote hi (phone lock/unlock, app switch, mobile-data tower ya 4G↔5G switch) dono ek
  saath jaagte the aur **same refresh_token** se ek saath request bhejte the. Supabase refresh
  tokens **rotate** karta hai — pehli request naya token le leti hai aur purana usi waqt invalid
  ho jaata hai, doosri ko `Invalid Refresh Token: Already Used` milta hai → supabase-js session
  clear karke `SIGNED_OUT` fire kar deta hai → user login page par. **Ye genuine expiry nahi thi,
  ek false logout tha.**
- ⚠️ **Kyun rukna chahiye tha par nahi ruka**: supabase-js ka `lock` option exactly isi race ko
  rokne ke liye hota hai, par `supabaseClient.ts` (line ~243) ka custom lock **dono branches mein
  seedha `await fn()` karta hai** — यानी effectively **no-op**, kuch bhi serialize nahi hota. Wo
  bypass jaan-boojh kar lagaya gaya tha (Web Locks API mobile par 15s hang karti thi), par uska
  side-effect yahi race thi.
- **Fix (Option A, admin-approved — minimal, sirf deletion)**: `initializeAuth()` ka manual
  proactive-refresh block **hata diya**. Supabase ka apna `autoRefreshToken` already wahi kaam
  karta hai, ye sirf duplicate caller tha. Ab **ek hi** refresh caller bachta hai → race khatam.
  Koi naya code add nahi hua, koi naya async/state path nahi bana — isliye crash risk ~zero.
- **Jaan-boojh kar NAHI chhua**: `SIGNED_OUT` ka 1× session-recovery block (safety net, rehne
  diya), `signIn`/`signUp`/`signOut`, profile-fetch logic, `src/sw.ts`, PWA cleanup. Push
  notification banner ka behaviour unrelated hai — wo service worker + server-side subscription se
  chalta hai, React session state se nahi.
- **LOCKED file (`auth/useAuth.tsx`) — admin ki explicit approval lekar badla gaya** (rule #1).
  Header v6.4 → **v6.5 (REFRESH RACE FIX)**.
- `npm run build` clean. `tsc --noEmit` mein sirf pre-existing baseline noise (`views/Auth.tsx` ka
  duplicate import block, is change se bilkul unrelated) — meri edited file mein 0 error.
- ⚠️ **Residual gap (Option B, admin ne raat 11 baje ke liye schedule kiya)**: `supabaseClient.ts`
  ka no-op `lock` अभी bhi no-op hai. Single-app resume wali race is fix se khatam ho gayi, par agar
  koi user **do tabs/windows ek saath** khule rakhe to theoretically abhi bhi ho sakti hai. Uske
  liye ek real promise-based mutex chahiye (⚠️ `navigator.locks` NAHI — wahi 15s mobile hang ki
  original wajah thi). Alag commit mein, per CLAUDE.md rule #8.

### 2026-08-18 — Sandeep / Kulvir singh's members moved into ECO@WIN12's priority flow
- **Found while confirming TEAMFIRE's fallback role** (admin asked: "TEAMFIRE ko bas end mein
  fallback rakho"). That was already the behaviour — but the audit turned up **one user who did
  not fit either side**: Sandeep (`sandeepratti875@gmail.com`), `team_code='ECO@WIN12'` but
  managed by **Kulvir singh** (`kulvir0038@gmail.com`) — a DIFFERENT person from Kulwinder singh
  (`ks6315077@gmail.com`). ⚠️ The names are nearly identical; the ids are not. Easy to confuse.
- **Why he was mis-routed**: his manager_id was in neither `WOMEN_FORM_PRIORITY_MANAGER` nor
  `WOMEN_FORM_MANAGER_IDS`, so he was excluded from the priority pool yet still matched the
  fallback pool (his team is in the intake token). Net effect: an ECO@WIN12 member was being
  served last, alongside TEAMFIRE — he had already taken 10 women-form leads that way.
- **Admin's call**: he belongs with ECO@WIN12's priority flow, never at the end with TEAMFIRE.
- **Fix**: added `KULVIR_MANAGER_ID` to the priority map for both new women-only forms and to
  `WOMEN_FORM_MANAGER_IDS` (so his users are also excluded from the fallback and from
  non-women-only forms), in `sheet-lead-intake` + `process-backlog`.
- **Added as a MANAGER, not a hardcoded user id** (unlike the earlier Priya Goyal case): Kulvir
  manages 11 accounts of which only Sandeep is active today — the other 10 join automatically if
  they ever reactivate, instead of silently repeating this same bug.
- Priority pool is now 4 managers across 3 teams — still "3 teams equal" as admin specified;
  Kulvir's members sit inside ECO@WIN12, they are not a fourth team.
- Old Simar-exclusive form (`26784403284560247`) deliberately untouched.
- `npm run build` clean; both edge functions verified to carry identical constants.


### 2026-08-18 — FASTMOVERS added to the women-only form pool as an EQUAL third team
- **Found while checking yesterday's payments**: 5 new paying members (₹5,495 total, 502 leads of
  quota) were correctly activated — `is_active`/`is_online`/`payment_status` all fine, not
  pending — but had received **ZERO leads, ever**. Root cause: their team `FASTMOVERS` appeared
  in **neither** routing path — not in `WOMEN_FORM_PRIORITY_MANAGER`, and not in
  `sheet_intake_tokens.team_code` (which was `'ECO@WIN12,TEAMFIRE'`). They could never have been
  assigned anything. Their manager is Kamaldeep kaur (`kamalsohal0098@gmail.com`).
- **Admin's rule (explicit)**: no team gets preference — the women-only form is shared **equally**
  across all three dedicated teams. Implemented by adding `KAMALDEEP_MANAGER_ID` to the priority
  list for both new women-only forms in `sheet-lead-intake` + `process-backlog`. The existing
  lowest-fill-ratio round-robin then does the sharing automatically.
- ⚠️ **"Equal" here means equal % of each agent's `daily_limit`, NOT equal raw lead counts** —
  the teams are different sizes (ECO@WIN12 7 users/82 capacity, ECOKULWINDER 6/56, FASTMOVERS
  5/49). Equalising raw counts would under-serve every individual on the larger team. Flagged and
  confirmed with admin before building.
- **Capacity verified before enabling**: pool is 187/day vs ~167 leads/day from this form
  (4-day actuals: 180/141/172/175), so no team starves. Projected: ECO@WIN12 ~73 (was 75),
  ECOKULWINDER ~50 (was 56), FASTMOVERS ~44 (was 0).
- ⚠️ **TEAMFIRE loses its ~11/day fall-through from this form** — the priority pool now absorbs
  the full volume. Small relative to TEAMFIRE's own supply (form 519 + meta-webhook) and their
  114/276 utilisation, but stated to admin up front rather than discovered later.
- **DB change was ALSO required, and code alone would have silently failed for backlog leads**:
  `process-backlog` applies its `teamCodesForLead` filter **before** the priority narrowing, so
  FASTMOVERS would have been dropped before `isPriorityForForm` ever ran. Fixed by
  `sheet_intake_tokens.team_code` → `'ECO@WIN12,TEAMFIRE,FASTMOVERS'`. Live intake alone did not
  need this (`findManagerScopedAssignee` never checks team_code) — the two paths differ, which is
  exactly the class of gap that caused the 2026-08-11 stuck-backlog incident.
- `source` label unaffected (still `GoogleSheet-ECO@WIN12` — it uses only the first team).
  `send-crm-conversion` still matches the ECO@WIN12 pixel by lead origin, so CAPI for
  FASTMOVERS-worked leads is unchanged.
- Kamaldeep also added to `WOMEN_FORM_MANAGER_IDS`, so FASTMOVERS is excluded from non-women-only
  leads and from the women-form fallback — they receive women's-form priority leads only, per
  admin's "ECO win wali sheet se hi, women's wali se".

### 2026-08-16 — Removed the in-app StaleLeadReminder popup (superseded by the Call/WhatsApp gate)
- **Admin ask**: now that the hard gate exists, drop the old soft "briefing card" popup.
- **Deleted `components/StaleLeadReminder.tsx`** and every trace of it in
  `views/MemberDashboard.tsx`: import, render, `staleLeadCount` state, and the per-fetch
  `count` query that fed it. That query ran inside `fetchData`'s `Promise.all`, i.e. on **every
  20-second poll** — so this is a real request-volume saving, not just dead-code cleanup.
- ⚠️ **It was also showing a stale hardcoded `DEADLINE_LABEL = 'Deadline: 10 Aug, 11:59 PM'`** —
  6 days expired by the time it was removed. Nothing auto-updated it (the file's own comment
  admitted it had to be edited by hand). Agents were being shown a dead deadline, which is worse
  than no deadline; another reason removal was the right call rather than re-dating it.
- **What still covers this job**: (1) the new `PendingLeadsGate` blocks Call/WhatsApp inside the
  app — strictly stronger than the popup ever was; (2) the `stale-lead-reminder` **Edge Function
  + cron (jobid 27) is untouched and still running** — it is the only thing that reaches an agent
  who has not opened the app at all, which the gate by definition cannot do. Deliberately kept.
- `npm run build` + `tsc --noEmit` clean; grepped for leftover references, none remain.

### 2026-08-16 — Call/WhatsApp GATE: agent must clear 10 oldest overdue leads first
- **Admin ask**: when an agent taps Call or WhatsApp on a new lead, force a popup first
  demanding they update their other pending leads — so status updates become mandatory, not
  optional. (Follow-up to the `Not Picked` status added the same day.)
- ⚠️ **Admin's literal design was measured against live data BEFORE building, and would have
  stopped the business**: a zero-tolerance "clear this whole month" gate → **only 1 of 38 active
  members would have passed**; the other 37 could not have called *anyone*. Average agent had
  **49.8** un-updated leads this month, worst case **247**. Shown to admin with the numbers;
  admin chose the batched version instead.
- **Second reason the strict version was wrong (data-quality, not just availability)**: an agent
  facing 50 leads between them and their next call will mass-mark junk statuses to unlock the
  button — especially now that one-tap `Not Picked` exists. That converts "no data" into **false
  data**, which is worse, and pollutes the CAPI signal (a wrong `Interested` sends Meta a real
  `QualifiedLead` event). Explicitly flagged this to admin rather than shipping it silently.
- **Built (admin picked the 10-lead variant)**: new `components/PendingLeadsGate.tsx` +
  `runGuardedAction()` in `views/MemberDashboard.tsx`. Call/WhatsApp changed from bare `<a href>`
  to buttons that route through the guard. Only counts leads that are (a) THIS IST month,
  (b) assigned **24h+ ago**, (c) still `Assigned`/`Fresh`. Shows the **10 oldest**; agent sets a
  status on each, saves, and the original Call/WhatsApp action then replays automatically.
- **Verified against live data before merge** — nobody ends up permanently stuck: Kamal & Sandeep
  0 pending (no popup at all, call goes straight through), Prema 3, Lalita 75 (sees 10 at a time,
  drains over the day). Every agent can always clear a batch in under a minute.
- ⚠️ **`Not Picked` is deliberately NOT counted as pending by this gate**, even though it IS
  counted by the soft stale-lead reminder. A hard gate that re-surfaced a genuinely unreachable
  lead forever would trap the agent behind it. Chasing retries is the reminder's job, not a
  blocker's.
- **Fail-open**: if the gate's own query errors (network/RLS), the call proceeds. An undialled
  lead costs more than a skipped nudge.
- Gate writes statuses **sequentially, not `Promise.all`** — each UPDATE fires
  `trg_send_crm_conversion` → `pg_net` → CAPI. Fanning 10 of those out at once is the exact race
  pattern documented in the 2026-08-10 pg_net incident.
- `npm run build` + `tsc --noEmit` clean (0 errors in both touched files).
- ⚠️ **Still open**: `stale-lead-reminder` Edge Function (Supabase-dashboard-only, not in repo)
  still needs `Not Picked` added to its status filter, or push reminder and in-app popup disagree.
- **Watch for gaming**: if update-rate jumps but almost everything is marked `Not Picked`/
  `Rejected`, the statuses are fake. Re-check the status mix in 3–5 days before drawing any
  conclusion about lead quality or CAPI improvement.

### 2026-08-16 — New lead status: "Not Picked" (agent called, nobody answered)
- **Why**: Kulwinder singh's team complained that most numbers "don't pick up". The complaint was
  **unmeasurable** — there was no status for it, so an agent who called and got no answer had no
  way to record that, and the lead just stayed `Assigned` (identical to never-touched). Analysis of
  3 days (14–16 Aug, forms 911 + 519) couldn't separate "never called" from "called, no answer".
- **What the data actually showed** (same form, same days, split by team — clean controlled test):
  ECO@WIN12 251 leads / **95.2% untouched** / **0 positive**; ECOKULWINDER 140 / 78.6% untouched /
  **15 positive**; TEAMFIRE 72 / 63.9% untouched / 1 positive. Per-agent: **Prema Vaishnav worked
  21 of her 26 leads and got 14 positive (54%)** from the exact same pool, while 9 agents
  (incl. Lalita with 76 leads, and Kulwinder singh himself with 32) worked **zero**. Across both of
  Kulwinder's teams: 398 leads, only 37 worked (9%). So the lead pool is demonstrably fine — the
  gap is work-rate, not quality. Still, without this status that stays an argument, not a metric.
- **Change (frontend only, `views/MemberDashboard.tsx`)**: added `Not Picked` to the lead status
  dropdown (📵, rose colour), to the filter dropdown + `stats.notPicked` counter, and to
  `getStatusColor`. **No schema change needed** — verified `leads.status` has **no CHECK
  constraint** (only `capi_event_log.event_name` does, and that's untouched).
- ⚠️ **Deliberately INCLUDED `Not Picked` in the stale-lead reminder query** (`['Assigned',
  'Fresh', 'Not Picked']`). Two reasons: a not-picked lead still needs a **retry** (it isn't
  resolved), and leaving it out would let an agent permanently silence the nudge by marking
  everything Not Picked — which would have quietly killed the whole stale-reminder system.
- ⚠️ **`stale-lead-reminder` Edge Function needs the same one-line change and is NOT in this repo**
  (Supabase-dashboard-only, same as `send-crm-conversion` used to be). Its status filter must
  become `['Assigned','Fresh','Not Picked']` too, or the push reminder and the in-app popup will
  disagree. Flagged to admin — not applied from this session.
- **NO CAPI event for this status, on purpose.** I'd earlier suggested it would send Meta a
  "negative signal" — that was wrong and is corrected here: Meta CAPI optimises *toward* events you
  send, it has no notion of a negative one. The correct negative signal is simply the **absence**
  of `QualifiedLead`, which already happens. Adding a `NotPicked` event would also require altering
  `capi_event_log_event_name_check` (a schema change) for zero optimisation benefit.

### 2026-08-16 — BUG-014: Admin Quick Edit silently killed users' lead flow (`is_online` desync)
- **Symptom**: Ravenjeet Kaur (`ravenjeetkaur@gmail.com`) got zero leads all day despite being
  `is_active=true`, `payment_status='active'`, 124 quota remaining, plan not pending. Admin asked
  whether she paused herself or the system broke.
- **Diagnosis**: her row was `is_active=true` **but `is_online=false`**. Every lead-routing path
  (`get_best_assignee_for_team` RPC, `sheet-lead-intake`, `process-backlog`,
  `assign-recycled-leads`, `assign_lead_round_robin`) requires **BOTH** flags true, so she was
  invisible to routing while looking perfectly healthy in the admin UI. **3 more paying users were
  in the exact same broken state** (Prince, Simran, Jashandeep kaur — 54/33/90 quota remaining),
  all updated within the same ~1h window.
- **ROOT CAUSE — `components/UserQuickEdit.tsx` (admin's "Quick Edit" modal)**: its save wrote
  `is_active` **without ever touching `is_online`**. Every other write path in the codebase pairs
  them (member pause toggle, admin activation, `check-quota-expiry`, `plan-expiry-notifier`,
  `razorpay-webhook`/`-reconcile` — verified all 6). So if a user was paused (both false) and an
  admin later saved Quick Edit for *any* unrelated reason (daily_limit tweak, leads_today reset),
  they'd come back `is_active=true` / `is_online=false` — permanently unroutable, with no error
  and no visible sign anywhere in the UI.
- **Second bug found in the same flow**: `AdminDashboard.tsx` passed
  `is_active: showEditModal.payment_status === 'active'` into the modal instead of the real
  `is_active` column. `payment_status='active'` only means "has paid" — it's independent of
  pause state. So the toggle pre-filled as ON for *every* paying user, meaning an admin saving an
  unrelated field would silently **un-pause** someone who had deliberately paused themselves.
  Fixed to pass `showEditModal.is_active`; also added the missing `is_active` field to the
  `AdminUserRow` interface (which had `is_online` but not `is_active`, despite `select('*')`
  returning it — this also cleared one pre-existing `tsc` error, 8 → 7 in that file).
- **Fix**: Quick Edit now writes `is_online: isActive` alongside `is_active`, same pairing the
  member dashboard's own pause toggle has had since the earlier "webhook needs is_online" fix.
- **Data repaired**: all 4 affected users set back to `is_online=true` (verified each still had
  `payment_status='active'` + quota remaining first). Full-table re-scan after: **0 users left in
  the `is_active=true AND is_online=false` state**.
- ⚠️ **Pattern to remember**: `is_online` is a *routing* flag, not a presence/heartbeat flag —
  despite its name. A legacy `update_user_presence()` RPC still exists in the DB that would set it
  independently as a browser-presence signal, but it is **not called from any frontend code**
  (grepped) — leaving it alone, flagged here so nobody wires it up without realising it would
  disable live users' lead flow.
- **Offer daily-limit audit run at the same time (admin's separate question)**: all 38 active
  paying users cross-checked against offer `PLAN_CONFIG` — **37/38 exactly correct**. Only
  mismatch is Himanshu Sharma (`turbo_boost`, `daily_limit=14` vs offer's 33) — same stale value
  as the documented 2026-08-06 case, caused by the hardcoded per-user-ID branch in
  `sync_user_plan_fields` not having re-fired since `plan_config` changed. Flagged to admin, **not
  auto-fixed** (deliberate special-case user).

### 2026-08-16 — August offer re-extended 2 more days (endsAt was already expired)
- **Found offer was silently OFF in the live UI**: `OFFER.endsAt` was still `2026-08-15T23:59:59+05:30`
  from the last extension, and today is 16-Aug — `isOfferLive()` had already flipped to `false`
  overnight, meaning the top banner + pricing-card "AUGUST OFFER" badge were both hidden and every
  plan's card had silently reverted to `plan.duration`/`baseTotalLeads` (`getOfferForPlan()` returns
  `null` once `endsAt` passes — this is the exact BUG FIX'd endsAt-aware behavior from 2026-08-10,
  working as designed, just needed a fresh extension).
- **Fix**: `OFFER.endsAt` → `2026-08-18T23:59:59+05:30` (2 more days from today). `OFFER_ACTIVE`
  already `true`, untouched. Backend `PLAN_CONFIG` (`functions/api/razorpay-webhook.ts` +
  `razorpay-reconcile`) doesn't auto-expire on `endsAt` — was already giving correct offer quota
  throughout, nothing to fix there.
- `npm run build` clean. This is a `config/offer.ts`-only change — no Edge Function deploy needed,
  goes live automatically with the next Cloudflare Pages build (same deploy as the Manager-plan-pace
  PR #150, per admin's request to land both together before deploying).

### 2026-08-16 — Manager plan (offer) pace changed: 20 din/14 per din → 10 din/27 per din
- **Admin decision**: Manager plan (August offer) ka total quota (272 leads) same rakha, lekin duration
  20 din se ghata ke **10 din** kar diya, jisse per-din pace **14 → 27 leads/din** ho gaya
  (272 ÷ 10 = 27.2, round to 27). Turbo Boost/Weekly Boost jaisa "fast pace" ab Manager plan mein bhi.
- **Explicit admin choice**: sirf **naye signups/renewals** se ye lagu hoga — abhi jo Manager users
  active hain (14/din pe), unka `daily_limit` turant nahi badla (koi bhi live user impact nahi hua).
  Wo apne agle renewal/reactivation cycle mein naye pace pe automatically sync ho jayenge
  (`trg_sync_user_plan_fields` trigger, jo `plan_config` table se padhta hai).
- **Changed (4 jagah, sab sync mein rakhi gayi — CLAUDE.md's PLAN_CONFIG-duplication warning follow
  karte hue)**:
  - DB `plan_config` table: `manager` row → `duration=10, daily_leads=27` (total_leads=272 unchanged)
  - `functions/api/razorpay-webhook.ts` `PLAN_CONFIG.manager`: `duration: 20→10, dailyLeads: 14→27`
  - `supabase/functions/razorpay-reconcile/index.ts` `PLAN_CONFIG.manager`: `dailyLeads: 14→27`
  - `config/offer.ts` `OFFER.plans.manager`: `dailyLeads: 14→27` + naya optional `duration: 10` field
- **`components/Subscription.tsx` follow-up fix (same change, found while implementing)**: pricing
  card ka "X Day Campaign" text `plan.duration` (base, static 20) se aata tha, offer ke `dailyLeads`
  se independent — isliye sirf `dailyLeads` badalne se card "27 Leads/Day" + "20 Day Campaign" ek
  saath dikhata (27×20=540 ≠ 272, visibly inconsistent). `OfferPlanOverride` interface mein optional
  `duration` field add kiya (sirf jab offer-pace base plan.duration se match na kare, tab set karo —
  baaki 4 plans ke liye unka base duration already offer-dailyLeads se consistent hai, unhe chhuna
  nahi pada). `applyOffer()` ab `offer.duration ?? plan.duration` use karta hai.
- `views/Landing.tsx` pricing card bhi manually update ki (`/20 days` → `/10 days`,
  `14 Leads/Day` → `27 Leads/Day`) — ye static JSX hai, offer.ts se dynamically nahi jud़ta.
- **`views/Subscription.tsx` jaan-boojh kar NAHI chhua** — poori tarah offer-unaware, hardcoded
  base values hai, aur koi jagah import/route nahi hoti (dead code, grep se confirm kiya) — is
  change ka scope se bahar hai.
- `npm run build` + `tsc --noEmit` dono clean (sirf pre-existing baseline noise, koi naya error
  meri edited files mein nahi).
- Sent `functions/api/razorpay-webhook.ts` + `razorpay-reconcile` for manual deploy (MCP
  `deploy_edge_function` still blocked, `-32003`) — frontend files (Landing.tsx, Subscription.tsx,
  offer.ts) normal Cloudflare Pages auto-deploy se live ho jayengi is push par.

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
| BUG-013 | 2026-08-05 | `PLAN_CONFIG` exists in 2 copies; only 1 updated for the offer → 2 real buyers got wrong quota | `razorpay-reconcile` `PLAN_CONFIG` synced to `razorpay-webhook.ts` |
| BUG-014 | 2026-08-16 | Admin Quick Edit wrote `is_active` without `is_online` → 4 paying users silently unroutable | `UserQuickEdit.tsx` writes both; `AdminDashboard.tsx` passes real `is_active` |
| BUG-015 | 2026-08-18 | Random logout loop — 2 callers refreshing the same rotating refresh token | `auth/useAuth.tsx` v6.5 — manual proactive refresh removed |
| BUG-016 | 2026-08-19 | "Checking session…" hang / bounce-to-login: profile cache wiped every app open for 87 users | `auth/useAuth.tsx` — dummy-profile heuristic matched on full signature |
| BUG-017 | 2026-08-20 | Reactivation deadlock — decrement branch required `payment_status='active'` to reactivate, which is exactly what deactivation had just cleared; 23 paying members stuck "Plan Inactive" with quota left | `update_user_lead_count()` decrement branch — condition + `payment_status` write fixed |

> ⚠️ **Keep this table in sync with `bugfix.md`.** It went stale at BUG-012 once already
> (BUG-013→016 were missing until backfilled on 2026-08-19), which made it look like nothing had
> broken for two weeks.

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
