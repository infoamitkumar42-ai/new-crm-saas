# AGENTS.md — Read this before touching LeadFlow CRM

**This file is for any AI coding agent or developer working on this repository.**
It is deliberately tool-neutral: Claude Code, Cursor, Copilot, Windsurf, Aider, Codex, a
contractor with an editor — the rules below are the same for all of you.

If you only read one file, read this one. Then read the two it points at.

---

## 0. Why this file exists

LeadFlow CRM is a **live revenue system**. Real people have paid real money and are owed a
specific number of leads. A "small refactor" here has, historically, meant:

- 4 paying members receiving **zero leads for a day** because one write forgot a second column
- 2 buyers sold the **wrong quota** because a config exists in two files and one was edited
- **55 leads** of reporting error because a query joined on the wrong foreign key
- **87 users** unable to open the app because a cache-cleanup heuristic matched real data
- **29 of 32 leads** landing on one person because work was fanned out concurrently

None of those were exotic. Each was a plausible-looking change made without checking the live
system first. **The failure mode of an agent here is confident, well-formatted, wrong.**

So: this codebase asks you to slow down and verify, not to be clever.

---

## 1. Read in this order

| # | File | What it gives you |
|---|---|---|
| 1 | **`AGENTS.md`** (this file) | Rules and traps. Non-negotiable. |
| 2 | **`docs/SYSTEM-OVERVIEW.md`** | How the system actually works: lead flow, the four routing paths, data model, deploys. |
| 3 | **`docs/AGENT-PROTOCOL.md`** | The required workflow for making a change and proving it works. |
| 4 | **`bugfix.md`** | Every bug ever found, with root cause and a verification query. **Check here before debugging anything** — it is probably already documented. |
| 5 | **`CLAUDE.md`** | Long-form changelog and project reference. Dense; skim for the area you're touching. |

**If you execute multiple steps without a human between them** — Google Antigravity, background
or async agents, multi-agent runs, any "go build this" mode — also read
**[`docs/AUTONOMOUS-AGENT-RULES.md`](./docs/AUTONOMOUS-AGENT-RULES.md)**. It carries the hard-stop
list, the premise re-verification budget, and the parallel-agent rules. It is not optional for
those modes.

`docs/sessions/` holds per-session logs, including what was *tried and abandoned*. Read the
relevant one before re-attempting something in the same area.

**Onboarding a new agent or IDE?** [`docs/AGENT-ONBOARDING-TEST.md`](./docs/AGENT-ONBOARDING-TEST.md)
is a read-only test, with an answer key, for checking that it actually reads these docs before it
is trusted with real work.

---

## 2. Hard rules

These are not style preferences. Violating one means reverting.

### 2.1 Never edit a LOCKED file without explicit human approval

```
auth/useAuth.tsx      Auth provider, session lifecycle
supabaseClient.ts     Supabase client, proxy routing, auth lock
App.tsx               Router + PWA/chunk recovery
vite.config.ts        PWA build config (injectionPoint: undefined is intentional)
src/sw.ts             Service worker — push notifications depend on it
```

Reading them is always fine and usually necessary. **Editing requires the owner to say so for
that specific change.** Every serious outage in this system's history traces back to these files.

### 2.2 Never change the database without showing the SQL first

No schema changes, no `CREATE OR REPLACE` on an RPC, no touching RLS policies — until the exact
SQL has been shown to the owner and approved. RLS is what keeps one user's leads invisible to
another.

### 2.3 One change per commit

If asked for three things, make three commits. When something breaks, the owner must be able to
revert exactly one thing. This rule has repeatedly been the difference between a 2-minute
rollback and an hour of bisecting.

### 2.4 Branch and PR — never push to `main`

Work on a feature branch, open a PR, merge it. Direct pushes to `main` are forbidden.

### 2.5 Identify people by email, never by name

There are two "Harmandeep kaur", two "Kajal", two "Priya", two "Baljinder kaur", two "Kamal", and
a **Kulwinder singh** who is a different person from **Kulvir singh**, and a **Kirti** who is a
different person from **Kirti giri** — same team, nearly identical names. Acting on the wrong row
because a name matched has already happened. Always key on `email` or `id`.

---

## 3. Traps that have actually caused damage

Each of these looks fine in code review. Each cost real money.

### 3.1 `leads` has TWO foreign keys to `users`

```
user_id     = original/legacy owner. Does NOT change on reassign or recycle.
assigned_to = who holds the lead NOW. Every routing path sets this.
```

