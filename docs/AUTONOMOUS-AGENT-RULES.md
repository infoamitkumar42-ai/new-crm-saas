# Rules for autonomous and long-running agents

For agents that plan and execute **multiple steps without a human between them** — Google
Antigravity, background/async agents, multi-agent runs, or any "go build this" mode.

`AGENTS.md` and `docs/AGENT-PROTOCOL.md` apply to you in full. This file adds what changes when
**nobody is checking each step.**

---

## 0. Why autonomy is riskier here than elsewhere

In an interactive session a wrong assumption gets caught within a message or two. In an
autonomous run it does not: step 3 forms a false premise, and steps 4 through 30 are built on it,
each one looking locally reasonable. The output is a large, coherent, confidently-written change
set that is wrong from the third step onward.

This has a documented precedent in this repo, and it happened even *with* a human present.
A theory about an auth lock was formed, two fixes were built on it, one was merged, one was
reverted — and the config in question **had never been active at all**. The library silently
dropped the option. Nothing in the code, the types, or the review would have revealed it. Only
opening `node_modules` did. See `bugfix.md`, the BUG-015 follow-up.

An autonomous agent would have gone further down that path, not less far.

**The rule this produces:** the longer you intend to run, the earlier and harder you must try to
disprove your own premise.

---

## 1. Hard stops — never do these autonomously

Halt and surface to the human. No exceptions, no "the intent was clearly…".

| Never, without an explicit human yes | Why |
|---|---|
| Edit a LOCKED file (`AGENTS.md` §2.1) | Every serious outage traces to these |
| `ALTER`, `DROP`, `CREATE OR REPLACE` on schema, RPCs, triggers or RLS | RLS is what isolates customers' data from each other |
| `UPDATE` / `DELETE` on `leads`, `users` or `payments` affecting more than one row | Bulk writes here move money and quota |
| Disable a trigger | If a run dies mid-way it stays disabled, and limits stop being enforced |
| Deploy an Edge Function, or push to `main` | Deploys change live routing for real leads |
| Delete a `payments` row | Breaks reconcile idempotency — this has re-activated an account and handed it a real member's lead |
| Change plan numbers, quota, or offer configuration | Directly changes what buyers receive for money already paid |
| Rotate, regenerate or commit a credential | — |
| Act on data reached through the **live admin UI** in a browser session | Read is fine; clicking through the admin panel mutates production |

If your plan contains one of these, stop **when you reach it** — do not do the surrounding work
in a way that assumes approval will arrive.

---

## 2. Re-verify your premise on a schedule

Adopt an explicit budget and hold yourself to it.

```
Every ~5 steps, or before any step that writes:
  - State the premise the next step depends on, in one sentence
  - Name the observation that established it (a query result, a file read, a real invocation)
  - If that observation is older than ~10 steps, or was an inference rather than an observation,
    re-establish it before proceeding
```

