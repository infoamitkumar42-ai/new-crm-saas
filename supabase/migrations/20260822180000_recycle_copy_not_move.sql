-- ═══════════════════════════════════════════════════════════════════════════
-- assign_recycled_leads: COPY the lead instead of MOVING it
-- Proposed 2026-08-22. DO NOT APPLY without reading the tradeoffs below.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- PROBLEM (the mechanism behind every phantom-quota incident this month)
-- The current RPC reclaims an old lead from an expired member and hands it to
-- a paying one with a plain UPDATE of leads.assigned_to:
--
--     UPDATE leads SET assigned_to = p_user_id, user_id = p_user_id, ...
--     WHERE id = v_lead.id;
--
-- Because trigger_update_user_lead_count fires whenever assigned_to changes,
-- every recycle DECREMENTS the original owner's total_leads_received. Two
-- consequences, both of which cost real support time this month:
--   1. Phantom quota — their remaining silently grows, so the dashboard shows
--      leads they are not actually owed (BUG-017 v2, 2026-08-21).
--   2. The lead vanishes from the original owner's dashboard, so their own
--      count no longer matches what they were delivered (Sameer, 2026-08-22).
--
-- FIX
-- Insert a NEW row for the receiving user and leave the original owner's row
-- completely untouched — same shape as the one-off backfill run on
-- 2026-08-22, but now built into the RPC so it holds going forward.
--
-- ── WHAT CHANGES ───────────────────────────────────────────────────────────
--  * Source row: ONLY recycle_count and recycled_at are written. assigned_to,
--    status, notes, everything else stays exactly as the original owner left
--    it. Their counter never moves, their dashboard never loses the lead.
--  * Receiving user: gets a brand-new row (status 'Fresh', notes cleared,
--    fresh assigned/distributed/delivered timestamps, original_user_id and
--    original_status recorded for traceability).
--  * created_at is COPIED, not reset — CLAUDE.md's standing rule: the age
--    window, duplicate detection and date-wise audits all key off created_at.
--    The UI already displays assigned_at, so the receiving agent still sees it
--    as a lead delivered today.
--
-- ── WHY recycle_count IS STILL WRITTEN TO THE SOURCE ───────────────────────
-- It is the ONLY thing stopping the same lead being recycled forever. The
-- source query filters on COALESCE(l.recycle_count,0) <= 1, and the source row
-- is now the row that keeps being scanned (it never moves away). Without this
-- increment the same lead would be copied to a new agent on every single
-- cron run, 6x a day, indefinitely.
--
-- Writing only recycle_count/recycled_at does NOT fire the counter trigger —
-- that trigger keys strictly off assigned_to changing — and does not fire
-- trg_send_crm_conversion, which is AFTER UPDATE OF status only.
--
-- ── NEW GUARD: no double-calling by two ACTIVE agents ──────────────────────
-- Under the old MOVE model exactly one person held a lead at any moment. With
-- copies that is no longer automatic, so a new condition blocks copying any
-- lead whose phone is currently held by an ACTIVE user. Effect: a lead can
-- still be recycled again later if the copy's holder also goes inactive, but
-- two live agents can never be calling the same number at the same time.
--
-- ── TRIGGERS ON THE NEW INSERT (all intended, all pre-existing behaviour) ──
--   trg_check_limit_insert        — daily-limit safety net; v_can_assign
--                                   already respects the limit, this backstops
--                                   a concurrent race.
--   trigger_update_user_lead_count — increments the RECEIVING user's
--                                   total_leads_received/leads_today. Same as
--                                   before; only the original owner's
--                                   decrement is gone, which is the point.
--   trigger_push_notification     — receiving agent gets their "new lead"
--                                   push, same as the old UPDATE path did.
--   trg_safety_net_assign         — no-op here, it only handles status='New'.
--   trg_send_crm_conversion       — does not fire on INSERT, so no CAPI event,
--                                   identical to the old behaviour.
--
-- ── ACCEPTED TRADEOFFS (say these out loud before applying) ────────────────
--  1. leads now holds two rows with the same phone — one for the original
--     owner (historical record) and one for the recycled recipient. Any future
--     duplicate-phone audit will see these; they are expected, not a bug.
--  2. Total row count in `leads` grows by roughly the recycle rate
--     (~30-60/day at current settings).
--  3. Lifetime "leads delivered" per user now counts a recycled lead for BOTH
--     the original owner and the recipient — which is the honest reading, since
--     both were genuinely given the lead to work.
--
-- ── UNCHANGED ──────────────────────────────────────────────────────────────
-- Every eligibility rule, the age window, the Gujarat exclusion, the per-user
-- dedup, quota/daily-limit math, ordering, SKIP LOCKED, and the
-- recycled_leads_received bookkeeping are byte-for-byte as they are today.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.assign_recycled_leads(p_user_id uuid, p_count integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_assigned INTEGER := 0;
    v_user_team TEXT; v_recycled_quota INTEGER; v_recycled_received INTEGER;
    v_total_promised INTEGER; v_total_received INTEGER;
    v_daily_limit INTEGER; v_leads_today INTEGER;
    v_daily_remaining INTEGER; v_can_assign INTEGER; v_lead RECORD;
BEGIN
    SELECT COALESCE(team_code,''), COALESCE(recycled_leads_quota,0),
           COALESCE(recycled_leads_received,0), COALESCE(total_leads_promised,0),
           COALESCE(total_leads_received,0), COALESCE(daily_limit,0),
           (SELECT COUNT(*)::INTEGER FROM leads
            WHERE assigned_to = p_user_id
              AND DATE(assigned_at AT TIME ZONE 'Asia/Kolkata') = (NOW() AT TIME ZONE 'Asia/Kolkata')::date)
      INTO v_user_team, v_recycled_quota, v_recycled_received,
           v_total_promised, v_total_received, v_daily_limit, v_leads_today
      FROM users WHERE id = p_user_id;

    IF NOT FOUND THEN RETURN 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id
                   AND is_active = true AND payment_status = 'active') THEN RETURN 0; END IF;
    IF v_daily_limit > 0 AND v_leads_today >= v_daily_limit THEN RETURN 0; END IF;

    v_daily_remaining := GREATEST(0, v_daily_limit - v_leads_today);
    v_can_assign := LEAST(p_count, v_recycled_quota - v_recycled_received,
                          v_total_promised - v_total_received, v_daily_remaining);
    IF v_can_assign <= 0 THEN RETURN 0; END IF;

    FOR v_lead IN
        SELECT l.id, l.status AS original_status, l.assigned_to AS original_owner_id,
               l.name, l.phone, l.city, l.state, l.source, l.form_id, l.lead_details,
               l.manager_id, l.created_at, l.quality_score, l.is_valid_phone, l.phone_type,
               COALESCE(l.recycle_count, 0) AS cur_recycle_count
        FROM leads l INNER JOIN users u ON l.assigned_to = u.id
        WHERE l.status IN ('Call Back','Contacted','Interested','Follow-up')
          AND (
                (    l.created_at > NOW() - INTERVAL '6 months'
                 AND l.created_at < NOW() - INTERVAL '2 months'
                 AND u.team_code IN ('TEAMFIRE','TEAMSIMRAN','TEAMRAJ') )
             OR (    l.status = 'Call Back'
                 AND (l.created_at AT TIME ZONE 'Asia/Kolkata') >= '2026-07-01'
                 AND (l.created_at AT TIME ZONE 'Asia/Kolkata') <  '2026-08-01' )
          )
          AND COALESCE(l.recycle_count, 0) <= 1
          AND l.phone IS NOT NULL AND LENGTH(TRIM(l.phone)) >= 10
          AND (u.is_active = false OR u.payment_status IN ('expired','inactive'))
          AND l.assigned_to != p_user_id
          AND COALESCE(l.user_id, l.assigned_to) != p_user_id
          AND NOT EXISTS (SELECT 1 FROM leads prev
                          WHERE prev.assigned_to = p_user_id AND prev.phone = l.phone AND prev.id != l.id)
          -- NEW (copy model): never hand out a number an ACTIVE agent is already
          -- working. Under the old MOVE model this was implicit.
          AND NOT EXISTS (SELECT 1 FROM leads other
                          INNER JOIN users ou ON ou.id = other.assigned_to
                          WHERE other.phone = l.phone AND other.id != l.id
                            AND ou.is_active = true)
          AND NOT (COALESCE(l.state,'') ILIKE '%gujarat%' OR COALESCE(l.city,'') ILIKE '%gujarat%'
                OR COALESCE(l.city,'')  ILIKE '%ahmedabad%'   OR COALESCE(l.city,'') ILIKE '%surat%'
                OR COALESCE(l.city,'')  ILIKE '%vadodara%'    OR COALESCE(l.city,'') ILIKE '%rajkot%'
                OR COALESCE(l.city,'')  ILIKE '%vapi%'        OR COALESCE(l.city,'') ILIKE '%deesa%'
                OR COALESCE(l.city,'')  ILIKE '%gandhinagar%' OR COALESCE(l.city,'') ILIKE '%baroda%')
        ORDER BY
            CASE l.status WHEN 'Call Back' THEN 1 WHEN 'Contacted' THEN 2
                          WHEN 'Interested' THEN 3 WHEN 'Follow-up' THEN 4 ELSE 5 END ASC,
            l.created_at DESC
        LIMIT v_can_assign
        FOR UPDATE OF l SKIP LOCKED
    LOOP
        -- 1. Source row: mark it as recycled so it cannot be picked again,
        --    and NOTHING else. The original owner keeps the lead, their notes,
        --    their status, and their counter.
        UPDATE leads
        SET recycle_count = v_lead.cur_recycle_count + 1,
            recycled_at   = NOW()
        WHERE id = v_lead.id;

        -- 2. Receiving user: a brand-new row, delivered fresh today.
        INSERT INTO leads (
            name, phone, city, state, source, status, notes,
            assigned_to, user_id, manager_id, form_id, lead_details,
            lead_type, original_user_id, original_status, recycle_count, recycled_at,
            created_at, assigned_at, distributed_at, delivered_at,
            quality_score, is_valid_phone, phone_type,
            is_replaced, replacement_requested, replacement_reason
        ) VALUES (
            v_lead.name, v_lead.phone, v_lead.city, v_lead.state, v_lead.source, 'Fresh', NULL,
            p_user_id, p_user_id, v_lead.manager_id, v_lead.form_id, v_lead.lead_details,
            'recycled', v_lead.original_owner_id, v_lead.original_status,
            v_lead.cur_recycle_count + 1, NOW(),
            v_lead.created_at, NOW(), NOW(), NOW(),
            v_lead.quality_score, v_lead.is_valid_phone, v_lead.phone_type,
            false, false, NULL
        );

        v_assigned := v_assigned + 1;
    END LOOP;

    IF v_assigned > 0 THEN
        UPDATE users SET recycled_leads_received = COALESCE(recycled_leads_received,0) + v_assigned,
                         last_lead_time = NOW(), last_assigned_at = NOW()
        WHERE id = p_user_id;
    END IF;
    RETURN v_assigned;
