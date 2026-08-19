# Agent Protocol — how to make a change here without breaking it

This is the required workflow for changing anything in LeadFlow CRM. It applies to AI agents and
to humans. `AGENTS.md` gives the rules; this file gives the method.

It exists because the characteristic failure in this repository is not a syntax error. It is a
**confident, well-written, plausible change that was never checked against reality.** Every
section below targets a specific way that has actually happened.

---

## 1. Diagnose before you fix

**Do not start from the symptom description. Start from the data.**

The owner reports symptoms in good faith, but a symptom has many possible causes, and the obvious
one is often wrong. Two real examples from this system:

- *"Users get logged out."* Two fixes were shipped for a refresh-token race. The actual cause of
  the reported hang was a **cache-cleanup heuristic** wiping real profiles (BUG-016). The
  logout and the hang were **two different bugs** presenting as one complaint.
- *"This member gets no leads."* Looked like a routing bug. Was a single boolean column
  (`is_online`) left behind by an unrelated admin form (BUG-014).

### The rule

> Before writing code, state your hypothesis, then run **one query against the live database that
> would disprove it.** If you cannot design that query, you do not understand the problem yet.

You have live database access here. Use it. A wrong hypothesis costs one query to eliminate and
hours to ship.

### Concretely

```
1. Reproduce the claim in data.       "87 rows match this condition" beats "this looks wrong"
2. Find who is NOT affected.          The contrast usually names the cause.
3. Trace the failing path in code.    Read it; do not infer it from file names.
4. Confirm the config is even live.   See §4.
```

Step 2 is the highest-value one. "Paying members never saw this bug, only admins and managers"
is what pointed straight at BUG-016's root cause.

---

## 2. Verify the mechanism, not just the outcome

A passing build proves the code compiles. It proves nothing about behaviour.

| Claim | Acceptable proof |
|---|---|
| "Routing now includes this team" | A real invocation that assigns a lead to that team, then cleanup |
| "The counts are correct now" | Old vs new query side by side on live rows, with the differences shown |
| "This no longer wipes real profiles" | A live query showing **0 real users** match, where the old condition matched 87 |
| "The mutex serialises" | A harness proving max-1-concurrent, plus error and timeout cases |
| "The Edge Function is deployed" | An actual invocation returning the new behaviour |

Note the pattern: the proof is **a number from the live system**, not a description of the diff.

### Test data must be cleaned up

If you create a test lead or user to prove something, delete it afterwards and re-run the drift
check. Test rows left behind have corrupted reports before.

---

## 3. Change one thing

One logical change per commit, always. When (not if) something regresses, the owner needs to
revert exactly one thing at 11pm without reading a diff.

If asked for three fixes, ship three commits. It is slower to type and much faster to recover.

---

## 4. Prove the config is actually live

**This trap has burned two separate fixes in this repo.**

`supabaseClient.ts` passes an `auth.lock` option. `supabase-js@2.39.0` forwards exactly seven
auth options to the underlying client, and `lock` is **not one of them** — it is silently
dropped. The option appears in the library's *type definitions*, so it type-checks, looks
correct in review, and does nothing.

Two fixes were built on the belief that this config was in effect. Both were dead code: one
"fixed" nothing, and its revert changed nothing either.

### The rule

> Before reasoning about what a configuration option does, open the installed package in
> `node_modules` and confirm the value reaches the code that consumes it.

Types are a claim. The implementation is the fact.

---

## 5. Distinguish correlation from cause

When the owner says *"we deployed X last night and this broke this morning"*, that is evidence
worth taking seriously — and it is not proof.

In this repo, that exact correlation appeared for a change that turned out to be **dead code**
(§4). It could not have caused anything. Reverting it was harmless but pointless, and it cost
time that should have gone to the real cause.

### The rule

> Timing suggests where to look. Only a mechanism proves cause. Say which one you have.

