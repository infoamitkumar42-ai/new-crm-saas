-- Renewal-while-active fix (2026-08-11).
--
-- When a currently-active, currently-earning user renews/upgrades their plan,
-- the webhook previously deactivated them instantly (is_active=false) and
-- deferred the new plan to next-day 7 AM IST activation — the SAME rule used
-- for brand-new/expired-user activations. This cut an active user off from
-- the rest of today's already-active daily capacity even though they still
-- had both daily-limit room and lifetime quota left (hit live with Ravenjeet
-- Kaur on 2026-08-11, required a manual admin fix).
--
-- pending_plan_name stores the NEW plan's name for this "deferred renewal"
-- case: the user keeps earning at their CURRENT plan's pace uninterrupted for
-- the rest of today, and check-quota-expiry's existing 7 AM IST activation
-- pass applies pending_plan_name -> plan_name tomorrow (trg_sync_user_plan_fields
-- then auto-syncs daily_limit/plan_weight/etc from plan_config as usual).
--
-- NULL for everyone else — brand-new signups and already-inactive/expired
-- renewals are completely unaffected, same behavior as before.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pending_plan_name text;
