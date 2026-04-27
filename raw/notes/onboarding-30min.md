# Developer Onboarding — 30 Minute Guide

## 5 Minutes: Project Understanding

LeadFlow CRM = SaaS platform where network marketing teams buy lead quotas.
Facebook ad leads → webhook → round-robin to paid subscribers → push notification.

Owner: Amit (info.amitkumar42@gmail.com)
Live: https://leadflowcrm.in

## 10 Minutes: Critical Rules (MEMORIZE THESE)

1. **Counter updates**: ONLY use `increment_user_lead_counters(user_id)` RPC. Never direct UPDATE.
2. **Dual FK**: leads table has `user_id` AND `assigned_to` — always use `users!assigned_to` alias.
3. **IST timezone**: All cron/date SQL must use `AT TIME ZONE 'Asia/Kolkata'`.
4. **Proxy**: Data → api.leadflowcrm.in | Auth → direct Supabase. Never mix them.
5. **Locked files**: auth/useAuth.tsx, supabaseClient.ts, App.tsx, vite.config.ts, src/sw.ts — don't touch.

## 10 Minutes: Local Setup

```bash
git clone https://github.com/infoamitkumar42-ai/new-crm-saas
cd new-crm-saas
npm install
# Create .env.local with VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm run dev
```

## 5 Minutes: Key Files to Know

| File | What it does |
|------|-------------|
| `views/AdminDashboard.tsx` | All admin features |
| `views/MemberDashboard.tsx` | Lead list for members |
| `supabase/functions/meta-webhook/` | Lead intake from Meta |
| `supabase/functions/process-backlog/` | Morning lead assignment |
| `functions/api/razorpay-webhook.ts` | Payment processing |
| `components/LeadAlert.tsx` | Foreground push notification UI |

## Common Queries

```typescript
// Correct leads query (disambiguate FK)
supabase.from('leads')
  .select('*, assigned_user:users!assigned_to(name, email)')
  .eq('assigned_to', userId)

// Correct counter update
supabase.rpc('increment_user_lead_counters', { p_user_id: userId })

// Check plan expiry
// total_leads_received >= total_leads_promised → expired
```
