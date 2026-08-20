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

## 2026-08-20

---

### BUG-017 — Reactivation deadlock: 23 paying members stuck "Plan Inactive" despite genuine quota left

**Status:** ✅ Fixed

**Symptom:** Ajay kumar (`ajayk783382@gmail.com`) reported "Plan Inactive" on his dashboard despite
17 leads still owed (719/736 delivered). A follow-up query found 23 members in the identical state.

**Root cause:** `trigger_update_user_lead_count` (AFTER INSERT/UPDATE on `leads`, function
`update_user_lead_count()`) has two branches:
- INCREMENT (a lead lands on someone) — correctly deactivates on quota exhaustion, setting BOTH
  `is_active=false` AND `payment_status='inactive'` together.
- DECREMENT (a lead is taken away — reassignment, recycling, an admin correction) — was supposed to
  reverse this if the user genuinely has room again, but its condition required
  `payment_status = 'active'` first. That's exactly the field the increment branch had just set to
  `'inactive'`. A user correctly deactivated for hitting quota could never satisfy this condition
  again — it required the very state only a successful reactivation would produce. The branch also
  never wrote `payment_status` at all, only `is_active`, so even fixing the condition alone would
  leave `payment_status` stale.

**What broke:** Any paying member who (a) was correctly auto-deactivated for exhausting quota, then
(b) later had one of their counted leads removed for any reason (reassignment, recycling from an
inactive holder, an admin correction) while `total_leads_promised` still had room — got permanently
stuck showing "Plan Inactive" with real leads owed, no self-healing path. Live count: 23 members,
1–67 leads owed each, ~323 leads total wrongly withheld. Not every one of the 23 is provably caused
by this exact mechanism (this repo has a long history of one-off manual SQL corrections that could
independently leave the same signature) — but it is a real, reproducible bug in an always-on
trigger, and the only currently-active code path that produces this exact outcome.

**Fix (`supabase/migrations/20260820134500_fix_reactivation_deadlock.sql`):**
```sql
-- Decrement branch's reactivation condition, before/after:
-- BEFORE:
--   WHEN payment_status = 'active' AND plan_name != 'none' AND (actual count) < total_leads_promised
--   THEN is_active := true   -- payment_status never touched
-- AFTER:
--   WHEN plan_name != 'none' AND total_leads_promised > 0 AND (actual count) < total_leads_promised
--   THEN is_active := true, payment_status := 'active'   -- both set together
```
Full `CREATE OR REPLACE FUNCTION public.update_user_lead_count()` is in the migration file. Increment
branch and all counter math untouched. Admin-approved per CLAUDE.md rule 4 (RPC/trigger change).

