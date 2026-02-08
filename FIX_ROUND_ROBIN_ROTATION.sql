-- ============================================================================
-- ⚖️ IMPLEMENT STRICT ROUND-ROBIN ROTATION
-- ============================================================================

BEGIN;

-- 1. Drop the existing function first (Required because return type structure is changing)
DROP FUNCTION IF EXISTS public.get_best_assignee_for_team(TEXT);

-- 2. Redefine get_best_assignee_for_team for FAIR rotation
CREATE OR REPLACE FUNCTION public.get_best_assignee_for_team(p_team_code TEXT)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    email TEXT,
    plan_name TEXT,
    daily_limit INT,
    leads_today INT,
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
            u.total_leads_received, 
            u.total_leads_promised,
            COALESCE((SELECT COUNT(*) FROM leads l WHERE l.assigned_to = u.id AND l.created_at >= CURRENT_DATE::timestamp), 0) AS leads_today_calculated,
            u.last_assigned_at -- Using this for fair rotation
        FROM users u
        WHERE u.team_code = p_team_code 
          AND u.is_active = true 
          AND u.is_online = true 
          AND u.role IN ('member', 'manager')
    ),
    eligible_users AS (
        SELECT * FROM today_counts tc
        WHERE tc.leads_today_calculated < tc.daily_limit
        AND (tc.total_leads_promised IS NULL OR tc.total_leads_promised = 0 OR COALESCE(tc.total_leads_received, 0) < tc.total_leads_promised)
    )
    SELECT 
        eu.id, eu.name, eu.email, eu.plan_name, eu.daily_limit, eu.leads_today_calculated::INT,
        COALESCE(eu.total_leads_received, 0)::INT, COALESCE(eu.total_leads_promised, 0)::INT
    FROM eligible_users eu
    -- NEW ORDERING: STRICT ROUND ROBIN
    -- 1. Users with fewer leads today go first
    -- 2. Among them, users who haven't received a lead for the longest time go first
    ORDER BY 
        eu.leads_today_calculated ASC, 
        eu.last_assigned_at ASC NULLS FIRST
    LIMIT 1;
END;
$$;

-- 2. Ensure atomic assignment updates last_assigned_at
-- This is critical for the rotation to work!
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
    v_new_lead_id UUID;
BEGIN
    PERFORM 1 FROM users WHERE id = p_user_id FOR UPDATE;

    SELECT COUNT(*) INTO v_today_count
    FROM leads
    WHERE assigned_to = p_user_id
      AND created_at >= CURRENT_DATE::timestamp;

    IF v_today_count >= p_planned_limit THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Limit reached during assignment'::TEXT;
        RETURN;
    END IF;

    INSERT INTO leads (
        name, phone, city, source, status, 
        user_id, assigned_to, 
        created_at, assigned_at
    )
    VALUES (
        p_lead_name, p_phone, p_city, p_source, p_status, 
        p_user_id, p_user_id, 
        NOW(), NOW()
    )
    RETURNING id INTO v_new_lead_id;

    UPDATE users
    SET leads_today = v_today_count + 1,
        total_leads_received = COALESCE(total_leads_received, 0) + 1,
        last_assigned_at = NOW(), -- UPDATED: crucial for rotation
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN QUERY SELECT true, v_new_lead_id, 'Lead assigned successfully'::TEXT;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Error: ' || SQLERRM;
END;
$$;

COMMIT;
