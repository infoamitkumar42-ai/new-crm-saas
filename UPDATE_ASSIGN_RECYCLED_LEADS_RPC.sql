-- ============================================================
-- UPDATE: assign_recycled_leads RPC — Final Production Version
-- Run this in Supabase SQL Editor
-- Date: 2026-04-05
-- Updated: 2026-04-06 — Added daily_limit check (CRITICAL FIX)
--   leads_today >= daily_limit → skip user for today (resume tomorrow)
-- Updated: 2026-04-06 — TEAM WHITELIST FIX
--   Only source leads from TEAMFIRE, TEAMSIMRAN, TEAMRAJ inactive members
--   GJ01TEAMFIRE and all other teams are EXCLUDED from recycling pool
-- ============================================================

-- STEP 1: Update assign_recycled_leads RPC
-- Changes:
--   - Status filter: only 'Call Back', 'Fresh', 'fresh'
--   - Time window: 2-6 months old
--   - Same phone block: don't reassign same phone to same user
--   - Priority: Call Back first, then Fresh (newer first = Feb > Jan)
--   - Daily limit check: skip user if leads_today >= daily_limit
--   - Team whitelist: ONLY TEAMFIRE / TEAMSIMRAN / TEAMRAJ sources
--   - GJ01TEAMFIRE leads are EXCLUDED (Gujarat team separation)
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_recycled_leads(p_user_id uuid, p_count integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_assigned INTEGER := 0;
    v_user_team TEXT;
    v_recycled_quota INTEGER;
    v_recycled_received INTEGER;
    v_total_promised INTEGER;
    v_total_received INTEGER;
    v_daily_limit INTEGER;
    v_leads_today INTEGER;
    v_daily_remaining INTEGER;
    v_can_assign INTEGER;
    v_lead RECORD;
BEGIN
    -- Fetch all user fields needed
    SELECT
        COALESCE(team_code, ''),
        COALESCE(recycled_leads_quota, 0),
        COALESCE(recycled_leads_received, 0),
        COALESCE(total_leads_promised, 0),
        COALESCE(total_leads_received, 0),
        COALESCE(daily_limit, 0),
        COALESCE(leads_today, 0)
    INTO
        v_user_team,
        v_recycled_quota,
        v_recycled_received,
        v_total_promised,
        v_total_received,
        v_daily_limit,
        v_leads_today
    FROM users
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Must be active
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = p_user_id
        AND is_active = true
        AND payment_status = 'active'
    ) THEN
        RETURN 0;
    END IF;

    -- ✅ DAILY LIMIT CHECK — skip if daily quota is full
    IF v_daily_limit > 0 AND v_leads_today >= v_daily_limit THEN
        RETURN 0;
    END IF;

    -- How many can we give today without breaching daily limit?
    v_daily_remaining := GREATEST(0, v_daily_limit - v_leads_today);

    -- Cap by: requested, recycled quota left, total quota left, daily limit left
    v_can_assign := LEAST(
        p_count,
        v_recycled_quota - v_recycled_received,
        v_total_promised - v_total_received,
        v_daily_remaining
    );

    IF v_can_assign <= 0 THEN
        RETURN 0;
    END IF;

    FOR v_lead IN
        SELECT
            l.id,
            l.status AS original_status,
            l.assigned_to AS original_owner_id
        FROM leads l
        INNER JOIN users u ON l.assigned_to = u.id
        WHERE
            l.status IN ('Call Back', 'Fresh', 'fresh')
            AND l.created_at > NOW() - INTERVAL '6 months'
            AND l.created_at < NOW() - INTERVAL '2 months'
            AND COALESCE(l.recycle_count, 0) <= 1
            AND l.phone IS NOT NULL
            AND LENGTH(TRIM(l.phone)) >= 10
            AND (
                u.is_active = false
                OR u.payment_status IN ('expired', 'inactive')
            )
            -- ✅ TEAM WHITELIST: Only TEAMFIRE/TEAMSIMRAN/TEAMRAJ sources
            -- GJ01TEAMFIRE and other Gujarat/unknown teams EXCLUDED
            AND u.team_code IN ('TEAMFIRE', 'TEAMSIMRAN', 'TEAMRAJ')
            AND l.assigned_to != p_user_id
            AND COALESCE(l.user_id, l.assigned_to) != p_user_id
            AND NOT EXISTS (
                SELECT 1 FROM leads prev
                WHERE prev.assigned_to = p_user_id
                AND prev.phone = l.phone
                AND prev.id != l.id
            )
        ORDER BY
            CASE l.status
                WHEN 'Call Back' THEN 1
                WHEN 'Fresh'     THEN 2
                WHEN 'fresh'     THEN 2
                ELSE 3
            END ASC,
            l.created_at DESC   -- Newest eligible leads first (Feb > Jan > Dec)
        LIMIT v_can_assign
        FOR UPDATE OF l SKIP LOCKED
    LOOP
        UPDATE leads SET
            lead_type = 'recycled',
            original_user_id = v_lead.original_owner_id,
            original_status = v_lead.original_status,
            recycle_count = COALESCE(recycle_count, 0) + 1,
            recycled_at = NOW(),
            assigned_to = p_user_id,
            user_id = p_user_id,
            status = 'Fresh',
            assigned_at = NOW(),
            distributed_at = NOW(),
            delivered_at = NOW(),
            notes = NULL,
            is_replaced = false,
            replacement_requested = false,
            replacement_reason = NULL
        WHERE id = v_lead.id;

        IF FOUND THEN
            v_assigned := v_assigned + 1;
        END IF;
    END LOOP;

    IF v_assigned > 0 THEN
        UPDATE users SET
            recycled_leads_received = COALESCE(recycled_leads_received, 0) + v_assigned,
            leads_today = COALESCE(leads_today, 0) + v_assigned,
            total_leads_received = COALESCE(total_leads_received, 0) + v_assigned,
            last_lead_time = NOW(),
            last_assigned_at = NOW()
        WHERE id = p_user_id;
    END IF;

    RETURN v_assigned;
END;
$function$;


-- ============================================================
-- VERIFY: Check RPC definition was updated
-- ============================================================
-- SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'assign_recycled_leads';


-- ============================================================
-- AUDIT: Check for any remaining Gujarat recycled leads
-- Should return 0 after the cleanup migration
-- ============================================================
-- SELECT COUNT(*) AS gujrat_recycled_remaining
-- FROM leads l
-- JOIN users au ON au.id = l.assigned_to
-- JOIN users ou ON ou.id = l.original_user_id
-- WHERE l.lead_type = 'recycled'
--   AND au.team_code IN ('TEAMFIRE', 'TEAMSIMRAN', 'TEAMRAJ')
--   AND ou.team_code NOT IN ('TEAMFIRE', 'TEAMSIMRAN', 'TEAMRAJ');


-- ============================================================
-- Test RPC (replace USER_UUID with real UUID)
-- ============================================================
-- SELECT assign_recycled_leads('USER_UUID_YAHAN', 2);
