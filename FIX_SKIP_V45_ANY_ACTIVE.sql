-- ============================================================================
-- 🚀 FIX LEAD SKIP - RPC v45 (ANY ACTIVE USER)
-- ============================================================================
-- Features:
-- 1. Master Switch: is_active = true is the ONLY eligibility criteria.
-- 2. No Skipping: Removes the check for total_leads_received vs total_leads_promised.
-- 3. Round-Robin Priority: Still prioritizes 0-lead users today.
-- 4. Tier Safety: Still gives priority to high tiers for tie-breaks.

BEGIN;

DROP FUNCTION IF EXISTS public.get_best_assignee_for_team(TEXT);

CREATE OR REPLACE FUNCTION public.get_best_assignee_for_team(
    p_team_code TEXT
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    plan_name TEXT,
    daily_limit INT,
    leads_today BIGINT,
    total_leads_received INT,
    total_leads_promised INT,
    out_user_id UUID,
    out_user_name TEXT,
    out_user_email TEXT,
    out_plan_name TEXT,
    out_daily_limit INT,
    out_leads_today BIGINT,
    out_total_received INT,
    out_total_promised INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_team_array TEXT[];
    v_selected_id UUID;
BEGIN
    -- normalize input
    v_team_array := string_to_array(REPLACE(p_team_code, ' ', ''), ',');

    -- PHASE 1: ATOMIC SELECTION (IGNORE TOTAL QUOTA)
    SELECT u.id INTO v_selected_id
    FROM users u
    WHERE u.team_code = ANY(v_team_array)
      AND u.is_active = true
      AND u.is_online = true
      AND u.role IN ('member', 'manager')
      AND (
          -- DAILY LIMIT CHECK (System still respects the day's limit)
          (SELECT COUNT(*) FROM leads l 
           WHERE l.assigned_to = u.id 
           AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
          ) < u.daily_limit 
          OR u.daily_limit = 0 
          OR u.daily_limit IS NULL
      )
    ORDER BY 
        -- 🛡️ 1. DAILY FAIRNESS (Primary Sort - Round Robin)
        (SELECT COUNT(*) FROM leads l 
         WHERE l.assigned_to = u.id 
         AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
        ) ASC,

        -- 🛡️ 2. TIER PRIORITY (Tie-breaker)
        (CASE 
            WHEN LOWER(u.plan_name) LIKE '%turbo%' OR LOWER(u.plan_name) LIKE '%boost%' THEN 4
            WHEN LOWER(u.plan_name) LIKE '%manager%' THEN 3
            WHEN LOWER(u.plan_name) LIKE '%supervisor%' THEN 2
            WHEN LOWER(u.plan_name) LIKE '%starter%' THEN 1
            ELSE 0
        END) DESC,

        -- 🛡️ 3. RANDOM JITTER
        RANDOM()
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- PHASE 2: RETURN DATA
    IF v_selected_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            eu.id AS user_id,
            eu.name AS user_name,
            eu.email AS user_email,
            eu.plan_name,
            eu.daily_limit,
            (SELECT COUNT(*) FROM leads l WHERE l.assigned_to = eu.id AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')) AS leads_today,
            eu.total_leads_received,
            eu.total_leads_promised,
            -- Webhook Compatibility
            eu.id AS out_user_id,
            eu.name AS out_user_name,
            eu.email AS out_user_email,
            eu.plan_name AS out_plan_name,
            eu.daily_limit AS out_daily_limit,
            (SELECT COUNT(*) FROM leads l WHERE l.assigned_to = eu.id AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')) AS out_leads_today,
            eu.total_leads_received AS out_total_received,
            eu.total_leads_promised AS out_total_promised
        FROM users eu
        WHERE eu.id = v_selected_id;
    END IF;
END;
$$;

COMMIT;
