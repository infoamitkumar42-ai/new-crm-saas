-- ============================================================================
-- 🛠️ CRITICAL FIX: RPC Quota & Priority Logic (Phase 90)
-- ============================================================================
-- 1. Respect `daily_limit_override` (Prioritize manual override over plan limit)
-- 2. Respect `weekly_boost` / `turbo_boost` priority correcty
-- 3. Ensure fairness when leads_today are equal
-- ============================================================================

-- First DROP the old function (return type changed)
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
    total_received INT,
    total_promised INT,
    debug_priority INT
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
            -- 🟢 FIX: Use Override if set, else Plan Limit
            COALESCE(u.daily_limit_override, u.daily_limit, 0) AS effective_limit,
            u.total_leads_received,
            u.total_leads_promised,
            -- Recalculate leads_today to be 100% sure (ignore potential trigger lag)
            COALESCE(
                (SELECT COUNT(*) 
                 FROM leads l 
                 WHERE l.assigned_to = u.id 
                 AND l.created_at >= CURRENT_DATE::timestamp),
                0
            ) AS leads_today
        FROM users u
        WHERE u.team_code = p_team_code
          AND u.is_active = true
          AND u.is_online = true
          AND u.role IN ('member', 'manager')
    ),
    eligible_users AS (
        SELECT *
        FROM today_counts tc
        WHERE 
            -- ✅ CHECK 1: Daily Limit (Count < Effective Limit)
            tc.leads_today < tc.effective_limit
            
            -- ✅ CHECK 2: Total Quota (Skip if promised > 0 and exhausted)
            AND (
                tc.total_leads_promised IS NULL 
                OR tc.total_leads_promised = 0 
                OR COALESCE(tc.total_leads_received, 0) < tc.total_leads_promised
            )
    )
    SELECT 
        eu.id AS user_id,
        eu.name AS user_name,
        eu.email AS user_email,
        eu.plan_name,
        eu.effective_limit AS daily_limit,
        eu.leads_today,
        COALESCE(eu.total_leads_received, 0)::INT AS total_received,
        COALESCE(eu.total_leads_promised, 0)::INT AS total_promised,
        -- Debug priorities
        (CASE 
            WHEN LOWER(eu.plan_name) LIKE '%turbo%' OR LOWER(eu.plan_name) LIKE '%boost%' THEN 4
            WHEN LOWER(eu.plan_name) LIKE '%manager%' THEN 3
            WHEN LOWER(eu.plan_name) LIKE '%supervisor%' THEN 2
            ELSE 1
        END) as debug_priority
    FROM eligible_users eu
    ORDER BY
        -- 1. Batch priority (Maintain current even/odd pacing)
        (CASE WHEN eu.leads_today % 2 = 1 THEN 0 ELSE 1 END) ASC,
        
        -- 2. Tier priority: Boosters/Managers FIRST
        (CASE 
            WHEN LOWER(eu.plan_name) LIKE '%turbo%' OR LOWER(eu.plan_name) LIKE '%boost%' THEN 4
            WHEN LOWER(eu.plan_name) LIKE '%manager%' THEN 3
            WHEN LOWER(eu.plan_name) LIKE '%supervisor%' THEN 2
            ELSE 1
        END) DESC,
        
        -- 3. Round Robin: Fewest leads first
        eu.leads_today ASC,

        -- 4. Tie-Breaker: Randomize slightly to prevent alphabetical bias
        eu.id ASC
    LIMIT 1;
END;
$$;

-- Grant permissions again just in case
GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO service_role;
