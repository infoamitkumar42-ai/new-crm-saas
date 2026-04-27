# AGENTS.md — LeadFlow CRM

> This file is read by Antigravity IDE, Cursor, Gemini CLI, and all compatible AI coding agents.
> It provides project context to prevent hallucination and ensure accurate code generation.

---

## Identity

You are working on **LeadFlow CRM**, a production SaaS application that handles real user data and real money.
Any mistake you make will affect **39+ paying customers** who depend on this system for their livelihood.
**Treat every change as if you're performing surgery on a live patient.**

---

## Mandatory Pre-Flight Check

Before writing ANY code, you MUST:

1. **Read `CLAUDE.md`** — contains locked files list, schema, business logic, and known issues.
2. **Run `git log --oneline -5`** — understand what was changed recently.
3. **Run `git diff --stat`** — check if there are uncommitted changes.
4. **Identify the EXACT files** you need to modify.
5. **Verify none of them are LOCKED** (see CLAUDE.md rule #1).
6. **State your plan** in plain language before writing code.
7. **Wait for user approval** before making changes.

If you cannot do steps 1-5, STOP and ask the user for guidance.

---

## Locked Files — NEVER MODIFY

These files are battle-tested and stable. Modifying them breaks authentication, PWA, or data routing.

| File | Why It's Locked |
|------|-----------------|
| `auth/useAuth.tsx` | Auth loop fix, session management — v6.4 stable |
| `supabaseClient.ts` | Cloudflare proxy routing, ISP bypass — v4.0 stable |
| `App.tsx` | PWA cleanup logic, route protection |
| `vite.config.ts` | `injectionPoint: undefined` prevents SW crash |
| `src/sw.ts` | Push notification service worker |

**If the user explicitly asks you to modify a locked file, confirm TWICE before proceeding.**

---

## Tech Stack

- **Frontend**: React 18.3 + TypeScript 5.2 + Vite 5.1 + Tailwind CSS 3.4
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + RLS)
- **Hosting**: Cloudflare Pages (NOT Vercel — Vercel files are legacy)
- **Payments**: Razorpay
- **Push**: Web Push API + VAPID keys
- **Icons**: lucide-react
- **State**: React Context only (no Redux/Zustand)
- **Errors**: Sentry

---

## Critical Architecture Patterns

### 1. Supabase Client Routing
```
Auth requests → DIRECT to vewqzsqddgmkslnuctvb.supabase.co
Data requests → PROXIED through api.leadflowcrm.in (Cloudflare Worker)
```
ISPs in India block direct Supabase. The proxy in `supabaseClient.ts` handles this.
**NEVER bypass this routing.**

### 2. Lead Counter Updates
```
❌ WRONG: supabase.from('users').update({ leads_today: X })
✅ RIGHT: supabase.rpc('increment_user_lead_counters', { p_user_id: userId })
```
The RPC atomically updates BOTH `leads_today` AND `total_leads_received`.

### 3. Leads Table Dual FK
```
❌ WRONG: supabase.from('leads').select('*, users(*)')
✅ RIGHT: supabase.from('leads').select('*, assigned_user:users!assigned_to(name, email)')
```
Both `user_id` and `assigned_to` are FKs to `users`. Always disambiguate.

### 4. Timezone Handling
All business logic uses IST (Asia/Kolkata). In SQL:
```sql
-- ✅ Correct
WHERE created_at AT TIME ZONE 'Asia/Kolkata' >= CURRENT_DATE
-- ❌ Wrong (UTC)
WHERE created_at >= CURRENT_DATE
```

### 5. Environment Variables
```
❌ WRONG: import.meta.env.VITE_SUPABASE_URL
✅ RIGHT: import { ENV } from '../config/env'; ENV.SUPABASE_URL
```

---

## Database Schema (Essential)

### users
Key columns: `id`, `email`, `name`, `role`, `team_code`, `plan_name`, `payment_status`, `is_active`, `is_online`, `daily_limit`, `leads_today`, `total_leads_promised`, `total_leads_received`

### leads  
Key columns: `id`, `name`, `phone`, `city`, `status`, `source`, `user_id` (legacy FK), `assigned_to` (active FK), `notes`, `created_at`

Lead statuses: `New`, `Fresh`, `Night_Backlog`, `Queued`, `Assigned`

### payments
Key columns: `id`, `user_id`, `amount`, `status`, `plan_name`, `razorpay_payment_id`

---

## Plan Quotas

| Plan | total_leads (daily_limit column) | Price |
|------|----------------------------------|-------|
| starter | 55 | ₹999 |
| supervisor | 115 | ₹1,999 |
| weekly_boost | 92 | ₹1,999 |
| turbo_boost | 108 | ₹2,499 |
| manager | 176 | ₹2,999 |

Expiry logic: `total_leads_received >= total_leads_promised` → plan expired.

---

## Import Conventions

```typescript
// Auth — always from relative path
import { useAuth } from '../auth/useAuth';

// Supabase — always from supabaseClient
import { supabase } from '../supabaseClient';

// Config — always through ENV object
import { ENV } from '../config/env';

// Icons — always lucide-react
import { Home, Settings, Bell } from 'lucide-react';
```

---

## Edge Functions (Supabase — Deno Runtime)

| Function | Trigger | Purpose |
|----------|---------|---------|
| meta-webhook | HTTP POST from Meta | Receives leads, assigns via RPC |
| process-backlog | Cron 10AM IST | Assigns Night_Backlog leads |
| send-push-notification | Called by other functions | Sends Web Push to user |
| check-quota-expiry | Cron 7AM IST | Auto-deactivates exhausted plans |
| daily-counter-reset | Cron 12AM IST | Resets leads_today to 0 |

---

## Common Mistakes to Avoid

1. ❌ Adding npm packages not in package.json without asking
2. ❌ Using `getUser()` instead of `getSession()` (causes 403)
3. ❌ Forgetting IST timezone in SQL queries
4. ❌ Writing to leads table without using atomic RPC
5. ❌ Modifying multiple files in one change
6. ❌ Assuming Vercel is the hosting platform (it's Cloudflare Pages)
7. ❌ Using `localStorage` in service worker context
8. ❌ Creating `.env` changes without updating Cloudflare dashboard
9. ❌ Deleting root-level .sql/.csv files (they're operational data)
10. ❌ Using `NOW()` in SQL without timezone conversion for IST logic

---

## When You're Unsure

**ASK THE USER.** Do not guess. Do not assume. Do not hallucinate.

If you don't know:
- What a column stores → ASK
- What an RPC does → ASK  
- Whether a file is safe to modify → ASK
- What the business requirement is → ASK

It is ALWAYS better to ask one question than to make one wrong change.

---

## Post-Change Verification

After every change, remind the user to test:
1. Admin dashboard loads
2. Member dashboard shows leads
3. Webhook lead assignment works
4. Push notification fires
5. Counters update correctly