Reverting an unproven change to reduce variables is legitimate — but call it that ("removing an
unproven variable"), not "fixing the bug".

---

## 6. Report honestly, especially about your own errors

Everything you write in `bugfix.md` and `CLAUDE.md` becomes the **next** agent's starting
assumption. A wrong entry does not stay a documentation problem; it becomes the next person's
false premise.

That chain has already run once here: BUG-015's original write-up blamed a no-op lock for failing
to serialise two callers. That lock was never active. The entry now carries a correction — see
the ⚠️ block in `bugfix.md` BUG-015.

### Required language

| Situation | Say |
|---|---|
| Verified against live data | "Verified: *number*, query included" |
| Believed but not verified | "Hypothesis — not verified" |
| Deployed but not confirmed live | "Merged; **not yet deployed** / not yet live-verified" |
| You were wrong earlier | State the correction plainly and move on. Do not quietly reword it. |

Never write "fixed" for something you have not observed working.

---

## 7. Scope discipline

Fix what was asked. When you find something else broken — and in this codebase you will — **flag
it, do not silently fix it.** An unrequested change bundled into a fix is how a small revert
becomes an archaeology session.

Two things that are genuinely part of the job, not scope creep:

- Verifying your change did not break neighbouring behaviour
- Reporting a serious problem you found, immediately, even if you were not asked to fix it

Something actively losing money (a paying team receiving no leads, a payment path with wrong
quota) should be raised **now**, in plain terms, with the numbers.

---

## 8. Respect the operational calendar

This is a live system with real users working during the day.

- **Risky changes** (auth, routing, payments) belong in low-traffic hours — night IST, when leads
  are going to `Night_Backlog` anyway and members are offline
- **Deploy-time behaviour:** already-open browser tabs keep running the old JavaScript. New code
  reaches a user on their next reload, so a frontend deploy does not disrupt anyone mid-session
- **Edge Functions do not auto-deploy.** Merging is not shipping. Say so explicitly

Before a risky change, check what is happening right now:

```sql
SELECT
  (SELECT COUNT(*) FROM leads WHERE assigned_at > NOW() - INTERVAL '2 hours') AS assigned_2h,
  (SELECT COUNT(*) FROM leads WHERE updated_at  > NOW() - INTERVAL '1 hour')  AS status_updates_1h,
  (SELECT COUNT(*) FROM leads WHERE status IN ('Night_Backlog','Queued'))     AS backlog;
```

---

## 9. Checklists

### Before writing code

```
[ ] AGENTS.md read; docs/SYSTEM-OVERVIEW.md skimmed for the affected area
[ ] bugfix.md searched for this area — is it already documented?
[ ] docs/sessions/ checked — was this already tried and abandoned?
[ ] git status && git log --oneline -5
[ ] Every file to be changed listed; none LOCKED without approval
[ ] Hypothesis stated, and disproved-or-confirmed with a live query
[ ] Plan shown to the owner and approved
```

### Before claiming it works

```
[ ] npm run build                         clean
[ ] npx tsc --noEmit                      new-error count vs baseline = 0
                                          (this repo has pre-existing errors; measure the delta,
                                           e.g. `npx tsc --noEmit 2>&1 | grep -c "path/to/File"`
                                           with and without the change via `git stash`)
[ ] Behaviour verified against live data or a real invocation
[ ] Test rows deleted; counter drift re-checked at 0
[ ] Health queries (SYSTEM-OVERVIEW §12) return 0 rows if leads/users were touched
```

### After merging

```
[ ] bugfix.md entry, if it was a bug (root cause + fix + verification query)
[ ] CLAUDE.md changelog entry
[ ] CLAUDE.md Bug Fix Index table updated
[ ] docs/sessions/ entry — including what was tried and abandoned
[ ] Manual Edge Function deploy stated explicitly if one is required
```

---

## 10. When to stop and ask

Stop when:

- The change touches a LOCKED file
- It needs a schema, RPC or RLS change
- Two readings of the request would produce materially different work
- The data contradicts what the owner described
- You would be guessing

An unanswered question costs one message. A confident wrong change to a live lead-distribution
system costs paying customers their leads.

**Asking is not failure here. Guessing is.**
