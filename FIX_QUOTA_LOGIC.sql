-- ============================================================================
-- 🔄 UPDATE RPC: Add Total Quota + Replacement Credits Check
-- ============================================================================
-- Problem: Current RPC only checks daily_limit, ignoring total quota exhaustion
-- Fix: Add check for total_leads_received < total_leads_promised
-- ============================================================================

-- Drop old function
DROP FUNCTION IF EXISTS public.get_best_assignee_for_team(TEXT);

-- Create updated function with FULL quota logic
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
            -- ✅ CHECK 1: Daily Limit (today_count < daily_limit)
            tc.leads_today < tc.daily_limit
            
            -- ✅ CHECK 2: Total Quota (total_received < total_promised)
            -- total_promised includes base plan + replacement credits
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
        eu.daily_limit,
        eu.leads_today,
        COALESCE(eu.total_leads_received, 0)::INT AS total_received,
        COALESCE(eu.total_leads_promised, 0)::INT AS total_promised
    FROM eligible_users eu
    ORDER BY
        -- 1. Batch priority (odd count = mid-batch, priority)
        (CASE WHEN eu.leads_today % 2 = 1 THEN 0 ELSE 1 END) ASC,
        
        -- 2. Tier priority: Higher plans first
        (CASE 
            WHEN LOWER(eu.plan_name) LIKE '%turbo%' OR LOWER(eu.plan_name) LIKE '%boost%' THEN 4
            WHEN LOWER(eu.plan_name) LIKE '%manager%' THEN 3
            WHEN LOWER(eu.plan_name) LIKE '%supervisor%' THEN 2
            ELSE 1
        END) DESC,
        
        -- 3. Round Robin: Fewest leads first
        eu.leads_today ASC
    LIMIT 1;
END;
$$;

-- ============================================================================
-- 🔄 UPDATE ATOMIC ASSIGN: Increment total_leads_received
-- ============================================================================

CREATE OR REPLACE FUNCTION public.assign_lead_atomically(
    p_lead_name TEXT,
    p_phone TEXT,
    p_city TEXT,
    p_source TEXT,
    p_status TEXT,
    p_user_id UUID,
    p_planned_limit INT DEFAULT 100
)
RETURNS TABLE (
    success BOOLEAN,
    lead_id UUID,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_today_count INT;
    v_total_received INT;
    v_total_promised INT;
    v_new_lead_id UUID;
BEGIN
    -- 1. Get user's current totals
    SELECT 
        COALESCE(total_leads_received, 0),
        COALESCE(total_leads_promised, 0)
    INTO v_total_received, v_total_promised
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    -- 2. Check TOTAL quota (skip if exhausted)
    IF v_total_promised > 0 AND v_total_received >= v_total_promised THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Total quota exhausted'::TEXT;
        RETURN;
    END IF;

    -- 3. Lock and check DAILY count
    SELECT COUNT(*) INTO v_today_count
    FROM leads
    WHERE assigned_to = p_user_id
      AND created_at >= CURRENT_DATE::timestamp
    FOR UPDATE;

    -- 4. Check DAILY limit
    IF v_today_count >= p_planned_limit THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Daily limit reached'::TEXT;
        RETURN;
    END IF;

    -- 5. Insert the lead
    INSERT INTO leads (name, phone, city, source, status, assigned_to, created_at, assigned_at)
    VALUES (p_lead_name, p_phone, p_city, p_source, p_status, p_user_id, NOW(), NOW())
    RETURNING id INTO v_new_lead_id;

    -- 6. Update user counters (BOTH daily and total)
    UPDATE users
    SET 
        leads_today = v_today_count + 1,
        total_leads_received = COALESCE(total_leads_received, 0) + 1,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN QUERY SELECT true, v_new_lead_id, 'Lead assigned successfully'::TEXT;
END;
$$;

-- ============================================================================
-- ✅ GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_best_assignee_for_team(TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION public.assign_lead_atomically(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_lead_atomically(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, INT) TO service_role;

-- ============================================================================
-- 🧪 TEST QUERY
-- ============================================================================
-- SELECT * FROM get_best_assignee_for_team('TEAMFIRE');
