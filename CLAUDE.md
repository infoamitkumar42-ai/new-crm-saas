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
