-- ═══════════════════════════════════════════════════════════════════════════
-- Pin Himanshu Sharma to the original turbo_boost pace (14/day)
-- Applied to production 2026-08-19 ~21:00 IST, with admin approval.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- PROBLEM
-- The special-case branch for Himanshu read daily_leads from plan_config:
--
--     SELECT daily_leads INTO pc FROM plan_config WHERE plan_name = NEW.plan_name;
--     NEW.daily_limit := COALESCE(pc.daily_leads, 14);
--
-- The 14 was only ever a fallback for "plan not found". Since plan_config's
-- turbo_boost row carries the August-offer pace, that lookup resolved to 33 —
-- verified by running the branch's exact logic in isolation, which returned 33.
-- So every UPDATE to his row (each lead assignment updates counters, and the
-- trigger is BEFORE INSERT OR UPDATE with no column filter) silently moved him
-- onto the offer pace.
--
-- Visible symptom: the admin panel showed him at 23/14. He was not over-served —
-- all 23 of that day's leads were assigned between 09:15 and 18:18 while his
-- daily_limit was still 33, and 0 arrived after it flipped to 14 at 18:47. The
-- ratio only looked wrong because the limit moved after the fact.
--
-- DECISION (admin, 2026-08-19)
-- He stays on the ORIGINAL turbo_boost plan: 14 leads/day, not the offer's 33.
-- So hardcode it. Reading plan_config here cannot express "this user is exempt
-- from the offer", which is exactly what is wanted.
--
-- plan_weight stays 7 — his pre-existing custom priority, deliberately not the
-- 9 that plan_config lists for turbo_boost. Untouched by this change.
--
-- BLAST RADIUS
-- Only the branch guarded by his user id. Every other user still goes through
-- the plan_config lookup below, unchanged.
--
-- VERIFIED AFTER APPLYING
--   - Himanshu   -> self-UPDATE fired the trigger; daily_limit stayed 14 ✔
--   - Mandeep kaur (the other turbo_boost user, control) -> stayed 33 / weight 9 ✔
--   - All other active/paid users vs plan_config: 0 daily_limit mismatches,
--     0 plan_weight mismatches ✔
--   - Counter drift 0, over-quota active users 0 ✔
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.sync_user_plan_fields()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  pc RECORD;
BEGIN
  -- Only reset to 0 if payment_status is explicitly inactive OR no plan
  -- Removed: valid_until check (was causing false resets when valid_until=NULL)
  IF COALESCE(NEW.payment_status, 'inactive') <> 'active'
     OR COALESCE(NEW.plan_name, 'none') = 'none' THEN
    NEW.daily_limit := 0;
    NEW.plan_weight := 0;
    RETURN NEW;
  END IF;

  -- ─────────────────────────────────────────────────────────────────────
  -- Himanshu Sharma — deliberate special case, admin decision 2026-08-19.
  -- He stays on the ORIGINAL turbo_boost pace of 14 leads/day, NOT the
  -- August-offer pace of 33. Hardcoded on purpose: reading plan_config here
  -- resolved to 33 and silently moved him onto the offer pace whenever his
  -- row was updated. weight=7 is his existing custom priority, unchanged.
  -- ─────────────────────────────────────────────────────────────────────
  IF NEW.id = '9dd68ace-a5a7-46d8-b677-3483b5bb0841' THEN
    NEW.daily_limit := 14;
    NEW.plan_weight := 7;
    RETURN NEW;
  END IF;

  -- Look up plan_config for weight + daily_limit
  SELECT daily_leads, weight INTO pc
  FROM public.plan_config
  WHERE plan_name = NEW.plan_name;

  IF FOUND THEN
    NEW.daily_limit := COALESCE(pc.daily_leads, 0);
    NEW.plan_weight := COALESCE(pc.weight, 1);
  ELSE
    -- Plan name not in plan_config — preserve existing values, don't zero out
    NEW.daily_limit := COALESCE(NEW.daily_limit, 0);
    NEW.plan_weight := COALESCE(NEW.plan_weight, 0);
  END IF;

  RETURN NEW;
END;
$function$;

-- ── Verification queries ───────────────────────────────────────────────────
--
-- 1. Himanshu must be 14 / weight 7, and must STAY there after a self-UPDATE:
--      UPDATE users SET updated_at = NOW() WHERE email='sharmahimanshu9797@gmail.com';
--      SELECT daily_limit, plan_weight FROM users WHERE email='sharmahimanshu9797@gmail.com';
--      -- expect 14, 7
--
-- 2. Every other active/paid user must still match plan_config (expect 0 rows):
--      SELECT u.email, u.daily_limit, pc.daily_leads, u.plan_weight, pc.weight
--      FROM users u JOIN plan_config pc ON pc.plan_name = u.plan_name
--      WHERE u.role='member'
--        AND (u.is_active OR u.is_plan_pending OR u.payment_status='active')
--        AND u.email <> 'sharmahimanshu9797@gmail.com'
--        AND (u.daily_limit <> pc.daily_leads OR u.plan_weight <> pc.weight);
