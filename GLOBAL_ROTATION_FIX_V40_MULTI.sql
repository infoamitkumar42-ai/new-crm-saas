-- ============================================================================
-- 🚀 GLOBAL LEAD ROTATION - RPC v40 (MULTI-TEAM SUPPORT)
-- ============================================================================
-- Supports comma-separated team codes (e.g., 'TEAMFIRE,TEAMSIMRAN')

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
    out_user_id UUID,        -- Validating legacy return for webhook compatibility
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
BEGIN
    -- normalize input: remove spaces, split by comma
    v_team_array := string_to_array(REPLACE(p_team_code, ' ', ''), ',');

    RETURN QUERY
    WITH today_counts AS (
        SELECT 
            u.id,
            u.name,
            u.email,
            u.plan_name,
            u.daily_limit,
            u.total_leads_received AS total_received,
            u.total_leads_promised AS total_promised,
            COALESCE(
                (SELECT COUNT(*) 
                 FROM leads l 
                 WHERE l.assigned_to = u.id 
                 AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
                ),
                0
            ) AS leads_today_calc
        FROM users u
        WHERE u.team_code = ANY(v_team_array) -- ✅ MULTI-TEAM MATCH
          AND u.is_active = true
          AND u.is_online = true
          AND u.role IN ('member', 'manager')
    ),
    eligible_users AS (
        SELECT *
        FROM today_counts
        WHERE 
            -- 1. Must be below daily limit
            (leads_today_calc < daily_limit OR daily_limit = 0 OR daily_limit IS NULL)
            -- 2. Must be below total plan limit (unless limit is 0/null)
            AND (total_received < total_promised OR total_promised = 0 OR total_promised IS NULL)
    )
    SELECT 
        eu.id AS user_id,
        eu.name AS user_name,
        eu.email AS user_email,
        eu.plan_name,
        eu.daily_limit,
        eu.leads_today_calc AS leads_today,
        eu.total_received AS total_leads_received,
        eu.total_promised AS total_leads_promised,
        -- DUPLICATE COLUMNS for Webhook Compatibility (out_ prefix)
        eu.id AS out_user_id,
        eu.name AS out_user_name,
        eu.email AS out_user_email,
        eu.plan_name AS out_plan_name,
        eu.daily_limit AS out_daily_limit,
        eu.leads_today_calc AS out_leads_today,
        eu.total_received AS out_total_received,
        eu.total_promised AS out_total_promised
    FROM eligible_users eu
    ORDER BY 
        -- PRIORITIZATION STRATEGY:
        -- 1. Users with LEAST leads today (Feature: Round Robin)
        eu.leads_today_calc ASC,
        -- 2. Users with LEAST total leads (Feature: Fairness over time)
        eu.total_received ASC,
        -- 3. Randomize for users with exact same stats
        RANDOM()
    LIMIT 1;
END;
$$;