**One-time batch correction** (same session, since the trigger fix alone only prevents *future*
freezes — it doesn't retroactively fix already-stuck rows):
```sql
UPDATE users
SET is_active = true, is_online = true, payment_status = 'active', updated_at = NOW()
WHERE role = 'member' AND is_active = false AND payment_status = 'inactive'
  AND plan_name <> 'none' AND total_leads_promised > 0
  AND total_leads_received < total_leads_promised;
-- 23 rows affected. daily_limit auto-synced per plan via trg_sync_user_plan_fields.
```

**Verification (all re-run after, all clean):**
```sql
-- 1. Nobody left in the stuck signature
SELECT COUNT(*) FROM users WHERE role='member' AND is_active=false AND payment_status='inactive'
  AND plan_name<>'none' AND total_leads_promised>0 AND total_leads_received < total_leads_promised;
-- -> 0

-- 2. Counter drift (standard check)
SELECT u.email, u.total_leads_received AS counter, COUNT(l.id) AS actual
FROM users u LEFT JOIN leads l ON l.assigned_to = u.id
WHERE u.role = 'member' GROUP BY u.id, u.email, u.total_leads_received
HAVING u.total_leads_received != COUNT(l.id);
-- -> 0 rows

-- 3. Over-quota active users (standard check)
SELECT email, total_leads_promised, (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) AS actual
FROM users u WHERE is_active = true AND total_leads_promised > 0
  AND (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) >= total_leads_promised;
-- -> 0 rows
```

**Date:** 2026-08-20

---

## 2026-08-19

---

### BUG-016 — "Checking session…" hang / bounce-to-login: profile cache wiped on EVERY app open for 87 users

**Status:** ✅ Fixed

**Symptoms:** App ya browser kholte hi "Loading workspace… / Checking session… / Connecting to
secure server…" par minutes tak atak jaata tha, ya login page par wapas fenk deta tha. Admin ke
saath sabse zyada, managers/unpaid members ke saath bhi. Mobile data par zyada, WiFi par bhi.

**Root cause:** `auth/useAuth.tsx` ke profile-cache initializer mein ek "legacy dummy profile"
cleanup tha jo sirf 4 fields dekhta tha:
```js
parsed.daily_limit === 0 && parsed.leads_today === 0 &&
parsed.total_leads_received === 0 && parsed.payment_status === 'inactive'
```
Ye ek ASLI admin/manager/unpaid-member row ka bilkul **normal** state hai — admin leads leta hi
nahi, isliye uske counters hamesha 0 aur `payment_status` `'inactive'` rehta hai. Live DB par
**87 users** is condition se match kar rahe the (2 admin + 13 manager + 72 member).

Un users ka profile cache **har app-open par wipe** ho jaata tha, jisse poori recovery chain toot
jaati thi:
1. `initializeAuth()` ka "instant restore" skip (usko `profileRef.current` chahiye — ab null)
2. "Optimistic Load: Showing cached profile" bhi skip (`cachedProfile` mila hi nahi)
3. Blocking `await loadUserProfile()` chalta hai
4. Agar wo live fetch fail hui — expired/dead token -> RLS 0 rows -> **406 "Cannot coerce the
   result to a single JSON object"** — to `fetchProfile` ka stale-cache fallback bhi khaali
5. `profile` null reh jaata hai -> `isAuthenticated = !!session && !!profile` **false**
   -> "Checking session…" par atka, ya login page par wapas

Paying members (jinke `daily_limit=9`, `total_leads_received=300+`, `payment_status='active'`)
kabhi match nahi karte the — isliye unhe ye bug lagbhag kabhi nahi dikhta tha. Yahi wajah hai ki
symptom "randomly kuch logon ke saath" lagta tha.

⚠️ `createTempProfile()` — jo wo dummy banata tha — **poore codebase mein kahin call hi nahi hota**
(dead code, grep se confirm). Cache mein sirf asli DB rows jaati hain (teeno `writeProfileCache`
call sites verify kiye). Yaani ye heuristic ab **sirf asli profiles** ko match kar sakti thi —
uska original purpose khatam ho chuka tha, sirf nuksaan bacha tha.

**Fix (`auth/useAuth.tsx`):** condition ko dummy ke **poore signature** se match karaya —
`createTempProfile()` hamesha `is_active: true`, `total_leads_promised: 50` aur khali `sheet_url`
likhta tha; ye teeno ek asli row mein saath nahi aate:
```js
const isLegacyDummy =
  parsed && parsed.daily_limit === 0 && parsed.leads_today === 0 &&
  parsed.total_leads_received === 0 && parsed.payment_status === 'inactive' &&
  parsed.is_active === true && parsed.total_leads_promised === 50 && !parsed.sheet_url;
```

**Verification:**
- Live DB query: tightened condition se **0 real users** match karte hain (purani se 87 karte the)
- Logic test (6 cases, sab pass): admin row -> keep (pehle WIPE), unpaid member -> keep (pehle
  WIPE), manager / paying member / naya signup -> keep, asli legacy dummy -> abhi bhi WIPE
- `npm run build` clean (1862 modules); `tsc --noEmit` mein 0 naya error

```sql
-- Kitne real users purani (buggy) condition se match karte the
SELECT role, COUNT(*) FROM users
WHERE daily_limit=0 AND leads_today=0 AND total_leads_received=0 AND payment_status='inactive'
GROUP BY role;   -- 72 member, 13 manager, 2 admin

-- Nayi (fixed) condition — hamesha 0 aana chahiye
SELECT COUNT(*) FROM users
WHERE daily_limit=0 AND leads_today=0 AND total_leads_received=0 AND payment_status='inactive'
  AND is_active=true AND total_leads_promised=50 AND COALESCE(sheet_url,'')='';
```

**Date:** 2026-08-19

---

### ⚠️ BUG-015 follow-up — `lock` option supabase-js 2.39.0 mein NEVER forwarded (abhi tak un-fixed)

**Status:** 🔎 Diagnosed, NOT fixed (deliberate — alag decision chahiye)

Investigation ke dauran mila: `supabaseClient.ts` ka custom `auth.lock` **kabhi lagu hi nahi hua**.
`node_modules/@supabase/supabase-js@2.39.0`'s `_initSupabaseAuthClient()` sirf 7 options forward
karta hai — `autoRefreshToken, persistSession, detectSessionInUrl, storage, storageKey, flowType,
debug` — aur **`lock` ko silently drop kar deta hai** (type definition mein `lock` hai, par
implementation use hi nahi karti). `gotrue-js@2.98.0` (GoTrueClient.ts:337-342) phir default par
gir jaata hai:
```js
if (settings.lock) { this.lock = settings.lock }            // kabhi nahi — drop ho chuka
else if (persistSession && isBrowser() && navigator.locks) {
  this.lock = navigatorLock                                  // <- YEHI chal raha hai
}
```
Yaani **`navigator.locks` shuru se hi active hai** — wahi API jiske baare mein CLAUDE.md kehta hai
ki mobile par 15s hang karti hai. Jo "SMART LOCK bypass" us hang se bachne ke liye likha gaya tha,
wo **dead config** tha.

Proof (live console log): `@supabase/gotrue-js: Lock "lock:leadflow-auth-v2" was not released
within 5000ms … Forcefully acquiring the lock to recover.` — ye message `navigatorLock` ka apna
hai aur 5000ms `gotrue-js` ka default `lockAcquireTimeout` hai. Saath mein `getSession() timed out
after 15s` do baar.

⚠️ **Isi wajah se BUG-015 ka "Option B" (in-tab mutex, PR #161) bhi dead code tha** — wo kabhi
chala hi nahi, isliye na usne kuch fix kiya na kuch toda. Revert (PR #162) bhi functionally no-op
tha. Jo temporal correlation dikha tha ("raat ko B lagaya, subah issue aaya") wo **coincidence**
thi.

**Options aage ke liye (koi bhi abhi implement nahi kiya):**
- (B) `createClient()` ke baad `supabase.auth.lock` directly assign karo — `acquireTimeout === 0`
  par `LockAcquireTimeoutError` throw karna ZAROORI hai, warna `_autoRefreshTokenTick()`
  (GoTrueClient.ts:2976) skip hone ke bajaye queue hone lagega
- (C) `supabase-js` upgrade karo aise version par jo `lock` forward karta ho (bada risk, live auth)

**Date:** 2026-08-19

---

## 2026-08-05 → 2026-08-18 (backfilled 2026-08-19)

> These three were fixed when they happened but only recorded in CLAUDE.md's changelog,
> not here. Backfilled so this file stays the single authoritative bug log.

---

### BUG-013 — `PLAN_CONFIG` duplication: one copy updated, the other stale → wrong quota sold

**Status:** ✅ Fixed

**Symptoms:** Two real paying customers (Ravenjeet Kaur, Kajal) received the wrong lead quota
after buying during the August offer — they got pre-offer numbers instead of offer numbers.

**Root cause:** `PLAN_CONFIG` exists in **two** independent copies:
1. `functions/api/razorpay-webhook.ts` (Cloudflare Pages Function)
2. `supabase/functions/razorpay-reconcile/index.ts` (15-min cron poller)

The August offer rollout updated only #1. But **#2 processes most live payments in practice**,
because the Cloudflare webhook has a documented history of silent failures (BUG-006) and the
reconcile poller picks those up. So the stale copy was the one actually deciding quota.

**Fix:** `razorpay-reconcile` redeployed with `PLAN_CONFIG` matching `razorpay-webhook.ts`
byte-for-byte. Both affected customers' quotas corrected manually.

⚠️ **Standing rule:** plan numbers (offer ON/OFF included) must be changed in **both** files,
plus the DB `plan_config` table, plus `config/offer.ts` for the UI. Four places. Changing fewer
means buyers get quota that does not match what they were sold. A warning block now sits at the
top of `razorpay-reconcile/index.ts`.

```sql
-- Verify all three quota sources agree for a plan
SELECT plan_name, duration, daily_leads, total_leads, weight FROM plan_config ORDER BY plan_name;
-- then diff against PLAN_CONFIG in razorpay-webhook.ts AND razorpay-reconcile/index.ts
```

**Date:** 2026-08-05 / fixed 2026-08-06

---

### BUG-014 — Admin Quick Edit silently killed users' lead flow (`is_online` desync)

**Status:** ✅ Fixed

**Symptoms:** Ravenjeet Kaur received zero leads all day despite `is_active=true`,
`payment_status='active'`, 124 quota remaining and no pending plan. Nothing in the admin UI
looked wrong.

**Root cause:** her row was `is_active=true` **but `is_online=false`**. Every lead-routing path
(`get_best_assignee_for_team` RPC, `sheet-lead-intake`, `process-backlog`,
`assign-recycled-leads`, `assign_lead_round_robin`) requires **BOTH** flags true, so she was
invisible to routing while looking perfectly healthy.

`components/UserQuickEdit.tsx` wrote `is_active` **without ever touching `is_online`**. Every
other write path in the codebase pairs them (member pause toggle, admin activation,
`check-quota-expiry`, `plan-expiry-notifier`, `razorpay-webhook`/`-reconcile` — all 6 verified).
So a user who had paused themselves (both flags false) and was later saved through Quick Edit for
any unrelated reason came back `is_active=true` / `is_online=false` — permanently unroutable,
with no error and no visible sign.

**3 more paying users were in the same broken state** (Prince, Simran, Jashandeep kaur).

**Second bug in the same flow:** `AdminDashboard.tsx` passed
`is_active: showEditModal.payment_status === 'active'` into the modal instead of the real
`is_active` column. `payment_status='active'` only means "has paid" — independent of pause state.
So the toggle pre-filled as ON for every paying user, meaning an admin saving an unrelated field
would silently **un-pause** someone who had deliberately paused themselves.

**Fix:** Quick Edit now writes `is_online: isActive` alongside `is_active`; `AdminDashboard.tsx`
passes the real `is_active`; `AdminUserRow` interface gained the missing `is_active` field. All 4
affected users repaired.

⚠️ **`is_online` is a ROUTING flag, not a presence/heartbeat flag** — despite its name. A legacy
`update_user_presence()` RPC still exists in the DB that would set it as a browser-presence
signal; it is **not called from any frontend code** (grepped). Wiring it up would disable live
users' lead flow.

```sql
-- Must always return 0 rows
SELECT email, name FROM users
WHERE role='member' AND is_active=true AND is_online=false AND payment_status='active';
```

**Date:** 2026-08-16

---

### BUG-015 — Random logout / "back to login page" loop: refresh-token race

**Status:** ✅ Fixed (v6.5) — see also the BUG-015 follow-up above, which corrects part of the
original diagnosis

**Symptoms (admin's own words):** after logging in, reopening the dashboard logs you out; logging
in again lands you back on the login page. Worse on mobile data, but also on WiFi. Android and
iOS both. Every earlier "permanent solution" (BUG-012 chunk recovery, PWA/SW cache cleanup) failed
to fix it — because those were all **loading/chunk** layer fixes and this is an **auth** layer bug.

**Root cause — two independent callers on one rotating refresh token:**
1. `supabaseClient.ts` has `autoRefreshToken: true` (supabase-js's own background timer)
2. `auth/useAuth.tsx` `initializeAuth()` had a **manual** block: "if the token expires within 10
   minutes, call `supabase.auth.refreshSession()` yourself"

On app resume (phone lock/unlock, app switch, mobile-data tower or 4G↔5G handover) both woke at
once and sent a refresh with the **same** token. Supabase **rotates** refresh tokens: the first
request consumes it and invalidates it immediately, so the second gets
`Invalid Refresh Token: Already Used` → supabase-js clears the session and fires `SIGNED_OUT` →
the user lands on the login page. **Not a genuine expiry — a false logout.**

**Fix (minimal, deletion only):** removed the manual proactive-refresh block from
`initializeAuth()`. `autoRefreshToken` already does that job, so it was a duplicate caller and
nothing else. One refresh caller remains → race gone. Header bumped v6.4 → **v6.5**.

⚠️ **Important correction (found 2026-08-19):** the original diagnosis blamed the no-op custom
`lock` in `supabaseClient.ts` for failing to serialise these calls. That lock was never in effect
at all — `supabase-js@2.39.0` silently drops the `lock` option (see the BUG-015 follow-up entry
above). The race and this fix are still real; the explanation of *why nothing stopped it* was
wrong. `navigator.locks` was the active lock the whole time and did not prevent this, because the
two callers were in the same tab and gotrue-js's own re-entrancy guard let both through.

⚠️ This fix addressed the **false logout**. It did **not** fix the separate "Checking session…"
**hang** — that turned out to be BUG-016.

**Date:** 2026-08-18

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

### BUG-009 — Meta CAPI Signal Silently Never Fires For Some Interested/Closed Tags

**Status:** ✅ Fixed
**Severity:** Medium — data quality issue for Meta ad optimization, not a business-data-loss bug
**Affected:** `views/MemberDashboard.tsx` (`handleStatusChange`), `send-crm-conversion` Edge Function

#### What was the bug
When a member tagged a lead `Interested`/`Closed`, the frontend called `send-crm-conversion` as pure fire-and-forget: `supabase.functions.invoke(...).catch(() => {})`. If the tab closed, the network blipped, or the call errored before the function's `capi_event_log` insert branches were reached, the signal silently never reached Meta — no error shown to the user, no log row at all (not even a `failed` result), completely invisible.

#### What broke
Audit on 2026-07-07 using the `capi_event_log` table (which records every real attempt + Meta's actual response) found:
- Priyanka Sharma's lead tagged `Interested` on 2026-07-06 — zero `capi_event_log` row exists. The call never completed.
- Separately (not a bug, a coverage gap): Lovepreet Kaur's lead (`ECO@WIN12` team) correctly logged `skipped_no_pixel` — `pixel_config` only has active rows for `team_code IN ('TEAMFIRE', 'TEAMFIRE,TEAMSIMRAN')`; no other team has an active Meta Pixel/CAPI mapping, so their Interested/Closed/Call Back tags can never reach Meta until a pixel is configured for them.
- A separate high-intent signal was also missing entirely: `status='Call Back'` (a lead interested enough to warrant a scheduled follow-up) was never sent to Meta at all — only `Interested`→`QualifiedLead` and `Closed`→`ClosedDeal` existed.

Full-history count (all-time, since this feature has ever existed): 881 `Interested`, 70 `Closed`, 590 `Call Back` tagged leads, of which only 19 + 16 + 0 respectively had a `sent` `capi_event_log` row — but nearly all of that gap is leads tagged *before* the current active Pixel (`1047115834311811`, created 2026-06-30 20:09 UTC) ever existed, so backfilling those would mean reporting months-old CRM interactions to Meta as if they "just happened" (`event_time` is always stamped `now()` by design) — a real risk of skewing Meta's signal quality / triggering unusual-activity review on the ad account for no benefit, since Meta never saw those campaigns' outcomes anyway. Backfill was intentionally scoped to **only leads updated since the active Pixel was created** (2026-06-30 onward) — 5 leads total.

#### How it was fixed
1. **`send-crm-conversion` v4** — added `'FollowUp'` to `ALLOWED_EVENTS` (was `['QualifiedLead', 'ClosedDeal']`), and updated the `capi_event_log_event_name_check` CHECK constraint to allow it.
2. **New DB trigger `trg_send_crm_conversion`** (`AFTER UPDATE ON leads`, fires when `status` changes to `Interested`/`Call Back`/`Closed`) calls `send-crm-conversion` via `net.http_post` — server-side, so it fires reliably regardless of the member's browser/tab/network state. This is now the sole path; the frontend's fire-and-forget call was removed from `MemberDashboard.tsx` entirely (see PR #84).
3. **Backfill**: the 5 leads tagged since the active Pixel's creation (2026-06-30) that were missing a `sent` log were re-sent via the (now-fixed) function — 4/5 succeeded with real Meta `fbtrace_id`s confirming genuine acceptance; the 5th (Lovepreet Kaur, `ECO@WIN12`) correctly `skipped_no_pixel` again, same as before — that part is a config gap, not something this fix could resolve (needs a Pixel/CAPI token for `ECO@WIN12` and any other non-TEAMFIRE team, same as was done for TEAMFIRE earlier).

#### Verification
```sql
-- Trigger is live
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'trg_send_crm_conversion';
-- tgenabled = 'O' (enabled)

-- Going forward: any Interested/Call Back/Closed tag should get a capi_event_log row
-- within seconds, with result IN ('sent','failed','skipped_no_pixel') -- never absent.
SELECT l.name, l.status, cel.event_name, cel.result, cel.created_at
FROM leads l LEFT JOIN capi_event_log cel ON cel.lead_id = l.id
WHERE l.status IN ('Interested','Call Back','Closed')
ORDER BY l.updated_at DESC LIMIT 20;
```

**Open item:** only `TEAMFIRE`/`TEAMSIMRAN` have an active Pixel/CAPI mapping in `pixel_config`. `ECO@WIN12`, `ALPHAECO`, `ECO-SUKH2022`, `WIN11`, `DIGFIG` all get `skipped_no_pixel` for every Interested/Follow-up/Closed tag — needs a Pixel ID + CAPI access token per team (or per ad account) to close, same setup process as TEAMFIRE.

#### ⚠️ Correction (same day) — wrong status was wired to the `FollowUp` event

The first version of this fix incorrectly mapped `status='Call Back'` → `FollowUp` event. **`Call Back` and `Follow-up` are two separate, distinct statuses** in this system (`Call Back` = "contact requested a callback later," a scheduling/logistics status; `Follow-up` = 📅 a dedicated status for a lead that showed real interest and is now being nurtured — the actual high-intent status). This was caught and corrected the same day.

**Consequence:** 3 leads with `status='Call Back'` (Komal_Kamal_Kayra, "anika", Priti_Mangal) were sent to Meta as a `FollowUp` custom event on 2026-07-07 before the fix. Meta CAPI has no delete/retract API for already-received custom events, so this cannot be undone — noted here for the record. Impact is minor (a handful of custom-event mislabels, not a standard/tracked conversion event, phone-hash match data itself was correct), but it's the honest state.

**Fix:**
```sql
-- trigger_send_crm_conversion() CASE mapping — before:
WHEN 'Call Back' THEN 'FollowUp'
-- after:
WHEN 'Follow-up' THEN 'FollowUp'
```
Also updated the trigger's `WHEN` clause: `NEW.status IN ('Interested','Call Back','Closed')` → `NEW.status IN ('Interested','Follow-up','Closed')`. `Call Back` status is intentionally NOT wired to any CAPI event (it wasn't part of the original request and isn't a reliable positive-intent signal by itself).

**Backfill correction:** 12 genuine `Follow-up`-status leads (tagged since the active Pixel's creation, 2026-06-30) had zero CAPI signal sent — all 12 backfilled successfully with real Meta `fbtrace_id`s after the fix.

**Verification:**
```sql
SELECT prosrc LIKE '%Follow-up%FollowUp%' AS has_correct_mapping,
       prosrc LIKE '%Call Back%' AS still_has_wrong_mapping
FROM pg_proc WHERE proname = 'trigger_send_crm_conversion';
-- has_correct_mapping = true, still_has_wrong_mapping = false
```

---

### BUG-010 — Phantom `total_leads_promised=50` at Signup Doubles Quota on First Real Payment

**Status:** ✅ Fixed
**Severity:** High — silent over-crediting of paid quota, real money impact
**Affected:** `handle_new_user()` trigger function

#### What was the bug
`handle_new_user()` hardcoded `total_leads_promised = 50` for **every** new signup, regardless of payment — a brand-new unpaid account (`payment_status='inactive'`, `plan_name='none'`) already had `total_leads_promised=50` sitting in the row from day one, with no payment behind it.

`razorpay-webhook.ts` / `razorpay-reconcile`'s cumulative-safety math (`baseline = Math.max(total_leads_received, total_leads_promised)`, `new_total = baseline + plan.totalLeads`) exists to protect users who already have real remaining quota from a prior payment when they renew. It has no way to distinguish that legitimate case from this phantom default — so the first time an affected user made a **real** payment, the phantom 50 got treated as already-earned quota and added on top of their actual plan.

#### What broke
Discovered 2026-07-09: Bhawna chawla (one of the 23 unpaid signups deactivated in BUG-008) made a genuine ₹999 starter-plan payment (`pay_TB5Pk9AXIpg0Uv`, captured) on 2026-07-08. `razorpay-reconcile` correctly activated her plan, but computed `total_leads_promised = 100` (phantom 50 + starter's real 50) instead of the correct **50** — she would have received double what she paid for.

Checked the remaining 22 previously-deactivated unpaid signups — none had a captured payment yet, so Bhawna was the only account actually affected at time of discovery.

#### How it was fixed
```sql
-- handle_new_user() — before:
'{"pan_india": true}'::jsonb, false, 0, 50,
-- after:
'{"pan_india": true}'::jsonb, false, 0, 0,
```
New signups now start at `total_leads_promised=0` — the cumulative-safety baseline math on first real payment then correctly computes `max(0, 0) + plan.totalLeads = plan.totalLeads`, exactly what was paid for.

**Manual correction for Bhawna chawla:** `total_leads_promised` 100 → 50 (matches her actual ₹999 starter payment). Also assigned `team_code='ECO@WIN12'` per admin instruction, so she now receives leads from that team's sheet instead of sitting unrouted.

#### Verification
```sql
SELECT prosrc LIKE '%jsonb, false, 0, 0,%' AS fixed FROM pg_proc WHERE proname = 'handle_new_user';
-- fixed = true

-- Should return 0 rows going forward (no unpaid new signup should ever show a non-zero promised quota):
SELECT email, name, total_leads_promised FROM users
WHERE role='member' AND payment_status='inactive' AND plan_name='none' AND total_leads_promised != 0
  AND created_at > '2026-07-09'::date;
```

#### Follow-up (same day) — retroactive cleanup, 34 pre-existing accounts

The fix above only prevents the bug for *future* signups. It does not fix existing rows created before the fix — anyone who signed up unpaid while the old `handle_new_user()` was live still has the phantom `total_leads_promised=50` sitting in their row today, visible in their dashboard as a misleading "50 total left" even though `Plan Inactive`.

Found via screenshot report (Amandeep kaur / `mnkaur5678@gmail.com` — one of the 23 accounts deactivated in BUG-008). Broadened the check beyond just her account:

```sql
-- Correctly scoped: only accounts with ZERO real payment history.
-- Users with captured_payments > 0 legitimately have a non-zero total_leads_promised
-- (their cumulative history from real past plans, even if currently expired/inactive) —
-- those must NOT be touched.
UPDATE users u
SET total_leads_promised = 0, updated_at = now()
WHERE role='member' AND payment_status='inactive' AND plan_name='none'
  AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.user_id = u.id AND p.status='captured')
  AND total_leads_promised != 0;
```

34 accounts corrected (Amandeep kaur among them). All were already `is_active=false` (from BUG-008), so this was purely a cosmetic/data-accuracy fix — no lead-routing behavior changed, just the dashboard now correctly shows `0 total left` / `Plan Inactive` instead of a phantom `50 total left` for someone who never paid.

**Safety verification before and after** — confirmed zero real-paying users were affected:
```sql
SELECT COUNT(*) FROM users u
WHERE role='member' AND payment_status='inactive' AND plan_name='none'
  AND total_leads_promised != 0
  AND EXISTS (SELECT 1 FROM payments p WHERE p.user_id=u.id AND p.status='captured');
-- 0 rows — every corrected account had zero captured payments, confirmed individually first
```

---

### BUG-011 — `assign_recycled_leads` RPC Silently Returns 0 Leads (NULL-unsafe filter)

**Status:** ✅ Fixed
**Severity:** High — would have caused mass under-delivery on a paid promotional offer
**Affected:** `assign_recycled_leads(p_user_id, p_count)` RPC
**Date:** 2026-08-04

#### What was the bug
The RPC's Gujarat-exclusion filter was NULL-unsafe:

```sql
AND NOT (l.state ILIKE '%gujarat%' OR l.city ILIKE '%gujarat%' OR ...)
```

In SQL, `NULL ILIKE '...'` evaluates to `NULL`, not `FALSE`. So for any lead where `state` is
NULL, the whole `OR` chain became `NULL`, `NOT NULL` = `NULL`, and the row was **silently
dropped** — no error, no warning, just zero rows.

#### What broke
Discovered 2026-08-04 while preparing the August ₹11/lead offer, which depends entirely on the
recycler delivering the non-fresh portion of each plan's quota.

**Every single one of the 1,046 eligible leads had `state = NULL`** (that column was never
populated for those older TEAMFIRE/TEAMSIMRAN/TEAMRAJ leads). Result: the eligible pool was
**0**. The recycler cron (jobid 22) had been inactive, so this had never surfaced.

Had the cron simply been switched on without this fix, buyers promised 90 / 136 / 181 / 227 / 272
leads would have received only the fresh portion (45 / 70 / 84 / 93 / 76) and the offer would have
under-delivered on every single sale, silently.

#### How it was fixed
Wrapped both columns in `COALESCE` so a NULL city/state behaves as an empty string:

```sql
AND NOT (COALESCE(l.state,'') ILIKE '%gujarat%' OR COALESCE(l.city,'') ILIKE '%gujarat%'
      OR COALESCE(l.city,'')  ILIKE '%ahmedabad%'   OR COALESCE(l.city,'') ILIKE '%surat%'
      OR COALESCE(l.city,'')  ILIKE '%vadodara%'    OR COALESCE(l.city,'') ILIKE '%rajkot%'
      OR COALESCE(l.city,'')  ILIKE '%vapi%'        OR COALESCE(l.city,'') ILIKE '%deesa%'
      OR COALESCE(l.city,'')  ILIKE '%gandhinagar%' OR COALESCE(l.city,'') ILIKE '%baroda%')
```

The same deploy also widened the age window to include July's Call Back leads across all teams
(offer inventory) — see `OFFER-PLAYBOOK.md`. All other guards were left untouched, in particular
`u.is_active = false OR u.payment_status IN ('expired','inactive')`, which ensures a lead is
**never taken away from an active paying member**.

Pool after fix: **0 → 1,140**.

#### Verification
```sql
-- Old definition returned 0; this must now return > 0
SELECT count(*) AS pool
FROM leads l INNER JOIN users u ON l.assigned_to = u.id
WHERE l.status IN ('Call Back','Contacted','Interested','Follow-up')
  AND COALESCE(l.recycle_count,0) <= 1
  AND l.phone IS NOT NULL AND LENGTH(TRIM(l.phone)) >= 10
  AND (u.is_active=false OR u.payment_status IN ('expired','inactive'))
  AND NOT (COALESCE(l.state,'') ILIKE '%gujarat%' OR COALESCE(l.city,'') ILIKE '%gujarat%');

-- Confirm the fix is live in the deployed function
SELECT prosrc LIKE '%COALESCE(l.state%' AS fixed FROM pg_proc WHERE proname='assign_recycled_leads';
-- fixed = true
```

**Live test (2026-08-04 16:02 IST):** 8 recycled leads delivered (Gurdeep 4, Jasnoor 4) —
`assigned_at` = today, `created_at` preserved (original July dates), `status='Fresh'`, previous
owners' notes cleared, all previous owners inactive, counter drift **0**.

**Lesson:** any `NOT (col ILIKE ...)` filter on a nullable column silently drops NULL rows.
Always `COALESCE(col,'')` first. Worth grepping other RPCs for this same pattern.

---

### BUG-012 — Chunk-load failure after deploy shows crash screen instead of auto-recovering

**Status:** ✅ Fixed
**Severity:** Medium — no data loss, but paying users see "Something went wrong" after every deploy
**Affected:** `App.tsx` → `lazyWithRetry()`
**Date:** 2026-08-04

#### What was the bug
Every deploy changes Vite's content-hashed chunk filenames. A user holding a cached `index.html`
requests the old chunk (e.g. `MemberDashboard-DfOrkO6f.js`), gets a 404, and React's lazy import
rejects.

There are two recovery layers, and **they cancelled each other out**:

1. `index.html` has a strong boot-recovery script — clears caches, unregisters service workers,
   then hard-reloads with a `?_r=<timestamp>` cache-buster. It triggers on the
   `unhandledrejection` event.
2. `App.tsx`'s `lazyWithRetry` wraps the import in its own `try/catch`.

Because layer 2 **catches** the rejection, it is never *unhandled* — so layer 1's
`unhandledrejection` listener never fired, and the good recovery never ran.

Layer 2's own fallback was weaker in two ways:

```js
return window.location.reload();
```

- Plain `reload()` does not bypass the HTTP cache, so it can re-serve the very same stale
  `index.html` pointing at the very same dead chunk → fails again → second attempt `throw`s.
- `window.location.reload()` returns `undefined`, and that `undefined` was returned **as the lazy
  component**. React tried to render `undefined` immediately, crashing into the ErrorBoundary
  *before* the reload could take effect. This is why users landed on `CrashRecoveryScreen` rather
  than getting a silent refresh.

#### What broke
Sentry `da7394b932b5448cb45d8709b1245798`, 2026-08-04 10:57 UTC (16:27 IST) — Chrome Mobile /
Android, `TypeError: Failed to fetch dynamically imported module: .../MemberDashboard-DfOrkO6f.js`,
caught by the React ErrorBoundary. Timing lines up exactly with that day's offer deploys.

Confirmed the hash churn locally:

| Build | MemberDashboard chunk |
|---|---|
| Live before the offer deploys | `DfOrkO6f` |
| `main` @ 8dd92b1 (pre-offer) | `CAn2cVgr` |
| After offer merge | `1NsBSe-a` |

#### How it was fixed
`lazyWithRetry`'s catch block now mirrors what `index.html` already does:

1. `caches.delete()` every cache entry so stale chunks cannot be re-served
2. Reload via `loc.replace(path + '?_r=' + Date.now())` instead of plain `reload()`, forcing a
   fresh `index.html`
3. **`return new Promise<never>(() => {})`** — keeps the lazy factory pending until the navigation
   actually happens, so React never renders `undefined`. This is the part that turns a visible
   crash screen into a silent refresh.

The double-failure path (`pageHasAlreadyBeenForceRefreshed === true` → `throw`) is unchanged, so a
genuinely broken build still surfaces to the ErrorBoundary rather than looping forever.

#### Verification
- `npm run build` clean; `npx tsc --noEmit` shows no new errors (the pre-existing
  `import.meta.env.DEV` error just shifts line number)
- Manual: hard-load the app, delete a chunk from `dist/assets/`, navigate to that route — the page
  should silently reload once and render, instead of showing "Something went wrong"
- Sentry: `Failed to fetch dynamically imported module` events should drop sharply after the next
  deploy; only genuine repeat failures should remain

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
