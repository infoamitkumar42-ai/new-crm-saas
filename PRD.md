# Complete PRD (Product Requirements Document)

## 1. Project Overview
LeadFlow CRM is a specialized Customer Relationship Management SaaS tailored primarily for Network Marketers, MLM professionals, and Direct Selling agents (e.g., Forever Living Distributors). It automates lead generation from Meta (Facebook/Instagram) ads and intelligently distributes these leads to subscribed users based on their active quotas and priorities. 

**Current State:**
- **What works:** User dashboard, lead viewing, status updating (Fresh, Interested, etc.), basic webhook-based lead distribution system, and authentication via Supabase.
- **What is broken:** The payment system is actively disabled in the codebase (`api/create-order.ts` line 33 is hardcoded to `MAINTENANCE_MODE = true`), meaning new users cannot purchase or renew subscriptions automatically. Additionally, the Progressive Web App (PWA) caching sometimes causes the app to hang, which is currently patched by an aggressive service worker cleanup script in `App.tsx`. Multiple standalone SQL scripts and `.cjs` files litter the root directory, indicating manual data corrections are frequently required.

## 2. Complete Feature List
| Feature Name | Current Status | Description |
|--------------|----------------|-------------|
| **User Authentication** | WORKING | Secure login and signup via Supabase Auth. |
| **Member Dashboard** | WORKING | Allows users to track today's leads, total leads, and remaining quota. |
| **Admin/Manager Dashboard** | WORKING | Internal dashboards to view system stats, user list, and manual plan activations. |
| **Lead Status Management** | WORKING | Users can update a lead's status (e.g., Contacted, Rejected) and add notes. |
| **Meta Webhook Distribution** | WORKING | Automatically ingests leads from Meta Ads and distributes them fairly via Round Robin/Weighted priority. |
| **Subscription Payments** | **BROKEN** | Razorpay integration is currently hardcoded into Maintenance Mode (`res.status(503)`). |
| **PWA Offline Support** | PARTIAL | Service workers (`vite-plugin-pwa`) are implemented but cause loading hangs; a forced cache clear button is added in `App.tsx` as a workaround. |
| **WhatsApp Notifications** | PARTIAL | Intended to alert users of new leads, though exact reliability relies on external gas-v15 Google Apps Scripts. |

## 3. Technical Architecture
- **Frontend Framework:** React (v18.3.1) built with Vite (v5.1.4).
- **Backend Framework (Serverless):** Vercel Serverless Functions (`api/` folder) utilizing Next.js typings (`next` v14.2.3 in `package.json`).
- **Backend API & Auth:** Supabase (Database, Auth, Edge Functions) using `@supabase/supabase-js`.
- **Database:** PostgreSQL (managed by Supabase) with Row Level Security (RLS).
- **Payment Integration:** Razorpay (`razorpay` v2.9.2).
- **Styling:** Tailwind CSS (`tailwindcss` v3.4.1) with PostCSS and Autoprefixer.
- **Hosting/Deployment:** Frontend on Vercel (`vercel.json` exists) with Backend hosted on Supabase Cloud.

## 4. Database Schema
Based on the codebase analysis, the primary tables are:

### `users`
- **Key Fields:** `id` (UUID, PK), `email`, `name`, `phone`, `role` ('admin', 'manager', 'member'), `plan_name`, `daily_limit`, `total_leads_promised`, `total_leads_received`, `is_active`, `team_code`, `manager_id`.
- **Relationships:** `manager_id` references `users(id)`.

### `leads`
- **Key Fields:** `id` (UUID, PK), `user_id` / `assigned_to` (UUID, FK to users), `name`, `phone`, `city`, `state`, `status` (Fresh, Closed, etc.), `notes`, `source`.
- **Relationships:** `assigned_to` references `users(id)`.

### `payments`
- **Key Fields:** `id` (UUID, PK), `user_id` (UUID, FK to users), `amount`, `status`, `plan_name`, `razorpay_payment_id`.
- **Relationships:** `user_id` references `users(id)`.

### `orphan_leads`
- **Key Fields:** `id` (UUID, PK), `name`, `phone`, `miss_reason`, `status`.

## 5. API Endpoints
Endpoints are hosted as Vercel Serverless Functions in the `api/` directory:

| Method | Route Path | Description | Current Status |
|--------|------------|-------------|----------------|
| POST | `/api/create-order` | Generates a Razorpay order before payment. | **BROKEN** (Hardcoded 503 Maintenance Mode on line 33) |
| POST | `/api/razorpay-webhook`| Listens for Razorpay payment success events and updates user quotas. | WORKING (if payments worked) |
| POST | `/api/check-renewals` | Validates if a user's subscription has expired. | WORKING |
| POST | `/api/confirm-user` | Administrative endpoint to confirm/activate users manually. | WORKING |
| POST | `/api/create-sheet` | Integrates with Google Sheets for data export. | WORKING |
| POST | `/api/init-user` | Initializes user records post-signup. | WORKING |

Supabase Edge Functions / External Webhooks:
- `meta-webhook-v47.ts` (and variants like v32, v24) handle incoming Meta Ad leads and route them dynamically to active users in Supabase.

## 6. Current Bugs & Issues
1. **Payments Offline (`api/create-order.ts`):** Line 33 sets `MAINTENANCE_MODE = true`, intentionally blocking all manual user renewals via Razorpay.
2. **PWA Loading Hangs (`App.tsx`):** The service worker routinely gets stuck. `App.tsx` line 300+ implements an aggressive cleanup `cleanupServiceWorkers()` that deletes Workbox caches on load, bypassing standard PWA benefits just to make the app work.
3. **Database Relation Edge-Case (PGRST201):** The `leads` table has multiple foreign keys to `users` (e.g., `user_id` vs `assigned_to`), occasionally causing "Could not embed because more than one relationship was found" errors when querying Supabase.
4. **Scattered Architecture:** Dozens of loose `.sql` and `.cjs` files exist in the project root for manual distribution hotfixes, indicating that the automated webhooks frequently fail to distribute leads perfectly and require manual script corrections (e.g., `execute_bulk_distribution.cjs`, `correct_teamfire_only.cjs`).

## 7. Project File Structure
The project uses a slightly non-standard React structure where most source code sits directly in the project root alongside `package.json` rather than strictly isolated inside `/src`.

```text
new-crm-saas/
├── api/                  # Vercel Serverless API endpoints
│   ├── check-renewals.ts
│   ├── create-order.ts
│   └── razorpay-webhook.ts
├── auth/                 # Authentication contexts and hooks
├── backend/              # Internal backend logic/admin tools
├── components/           # Reusable React UI components
├── config/               # Environment and App global configs
├── gas-v15/              # Legacy / associated Google Apps Script files
├── hooks/                # Custom React Hooks
├── lib/                  # Library utilities and helpers
├── public/               # Static assets (images, icons)
├── scripts/              # Utility Node.js scripts
├── src/                  # Minimal React directory (Service Workers, pages)
├── supabase/             # Supabase edge functions & migrations
├── views/                # Full Page React Components (Dashboards, Landing)
├── App.tsx               # Main React Router configuration
├── index.tsx             # React DOM injection point
├── types.ts              # Global TypeScript interfaces
├── vite.config.ts        # Vite bundler configuration
├── package.json          # Node dependencies
└── *.cjs / *.sql         # Numerous manual repair and audit scripts
```
