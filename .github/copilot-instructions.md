# ⛔ STOP — read `AGENTS.md` before changing any code in this repository

This is a **live revenue system**. Paying customers are owed a specific number of leads.
"Small" changes here have previously cost real money — paying members receiving zero leads for a
day, buyers sold the wrong quota, 87 users locked out of the app.

## Required reading, in order

1. **`AGENTS.md`** — rules, and the traps that have actually caused damage
2. **`docs/SYSTEM-OVERVIEW.md`** — how the system works: lead flow, the four routing paths, data model
3. **`docs/AGENT-PROTOCOL.md`** — required workflow for making and proving a change
4. **`bugfix.md`** — every bug ever found; check here *before* debugging anything
5. **`docs/AUTONOMOUS-AGENT-RULES.md`** — required if you run multiple steps without a human between them

## Non-negotiable rules (full list in `AGENTS.md`)

- Never edit `auth/useAuth.tsx`, `supabaseClient.ts`, `App.tsx`, `vite.config.ts` or `src/sw.ts`
  without explicit approval **for that specific change**
- Never change DB schema, RPCs or RLS policies without showing the SQL and getting approval first
- One logical change per commit; branch + PR; never push to `main`
- Identify users by **email**, never by name — several people here share names
- Verify against the live database before writing code, and again before claiming it works

## The three that bite most often

- `leads` has **two** FKs to `users`: `user_id` (original owner, never changes) and
  `assigned_to` (current holder). For "whose lead is it", use **`assigned_to`**.
- Lead routing requires `is_active` **and** `is_online` — both true. Any write touching one must
  touch the other.
- Plan numbers live in **four** places (two `PLAN_CONFIG` files, the `plan_config` DB table, and
  `config/offer.ts`). Change one, change all four.

If you are unsure, stop and ask. Guessing is the failure mode this file exists to prevent.
