-- ═══════════════════════════════════════════════════════════════════════════
-- Fix reactivation deadlock in update_user_lead_count()'s DECREMENT branch
-- Found + applied 2026-08-20, admin-approved (Ajay kumar's "Plan Inactive"
-- report, generalized after finding 23 users in the same broken state).
-- ═══════════════════════════════════════════════════════════════════════════
--
-- PROBLEM
-- trigger_update_user_lead_count (AFTER INSERT/UPDATE ON leads) has two
-- branches. INCREMENT (a lead lands on someone) correctly sets BOTH
-- is_active=false AND payment_status='inactive' together when quota is hit:
--
--     is_active = CASE WHEN (actual count) >= total_leads_promised THEN false ELSE is_active END,
--     payment_status = CASE WHEN (actual count) >= total_leads_promised THEN 'inactive' ELSE payment_status END,
--
-- DECREMENT (a lead is taken away from someone — reassignment, recycling,
-- an admin correction, anything that changes assigned_to away from them)
-- was supposed to be the mirror: if they now genuinely have room again,
-- reactivate them. But its condition required:
--
--     is_active = CASE WHEN payment_status = 'active' AND plan_name != 'none'
--                       AND (actual count) < total_leads_promised
--                       THEN true ELSE is_active END
--
-- payment_status = 'active' is EXACTLY the field that was just set to
-- 'inactive' by the increment branch's own deactivation. A user who was
-- correctly deactivated for hitting quota can NEVER satisfy this condition
-- again through this trigger, even after a decrement genuinely reopens
-- their quota — the condition requires the very state that only a
-- successful reactivation would produce. Self-referential deadlock.
--
-- payment_status itself was also never written in this branch at all —
-- only is_active — so even removing the impossible condition wasn't enough
-- on its own; a `true` is_active with a stale `payment_status='inactive'`
-- would still fail every OTHER query that filters on payment_status
-- (check-quota-expiry, plan-expiry-notifier, both routing-adjacent).
--
-- IMPACT (found via live query, 2026-08-20)
-- 23 real paying members stuck in exactly this state — is_active=false,
-- payment_status='inactive', plan_name still a real plan, genuine leads
-- remaining (received < promised) — ranging from 1 to 67 leads owed,
-- ~323 leads total. Ajay kumar (ajayk783382@gmail.com) was the one that
-- surfaced it (member complaint: "Plan Inactive" despite 17 leads left).
-- Not every one of the 23 is provably caused by THIS exact mechanism —
-- this repo has a long history of one-off manual SQL corrections that
-- could independently leave the same signature — but this is a real,
-- demonstrable, reproducible logic bug in an always-on trigger, and it's
-- the only currently-active code path that can produce this outcome.
--
-- FIX
-- Decrement branch's reactivation condition drops the payment_status
-- requirement (replaced with the same intent check the increment branch
-- and check-quota-expiry's activation pass already use: a real plan +
-- genuine quota room) and now sets payment_status='active' alongside
-- is_active=true, so both fields land in the same consistent state every
-- other activation path in the codebase already produces.
--
-- Everything else — the increment branch, the decrement branch's counter
-- math — is untouched.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_user_lead_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- INCREMENT: lead assigned to a new user
  IF (TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND NEW.assigned_to IS NOT NULL AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to)
  THEN
    UPDATE users
    SET
      total_leads_received = COALESCE(total_leads_received, 0) + 1,
      leads_today          = COALESCE(leads_today, 0) + 1,
      is_active = CASE
        WHEN (SELECT COUNT(*) FROM leads WHERE assigned_to = NEW.assigned_to)
             >= COALESCE(total_leads_promised, 0)
             AND COALESCE(total_leads_promised, 0) > 0
        THEN false
        ELSE is_active
      END,
      payment_status = CASE
        WHEN (SELECT COUNT(*) FROM leads WHERE assigned_to = NEW.assigned_to)
             >= COALESCE(total_leads_promised, 0)
             AND COALESCE(total_leads_promised, 0) > 0
        THEN 'inactive'
        ELSE payment_status
      END,
      updated_at = NOW()
    WHERE id = NEW.assigned_to;
  END IF;

  -- DECREMENT: lead reassigned AWAY from old user
  IF TG_OP = 'UPDATE'
     AND OLD.assigned_to IS NOT NULL
     AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to
  THEN
    UPDATE users
    SET
      total_leads_received = GREATEST(0, COALESCE(total_leads_received, 0) - 1),
      leads_today          = GREATEST(0, COALESCE(leads_today, 0) - 1),
      -- 2026-08-20 fix: dropped the impossible `payment_status = 'active'`
      -- precondition (see header). A real plan + genuine quota room is now
      -- enough to reopen routing eligibility, same intent check the
      -- increment branch and check-quota-expiry's own activation pass use.
      -- ⚠️ v2 (same day, see "REVISION" note at the bottom of this file):
      -- reactivation ALSO requires that this lead is not being RECYCLED away.
      is_active = CASE
        WHEN COALESCE(plan_name, 'none') != 'none'
             AND COALESCE(total_leads_promised, 0) > 0
             AND (SELECT COUNT(*) FROM leads WHERE assigned_to = OLD.assigned_to)
                 < COALESCE(total_leads_promised, 0)
             AND NOT (COALESCE(NEW.lead_type, '') = 'recycled'
                      AND NEW.original_user_id IS NOT DISTINCT FROM OLD.assigned_to)
        THEN true
        ELSE is_active
      END,
      payment_status = CASE
        WHEN COALESCE(plan_name, 'none') != 'none'
             AND COALESCE(total_leads_promised, 0) > 0
             AND (SELECT COUNT(*) FROM leads WHERE assigned_to = OLD.assigned_to)
                 < COALESCE(total_leads_promised, 0)
             AND NOT (COALESCE(NEW.lead_type, '') = 'recycled'
                      AND NEW.original_user_id IS NOT DISTINCT FROM OLD.assigned_to)
        THEN 'active'
        ELSE payment_status
      END,
      updated_at = NOW()
    WHERE id = OLD.assigned_to;
  END IF;

  RETURN NEW;
