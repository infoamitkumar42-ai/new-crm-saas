# External Services Reference

## Supabase

- **Project ID**: vewqzsqddgmkslnuctvb
- **Dashboard**: https://supabase.com/dashboard/project/vewqzsqddgmkslnuctvb
- **Region**: ap-south-1 (Mumbai)
- **Auth**: Direct URL (not proxied)
- **Data**: Via api.leadflowcrm.in proxy

## Cloudflare

- **Pages Project**: leadflowcrm
- **Live URL**: https://leadflowcrm.in
- **Worker (proxy)**: https://api.leadflowcrm.in
- **Worker code**: `cloudflare-worker/` folder in repo
- **Build command**: `npm run build`
- **Output directory**: `dist`

## Razorpay

- **Purpose**: Payment processing for plan purchases
- **Webhook endpoint**: `https://leadflowcrm.in/api/razorpay-webhook` (Cloudflare Pages Function)
- **Webhook handler**: `functions/api/razorpay-webhook.ts`
- **Events handled**: `payment.captured` → activates user plan

## Meta (Facebook)

- **Purpose**: Lead form webhooks
- **Endpoint**: Supabase Edge Function `meta-webhook`
- **Verification**: Webhook signature validation
- **Lead format**: name, phone, city, state extracted from payload

## GitHub

- **Repo**: https://github.com/infoamitkumar42-ai/new-crm-saas
- **Branch**: main
- **Deploy**: Auto-deploy to Cloudflare Pages on push to main

## Web Push (VAPID)

- **Purpose**: Real-time lead notifications to member devices
- **Keys**: Regenerated 2026-03-13 (stored in Supabase secrets)
- **Handler**: `supabase/functions/send-push-notification/`
- **Subscriptions**: `push_subscriptions` table
