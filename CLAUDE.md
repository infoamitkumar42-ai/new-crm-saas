# CLAUDE.md — LeadFlow CRM

This file is the primary reference for AI assistants (Claude, etc.) working on this repository. Read it fully before making any changes.

---

## Project Overview

**LeadFlow CRM** is a SaaS CRM built for Network Marketing / MLM professionals and Direct Selling agents (e.g., Forever Living distributors). It automatically ingests leads from Meta (Facebook/Instagram) Ads and distributes them fairly to subscribed users using a Round Robin / Weighted Priority algorithm.

- **Live domain:** `https://leadflowcrm.in`
- **Supabase proxy:** `https://api.leadflowcrm.in` (Cloudflare worker proxying Supabase to bypass ISP blocks on Jio/Airtel)
- **Supabase project ID:** `vewqzsqddgmkslnuctvb`

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | ^18.3.1 |
| Build tool | Vite | ^5.1.4 |
| Language | TypeScript | ^5.2.2 |
| Routing | React Router DOM | ^6.22.3 |
| Styling | Tailwind CSS | ^3.4.1 |
| Backend API | Vercel Serverless Functions (`api/` dir) using Next.js types | ^14.2.3 |
| Database / Auth | Supabase (PostgreSQL + RLS + Auth) | ^2.39.0 |
| Payments | Razorpay | ^2.9.2 |
| Error tracking | Sentry | ^10.40.0 |
| PWA | vite-plugin-pwa (injectManifest strategy) | ^1.2.0 |
| Icons | lucide-react | ^0.344.0 |
| HTTP client | axios (used alongside native fetch) | ^1.13.4 |

---

## Directory Structure

```
new-crm-saas/
├── api/                      # Vercel Serverless Functions (Next.js API style)
│   ├── check-renewals.ts     # Validates subscription expiry
│   ├── confirm-user.ts       # Admin endpoint to manually activate users
│   ├── create-order.ts       # ⚠️ BROKEN — Razorpay order creation (MAINTENANCE_MODE=true)
│   ├── create-sheet.ts       # Google Sheets export integration
│   ├── init-user.ts          # Initializes user record post-signup
│   └── razorpay-webhook.ts   # Listens for Razorpay payment events
│
├── auth/
│   └── useAuth.tsx           # 🔒 LOCKED v6.4 — AuthProvider + useAuth hook (DO NOT REFACTOR)
│
├── backend/                  # Internal admin tools / backend logic
│
├── cloudflare-worker/        # Cloudflare Worker code for the api.leadflowcrm.in proxy
│
├── components/               # Reusable React UI components
│   ├── FilterSettings.tsx
│   ├── Layout.tsx
│   ├── LeadAlert.tsx
│   ├── NotificationBanner.tsx
│   ├── Sidebar.tsx
│   ├── SmartRenewalBanner.tsx
│   ├── Subscription.tsx
│   ├── TargetAudience.tsx
│   ├── UI.tsx                # Shared UI primitives
│   ├── UpsellModal.tsx
│   └── UserQuickEdit.tsx
│
├── config/
│   ├── env.ts                # ENV config object (VITE_ vars + hardcoded fallbacks)
│   └── example.env.txt       # Template for required environment variables
│
├── gas-v15/                  # Legacy Google Apps Script files (Gmail/Sheets automation)
│
├── hooks/
│   ├── useNotification.ts
│   └── usePushNotification.ts
│
├── lib/
│   └── leadStats.ts          # Lead statistics helpers
│
├── migrations/               # Root-level SQL migration files (manual)
│
├── public/                   # Static assets (icons, screenshots for PWA manifest)
│
├── scripts/                  # Utility Node.js scripts for data operations
│
├── src/
│   ├── pages/
│   │   └── ResetPassword.tsx
│   └── sw.ts                 # Service Worker source (compiled by vite-plugin-pwa)
│
├── supabase/
│   ├── functions/            # Supabase Edge Functions (Deno runtime)
│   │   ├── daily-counter-reset/
│   │   ├── meta-webhook/     # Primary Meta Ads lead ingestion webhook
│   │   ├── meta-webhook-v24/
│   │   ├── process-backlog/
│   │   ├── process-direct-lead/
│   │   ├── send-push-notification/
│   │   └── sync-counters/
│   └── migrations/           # Supabase SQL migration files
│       ├── 20260207010000_fix_assignment_logic.sql
│       └── 20260207013800_fix_quota_logic.sql
│
├── views/                    # Full-page React components
│   ├── AdminDashboard.tsx
│   ├── ApplyForm.tsx
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── FilterSettings.tsx
│   ├── Landing.tsx
│   ├── ManagerDashboard.tsx
│   ├── MemberDashboard.tsx
│   ├── ResetPassword.tsx
│   ├── Settings.tsx
│   ├── Subscription.tsx
│   ├── admin/
│   │   └── Revenue.tsx
│   ├── legal/                # Public legal pages (Terms, Privacy, Refund, Shipping, Contact)
│   └── member/
│
├── App.tsx                   # Main React Router + auth wiring
├── index.tsx                 # React DOM entry point
├── supabaseClient.ts         # 🔒 LOCKED v4.0 — Supabase client with Cloudflare proxy override
├── types.ts                  # Global TypeScript interfaces (UserProfile, Lead, Payment, etc.)
├── vite.config.ts            # Vite + PWA configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── vercel.json               # Vercel deployment config (rewrites, cache headers)
├── package.json
└── tsconfig.json
```

