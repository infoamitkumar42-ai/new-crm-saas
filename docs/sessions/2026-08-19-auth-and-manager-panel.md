# Session log — 2026-08-19

**Agent:** Claude Code (Opus 5) · **Owner:** info.amitkumar42@gmail.com
**Branch:** `claude/modest-darwin-7986rv` · **PRs:** #160–#168

This log exists so the next person does not repeat what happened here. The **dead ends are the
most valuable part** — the merged diffs are visible in git, the reasoning that failed is not.

---

## Headline

A months-old "users get randomly logged out" complaint was chased through **three** fixes. The
first two were wrong or inert. The third was the real cause, and it was found only after the
owner supplied a browser console log.

**Elapsed cost of not having that log at the start: two changes to LOCKED files, one revert, and
a full day.** Ask for the console log first next time.

---

## Timeline

| PR | Change | Outcome |
|---|---|---|
| #160 | Remove duplicate `refreshSession()` from `initializeAuth()` | ✅ Kept — real race, real fix, but did not fix the reported hang |
| #161 | Replace the no-op `auth.lock` with an in-tab mutex | ❌ **Dead code** — never executed |
| #162 | Revert #161 | ⚪ Functionally a no-op, since #161 never ran |
| #163 | **BUG-016** — stop wiping real profile caches | ✅ **The actual fix** |
| #164 | Manager panel: count by `assigned_to`, not `user_id` | ✅ |
| #165 | Stop showing plan names for inactive members | ✅ |
| #166 | Extend August offer to 25 Aug | ✅ |
| #167 | Backfill BUG-013/014/015 into `bugfix.md` | ✅ |
| #168 | This documentation set | ✅ |

---

## What went wrong, and why

### Mistake 1 — Treated two symptoms as one bug

The owner's report bundled two distinct failures:

1. **Logout loop** — you log in, reopen, you are back at the login page
2. **Hang** — the app sits on "Checking session… / Connecting to secure server…"

These were separate bugs with separate causes. PR #160 fixed a genuine refresh-token race, which
addressed (1). It was then implicitly presented as though it would address (2) as well. It did
not, and the owner reasonably reported the fix as having failed.

**Lesson:** when a report contains multiple symptoms, enumerate them explicitly and say which
ones a fix does and does not address.

### Mistake 2 — Built on a config that was never live

PR #161 replaced the custom `auth.lock` in `supabaseClient.ts` with a real mutex — with a
watchdog, an 8-case test harness, all passing.

It never ran. `supabase-js@2.39.0`'s `_initSupabaseAuthClient()` forwards exactly seven auth
options and **silently drops `lock`**. `gotrue-js` then falls back to its default `navigatorLock`.
So:

- the original "no-op lock bypass" was never in effect either — `navigator.locks` had been the
  active lock the entire time, the very API the code comments blame for mobile hangs
- the new mutex was dead code, and its revert was equally inert
- the reasoning in the BUG-015 write-up about *why nothing prevented the race* was wrong

**Proof, found only by reading `node_modules`:**

```
node_modules/@supabase/supabase-js/src/SupabaseClient.ts:265  ->  destructures 7 options, no `lock`
node_modules/@supabase/gotrue-js/src/GoTrueClient.ts:337-342  ->  falls back to navigatorLock
```

The console log corroborated it: `Lock "lock:leadflow-auth-v2" was not released within 5000ms` is
`navigatorLock`'s own message, and 5000ms is `gotrue-js`'s default `lockAcquireTimeout`.

**Lesson:** an option existing in a library's TypeScript types does not mean the implementation
uses it. Verify against installed source before theorising. This is now `AGENTS.md` §3.10 and
`AGENT-PROTOCOL.md` §4.

### Mistake 3 — Reverted on correlation, not mechanism

The owner observed: *"Option B went in at night, the problem appeared in the morning."* PR #161
was reverted on that basis.

The revert was harmless, but #161 was dead code and **could not have caused anything**. The
correlation was coincidence. A defect was later found in it (it ignored `acquireTimeout=0`, which
`_autoRefreshTokenTick()` relies on to skip a tick), so removing it was defensible — but the
stated reason at the time was the timing, and that reasoning was not sound.

**Lesson:** timing tells you where to look; only a mechanism proves cause. Removing an unproven
variable is fine — call it that, not "the fix".

---

## What actually worked: BUG-016

The owner sent a browser console log. The **first line** contained the answer:

```
🧹 Wiping legacy dummy profile from cache to force live DB fetch!
```

