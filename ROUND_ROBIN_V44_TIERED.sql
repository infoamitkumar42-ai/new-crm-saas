-- ============================================================================
-- 🚀 ROUND-ROBIN TIERED ROTATION - RPC v44
-- ============================================================================
-- Features:
-- 1. Daily Round-Robin FIRST: Primary sort is Leads Today (ASC).
-- 2. Tier Priority SECOND: Within each round, higher plans get priority (DESC).
-- 3. Random THIRD: Jitter for equal tiers.
-- 4. Atomic Locking (SKIP LOCKED) preserved.

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

    -- PHASE 1: ATOMIC ROUND-ROBIN SELECTION
    SELECT u.id INTO v_selected_id
    FROM users u
    WHERE u.team_code = ANY(v_team_array)
      AND u.is_active = true
      AND u.is_online = true
      AND u.role IN ('member', 'manager')
      AND (
          -- PLAN EXPIRY CHECK
          u.total_leads_received < u.total_leads_promised 
          OR u.total_leads_promised = 0 
          OR u.total_leads_promised IS NULL
      )
      AND (
          -- DAILY LIMIT CHECK
          (SELECT COUNT(*) FROM leads l 
           WHERE l.assigned_to = u.id 
           AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
          ) < u.daily_limit 
          OR u.daily_limit = 0 
          OR u.daily_limit IS NULL
      )
    ORDER BY 
        -- 🛡️ 1. DAILY FAIRNESS (Primary Sort - Round Robin)
        -- Everyone with 0 leads gets priority over everyone with 1+ leads.
        (SELECT COUNT(*) FROM leads l 
         WHERE l.assigned_to = u.id 
         AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
        ) ASC,

        -- 🛡️ 2. TIER PRIORITY (Tie-breaker within the same lead count)
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