> **Note:** The project root also contains many loose `.sql`, `.cjs`, `.json`, and `.md` files that are manual data-repair scripts from historical incidents. These are NOT part of the application build and should be ignored unless explicitly needed for database operations.

---

## Environment Variables

Copy `config/example.env.txt` to `.env` at the project root.

### Frontend (Vite — must be prefixed `VITE_`)
| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anonymous key |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key (frontend checkout) |
| `VITE_APPS_SCRIPT_URL` | Google Apps Script webhook URL |

### Backend / Serverless (Vercel env — NOT prefixed)
| Variable | Description |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay secret (signs orders, verifies webhooks) |

> **Important:** `config/env.ts` contains hardcoded fallback values for development convenience. For production, always set the real `VITE_` environment variables in Vercel. Do not commit real secrets.

---

## Development Workflow

### Local Development
```bash
npm install
npm run dev        # Starts Vite dev server on port 3000
```

### Build
```bash
npm run build      # Vite production build → dist/
npm run preview    # Preview built dist locally
```

### No test suite is currently configured. There is no `test` script.

---

## Routing Architecture (`App.tsx`)

The app uses `react-router-dom` v6 with `BrowserRouter`. Key route patterns:

| Path | Component | Access |
|------|-----------|--------|
| `/` | `RootRoute` → `DashboardRouter` or `Landing` | Public (smart redirect) |
| `/login`, `/signup` | `Auth` | Public only (redirects if authenticated) |
| `/reset-password` | `ResetPassword` | Public |
| `/apply` | `ApplyForm` | Public |
| `/dashboard` | `DashboardRouter` | Protected |
| `/admin/*` | `AdminDashboard` | Protected — role: `admin` |
| `/manager/*` | `ManagerDashboard` | Protected — role: `manager` or `admin` |
| `/terms`, `/privacy`, `/refund`, `/shipping`, `/contact` | Legal pages | Public |
| `*` | Redirect to `/` | — |

**`DashboardRouter`** reads `profile.role` and renders the correct dashboard:
- `admin` → `AdminDashboard`
- `manager` → `ManagerDashboard`
- `member` (default) → `Layout` + `MemberDashboard`

---

## Authentication (`auth/useAuth.tsx`)

> **LOCKED at v6.4 (March 10, 2026). Do not refactor this file without explicit instruction.**