END;
$function$;

-- ── Verification queries ───────────────────────────────────────────────────
--
-- 1. Nobody currently active/paying should be affected by this change alone
--    (it only changes behavior on a DECREMENT event, which hasn't happened
--    yet for anyone at the moment this migration runs):
--      SELECT COUNT(*) FROM users WHERE role='member' AND is_active=true
--        AND (SELECT COUNT(*) FROM leads WHERE assigned_to=users.id) >= total_leads_promised
--        AND total_leads_promised > 0;
--      -- expect 0 (same as before this migration)
--
-- 2. The 23 already-stuck users are NOT auto-fixed by this migration alone
--    (they need a real decrement event, or the one-time batch correction
--    applied separately in the same session) — this only prevents the SAME
--    bug from re-freezing anyone in the future.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- REVISION v2 — SAME DAY, a few hours later. READ THIS BEFORE TRUSTING v1.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- The admin caught two problems with the work above.
--
-- (A) THE BATCH CORRECTION WAS TOO BROAD — see bugfix.md BUG-017. It filtered
--     only on "quota remaining > 0" and never checked when the user last paid,
--     so it reactivated 13 long-dormant accounts. Reverted.
--
-- (B) THE v1 TRIGGER FIX ABOVE WAS ITSELF DANGEROUS, for a reason v1 missed:
--
--     `assign_recycled_leads` reclaims old leads from expired members and
--     hands them to paying ones. Crucially it MOVES the row — a plain
--     UPDATE of leads.assigned_to — rather than copying it:
--
--         UPDATE leads SET lead_type='recycled', original_user_id=<old owner>,
--                          assigned_to = p_user_id, user_id = p_user_id, ...
--         WHERE id = v_lead.id;
--
--     So every recycle fires THIS trigger's decrement branch against the
--     expired original owner, dropping their total_leads_received by 1 and
--     opening phantom room under their total_leads_promised. That is where
--     the phantom quota came from in the first place — confirmed on live
--     data, where phantom_quota tracks leads_recycled_away almost exactly
--     (Saloni Rajput 67 vs 70, PRACHI GARG 49 vs 69, Payal 88 vs 136;
--     3,013 leads recycled from 164 users in total).
--
--     v1 removed the `payment_status = 'active'` precondition. That condition
--     was a genuine deadlock for the case v1 targeted — but it was ALSO the
--     only thing stopping the decrement branch from resurrecting expired
--     users on every recycle. With the recycler enabled (system_config
--     recycled_pool_control.enabled = true, cron 6x/day), v1 would have
--     silently re-activated expired accounts several times a day — exactly
--     the outcome (A) was reverted for, but automatic and unattended.
--
--     FIX: the decrement branch's reactivation now additionally requires that
--     this lead is not being recycled away from this very user:
--
--         AND NOT (COALESCE(NEW.lead_type,'') = 'recycled'
--                  AND NEW.original_user_id IS NOT DISTINCT FROM OLD.assigned_to)
--
--     The genuine case v1 was written for (an admin correcting a wrongly
--     assigned lead on a real customer) still reactivates. Recycling never
--     does.
--
-- ALSO APPLIED (data cleanup, admin-requested): 51 expired members
-- (is_active=false AND payment_status='inactive') had 659 leads of phantom
-- quota between them, produced by the recycle-decrement described above.
-- All set to total_leads_promised = total_leads_received, i.e. remaining 0:
--
--     UPDATE users SET total_leads_promised = total_leads_received, updated_at = NOW()
--     WHERE role='member' AND is_active=false AND payment_status='inactive'
--       AND total_leads_promised > total_leads_received;
--
-- Currently-active paying members were deliberately NOT touched — several of
-- them also carry recycle-inflated quota (SEEMA RANI 143, Ravenjeet Kaur 86,
-- Ajay kumar 17), but they are live customers and zeroing them would cut off
-- delivery. That is a separate decision for the admin.
--
-- ⚠️ STILL OPEN — the underlying design question. Recycling MOVES a lead
-- instead of COPYING it, so it will keep deflating the original owner's
-- counter every time it runs. Zeroing the quota (above) cleans up today's
-- damage but not the mechanism. Making assign_recycled_leads INSERT a new
-- row for the receiving user, leaving the original owner's row untouched,
-- would stop phantom quota at the source — but that is an RPC change needing
-- explicit approval (CLAUDE.md rule 4) and has its own consequences
-- (duplicate phone rows, lead-count reporting, CAPI event_id uniqueness).
-- Not done here. Flagged for a separate, deliberate decision.
-- ═══════════════════════════════════════════════════════════════════════════
