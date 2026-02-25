-- ============================================================================
-- 🚀 CHIRAG TEAM FIX - RPC v38 (ULTRA-RESILIENT)
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
        -- Calculate today's lead count (Most robust way: String date comparison)
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
                 -- Robust IST Date Match: Convert created_at to IST string and compare with TODAY IST string
                 AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
                ),
                0
            ) AS leads_today_calc
        FROM users u
        WHERE TRIM(u.team_code) = TRIM(p_team_code)
          AND u.is_active = true
          -- Online check removed for debug or if needed (User is online anyway)
          AND u.is_online = true
    ),
    eligible_users AS (
        SELECT *
        FROM today_counts
        WHERE (leads_today_calc < daily_limit OR daily_limit = 0 OR daily_limit IS NULL)
    )
    SELECT 
        eu.id AS user_id,
        eu.name AS user_name,
        eu.email AS user_email,
        eu.plan_name,
        eu.daily_limit,
        eu.leads_today_calc,
        eu.total_received,
        eu.total_promised
    FROM eligible_users eu
    ORDER BY
        -- 1. ABSOLUTE PRIORITY: Users with 0 leads today go first
        (CASE WHEN eu.leads_today_calc = 0 THEN 0 ELSE 1 END) ASC,
        
        -- 2. BATCH PRIORITY: Users mid-batch (odd count) next
        (CASE WHEN eu.leads_today_calc % 2 = 1 THEN 0 ELSE 1 END) ASC,
        
        -- 3. ROUND ROBIN: Fewest leads first
        eu.leads_today_calc ASC
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO service_role;