- Uses `React.Context` (`AuthContext`) + `AuthProvider` wrapping the entire app.
- Supabase Auth with Email/Password.
- Profile data fetched from the `users` table in Supabase after session is established.
- Profile cached in `localStorage` under key `leadflow-profile-cache` (10 min TTL for fresh, stale used as fallback on network failure).
- Session stored under `leadflow-auth-v2` localStorage key.
- Network-aware timeouts: 2G=45s, 3G=30s, 4G=15s, default=20s.
- Circuit breaker: 3 consecutive profile failures → 5-minute pause.
- `isAuthenticated = !!session && !!profile` (both must be non-null).
- Hard-coded admin emails: `info.amitkumar42@gmail.com`, `amitdemo1@gmail.com`.

### Auth Context API
```typescript
{
  session: Session | null;
  profile: User | null;
  loading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  isNetworkError: boolean;
  signUp(params): Promise<void>;
  signIn(params): Promise<void>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
}
```

---

## Supabase Client (`supabaseClient.ts`)

> **LOCKED at v4.0. Do not refactor without explicit instruction.**

Key design decisions:
- **Global `window.fetch` override**: All requests to `vewqzsqddgmkslnuctvb.supabase.co` are transparently proxied to `api.leadflowcrm.in` (Cloudflare), EXCEPT `/auth/v1/` calls which go direct.
- `autoRefreshToken: false` — token refresh is handled manually in `useAuth.tsx`.
- Realtime/WebSocket is disabled (`eventsPerSecond: -1`) to prevent mobile connection errors.
- Storage key: `leadflow-auth-v2`.
- `supabaseRealtime` is an alias for `supabase` (no separate WS client).

Exports:
- `supabase` — main Supabase client
- `supabaseRealtime` — alias for `supabase`
- `logEvent(event, payload, userId?, client?)` — logs to `logs` table
- `isAuthenticated()` — checks session async
- `getCurrentUser()` — fetches current Supabase user

---

## Database Schema

All tables live in the Supabase PostgreSQL `public` schema with Row Level Security (RLS).

### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Matches Supabase Auth UID |
| `email` | text | |
| `name` | text | |
| `role` | text | `'admin'`, `'manager'`, `'member'` |
| `team_code` | text | Unique per manager |
| `manager_id` | UUID FK → `users(id)` | For members |
| `plan_name` | text | Subscription plan |
| `daily_limit` | int | Leads per day |
| `total_leads_promised` | int | Total leads in subscription |
| `total_leads_received` | int | Running count |
| `leads_today` | int | Resets daily |
| `is_active` | bool | Subscription active flag |
| `payment_status` | text | `'active'` / `'inactive'` |
| `valid_until` | timestamp | Subscription expiry |
| `filters` | jsonb | Target audience filters |
| `sheet_url` | text | Google Sheet URL for user |
| `days_extended` | int | Manual extension days |
| `created_at` | timestamp | |

### `leads`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `assigned_to` | UUID FK → `users(id)` | Primary assignment FK |
| `user_id` | UUID FK → `users(id)` | Legacy FK — causes PGRST201 if both queried |
| `manager_id` | UUID FK → `users(id)` | |
| `name` | text | |
| `phone` | text | |
| `city` | text | |
| `state` | text | |
| `category` | text | |
| `status` | text | `'Fresh'`, `'Call Back'`, `'Interested'`, `'Closed'`, `'Rejected'` |
| `notes` | text | |
| `source` | text | e.g. `'meta'` |
| `created_at` | timestamp | |

> **Known bug:** `leads` has two FKs to `users` (`user_id` and `assigned_to`). Always use `.select('*, assigned_to_user:users!assigned_to(*)')` style disambiguated queries to avoid Supabase PGRST201 errors.

### `payments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → `users(id)` | |
| `amount` | numeric | |
| `status` | text | |
| `plan_name` | text | |
| `razorpay_payment_id` | text | |
| `created_at` | timestamp | |

