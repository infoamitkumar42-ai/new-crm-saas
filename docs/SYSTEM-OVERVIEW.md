# LeadFlow CRM — System Overview

Written for someone who has never seen this codebase: a new developer, a contractor, or an AI
agent. Read `AGENTS.md` first for the rules; this file explains how the thing actually works.

---

## 1. What the business does

LeadFlow CRM sells **leads**, not software time.

Meta (Facebook/Instagram) ad campaigns collect contact details from people interested in network
marketing opportunities. Those leads flow into this system, which distributes them to paying
subscribers ("members") using a fairness algorithm. Members work the leads and record an outcome.

**The single most important consequence of that model:**

> Plans are **quota-based, not time-based.** A plan ends when the member has received the number
> of leads they paid for — not on a calendar date. `valid_until` exists in the schema but is set
> to the year 2099 and is **ignored**. Never write expiry logic against it.

Expiry is: `total_leads_received >= total_leads_promised`.

---

## 2. The stack

| Layer | Technology | Where |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind | `views/`, `components/`, `hooks/` |
| Hosting | Cloudflare Pages | auto-deploys from `main` |
| Payment webhook | Cloudflare Pages Function | `functions/api/razorpay-webhook.ts` |
| Backend | Supabase (Postgres + Edge Functions + Auth) | project `vewqzsqddgmkslnuctvb` |
| Edge Functions | Deno | `supabase/functions/*` — **manual deploy** |
| Scheduled jobs | `pg_cron` inside Postgres | see §7 |
| Payments | Razorpay | live mode |
| Ad attribution | Meta CAPI (server-side conversions) | see §8 |

Domain: `leadflowcrm.in` · API proxy: `api.leadflowcrm.in` (Cloudflare Worker)

### Why there is a proxy

Some Indian ISPs (Jio, Airtel) block `*.supabase.co` directly. So **data** requests are routed
through `api.leadflowcrm.in`, while **auth** requests go direct to Supabase (faster token
refresh) with a proxy fallback if the direct call is blocked or slow. Both directions have
fallbacks — see the comments at the top of `supabaseClient.ts`.

---

## 3. Roles

| Role | Sees | File |
|---|---|---|
| `admin` | Everything: all users, all leads, config toggles | `views/AdminDashboard.tsx` |
| `manager` | Their own team's members and aggregate stats | `views/ManagerDashboard.tsx` |
| `member` | Their own assigned leads only | `views/MemberDashboard.tsx` |

`views/Dashboard.tsx` routes by role. Members are grouped into **teams** via `users.team_code`,
and each member has a `manager_id`.

Live team codes include `TEAMFIRE`, `ECO@WIN12`, `ECOKULWINDER`, `FASTMOVERS`,
`UNITEDECOSYSTEM`, `TEAMSIMRAN`, `GJ01TEAMFIRE`, `TEAMRAJ`. `TEAMFIRE` is the largest and acts as
the **fallback** pool for shared lead sources.

---

## 4. How a lead reaches a member

There are **two intake channels** and **four assignment paths**. Getting these confused is the
single most common source of routing bugs, so they are spelled out.

### 4.1 Intake channel A — Meta webhook (direct)

```
Meta Lead Ad
  └─> supabase/functions/meta-webhook
        ├─ look up meta_pages by page_id  ->  team_id  (which team owns this page)
        ├─ working hours 08:00–22:00 IST?
        │     yes -> RPC get_best_assignee_for_team(team_code) -> assign
        │     no  -> insert with status 'Night_Backlog'
        └─ fire Meta CAPI 'Lead' event
```

### 4.2 Intake channel B — Google Sheet (Meta → Sheet → Apps Script → CRM)

```
Meta Lead Ad  ->  Google Sheet  ->  Apps Script (runs every 10 min, outside this repo)
  └─> supabase/functions/sheet-lead-intake   (authenticated by x-intake-secret)
        ├─ resolve eligible teams from sheet_intake_tokens.team_code
        ├─ women-only form?  -> priority managers first, then fallback pool
        ├─ restricted form?  -> only the teams listed for that form_id
        └─ assign, or leave 'Queued' if nobody has capacity
```

