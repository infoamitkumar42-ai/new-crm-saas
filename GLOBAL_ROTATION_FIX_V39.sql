-- ============================================================================
-- 🚀 GLOBAL LEAD ROTATION - RPC v39 (FINAL SYSTEM-WIDE FIX)
-- ============================================================================

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
    total_leads_promised INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
        WHERE (TRIM(u.team_code) = TRIM(p_team_code) OR u.team_code = p_team_code)
          AND u.is_active = true
          AND u.is_online = true
          AND u.role IN ('member', 'manager')
    ),
    eligible_users AS (
        SELECT *
        FROM today_counts tc
        WHERE 
            -- 1. Must be below daily limit
            (tc.leads_today_calc < tc.daily_limit OR tc.daily_limit = 0 OR tc.daily_limit IS NULL)
            -- 2. Must be below total plan limit (unless limit is 0/null)
            AND (tc.total_received < tc.total_promised OR tc.total_promised = 0 OR tc.total_promised IS NULL)
    )
    SELECT 
        eu.id,
        eu.name,
        eu.email,
        eu.plan_name,
        eu.daily_limit,
        eu.leads_today_calc,
        eu.total_received,
        eu.total_promised
    FROM eligible_users eu
    ORDER BY
        -- 1. ABSOLUTE PRIORITY: Users who haven't received ANY lead today (IST)
        (CASE WHEN eu.leads_today_calc = 0 THEN 0 ELSE 1 END) ASC,
        
        -- 2. BATCH PRIORITY: Users mid-batch (odd count: 1, 3, 5...) get priority to finish their 2nd lead
        (CASE WHEN eu.leads_today_calc % 2 = 1 THEN 0 ELSE 1 END) ASC,
        
        -- 3. PLAN TIER: Turbo/Boost users get priority within their batch tier
        (CASE 
            WHEN LOWER(eu.plan_name) LIKE '%turbo%' OR LOWER(eu.plan_name) LIKE '%boost%' THEN 4
            WHEN LOWER(eu.plan_name) LIKE '%manager%' THEN 3
            WHEN LOWER(eu.plan_name) LIKE '%supervisor%' THEN 2
            WHEN LOWER(eu.plan_name) LIKE '%starter%' THEN 1
            ELSE 0
        END) DESC,
        
        -- 4. ROUND ROBIN: Fewest leads today first
        eu.leads_today_calc ASC,
        
        -- 5. FAIRNESS tie-breaker: Users with fewest total leads first
        eu.total_received ASC,
        eu.id ASC
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO service_role;
