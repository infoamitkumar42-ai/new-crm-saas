-- ============================================================================
-- 🚀 CHIRAG TEAM FIX - RPC v37 (CLEAN START + IST LOCK)
-- ============================================================================

-- 1. DROP ALL POTENTIAL DUPLICATES
DROP FUNCTION IF EXISTS public.get_best_assignee_for_team(TEXT);
DROP FUNCTION IF EXISTS public.get_best_assignee_for_team(TEXT, TEXT);

-- 2. CREATE FRESH v37
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
        -- Calculate today's lead count (IST Date)
        SELECT 
            u.id,
            u.name,
            u.email,
            u.plan_name,
            u.daily_limit,
            u.total_leads_received as total_received,
            u.total_leads_promised as total_promised,
            COALESCE(
                (SELECT COUNT(*) 
                 FROM leads l 
                 WHERE l.assigned_to = u.id 
                 AND l.created_at::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date),
                0
            ) AS leads_today_calc
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
        WHERE leads_today_calc < daily_limit
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
        
        -- 3. TIER PRIORITY: Higher plans first
        (CASE 
            WHEN LOWER(eu.plan_name) LIKE '%turbo%' OR LOWER(eu.plan_name) LIKE '%boost%' THEN 4
            WHEN LOWER(eu.plan_name) LIKE '%manager%' THEN 3
            WHEN LOWER(eu.plan_name) LIKE '%supervisor%' THEN 2
            ELSE 1
        END) DESC,
        
        -- 4. ROUND ROBIN: Fewest leads first
        eu.leads_today_calc ASC
    LIMIT 1;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO service_role;
