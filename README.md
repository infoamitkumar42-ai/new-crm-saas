# LeadFlow CRM

> ## ⛔ Changing code here? Read **[`AGENTS.md`](./AGENTS.md)** first.
>
> This is a **live revenue system**. Paying customers are owed a specific number of leads.
> Changes that looked small have previously meant paying members receiving zero leads for a day,
> buyers sold the wrong quota, and 87 users locked out of the app.
>
> That applies to humans and to AI coding agents alike.

SaaS lead-distribution platform for network-marketing professionals. Leads come in from Meta
(Facebook/Instagram) ad campaigns and are distributed to paying subscribers by a fairness
algorithm; subscribers work the leads and record outcomes, which feed back to Meta as conversion
signals.

**Plans are quota-based, not time-based** — a plan ends when the member has received the number
of leads they paid for, not on a calendar date.

---

## Documentation

| File | Read it when |
|---|---|
| **[`AGENTS.md`](./AGENTS.md)** | **Always, before changing anything.** Rules + the traps that have actually caused damage. |
| [`docs/SYSTEM-OVERVIEW.md`](./docs/SYSTEM-OVERVIEW.md) | You need to understand how the system works — lead flow, the four routing paths, data model, deploys. |
| [`docs/AGENT-PROTOCOL.md`](./docs/AGENT-PROTOCOL.md) | You are about to make a change and need the required workflow for proving it works. |
| [`bugfix.md`](./bugfix.md) | **Before debugging anything.** Every bug ever found, with root cause and a verification query. |
| [`CLAUDE.md`](./CLAUDE.md) | You want the long-form changelog or a detailed reference for one area. |
| [`docs/sessions/`](./docs/sessions/) | You are working in an area someone touched recently — including what they tried and abandoned. |

---

## Stack

React 18 · Vite · TypeScript · Tailwind — hosted on **Cloudflare Pages**
**Supabase** (Postgres + Edge Functions + Auth) · **Razorpay** payments · **Meta CAPI** attribution

Live: [leadflowcrm.in](https://leadflowcrm.in) · API proxy: `api.leadflowcrm.in`

---

## Run locally

**Prerequisites:** Node.js

```bash
npm install
npm run dev
```

Environment variables live in `.env` (`VITE_`-prefixed values are exposed to the browser at build
time). See [`config/env.ts`](./config/env.ts) for what is read and its fallbacks.

```bash
npm run build      # production build — must be clean before any PR
npx tsc --noEmit   # type check (note: the repo has pre-existing errors — measure the delta)
```

---

## Deployment

| Part | How it deploys |
|---|---|
| Frontend + `functions/api/*` | Cloudflare Pages, **automatically** on merge to `main` |
| `supabase/functions/*` (Edge Functions) | **Manually.** Merging does *not* deploy them. |

⚠️ An Edge Function change is not live until someone deploys it. Leads have kept routing on old
logic for hours after a merge because this was assumed to be automatic.

---

## Repository layout

```
auth/            Auth provider and session lifecycle          🔒 LOCKED
supabaseClient.ts  Supabase client, proxy routing, auth lock  🔒 LOCKED
App.tsx          Router + PWA/chunk recovery                  🔒 LOCKED
src/sw.ts        Service worker (push notifications)          🔒 LOCKED
vite.config.ts   PWA build config                             🔒 LOCKED

views/           Role dashboards (admin / manager / member), landing, auth
components/      Shared UI — subscription, lead alerts, gates, admin controls
hooks/           Push and in-app notification hooks
config/          Environment and offer configuration

supabase/functions/   Edge Functions (Deno) — lead intake, backlog, CAPI, payments reconcile
supabase/migrations/  SQL migrations
functions/api/        Cloudflare Pages Functions — Razorpay webhook
docs/                 System overview, agent protocol, session logs
*.sql *.csv *.json    Operational scripts and data — NOT scratch files, do not delete
```

🔒 **LOCKED** files require explicit approval for each specific change — see
[`AGENTS.md`](./AGENTS.md) §2.1.
