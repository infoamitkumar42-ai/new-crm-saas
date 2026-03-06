# Tech Stack Document

## 1. Core Frameworks & Technologies
The LeadFlow CRM is built as a Single Page Application (SPA) combined with Serverless API endpoints.

| Category | Technology | Version | Description |
|----------|------------|---------|-------------|
| **Frontend Framework** | React | `^18.3.1` | UI Library |
| **Bundler / Server** | Vite | `^5.1.4` | Fast frontend build tool |
| **Language** | TypeScript | `^5.2.2` | Strong static typing for JavaScript |
| **Routing** | React Router DOM | `^6.22.3` | Client-side routing (`BrowserRouter`) |
| **Backend API Runner** | Next.js API Routes | `^14.2.3` | Used strictly alongside Vercel Serverless Functions in the `api/` directory |
| **Styling** | Tailwind CSS | `^3.4.1` | Utility-first CSS framework (with `postcss` and `autoprefixer`) |

## 2. Dependencies & NPM Packages
Below is every significant NPM package actively installed in the repository:

### Application Dependencies
- `@supabase/supabase-js` (`^2.39.7`): Official Supabase client for Database and Auth connection.
- `razorpay` (`^2.9.2`): Server-side Node.js SDK for handling payments.
- `@sentry/react` (`^10.40.0`): Error tracking and performance monitoring.
- `axios` (`^1.13.4`): Promise-based HTTP client for external API requests (used interchangeably with `fetch`).
- `lucide-react` (`^0.344.0`): UI Icon library used throughout the dashboards.
- `pg` (`^8.18.0`): PostgreSQL client for Node.js (likely used inside Edge Functions/migration scripts).

### Development Dependencies
- `@vitejs/plugin-react` (`^4.2.1`): Vite plugin for React Fast Refresh.
- `vite-plugin-pwa` (`^1.2.0`): Generates service workers for offline support and app installation.
- `@types/react`, `@types/react-dom`, `@types/node`: TypeScript definitions for core modules.

## 3. Environment Variables
The application strictly depends on the following environment variables to function correctly. 
*Note: Public variables must be prefixed with `VITE_` due to the Vite build system.*

### Frontend Variables (Public)
- `VITE_SUPABASE_URL`: The Supabase project URL (e.g., `https://[ID].supabase.co`).
- `VITE_SUPABASE_ANON_KEY`: The public anonymous key for unauthenticated Supabase access.

### Backend / Serverless Variables (Private)
- `SUPABASE_SERVICE_ROLE_KEY`: The secret key bypassing Row Level Security (RLS) - used only in Edge Functions and Node scripts.
- `RAZORPAY_KEY_ID`: Your public Razorpay identifier for identifying your merchant account.
- `RAZORPAY_KEY_SECRET`: Your private Razorpay secret for signing orders and verifying webhook signatures securely.

## 4. External Services & APIs Connected
The platform relies heavily on third-party services:

1. **Supabase (Backend-as-a-Service)**
   - **PostgreSQL Database:** Relational database running the core `users` and `leads` tables.
   - **Authentication:** Supabase Auth for Email/Password management.
   - **Edge Functions:** Deno-based serverless functions for background scheduling (`process-backlog`) and Meta webhooks.
2. **Vercel**
   - **Hosting:** Primary frontend host handling Vite deployments.
   - **Serverless Functions:** Runs the `/api/*` endpoints via Vercel's Node.js runtime.
3. **Razorpay (Payment Gateway)**
   - Integrated to handle user plan subscriptions via the `api/create-order.ts` endpoint (Note: Currently manually disabled via Maintenance Mode).
   - Generates INR payments securely.
4. **Meta Graph API (Facebook & Instagram Ads)**
   - Connected via `meta-webhook-*.ts` scripts. Custom webhooks listen to new Lead Ad form submissions on Meta and push the raw JSON payload straight into the platform.
5. **Sentry**
   - Application crash reporting (integrated in `App.tsx` via `<Sentry.ErrorBoundary>`).
6. **Google Apps Script (Legacy / Companion)**
   - The `gas-v15` folder contains `.gs` scripts indicating Google Sheets and Gmail integrations for sending automated renewal reminders out-of-band.