`auth/useAuth.tsx` cleared the cached profile whenever it matched:

```js
daily_limit === 0 && leads_today === 0 &&
total_leads_received === 0 && payment_status === 'inactive'
```

That is the **normal state of a real admin, manager, or unpaid member.** An admin never receives
leads, so those counters stay at zero forever. Live count: **87 users matched — 2 admins,
13 managers, 72 members.**

Their cache was wiped on every app open, which removed every fallback:

```
cache wiped
  -> instant restore skipped   (needs profileRef)
  -> optimistic load skipped   (needs cachedProfile)
  -> blocking live fetch
      -> dead token -> RLS returns 0 rows -> users query 406
      -> stale-cache fallback finds nothing (just wiped)
  -> profile null -> isAuthenticated false -> "Checking session…" / login page
```

Paying members carry `daily_limit: 9` and hundreds of received leads, so they never matched —
which is exactly why the bug looked random and resisted diagnosis for months.

`createTempProfile()`, the function whose output this cleanup existed to remove, **is not called
anywhere** (dead code). All three `writeProfileCache` call sites write real DB rows. The
heuristic could therefore only ever match real profiles.

**Fix:** match the dummy's full signature (`is_active: true` + `total_leads_promised: 50` +
empty `sheet_url` alongside the zeros). Live-verified: **0 real users match** the tightened
condition, where 87 matched the old one.

### The diagnostic move that mattered

Asking *"who is NOT affected?"* — paying members never saw it — pointed directly at the counter
values, and from there to the heuristic. That contrast is now `AGENT-PROTOCOL.md` §1 step 2.

---

## Other work this session

- **Manager panel counts (#164)** — all three count queries used `user_id` instead of
  `assigned_to`. 15+ TEAMFIRE members were wrong by up to **55 leads**, in both directions
  (Ankush 270 vs actual 325; Mandeep kaur 651 vs actual 598). The owner spotted this from a
  screenshot before it was measured.
- **Plan badge (#165)** — `plan_name` is not cleared on expiry, so Mary Janjot (quota 227/227
  spent, inactive) displayed as a `turbo_boost` subscriber. Now shows Expired / No Plan, split on
  `total_leads_promised` so that two users with a stale `plan_name` and zero payments correctly
  read "No Plan" rather than "Expired".
- **Offer extension (#166)** — `endsAt` had silently passed for the **third** time (13, 16, 19
  Aug). Extended to 25 Aug. Backend `PLAN_CONFIG` does not expire on `endsAt`, so the five
  payments taken that day had correctly received offer quota regardless.
- **Offer audit** — all 46 active/paid users verified against `plan_config`: every `daily_limit`
  correct, and all 25 offer-era payers at exactly the right cumulative quota (diff = 0).
- **Leads PDF** — 54 leads for `parwatiprajapat111@gmail.com`, 12–17 Aug.

---

## Open items

| Item | State |
|---|---|
| 🚨 **UNITEDECOSYSTEM has no routing** | 5 members paid on 19 Aug (₹4,995, 450 leads). The team is in **no** routing path. Owner is building a new ad + Sheet; routing deliberately **not** wired yet, pending that setup. |
| `auth.lock` never applied | Documented, not fixed. Options: assign `supabase.auth.lock` post-construction (must throw `LockAcquireTimeoutError` when `acquireTimeout === 0`), or upgrade `supabase-js`. |
| ECOKULWINDER missing from `sheet_intake_tokens` | Reachable via live intake, dropped by the backlog sweep. Same class as the FASTMOVERS bug. |
| Ritika maurya (`mauryariti03@gmail.com`) | `team_code='ALPHAECO'`, which is in no intake token. Would be excluded from non-women leads and dropped from backlog if she reactivates. |
| Himanshu Sharma `plan_weight` | 7, should be 9 per `plan_config`. Tie-break only, no quota impact. Deliberate special-case user — not touched without approval. |
| Status-update burst pattern | On 17 Aug, Maninder Kaur marked **12 leads "Closed" in 2.5 minutes**; Ankush 6 in 19 minutes. 20 of 24 August closures fall in such bursts. Possibly the Call/WhatsApp gate being cleared rather than genuine closures. **Do not draw ad-spend conclusions from Closed counts until this is checked with the agents.** |

---

## Verified end state

```
counter drift ................ 0
over-quota active users ...... 0
users over daily_limit ....... 0
is_active/is_online desync ... 0
Night_Backlog / Queued ....... 0
```
