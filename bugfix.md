# LeadFlow CRM — Bug Fix Log

> **Purpose:** Running log of every bug found and fixed. Read this before debugging anything new — the root cause may already be documented.
>
> **Format per entry:**
> - **What was the bug** (symptoms + root cause)
> - **What broke** (real-world impact)
> - **How it was fixed** (exact SQL / code change)
> - **Verification** (how we confirmed the fix worked)
> - **Date**

---

## 2026-05-24

---

### BUG-001 — Counter Mismatch: `total_leads_received` ≠ Actual Lead Count

**Status:** ✅ Fixed  
**Severity:** Critical  
**Affected:** 57 users had wrong counters  

#### What was the bug
`total_leads_received` in the `users` table did not match the actual count of leads assigned (`COUNT(*) FROM leads WHERE assigned_to = user.id`). Counters were inflated (showed more than reality) for many users.

**Root cause:** The `trigger_update_user_lead_count` (AFTER INSERT/UPDATE) only incremented counters, never decremented. When leads were reassigned by admin (manual round-robin operations, duplicate cleanup, recycle assignments), the old user's counter was never reduced. Over time this caused drift — counter kept climbing even when leads were taken away.

#### What broke
- Auto-deactivate failed: system thought user had used all quota when they hadn't (counter inflated → checked against `total_leads_promised` → triggered false expiry)
- Admin reports were wrong: showing wrong "leads remaining" figures
- RPC `get_best_assignee_for_team` quota check uses `total_leads_received < total_leads_promised` — if counter was inflated, users were wrongly excluded from assignment even though they had quota

#### How it was fixed

**Step 1 — One-time sync:** Set `total_leads_received = actual lead count` for all 57 affected users:
```sql
UPDATE users u
SET total_leads_received = (
  SELECT COUNT(*) FROM leads WHERE assigned_to = u.id
)
WHERE u.id IN (
  SELECT u2.id FROM users u2
  WHERE (SELECT COUNT(*) FROM leads WHERE assigned_to = u2.id) != u2.total_leads_received
);
```

**Step 2 — Trigger fix:** Updated `trigger_update_user_lead_count` to also DECREMENT counters when a lead is reassigned AWAY from a user:
```sql
CREATE OR REPLACE FUNCTION public.update_user_lead_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- INCREMENT when lead assigned to a user
  IF (TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND NEW.assigned_to IS NOT NULL AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to)
  THEN
    UPDATE users SET
      total_leads_received = COALESCE(total_leads_received, 0) + 1,
      leads_today          = COALESCE(leads_today, 0) + 1,
      is_active = CASE
        WHEN COALESCE(total_leads_received, 0) + 1 >= COALESCE(total_leads_promised, 0)
             AND COALESCE(total_leads_promised, 0) > 0 THEN false
        ELSE is_active END,
      updated_at = NOW()
    WHERE id = NEW.assigned_to;
  END IF;

  -- DECREMENT when lead reassigned AWAY from old user (recycle / admin reassign)
  IF TG_OP = 'UPDATE'
     AND OLD.assigned_to IS NOT NULL
     AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to
  THEN
    UPDATE users SET
      total_leads_received = GREATEST(0, COALESCE(total_leads_received, 0) - 1),
      leads_today          = GREATEST(0, COALESCE(leads_today, 0) - 1),
      is_active = CASE
        WHEN payment_status = 'active'
             AND plan_name != 'none'
             AND GREATEST(0, COALESCE(total_leads_received, 0) - 1) < COALESCE(total_leads_promised, 0)
        THEN true ELSE is_active END,
      updated_at = NOW()
    WHERE id = OLD.assigned_to;
  END IF;

  RETURN NEW;
END; $$;
```

#### Verification
```sql
-- After fix: this query should return 0 rows
SELECT u.email, u.total_leads_received AS counter,
       COUNT(l.id) AS actual,
       u.total_leads_received - COUNT(l.id) AS drift
FROM users u LEFT JOIN leads l ON l.assigned_to = u.id
WHERE u.role = 'member'
GROUP BY u.id
HAVING u.total_leads_received != COUNT(l.id);
-- Result: 0 rows ✅
```

---

### BUG-002 — Over-Quota Users Still Active

