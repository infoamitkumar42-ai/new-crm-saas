-- ============================================================================
-- 🎯 STATE-BASED LEAD ROUTING - COMPLETE IMPLEMENTATION
-- ============================================================================
-- 18 Users want leads ONLY from: J&K, Assam, Jharkhand, Chhattisgarh, 
-- Uttarakhand, Maharashtra
-- Other TEAMFIRE users should NOT receive leads from these states
-- ============================================================================

-- Step 1: Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_states TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS accept_all_states BOOLEAN DEFAULT true;

-- Step 2: Update the 18 specific users
UPDATE users SET 
    preferred_states = ARRAY['Jammu and Kashmir', 'Jammu & Kashmir', 'J&K', 'Kashmir', 'Jammu',
                             'Assam', 
                             'Jharkhand', 
                             'Chhattisgarh', 'Chattisgarh',
                             'Uttarakhand', 
                             'Maharashtra'],
    accept_all_states = false
WHERE email IN (
    'ludhranimohit91@gmail.com',
    'dineshmonga22@gmail.com',
    'dhawantanu536@gmail.com',
    'harmandeepkaurmanes790@gmail.com',
    'payalpuri3299@gmail.com',
    'vansh.rajni.96@gmail.com',
    'rupanasameer551@gmail.com',
    'loveleenkaur8285@gmail.com',
    'rohitgagneja69@gmail.com',
    'rasganiya98775@gmail.com',
    'jerryvibes.444@gmail.com',
    'brark5763@gmail.com',
    'sharmahimanshu9797@gmail.com',
    'rrai26597@gmail.com',
    'samandeepkaur1216@gmail.com',
    'dbrar8826@gmail.com',
    'nehagoyal36526@gmail.com',
    'rahulkumarrk1111@gmail.com'
);

-- Step 3: Update RPC function with state-based routing
DROP FUNCTION IF EXISTS public.get_best_assignee_for_team(TEXT);
DROP FUNCTION IF EXISTS public.get_best_assignee_for_team(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_best_assignee_for_team(
    p_team_code TEXT,
    p_state TEXT DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    plan_name TEXT,
    daily_limit INT,
    leads_today BIGINT,
    total_received INT,
    total_promised INT
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
            u.total_leads_received,
            u.total_leads_promised,
            u.preferred_states,
            u.accept_all_states,
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
            tc.leads_today < tc.daily_limit
            AND (
                tc.total_leads_promised IS NULL 
                OR tc.total_leads_promised = 0 
                OR COALESCE(tc.total_leads_received, 0) < tc.total_leads_promised
            )
    ),
    -- Priority 1: State-specific users (if state matches their preference)
    state_specific_users AS (
        SELECT eu.*, 1 AS priority
        FROM eligible_users eu
        WHERE p_state IS NOT NULL 
          AND eu.accept_all_states = false
          AND eu.preferred_states IS NOT NULL
          AND (
              -- Check if any preferred state matches the lead's state
              EXISTS (
                  SELECT 1 FROM unnest(eu.preferred_states) ps 
                  WHERE LOWER(p_state) LIKE '%' || LOWER(ps) || '%'
                     OR LOWER(ps) LIKE '%' || LOWER(p_state) || '%'
              )
          )
    ),
    -- Priority 2: General pool users (accept_all_states = true AND state NOT in anyone's preferred list)
    general_pool_users AS (
        SELECT eu.*, 2 AS priority
        FROM eligible_users eu
        WHERE eu.accept_all_states = true
          -- Exclude if this state belongs to state-specific users
          AND (
              p_state IS NULL
              OR NOT EXISTS (
                  SELECT 1 FROM eligible_users other
                  WHERE other.accept_all_states = false
                    AND other.preferred_states IS NOT NULL
                    AND EXISTS (
                        SELECT 1 FROM unnest(other.preferred_states) ps 
                        WHERE LOWER(p_state) LIKE '%' || LOWER(ps) || '%'
                           OR LOWER(ps) LIKE '%' || LOWER(p_state) || '%'
                    )
              )
          )
    ),
    -- Combine both pools
    all_candidates AS (
        SELECT * FROM state_specific_users
        UNION ALL
        SELECT * FROM general_pool_users
    )
    SELECT 
        ac.id AS user_id,
        ac.name AS user_name,
        ac.email AS user_email,
        ac.plan_name,
        ac.daily_limit,
        ac.leads_today,
        COALESCE(ac.total_leads_received, 0)::INT AS total_received,
        COALESCE(ac.total_leads_promised, 0)::INT AS total_promised
    FROM all_candidates ac
    ORDER BY
        -- Priority first (state-specific users get priority 1)
        ac.priority ASC,
        -- Then batch priority
        (CASE WHEN ac.leads_today % 2 = 1 THEN 0 ELSE 1 END) ASC,
        -- Then tier
        (CASE 
            WHEN LOWER(ac.plan_name) LIKE '%turbo%' THEN 4
            WHEN LOWER(ac.plan_name) LIKE '%manager%' THEN 3
            WHEN LOWER(ac.plan_name) LIKE '%supervisor%' THEN 2
            ELSE 1
        END) DESC,
        -- Then round robin
        ac.leads_today ASC
    LIMIT 1;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT, TEXT) TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check which users got the state preference
SELECT name, email, preferred_states, accept_all_states 
FROM users 
WHERE accept_all_states = false;

-- Test: Get assignee for Maharashtra lead
-- SELECT * FROM get_best_assignee_for_team('TEAMFIRE', 'Maharashtra');

-- Test: Get assignee for Punjab lead (should go to general pool)
-- SELECT * FROM get_best_assignee_for_team('TEAMFIRE', 'Punjab');