An inference is not an observation. "The config is passed to createClient, so it is in effect"
is an inference — and in this repo it was false. "I read `node_modules/@supabase/supabase-js/
src/SupabaseClient.ts:265` and `lock` is not forwarded" is an observation.

**If you cannot name the observation, you are guessing. Stop and verify.**

---

## 3. Read-only first, and go wide before going deep

You have live database access. Reads are cheap, safe, and settle most questions outright.

Before writing anything:

```
1. Reproduce the reported problem as a number.        "87 rows match" not "this looks wrong"
2. Establish who or what is NOT affected.             The contrast usually names the cause
3. Read the actual failing code path.                 Do not infer behaviour from file names
4. Confirm the config involved is genuinely live.     AGENT-PROTOCOL.md §4
```

Step 2 is the highest-yield step in this codebase and the one most often skipped. "Paying members
never saw this bug — only admins, managers and unpaid members did" is what located BUG-016's root
cause, after two wrong fixes had already shipped.

---

## 4. One change per commit still applies — more so

Autonomy makes it tempting to batch: you can see six things worth fixing, and fixing them together
looks efficient.

Do not. When something regresses at 11pm, the owner needs to revert exactly one thing without
reading a diff. A six-in-one commit turns a two-minute rollback into an archaeology session, and
the person doing it will not be you.

If you find further problems while working, **write them down and report them.** Do not fix them
in passing.

---

## 5. Evidence, not narrative

Antigravity-style agents produce artifacts, walkthroughs and summaries. These are useful and also
dangerous: a fluent write-up of unverified work reads exactly like a fluent write-up of verified
work.

Every claim in your output must carry its evidence:

| Claim | Required evidence |
|---|---|
| "Fixed" | An observation of the new behaviour — a query result, a real invocation, a test run |
| "This affects N users" | The query, and its output |
| "Deployed" | Edge Functions do **not** auto-deploy. Merging is not deploying. |
| "Verified" | Reserved for something you observed. Otherwise write "hypothesis — not verified" |

Never let a summary state more certainty than the work behind it. In this repo an over-confident
write-up became the next agent's false premise once already — that is why `bugfix.md` BUG-015
carries a correction block.

---

## 6. Timing and blast radius

This is a live system with people working during Indian business hours.

- **Risky work** (auth, routing, payments) belongs in low-traffic hours — night IST, when leads go
  to `Night_Backlog` and members are offline
- **Frontend deploys are safe mid-session** — open tabs keep the old JavaScript; new code arrives
  on the user's next reload
- **Edge Function changes are inert until deployed manually** — say so explicitly, every time

Check what is happening before starting anything risky:

```sql
SELECT
  (SELECT COUNT(*) FROM leads WHERE assigned_at > NOW() - INTERVAL '2 hours') AS assigned_2h,
  (SELECT COUNT(*) FROM leads WHERE updated_at  > NOW() - INTERVAL '1 hour')  AS status_updates_1h,
  (SELECT COUNT(*) FROM leads WHERE status IN ('Night_Backlog','Queued'))     AS backlog;
```

---

## 7. Parallel agents

If more than one agent is working in this repository at once:

- **One agent owns a file.** Two agents editing `views/MemberDashboard.tsx` will silently clobber
  each other.
- **Never run two agents against the live database at once.** Lead assignment reads a count, then
  writes; concurrent runs read the same stale count. That exact pattern put **29 of 32 leads on
  one member** — and that was async HTTP calls, not even two agents.
- Rebase on `origin/main` before pushing, and never force-push over work you did not create.

---

## 8. When you get blocked

Blocked means stop, not improvise. The failure mode to avoid is inventing a path around an
obstacle that exists for a reason.

| Situation | Do |
|---|---|
| A tool or permission is denied | Report it. Do not find another route to the same effect. |
| A query returns something that contradicts the request | Stop. Report the contradiction with the data. |
| The fix requires a LOCKED file or a DB change | Stop. Present the exact diff or SQL and wait. |
| You have tried the same thing three times | Stop. Report what you tried and what you observed. |
| Two readings of the request give different work | Stop and ask. |

A denied tool call is a decision, not an obstacle to route around.

---

## 9. Definition of done

A task is finished when **all** of these hold:

```
[ ] npm run build clean
[ ] npx tsc --noEmit — new-error count vs baseline is zero
    (this repo has pre-existing errors; measure the delta with git stash)
[ ] Behaviour verified against live data or a real invocation
[ ] Any test rows deleted, and counter drift re-checked at 0
[ ] Health queries (SYSTEM-OVERVIEW §12) return 0 rows if leads/users were touched
[ ] One logical change per commit; branch + PR; not pushed to main
[ ] bugfix.md entry if it was a bug — root cause, fix, verification query
[ ] CLAUDE.md changelog + Bug Fix Index updated
[ ] docs/sessions/ entry, including what was tried and abandoned
[ ] Manual Edge Function deploy stated explicitly if one is needed
[ ] Anything unverified labelled unverified
```

Reporting completion with any of these outstanding is reporting it wrong.

---

## 10. The short version

> Read before you write. Verify before you claim. One change at a time.
> Stop at the hard-stop list. Say what you actually observed.
>
> An unanswered question costs one message. A confident wrong change to a live
> lead-distribution system costs paying customers their leads.