### `orphan_leads`
Leads that failed to be assigned to any user.
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `name` | text | |
| `phone` | text | |
| `miss_reason` | text | Why assignment failed |
| `status` | text | |

### `logs`
Application event log inserted via `logEvent()`.
| Column | Notes |
|--------|-------|
| `user_id` | |
| `action` | Event name |
| `details` | JSONB payload |
| `created_at` | |

---

## API Endpoints

### Cloudflare Pages Functions (`functions/` directory) — LIVE
| Method | Path | Description | Status |
|--------|------|-------------|--------|
| POST | `/api/razorpay-webhook` | Processes Razorpay payment success — immediate activation | **Working** ✅ |

### Legacy Vercel Serverless (`api/` directory) — NOT active in production
These files remain in the repo for reference but the site is deployed on Cloudflare Pages, not Vercel.

| Method | Path | Description | Status |
|--------|------|-------------|--------|
| POST | `/api/create-order` | Creates Razorpay order | **BROKEN** — `MAINTENANCE_MODE = true` returns 503 |
| POST | `/api/razorpay-webhook` | Old Vercel version with 30-min delay | Superseded by Cloudflare Pages version |
| POST | `/api/check-renewals` | Checks/flags expired subscriptions | Legacy |
| POST | `/api/confirm-user` | Admin: manually activate user | Legacy |
| POST | `/api/create-sheet` | Creates Google Sheet for user | Legacy |
| POST | `/api/init-user` | Initializes user after signup | Legacy |

---

## Supabase Edge Functions (`supabase/functions/`)

Deployed to Supabase, run on Deno runtime.

| Function | Purpose |
|----------|---------|
| `meta-webhook` | Primary Meta Ads lead ingestion and Round Robin distribution |
| `meta-webhook-v24` | Older version — kept for reference |
| `process-backlog` | Processes leads stuck in queue |
| `process-direct-lead` | Direct lead assignment |
| `daily-counter-reset` | Resets `leads_today` counters daily (cron) |
| `sync-counters` | Syncs lead count aggregates |
| `send-push-notification` | Sends browser push notifications to users |

---

## TypeScript Interfaces (`types.ts`)

```typescript
type UserRole = 'admin' | 'manager' | 'member';

interface UserProfile { id, email, name, role, team_code?, manager_id?, created_at }

interface Lead {
  id, name, phone, city, category,
  status: 'Fresh' | 'Call Back' | 'Interested' | 'Closed' | 'Rejected',
  notes, assigned_to, manager_id, created_at
}

interface Payment { id, user_id, amount, status, plan_name, razorpay_payment_id, created_at }
```

The `User` interface in `auth/useAuth.tsx` and `types.ts` extends `UserProfile` with subscription fields (`daily_limit`, `leads_today`, `is_active`, `payment_status`, `valid_until`, `total_leads_promised`, `total_leads_received`, `filters`, `sheet_url`, `days_extended`).

---

## Known Issues & Workarounds

### 1. Payment System Disabled
`api/create-order.ts` has `MAINTENANCE_MODE = true` hardcoded, returning HTTP 503. New subscriptions cannot be purchased. Admin must manually activate users via `api/confirm-user.ts` or the Admin Dashboard.

### 2. PWA Loading Hang
`vite-plugin-pwa` with `injectManifest` strategy sometimes gets stuck on mobile. `App.tsx` implements `cleanupServiceWorkers()` (in DEV mode only) and exposes a "Force Refresh App" button after 8 seconds of loading. Do not add Workbox precaching — it exacerbates the issue.

### 3. Supabase PGRST201 Dual FK
The `leads` table has both `user_id` and `assigned_to` as FKs to `users`. When writing Supabase queries that join users, always disambiguate with the hint syntax:
```typescript
supabase.from('leads').select('*, assigned_user:users!assigned_to(name, email)')
```