**Status:** ✅ Fixed  
**Severity:** Critical (business loss — users receiving leads they didn't pay for)  
**Affected:** 10 users  

#### What was the bug
10 users had `is_active = true` even though their actual lead count (`COUNT(*)`) had already exceeded `total_leads_promised`. They were continuing to receive leads for free.

**Root cause:** Same as BUG-001. Inflated counters meant the auto-deactivate trigger never fired for these users because the trigger compares `total_leads_received` (counter) against `total_leads_promised`. Counter was lower than actual leads, so the trigger thought quota wasn't exhausted yet.

#### What broke
Users got free extra leads beyond what their plan covered → business loss.

#### How it was fixed
Deactivated all 10 users using actual lead count (not counter):
```sql
UPDATE users
SET is_active = false,
    payment_status = CASE WHEN payment_status = 'active' THEN 'expired' ELSE payment_status END
WHERE id IN (
  SELECT u.id FROM users u
  WHERE u.is_active = true
    AND u.total_leads_promised > 0
    AND (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) >= u.total_leads_promised
    AND u.role = 'member'
);
```

#### Verification
```sql
-- Should return 0 rows after fix
SELECT email, name,
       (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) AS actual,
       total_leads_promised, is_active
FROM users u
WHERE is_active = true AND total_leads_promised > 0
  AND (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) >= total_leads_promised;
-- Result: 0 rows ✅
```

---

### BUG-003 — Daily Limit Trigger Uses Stale `leads_today` Counter

**Status:** ✅ Fixed  
**Severity:** High (could cause users to get fewer leads than plan allows, or more)  
**Affected:** `check_lead_limit_before_insert` function (used by both `trg_check_limit_insert` and `trg_check_limit_update`)  

#### What was the bug
The BEFORE INSERT/UPDATE trigger that enforces daily limits was reading `leads_today` from the `users` table:
```sql
SELECT leads_today, daily_limit, name INTO current_leads, max_limit, user_name
FROM users WHERE id = NEW.assigned_to;
IF current_leads >= max_limit THEN RAISE EXCEPTION 'BLOCKED';
```

**Root cause — Timezone window:** The `daily-counter-reset` cron resets `leads_today = 0` at **midnight UTC = 5:30 AM IST**. But IST day changes at **midnight IST**. So from 12:00 AM IST → 5:30 AM IST (5.5 hour window), the new IST day has started but `leads_today` still shows the previous day's count. Any backlog processing in this window would be incorrectly blocked with "User is Full" even though the new day has fresh capacity.

**Secondary cause:** If `leads_today` ever drifts for any other reason (manual ops, bugs), the limit check becomes inaccurate.

The RPC `get_best_assignee_for_team` already uses actual `COUNT(*)` — the trigger should too.

#### What broke
- Users' leads blocked prematurely (shows full when not actually at limit)
- Backlog leads assigned at 10 AM IST process correctly, but any lead assignment attempted between 12 AM–5:30 AM IST could be incorrectly blocked

#### How it was fixed
Changed `check_lead_limit_before_insert` to use actual `COUNT(*)` from the `leads` table with IST date filter:
```sql
CREATE OR REPLACE FUNCTION public.check_lead_limit_before_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    current_leads INT;
    max_limit     INT;
    user_name     TEXT;
BEGIN
    IF NEW.status = 'Assigned' AND NEW.assigned_to IS NOT NULL THEN
        SELECT daily_limit, name
        INTO   max_limit, user_name
        FROM   users
        WHERE  id = NEW.assigned_to;

        max_limit := COALESCE(max_limit, 0);

        IF max_limit > 0 THEN
            -- Use actual COUNT from leads table with IST date (immune to leads_today counter drift)
            SELECT COUNT(*) INTO current_leads
            FROM   leads
            WHERE  assigned_to = NEW.assigned_to
              AND  id IS DISTINCT FROM NEW.id
              AND  assigned_at >= (CURRENT_DATE AT TIME ZONE 'Asia/Kolkata')
              AND  assigned_at < ((CURRENT_DATE + 1) AT TIME ZONE 'Asia/Kolkata');

            IF current_leads >= max_limit THEN
                RAISE EXCEPTION '⛔ BLOCKED: User % is Full (%/%). Cannot assign lead.',
                    user_name, current_leads, max_limit;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
```

**Key detail:** `id IS DISTINCT FROM NEW.id` — for UPDATE trigger, this excludes the current lead being updated so it's not double-counted. For INSERT (BEFORE INSERT), the row doesn't exist yet so it's a safe no-op exclusion.

#### Verification
```sql
-- Confirm function no longer reads leads_today column
SELECT prosrc LIKE '%actual COUNT from leads table%' AS fixed,
       prosrc LIKE '%SELECT leads_today%' AS still_uses_counter
FROM pg_proc WHERE proname = 'check_lead_limit_before_insert';
-- fixed=true, still_uses_counter=false ✅
```

---

### BUG-004 — Safety Net Trigger Double-Increments `leads_today`

**Status:** ✅ Fixed  
**Severity:** Medium (dead code in production — trigger never fires, but would cause damage if it did)  
**Affected:** `process_stuck_lead` function (`trg_safety_net_assign` trigger)  

#### What was the bug
The `trg_safety_net_assign` (BEFORE INSERT on leads) ran when a lead arrived as `status='New'` with `assigned_to=NULL`. It manually incremented the counter AND THEN the AFTER trigger also incremented it:

```sql
-- In process_stuck_lead (BEFORE INSERT):
IF v_target_user IS NOT NULL THEN
    NEW.assigned_to := v_target_user;
    NEW.status := 'Assigned';
    UPDATE users SET leads_today = leads_today + 1 WHERE id = v_target_user;  -- ← MANUAL +1
END IF;

-- THEN trigger_update_user_lead_count fires (AFTER INSERT):
-- Also does leads_today = leads_today + 1  ← SECOND +1!
```

Net result: `leads_today += 2` per safety-net-assigned lead, `total_leads_received += 1` (correct only once by AFTER trigger). Users would appear to hit their daily limit at 50% of actual capacity.

**Note:** Confirmed 0 leads with `status='New'` have ever existed in production — this trigger has never actually fired. But it's a time bomb.

#### What broke
Not currently broken (dead code). If it ever fires, users would get blocked at half their daily limit.

#### How it was fixed
Removed the manual `UPDATE users SET leads_today += 1` line. AFTER trigger handles all counter updates:
```sql
CREATE OR REPLACE FUNCTION public.process_stuck_lead()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_target_team TEXT;
    v_target_user UUID;
BEGIN
    IF NEW.status = 'New' AND NEW.assigned_to IS NULL THEN
        -- ... team routing logic ...
        IF v_target_user IS NOT NULL THEN
            NEW.assigned_to := v_target_user;
            NEW.status := 'Assigned';
            -- trigger_update_user_lead_count (AFTER INSERT) handles counter updates
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
```

#### Verification
```sql
SELECT prosrc LIKE '%UPDATE users SET leads_today%' AS still_double_increments
FROM pg_proc WHERE proname = 'process_stuck_lead';
-- still_double_increments=false ✅
```

---

### BUG-005 — `get_best_assignee_for_team` PASS 2 Has Reversed `plan_weight` Ordering

**Status:** ✅ Fixed  
**Severity:** Low (no current impact — all users have `plan_weight=1`, but latent bug for future)  
**Affected:** `get_best_assignee_for_team` RPC  

#### What was the bug
The RPC has two passes:
- **PASS 1** (users below 60% daily limit): `ORDER BY ... COALESCE(plan_weight, 1) ASC`
- **PASS 2** (users 60–100% daily limit): `ORDER BY ... COALESCE(plan_weight, 1) DESC` ← **REVERSED!**

In PASS 1, `ASC` means lower weight = higher priority. In PASS 2, `DESC` means higher weight = higher priority. These are opposite behaviors. If you set different `plan_weight` values for different users/plans in the future, PASS 2 would assign leads in reverse-priority order, causing unequal distribution.

#### What broke
No current impact (all `plan_weight = 1`). Would cause lead distribution problems if `plan_weight` is ever varied.

#### How it was fixed
Changed PASS 2 ORDER BY from `DESC` to `ASC`:
```sql
-- PASS 2 ORDER BY (was DESC, now ASC — matches PASS 1):
ORDER BY
    (today_count)::float / GREATEST(COALESCE(u.plan_weight, 1), 1) ASC,
    CASE u.plan_name WHEN 'manager' THEN 1 ... END ASC,
    COALESCE(u.plan_weight, 1) ASC,   -- ← Fixed: was DESC
    RANDOM()
```

#### Verification
```sql
SELECT prosrc LIKE '%plan_weight, 1) DESC%' AS still_has_bug,
       prosrc LIKE '%plan_weight, 1) ASC%'  AS fixed
FROM pg_proc WHERE proname = 'get_best_assignee_for_team';
-- still_has_bug=false, fixed=true ✅
```

---

### BUG-006 — Razorpay Webhook Silently Drops Payments (No Self-Healing)

**Status:** ✅ Fixed (permanent safety net added)
**Severity:** Critical — real captured payments were not activating user plans, with no automatic detection
**Affected:** `functions/api/razorpay-webhook.ts` (Cloudflare Pages Function)

#### What was the bug
The Razorpay webhook is the only path that turns a captured payment into an active plan. It had already failed once for 27+ days (root cause: `leadflowcrm.in` non-www→www redirect turning Razorpay's POST into a GET — fixed earlier). Even after that fix and a webhook-secret rotation, it failed again on 2026-07-07 for 2 more real payments (`pay_TAaIC81bqGq1ZA` — SEEMA RANI, `pay_TAa7wUU9qCp8MV` — Ravenjeet Kaur), proving webhook delivery from Razorpay → Cloudflare Pages is not reliable enough to trust unmonitored. No Razorpay MCP/API tool exposes webhook delivery logs or retry config, so the delivery side could not be further diagnosed from this codebase.

#### What broke
A paying customer's plan does not activate and they receive no leads, with zero automatic alert — the only way this was caught was the customer complaining.

#### How it was fixed
Instead of only chasing the webhook reliability issue again, added a reconciliation safety net that doesn't depend on the webhook working at all:
- New Supabase Edge Function **`razorpay-reconcile`** (project `vewqzsqddgmkslnuctvb`) polls `GET https://api.razorpay.com/v1/payments?from=<now-2h>&count=100` via Razorpay's REST API directly, and for every `status=captured` payment not yet present in `payments` (checked by `razorpay_payment_id`), replays the exact same activation logic as `razorpay-webhook.ts` (same `PLAN_CONFIG`, same `baseline = Math.max(total_leads_received, total_leads_promised)` cumulative-quota math, same next-day-7AM-IST pending-activation flow).
- `pg_cron` job `razorpay-reconcile-15min` (jobid 26, schedule `*/15 * * * *`) invokes it every 15 minutes via `net.http_post`, using the project's existing service_role JWT (same pattern as `morning-backlog-processor`/`daily-quota-check`).
- The 2-hour lookback window vs. 15-minute cron interval gives an 8x safety margin, so a single missed cron tick or a burst of Razorpay API slowness still gets caught on the next run.
- Idempotent by design (dedupes on `razorpay_payment_id`) — safe to run indefinitely alongside the real webhook; it only ever fills gaps, never double-processes.
- Razorpay API keys (`key_id`/`key_secret`) are hardcoded as constants inside the Edge Function source, since no Supabase secrets-management MCP tool was available in this environment to set them as an env var (`deploy_edge_function` was the only deployment path found).

#### Verification
```sql
-- Cron job is active
SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'razorpay-reconcile-15min';
-- jobid=26, schedule='*/15 * * * *', active=true

-- Manual test invocation returned 200 and reached Razorpay live (not a silent failure)
SELECT net.http_post(
  url := 'https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/razorpay-reconcile',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer <service_role_jwt>"}'::jsonb,
  body := '{}'::jsonb
);
-- then: SELECT status_code, content FROM net._http_response WHERE id = <request_id>;
-- status_code=200, content={"checked":0,"results":[]}  (0 = correct, no new captured payment in last 2h at test time)

-- Cross-check: Razorpay's live captured-payment list has zero gap vs. the payments table
-- (confirmed 2026-07-07: both of today's captured payments already present in `payments`)
```

**Note:** this does not fix Razorpay→Cloudflare webhook delivery itself (still unexplained/unmonitorable from this side) — it makes the *consequence* of that failure self-healing within ~15 minutes instead of requiring a customer complaint to notice.

---

### BUG-007 — Stale Hardcoded Razorpay Key Fallback in `config/env.ts`

**Status:** ✅ Fixed
**Severity:** High (latent — would have caused silent checkout failure)
**Affected:** `config/env.ts`

#### What was the bug
`config/env.ts` had `RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_RnAEaa2JKAP8Ow"` — a hardcoded live key baked in as a silent fallback for whenever the build-time env var is unset. On 2026-07-07, the admin regenerated the Razorpay live API key (new key_id `rzp_live_TAhoGz0Jx9Do7e`) from the Razorpay dashboard, which immediately invalidates the old key_id/key_secret pair. Regeneration was done to give this session a working key pair for building `razorpay-reconcile` (BUG-006).

#### What broke
Nothing broke in production because `VITE_RAZORPAY_KEY_ID` was already correctly set in Cloudflare Pages at build time (the fallback was never actually hit). But the fallback was now silently pointing at a dead key — if the Cloudflare Pages build-time var were ever accidentally removed or misconfigured, the frontend checkout widget (`components/Subscription.tsx` / `views/Subscription.tsx`, `key: import.meta.env.VITE_RAZORPAY_KEY_ID`) would fall back to this invalid key with no clear error, and Razorpay Checkout would fail to open for every user.

#### What needed updating (full propagation checklist for a Razorpay live key rotation)
- Cloudflare Pages env (Production) — `RAZORPAY_KEY_ID` (server-side, used by `functions/api/create-order.ts`) — did not exist before, newly added
- Cloudflare Pages env (Production) — `RAZORPAY_KEY_SECRET` (server-side, same file) — existing var, value updated
- Cloudflare Pages env (Production) — `VITE_RAZORPAY_KEY_ID` (build-time, baked into frontend bundle for the Checkout widget) — existing var, value updated
- **A fresh Cloudflare Pages deployment triggered after all three were updated** — required, since Cloudflare only applies env/secret changes to deployments made after the change (confirmed via Cloudflare docs: "it needs to be done before a deployment that uses those secrets")
- `config/env.ts` hardcoded fallback — updated to the new key (this fix)
- Supabase `razorpay-reconcile` — already deployed with the new key directly, no separate update needed
- **NOT touched, correctly**: `RAZORPAY_WEBHOOK_SECRET` — this is a separate credential (HMAC signature verification only) and is not affected by key_id/key_secret regeneration

#### How it was fixed
```ts
// config/env.ts — before:
RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_RnAEaa2JKAP8Ow",
// after:
RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_TAhoGz0Jx9Do7e",
```

#### Verification
```
grep -n "RAZORPAY_KEY_ID" config/env.ts
-- should show rzp_live_TAhoGz0Jx9Do7e, not rzp_live_RnAEaa2JKAP8Ow
```
Real-world verification: open the app, click "Buy"/"Subscribe" on any plan — Razorpay Checkout popup should open without a "Server misconfiguration" or order-creation error.

---

### BUG-008 — New Signups Default to `is_active=true` With No Payment

**Status:** ✅ Fixed
**Severity:** High — every new signup was immediately eligible to receive leads for free
**Affected:** `handle_new_user()` trigger function (fires `AFTER INSERT ON auth.users`, populates `public.users`)

#### What was the bug
`handle_new_user()` correctly sets `payment_status='inactive'` and `plan_name='none'` for a brand-new signup (no payment made yet), but in the same INSERT it hardcoded `is_active` to `true`. `is_active` is the flag that controls lead-receiving eligibility, so every single new account — the moment they finish Supabase Auth signup, before paying anything — became eligible to receive leads.

#### What broke
Audit on 2026-07-07 found 22 accounts created between 2026-06-10 and 2026-07-01 with `is_active=true`, `payment_status='inactive'`, `plan_name='none'`, `total_leads_received=0` — genuine unpaid signups, not paying members. Cross-checked their `manager_id` to find their real intended team (their own `team_code` is NULL for members, only managers get a `team_code`):

| Real team (via manager) | Count |
|---|---|
| ALPHAECO | 9 |
| ECO@WIN12 | 7 |
| ECO-SUKH2022 | 4 |
| TEAMFIRE | 1 |
| DIGFIG | 1 |

Plus 1 more with an explicit `team_code='ALPHAECO'` (Sukhmani) — highest risk of the batch, since she (unlike the other 9 ALPHAECO signups whose `team_code` is NULL) would actually pass a `team_code='ALPHAECO'` filter in lead-assignment RPCs despite having paid nothing.

11 of these (the ones under TEAMFIRE/ALPHAECO, verified zero `payments` rows each) were deactivated first; the remaining 12 (ECO@WIN12 x7, ECO-SUKH2022 x4, DIGFIG x1) were re-verified zero-payment and deactivated the same day in a follow-up pass. All 23 unpaid signups found in this audit are now `is_active=false`.

#### How it was fixed
```sql
-- handle_new_user() — before:
'{"pan_india": true}'::jsonb, true, 0, 50,
-- after:
'{"pan_india": true}'::jsonb, false, 0, 50,
```
Single-value change inside the existing `INSERT INTO public.users (...)` column list (`is_active` column position) — full `CREATE OR REPLACE FUNCTION` re-deployed with only this value flipped. All other fields (payment_status, plan_name, quota defaults, team_code/manager_id extraction logic) untouched.

#### Verification
```sql
SELECT prosrc LIKE '%jsonb, false, 0, 50%' AS fixed FROM pg_proc WHERE proname = 'handle_new_user';
-- fixed = true

-- Should return 0 rows going forward (no new unpaid account should ever be is_active=true):
SELECT email, name, created_at FROM users
WHERE role='member' AND is_active=true AND payment_status='inactive' AND plan_name='none'
  AND created_at > '2026-07-07'::date;
```

**Note:** the `is_active` column itself still has a table-level `DEFAULT true` (`information_schema.columns` confirms this). It's dormant now — every actual signup path goes through `handle_new_user()`, which explicitly specifies `is_active` in its INSERT, overriding the column default. Left as-is (changing a column default is a schema change requiring separate sign-off per the hard rules in `CLAUDE.md`), but flagged here in case any future insert path into `public.users` ever omits `is_active` explicitly.

---

## Historical Over-Delivery (Root Cause Analysis)

**Date discovered:** 2026-05-24  
**Status:** Cannot be reversed (historical), future protected by BUG-001/002/003 fixes  

100+ past users received more leads than `total_leads_promised`. Biggest cases:
- Simran (simransimmi983): +142 leads over
- Princy (princyrani303): +135 over  
- Kulwant Singh: +107 over

**Root cause:** These leads were assigned before `trigger_update_user_lead_count` had auto-deactivation logic. The trigger existed but did not check `total_leads_received >= total_leads_promised` and set `is_active = false`. Counter drift (BUG-001) compounded the problem.

**Protection going forward:**
- BUG-001 fix: trigger now decrements on reassign → counters stay accurate
- BUG-002 fix: regular audit can catch over-quota active users
- BUG-003 fix: daily limit trigger uses actual count → no false passes
- Auto-deactivate in trigger: fires atomically at exact quota exhaustion

---

## Non-Bug Fixes / Data Operations (2026-05-24)

| Operation | Detail |
|-----------|--------|
| 19 Queued/Duplicate leads assigned | Round-robin to 9 active users (May 20 batch) |
| Komal bishnoi (kb817949) credit | +35 leads (weekly_boost underdelivery fix — plan ran 10 May onward) |
| Ajay kumar re-activated | Had quota remaining (545/554), was incorrectly inactive |
| Reetika re-activated | Had quota remaining (51/52) |
| Harmandeep kaur (deeprandhawa1604) re-activated | Had quota remaining (50/82) |
| 14 users deactivated | Non-May-paying users, quota zeroed |

---

## How to Use This File

1. **Before debugging a new issue** — CTRL+F for keywords (e.g., "leads_today", "counter", "daily limit"). If the root cause is already documented, the fix approach is known.

2. **After fixing any bug** — Add an entry here with date, symptoms, root cause, exact SQL/code fix, and verification query.

3. **For audit trail** — Each entry has a date and verification query you can re-run to confirm the fix is still in place.

4. **Counter drift check** — Run this anytime you suspect counter issues:
   ```sql
   SELECT u.email, u.name,
          u.total_leads_received AS counter,
          COUNT(l.id) AS actual,
          u.total_leads_received - COUNT(l.id) AS drift
   FROM users u LEFT JOIN leads l ON l.assigned_to = u.id
   WHERE u.role = 'member'
   GROUP BY u.id, u.email, u.name, u.total_leads_received
   HAVING u.total_leads_received != COUNT(l.id)
   ORDER BY ABS(u.total_leads_received - COUNT(l.id)) DESC;
   ```

5. **Over-quota active users check** — Run weekly:
   ```sql
   SELECT email, name, total_leads_promised,
          (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) AS actual_leads,
          is_active
   FROM users u
   WHERE is_active = true AND total_leads_promised > 0
     AND (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) >= total_leads_promised;
   ```
