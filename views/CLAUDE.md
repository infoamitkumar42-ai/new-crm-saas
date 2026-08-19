# ⛔ This file is not the documentation. Read `/AGENTS.md` at the repository root.

This path used to hold a **copy** of the root `CLAUDE.md`, frozen around March 2026. It was
never updated, and by August 2026 several of its statements were flatly wrong — including plan
prices, quotas, and this one:

> ~~"`daily_limit` in the users table stores the TOTAL leads for the plan, NOT the per-day limit.
> The RPC divides by days internally."~~

**That is false.** `daily_limit` is exactly what it says: the per-day cap. An agent that believed
the old text would have mis-sized every capacity calculation in the system.

The content was replaced with this pointer on 2026-08-19, after an onboarding test showed how
easily an agent quotes a stale document with full confidence.

---

## Where the real documentation is

| File | Purpose |
|---|---|
| [`/AGENTS.md`](../AGENTS.md) | **Start here.** Rules and the traps that have actually caused damage. |
| [`/docs/SYSTEM-OVERVIEW.md`](../docs/SYSTEM-OVERVIEW.md) | How the system works: lead flow, the four routing paths, data model. |
| [`/docs/AGENT-PROTOCOL.md`](../docs/AGENT-PROTOCOL.md) | Required workflow for making and proving a change. |
| [`/docs/AUTONOMOUS-AGENT-RULES.md`](../docs/AUTONOMOUS-AGENT-RULES.md) | Extra rules if you run many steps without a human between them. |
| [`/bugfix.md`](../bugfix.md) | Every bug ever found. Check before debugging anything. |
| [`/CLAUDE.md`](../CLAUDE.md) | Long-form changelog and reference — the real one, ~1,900 lines. |

**Plan numbers live in four places and none of them is a markdown file.** See `AGENTS.md` §3.3.
Treat `plan_config` (the database table) as the source of truth, because
`trg_sync_user_plan_fields` reads it live on every `users` UPDATE.

---

## About this directory

`views/` holds the role dashboards and top-level pages:

| File | Role |
|---|---|
| `AdminDashboard.tsx` | Admin panel |
| `ManagerDashboard.tsx` | Manager — team overview. Count leads by `assigned_to`, never `user_id`. |
| `MemberDashboard.tsx` | Member — their own leads |
| `Dashboard.tsx` | Routes by role |
| `Landing.tsx` · `Auth.tsx` · `Settings.tsx` | Public and account pages |

⚠️ `views/Subscription.tsx` is **dead code** — offer-unaware and imported nowhere. The live one is
`components/Subscription.tsx`. Editing the wrong one is a silent no-op.

⚠️ `views/ManagerDashboard_old.tsx` is also dead. It still contributes pre-existing `tsc` errors,
so measure your error-count delta against the baseline rather than the absolute number.
