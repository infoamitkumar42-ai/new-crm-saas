-- ============================================================================
-- 🎯 FORM-BASED LEAD ROUTING - SIMPLE & CLEAN
-- ============================================================================
-- Form ID: 1282140203730435 (Special 6 States Campaign)
-- 18 Users will ONLY receive leads from this form
-- Other users will NOT receive leads from this form
-- ============================================================================

-- Step 1: Add form preference columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_form_ids TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS accept_all_forms BOOLEAN DEFAULT true;

-- Step 2: Configure 18 users for the special form
UPDATE users SET 
    preferred_form_ids = ARRAY['1282140203730435'],
    accept_all_forms = false
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

-- Step 3: Update RPC function with form-based routing
DROP FUNCTION IF EXISTS public.get_best_assignee_for_team(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_best_assignee_for_team(
    p_team_code TEXT,
    p_form_id TEXT DEFAULT NULL
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
            u.preferred_form_ids,
            u.accept_all_forms,
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
    -- Priority 1: Form-specific users (if form matches their preference)
    form_specific_users AS (
        SELECT eu.*, 1 AS priority
        FROM eligible_users eu
        WHERE p_form_id IS NOT NULL 
          AND eu.accept_all_forms = false
          AND eu.preferred_form_ids IS NOT NULL
          AND p_form_id = ANY(eu.preferred_form_ids)
    ),
    -- Priority 2: General pool users (accept_all_forms = true AND form NOT in anyone's preferred list)
    general_pool_users AS (
        SELECT eu.*, 2 AS priority
        FROM eligible_users eu
        WHERE eu.accept_all_forms = true
          AND (
              p_form_id IS NULL
              OR NOT EXISTS (
                  SELECT 1 FROM eligible_users other
                  WHERE other.accept_all_forms = false
                    AND other.preferred_form_ids IS NOT NULL
                    AND p_form_id = ANY(other.preferred_form_ids)
              )
          )
    ),
    -- Combine both pools
    all_candidates AS (
        SELECT * FROM form_specific_users
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
        ac.priority ASC,
        (CASE WHEN ac.leads_today % 2 = 1 THEN 0 ELSE 1 END) ASC,
        (CASE 
            WHEN LOWER(ac.plan_name) LIKE '%turbo%' THEN 4
            WHEN LOWER(ac.plan_name) LIKE '%manager%' THEN 3
            WHEN LOWER(ac.plan_name) LIKE '%supervisor%' THEN 2
            ELSE 1
        END) DESC,
        ac.leads_today ASC
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT, TEXT) TO service_role;

-- Verification
SELECT name, email, preferred_form_ids, accept_all_forms 
FROM users 
WHERE accept_all_forms = false;

-- Test: Should return one of the 18 users
-- SELECT * FROM get_best_assignee_for_team('TEAMFIRE', '1282140203730435');

-- Test: Should return general pool user (not the 18)
-- SELECT * FROM get_best_assignee_for_team('TEAMFIRE', '4242604432649081');