⚠️ **The Apps Script lives in Google, not in this repo.** If leads stop arriving, the break is
often upstream (Meta's Sheet authorisation expiring, or the Sheet being restructured), not in
this code. A 30-hour outage was caused exactly that way. Diagnostic note: Apps Script runs that
complete in 2–4 seconds mean *no new rows found* — a silent-success failure mode, not health.

### 4.3 The four assignment paths

Every one of these has its **own** eligibility logic. They do not share a single function, so a
rule added to one is **not** automatically true in the others. This has caused repeated bugs.

| # | Path | Runs when | Team source |
|---|---|---|---|
| 1 | `get_best_assignee_for_team` RPC | meta-webhook, live | `meta_pages.team_id` |
| 2 | `sheet-lead-intake` (inline logic) | sheet lead arrives, live | `sheet_intake_tokens.team_code` |
| 3 | `process-backlog` (inline logic) | 10:00 IST cron + 10-min sweeper | `sheet_intake_tokens.team_code` |
| 4 | `assign-recycled-leads` | 6×/day cron | `system_config.recycled_pool_control` |

⚠️ **Paths 2 and 3 diverge.** `process-backlog` applies its team filter *before* narrowing to
priority managers, so a team can be reachable live but silently dropped from the backlog sweep.
That is exactly how a newly-paid team received zero leads (FASTMOVERS, 18 Aug). **When adding a
team to a routing rule, check every path, and check the `sheet_intake_tokens` row too — a code
change alone is often not enough.**

### 4.4 Eligibility and fairness

A member can receive a lead only if **all** hold:

```
is_active = true              AND is_online = true
payment_status = 'active'     AND leads today < daily_limit
                                  AND total_leads_received < total_leads_promised
```

Ordering is **`fill_ratio ASC, plan_weight DESC`** — proportional fairness first (whoever is
furthest from their daily quota goes next), plan tier only breaks ties. This ordering was
reversed once and starved lower-tier members completely on low-volume days (BUG-005).

### 4.5 Night backlog

Leads arriving 22:00–08:00 IST are stored as `Night_Backlog` and distributed by the 10:00 IST
cron. A 10-minute sweeper catches anything left over. `Queued` leads are swept by the same
function.

If backlog is not clearing, the usual cause is **capacity**, not a bug: incoming volume can
exceed what active members can absorb in a day.

---

## 5. Data model — the parts that matter

### `users`

| Column | Meaning / trap |
|---|---|
| `role` | `admin` / `manager` / `member` |
| `team_code` | routing key. **NULL means invisible to every team-based path.** |
| `manager_id` | used by priority-pool routing |
| `is_active` | can receive leads |
| `is_online` | **also** required to receive leads. A routing flag, not presence. |
| `payment_status` | `active` / `inactive` / `expired` |
| `plan_name` | **not cleared on expiry** — it remembers the last plan for renewals |
| `daily_limit` | per-day cap for the current plan |
| `leads_today` | counter, reset at midnight IST. Do not trust for reporting. |
| `total_leads_promised` | **cumulative across all payments**, not per-plan |
| `total_leads_received` | counter. Do not trust for reporting — use `COUNT(*)`. |
| `is_plan_pending` / `plan_activation_time` | paid, activates next 07:00 IST |
| `pending_plan_name` | set when an already-earning member renews mid-day |
| `valid_until` | **ignored** — set to 2099 |

Because `plan_name` survives expiry, **never render it as the current plan without checking
`payment_status`** — an expired member otherwise displays as a live subscriber (PR #165).

### `leads`

| Column | Meaning / trap |
|---|---|
| `user_id` | original owner. Does **not** change on reassign/recycle. |
| `assigned_to` | current holder. **Use this for "whose lead is it".** |
| `status` | `New` / `Fresh` / `Night_Backlog` / `Queued` / `Assigned` / `Contacted` / `Not Picked` / `Call Back` / `Interested` / `Follow-up` / `Closed` / `Rejected` / `Invalid` |
| `notes` | **user-facing** — shown in the member's app |
| `source` | display label, e.g. `GoogleSheet-ECO@WIN12`. **Never derive routing from it** — it carries only the first team. Deriving routing from this label stranded 214 leads in backlog. |
| `form_id` | which Meta form — drives priority routing |
| `created_at` / `assigned_at` | recycled leads keep the original `created_at`; the UI shows `assigned_at` |

`status` has **no CHECK constraint** — new statuses can be added without a migration.
(`capi_event_log.event_name` *does* have one.)

### Other tables

`payments` · `push_subscriptions` · `meta_pages` (page → team) ·
`sheet_intake_tokens` (intake secret → allowed teams) · `plan_config` (plan numbers, read live by
a trigger) · `system_config` (feature toggles incl. the recycle pool) · `pixel_config` (CAPI
credentials per team) · `capi_event_log` · `notification_logs`

---

## 6. Triggers you will trip over

| Trigger | Effect |
|---|---|
| `trg_check_limit_insert` / `trg_check_limit_update` | Block assignment past `daily_limit`, using a live `COUNT(*)` with IST dates. Ignores `daily_limit_override`. |
| `trigger_update_user_lead_count` | Maintains `leads_today` + `total_leads_received` when `assigned_to` changes; auto-deactivates on quota exhaustion. **Do not also call the counter RPC.** |
| `trg_sync_user_plan_fields` | On **every** `users` UPDATE, overwrites `daily_limit` / `plan_weight` from `plan_config` based on `plan_name`. Setting those columns directly does not stick. |
| `trg_send_crm_conversion` | On `leads.status` change to Interested/Follow-up/Closed, calls the CAPI function via `pg_net`. |
| `handle_new_user()` | Copies signup metadata into `public.users`. Has been the source of three separate bugs — read `bugfix.md` before touching it. |

**Manual bulk assignment checklist** (the limit triggers will otherwise block you):

```
1. Raise total_leads_promised for the targets FIRST (prevents mid-loop auto-deactivation)
2. ALTER TABLE leads DISABLE TRIGGER trg_check_limit_update;
3. Assign SEQUENTIALLY (never concurrently — see AGENTS.md §3.5)
4. ALTER TABLE leads ENABLE TRIGGER trg_check_limit_update;   -- always, even on failure
5. Verify counter drift = 0
```

Wrap it in a single `BEGIN/COMMIT` so the trigger cannot be left disabled if a step fails.

---

## 7. Scheduled jobs (`pg_cron`, times IST)

| Time | Job | Purpose |
|---|---|---|
| 00:00 | reset-leads-daily | `leads_today = 0` for everyone |
| 07:00 | daily-quota-check | activate pending plans; deactivate exhausted quotas |
| 10:00 | morning-backlog | distribute `Night_Backlog` |
| every 10 min | backlog-sweeper | catch stragglers |
| every 15 min | razorpay-reconcile | poll Razorpay for payments the webhook missed |
| 6×/day | recycled-afternoon-batch | recycled-lead distribution (gated by config) |
| every 10 min | stale-lead-reminder | push reminder for un-updated leads |

⚠️ Job names can be misleading — `stale-lead-reminder-daily` runs every 10 minutes. `pg_cron`
has no rename, so the name was left alone.

---

## 8. Meta CAPI (ad attribution)

Two separate event streams:

1. **`Lead`** — fired at intake by `meta-webhook` and `sheet-lead-intake`
2. **`QualifiedLead` / `FollowUp` / `ClosedDeal`** — fired by `send-crm-conversion` when a member
   changes a lead's status, via `trg_send_crm_conversion`

Pixel matching is **origin-based** for sheet leads: a lead from ECO@WIN12's ads reports to
ECO@WIN12's pixel even when a TEAMFIRE member works it. Before that fix, an account was paying
for ads and getting no optimisation signal while polluting another account's pixel.

`action_source` must be a valid Meta enum — `'crm'` is not one, and using it made events fail
silently for months. Match quality depends on hashed `ph` / `em` / `fn` / `ln` / `ct` / `st` /
`external_id` in `user_data`.

---

## 9. Auth and session handling

- Sessions persist in `localStorage` under `leadflow-auth-v2`
- The user's profile is cached in `leadflow-profile-cache` for instant restore on reopen
- `isAuthenticated = !!session && !!profile` — **both** are required, so a failed profile fetch
  logs the user out in practice even with a valid session
- `autoRefreshToken` is on; refresh tokens **rotate**, so two concurrent refreshes make the
  loser's token invalid (BUG-015)
- The `auth.lock` option in `supabaseClient.ts` is **silently dropped** by `supabase-js@2.39.0`;
  `navigator.locks` is what actually runs (BUG-015 follow-up)

If the app hangs on "Checking session…", the cause is almost always this chain rather than the
network — see BUG-016.

---

## 10. Payments

```
Razorpay -> functions/api/razorpay-webhook.ts   (primary, fails silently often)
         -> razorpay-reconcile (every 15 min)   (backup poller — processes MOST payments)
```

Both must implement identical logic. Key behaviours:

- **New/inactive buyer:** quota added, plan activates the **next 07:00 IST**
- **Already-active member renewing:** today's plan and pace are left untouched; the new quota is
  added cumulatively and the new plan name is stashed in `pending_plan_name` for the 07:00
  cutover. Without this, renewing mid-day cut a member off from the rest of that day's leads.
- Idempotency is by `razorpay_payment_id` **existing in the `payments` table**

⚠️ **Never delete a `payments` row to undo a test.** That breaks the dedup and the reconcile
poller re-processes the payment as new — which once re-activated a demo account and handed it a
real member's lead. Correct the `users` row instead and leave the payment as history.

---

## 11. Known deliberate special cases

Do not "fix" these:

- **Himanshu Sharma** (`sharmahimanshu9797@gmail.com`) has `total_leads_promised = 1,000,001` —
  an intentional unlimited-quota override. Do not flag it or compare his quota to others'.
- **`plan_name` is not cleared on expiry** — deliberate, for renewals.
- **`valid_until = 2099`** — deliberate; quota decides expiry.
- Repeat form-fills from the same phone are treated as **fresh leads** (only a 10-minute
  double-fire guard remains). Double-calling risk was accepted knowingly.
- `views/Subscription.tsx` is dead code (offer-unaware, not imported anywhere). The live one is
  `components/Subscription.tsx`.

---

## 12. Operational health queries

Run these after anything touching leads or users. Both should return **zero rows**.

```sql
-- 1. Counter drift
SELECT u.email, u.total_leads_received AS counter, COUNT(l.id) AS actual
FROM users u LEFT JOIN leads l ON l.assigned_to = u.id
WHERE u.role = 'member'
GROUP BY u.id, u.email, u.total_leads_received
HAVING u.total_leads_received != COUNT(l.id);

-- 2. Over-quota users still active
SELECT email, total_leads_promised,
       (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) AS actual_leads
FROM users u
WHERE is_active = true AND total_leads_promised > 0
  AND (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) >= total_leads_promised;

-- 3. The is_online desync that hides paying members from routing (BUG-014)
SELECT email, name FROM users
WHERE role='member' AND is_active=true AND is_online=false AND payment_status='active';

-- 4. Members with no team_code — invisible to every team-based routing path
SELECT email, name, plan_name, payment_status FROM users
WHERE role='member' AND team_code IS NULL AND payment_status='active';
```

---

## 13. Where to look when something is wrong

| Symptom | Look at |
|---|---|
| A member is getting no leads | §4.4 eligibility, then `team_code`, then which of the four paths should serve them |
| A whole team is getting no leads | Is the team in `sheet_intake_tokens` / `meta_pages` / the priority map? All of them? |
| Leads stuck in `Night_Backlog` / `Queued` | Capacity first (usually), then `resolveTeamCodes` in `process-backlog` |
| No leads at all from a Sheet source | Upstream: Meta→Sheet authorisation, Apps Script, Sheet structure |
| Numbers disagree between two screens | `user_id` vs `assigned_to` (§AGENTS.md 3.1), or a counter column vs `COUNT(*)` |
| Quota looks wrong after payment | The four `PLAN_CONFIG` locations (§AGENTS.md 3.3) |
| App hangs on "Checking session…" | `bugfix.md` BUG-016, then BUG-015 |
| Meta reports far more leads than the CRM has | Usually upstream delivery, not this system. Verify before changing code. |
