-- ============================================================================
-- 🚀 CHIRAG TEAM FIX - RPC v36 (ROBUST IST LOCK)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_best_assignee_for_team(
    p_team_code TEXT
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    plan_name TEXT,
    daily_limit INT,
    leads_today BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH today_counts AS (
        -- Calculate today's lead count (Locked to IST Date)
        SELECT 
            u.id,
            u.name,
            u.email,
            u.plan_name,
            u.daily_limit,
            COALESCE(
                (SELECT COUNT(*) 
                 FROM leads l 
                 WHERE l.assigned_to = u.id 
                 AND l.created_at::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date),
                0
            ) AS leads_today
        FROM users u
        WHERE u.team_code = p_team_code
          AND u.is_active = true
          AND u.is_online = true
          AND u.role IN ('member', 'manager')
    ),
    eligible_users AS (
        -- Filter users who are below their daily limit
        SELECT *
        FROM today_counts
        WHERE leads_today < daily_limit
    )
    SELECT 
        eu.id AS user_id,
        eu.name AS user_name,
        eu.email AS user_email,
        eu.plan_name,
        eu.daily_limit,
        eu.leads_today
    FROM eligible_users eu
    ORDER BY
        -- 1. ABSOLUTE PRIORITY: Users with 0 leads today go first
        (CASE WHEN eu.leads_today = 0 THEN 0 ELSE 1 END) ASC,
        
        -- 2. BATCH PRIORITY: Users mid-batch (odd count) next
        (CASE WHEN eu.leads_today % 2 = 1 THEN 0 ELSE 1 END) ASC,
        
        -- 3. TIER PRIORITY: Higher plans first
        (CASE 
            WHEN LOWER(eu.plan_name) LIKE '%turbo%' OR LOWER(eu.plan_name) LIKE '%boost%' THEN 4
            WHEN LOWER(eu.plan_name) LIKE '%manager%' THEN 3
            WHEN LOWER(eu.plan_name) LIKE '%supervisor%' THEN 2
            ELSE 1
        END) DESC,
        
        -- 4. ROUND ROBIN: Fewest leads first
        eu.leads_today ASC
    LIMIT 1;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO service_role;