### 4. Root Directory Clutter
Dozens of `.cjs`, `.sql`, `.json`, and `.md` files exist at the project root. These are operational scripts used by the team for manual lead distribution fixes. Do not delete them without confirming with the user. They are excluded from the Vite build.

### 5. Cloudflare Proxy for ISP Bypass
Many Indian ISPs (Jio, Airtel) block direct Supabase connections. `supabaseClient.ts` overrides `window.fetch` globally to route all non-auth requests through `api.leadflowcrm.in`. Do not remove this proxy logic.

---

## Code Conventions

### File Naming
- React components: `PascalCase.tsx` (e.g., `MemberDashboard.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useAuth.tsx`, `usePushNotification.ts`)
- Utilities / helpers: `camelCase.ts`
- Vercel API routes: `kebab-case.ts`

### Component Style
- Functional components with `React.FC` type annotation.
- Tailwind CSS utility classes for all styling — no CSS modules or styled-components.
- `lucide-react` for icons.
- No testing framework is configured.

### Imports
- All views import `useAuth` from `../auth/useAuth`.
- All Supabase queries use the `supabase` client from `../supabaseClient`.
- Environment variables accessed via `ENV` object from `../config/env` — never directly from `import.meta.env`.

### State Management
- No global state library (no Redux, Zustand). State is managed via React Context (`AuthContext`) and local `useState`.
- Profile data is the only global shared state; all other state is local to components.

### Error Handling
- Sentry is integrated via `<Sentry.ErrorBoundary>` at the app root and `Sentry.captureException()` in `useAuth.tsx`.
- Network errors trigger `isNetworkError` state which renders `ConnectionIssueScreen`.

---

## Deployment

- **Frontend:** Cloudflare Pages (NOT Vercel). `vercel.json` exists in the repo but is not the active deployment config.
- **Cloudflare Pages Functions:** Serverless functions live in `functions/` directory (e.g., `functions/api/razorpay-webhook.ts`). These replace the old `api/` Vercel functions for production.
- **Supabase Edge Functions:** Deploy via Supabase CLI (`supabase functions deploy <name>`).
- **Cloudflare Worker (Supabase Proxy):** The `cloudflare-worker/` directory contains the worker proxying `api.leadflowcrm.in` → Supabase (separate from Pages Functions).

---

## Files to Treat as Locked / Fragile

These files have been stabilized after extensive debugging. Avoid modifying them unless there is a specific bug to fix:

| File | Lock Version | Reason |
|------|-------------|--------|
| `auth/useAuth.tsx` | v6.4 (2026-03-10) | Fixed infinite auth loop — dependency on `profileRef` vs `profile` state |
| `supabaseClient.ts` | v4.0 (2025-01-06) | Fixed 406 errors — `window.fetch` override + split auth/data routing |
| `App.tsx` | — | PWA cleanup logic is fragile; don't modify SW cleanup without testing on mobile |
| `vite.config.ts` | — | `injectionPoint: undefined` is intentional — prevents Workbox precache |
| `src/sw.ts` | — | Service worker — changes affect PWA and push notifications |

---

## User Roles Summary

| Role | Access | Dashboard |
|------|--------|-----------|
| `admin` | Full system access | `AdminDashboard` |
| `manager` | Team management | `ManagerDashboard` |
| `member` | Own leads only | `MemberDashboard` |

Role is stored in both `users.role` (Supabase DB) and `user.user_metadata.role` (Supabase Auth metadata). The DB value takes precedence.

---

## External Services

| Service | Usage |
|---------|-------|
| Supabase | Database, Auth, Edge Functions |
| Vercel | Frontend hosting + Serverless API |
| Razorpay | Payment gateway (currently disabled) |
| Meta Graph API | Lead Ads webhook source |
| Cloudflare Workers | Reverse proxy (`api.leadflowcrm.in`) |
| Sentry | Error monitoring |
| Google Apps Script | Legacy renewal reminders, Sheet creation |