END;
$function$;

-- ── Verification after applying ────────────────────────────────────────────
--
-- 1. Original owners must STOP losing leads. Take a recycled lead's
--    original_user_id and confirm their count did not drop:
--      SELECT total_leads_received,
--             (SELECT COUNT(*) FROM leads WHERE assigned_to = u.id) AS actual
--      FROM users u WHERE id = '<original_user_id>';
--      -- counter and actual must match (drift 0), and neither should fall
--      -- after a recycler run.
--
-- 2. Standard drift check (must stay 0 rows):
--      SELECT u.email, u.total_leads_received, COUNT(l.id)
--      FROM users u LEFT JOIN leads l ON l.assigned_to = u.id
--      WHERE u.role='member' GROUP BY u.id, u.email, u.total_leads_received
--      HAVING u.total_leads_received != COUNT(l.id);
--
-- 3. No two ACTIVE agents on the same phone (must be 0 rows):
--      SELECT l.phone, COUNT(DISTINCT l.assigned_to)
--      FROM leads l JOIN users u ON u.id = l.assigned_to
--      WHERE u.is_active = true
--      GROUP BY l.phone HAVING COUNT(DISTINCT l.assigned_to) > 1;
--
-- 4. Source rows must keep their owner and status after a run:
--      SELECT id, assigned_to, status, recycle_count, recycled_at
--      FROM leads WHERE recycled_at > NOW() - INTERVAL '1 hour'
--        AND lead_type <> 'recycled';
--      -- these are the SOURCE rows: assigned_to unchanged, status unchanged,
--      -- only recycle_count/recycled_at written.