**For "which leads does this person have", the answer is almost always `assigned_to`.**
Counting by `user_id` put the manager panel off by up to 55 leads per member (PR #164).

Selecting both tables also needs disambiguation or PostgREST returns `PGRST201`:

```ts
supabase.from('leads').select('*, assigned_user:users!assigned_to(name, email)')
```

### 3.2 Lead routing requires `is_active` AND `is_online` — both true

`is_online` is a **routing** flag, not a presence/heartbeat flag, despite the name. Every write
that changes one must change the other. One modal that updated only `is_active` made four paying
users invisible to routing with no error anywhere (BUG-014).

There is a legacy `update_user_presence()` RPC in the DB that would set `is_online` as a browser
signal. **It is not called from any frontend code. Do not wire it up** — it would disable live
users' lead flow.

### 3.3 Plan numbers live in FOUR places

```
functions/api/razorpay-webhook.ts        PLAN_CONFIG
supabase/functions/razorpay-reconcile/   PLAN_CONFIG   <- processes MOST payments in practice
DB table plan_config                     read by trg_sync_user_plan_fields on every users UPDATE
config/offer.ts                          what the UI advertises
```

Change one, change all four. Editing only the webhook sold two customers the wrong quota
(BUG-013). Note the reconcile poller matters *more* than the webhook, because the Cloudflare
webhook fails silently often enough that the poller picks up most payments (BUG-006).

### 3.4 The offer expires silently

`config/offer.ts` has `OFFER_ACTIVE` **and** `endsAt`. When `endsAt` passes, the banner and the
pricing-card badges just disappear — no error, no log. This has caught people out three times
(13, 16 and 19 Aug). If the UI "lost" the offer, check `endsAt` first.

Note the backend does **not** expire on `endsAt`, so payments keep getting offer quota after the
UI has gone dark. That asymmetry is deliberate but surprising.

### 3.5 Never fan out lead assignment concurrently

Lead assignment reads a per-user count, then writes. Run several at once and they all read the
same stale count. Doing this through `pg_net` (which is async) put **29 of 32 leads on one user**.

Assign **sequentially**, in one transaction, so each assignment is visible to the next.
This applies to any bulk status write too — each `UPDATE` on `leads` fires
`trg_send_crm_conversion` → `pg_net` → Meta CAPI.

### 3.6 All date logic is IST, the database is UTC

Every date comparison needs `AT TIME ZONE 'Asia/Kolkata'`. Cron jobs are scheduled in UTC. "Today"
without a timezone conversion is wrong for 5.5 hours of every day.

### 3.7 Counters are maintained by triggers — do not also update them

`trigger_update_user_lead_count` (AFTER INSERT/UPDATE on `leads`) increments `leads_today` and
`total_leads_received` when `assigned_to` changes, and auto-deactivates on quota exhaustion.
Calling `increment_user_lead_counters` as well double-counts.

**Never trust the counter for reporting.** The authoritative quota formula is:

```
total_leads_promised - COUNT(actual leads WHERE assigned_to = user)
```

### 3.8 `leads.notes` is shown to the agent in the app

It is not an internal field. An audit note written there was visible to end users until it was
cleared. Never use it for internal annotations.

### 3.9 The repo copy of an Edge Function may not be what is deployed

Several functions have been edited directly in the Supabase dashboard. **Before editing any Edge
Function, verify the repo copy matches production.** A stale repo copy was edited once and
silently reverted a live fix.

### 3.10 Config you set may never be applied

`supabaseClient.ts` passes an `auth.lock` option that `supabase-js@2.39.0` **silently drops** —
it forwards only 7 auth options and `lock` is not one of them. Two separate fixes were built on
the assumption that this config was live. Both were dead code.

**Before theorising about a config's behaviour, prove it reaches the library.** Check the
installed package source in `node_modules`, not the documentation.

### 3.11 `.single()` returns HTTP 406, not an empty result

When RLS filters every row (typically an expired/invalid token), PostgREST returns
`406 "Cannot coerce the result to a single JSON object"`. That is an **auth** symptom, not a
missing-data symptom.

### 3.12 `trg_check_limit_insert` enforces `daily_limit`, ignoring `daily_limit_override`

Any capacity calculation must use `daily_limit` or the trigger rejects the insert.

---

## 4. Before you write any code

```
[ ] Read AGENTS.md, docs/SYSTEM-OVERVIEW.md, docs/AGENT-PROTOCOL.md
[ ] Search bugfix.md for the area you are about to touch
[ ] git status && git log --oneline -5
[ ] Identify every file you will change; check none are LOCKED (§2.1)
[ ] Query the LIVE database to confirm the problem is what you think it is
[ ] State your plan to the owner and get approval before editing
```

That fifth step is the one agents skip, and it is the one that catches most wrong diagnoses.
In this codebase you can almost always check a hypothesis against real data in one query —
so check it.

---

## 5. Before you say it works

```
[ ] npm run build          (must be clean)
[ ] npx tsc --noEmit       (compare error COUNT to the pre-change baseline —
                            this repo has pre-existing errors; introducing zero new ones is the bar)
[ ] Verify the behaviour against live data or a real invocation, not by reading the diff
[ ] Counter drift = 0 and over-quota users = 0 (queries in bugfix.md) if you touched leads/users
[ ] Delete any test rows you created and re-verify the counters
```

**Report honestly.** If something is unverified, say it is unverified. If a fix is a hypothesis,
call it a hypothesis. A wrong confident claim here becomes an incorrect changelog entry, which
becomes the next agent's false premise — that exact chain has already happened once in this repo
(see the BUG-015 correction in `bugfix.md`).

---

## 6. After the change

- Add an entry to `bugfix.md` if it was a bug — with root cause, the fix, and a verification query
- Add a changelog entry to `CLAUDE.md`
- Keep the Bug Fix Index table in `CLAUDE.md` in sync (it went stale once and hid four bugs)
- Record what you tried and abandoned in `docs/sessions/` — the dead ends are worth as much as
  the fix

---

## 7. Deployment

| Part | Deploys how |
|---|---|
| Frontend (`views/`, `components/`, `config/`, `hooks/`) | Cloudflare Pages, automatically on merge to `main` |
| `functions/api/*` | Cloudflare Pages Functions, same automatic deploy |
| `supabase/functions/*` (Edge Functions) | **Manual.** Merging does NOT deploy them. |

**An Edge Function change is not live until someone deploys it.** Leads kept routing on old logic
for hours after a merge more than once because this was assumed to be automatic. Say clearly, in
the PR and to the owner, when a manual deploy is required.

---

## 8. If you are unsure

Stop and ask. An unanswered question costs a message. A confident wrong change to a live lead
distribution system costs paying customers their leads, and the trust of the people who run it.

---

## 9. Tooling available in this repo (optional, tool-specific)

The sections above apply to everyone. What follows only applies if your environment provides
these tools — ignore it otherwise.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

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

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
