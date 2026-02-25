-- ============================================================================
-- 🚀 GLOBAL LEAD ROTATION - RPC v41 (FAIRNESS & CONCURRENCY FIX)
-- ============================================================================
-- Features: 
-- 1. Atomic Locking (FOR UPDATE SKIP LOCKED) to prevent parallel "double hits".
-- 2. Precision Timing (last_assigned_at) to ensure true Round-Robin.
-- 3. Multi-Team Support.

BEGIN;

-- 0. DROP EXISTING FUNCTIONS TO ALLOW TYPE CHANGES
DROP FUNCTION IF EXISTS public.get_best_assignee_for_team(TEXT);
DROP FUNCTION IF EXISTS public.assign_lead_atomically(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, INT);

-- 1. UPDATE ASSIGNMENT FUNCTION TO TRACK TIMING
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
    -- Consistency: Get today's count in IST
    SELECT COUNT(*) INTO v_today_count
    FROM leads
    WHERE assigned_to = p_user_id
      AND to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD');

    -- Check limit
    IF v_today_count >= p_planned_limit AND p_planned_limit > 0 THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Limit reached during assignment'::TEXT;
        RETURN;
    END IF;

    -- Insert Lead
    INSERT INTO leads (name, phone, city, source, status, assigned_to, created_at, assigned_at)
    VALUES (p_lead_name, p_phone, p_city, p_source, p_status, p_user_id, NOW(), NOW())
    RETURNING id INTO v_new_lead_id;

    -- CRITICAL: Update timing trackers
    UPDATE users
    SET 
        leads_today = v_today_count + 1,
        total_leads_received = total_leads_received + 1,
        last_assigned_at = NOW(), -- For Fairness Tie-breaking
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN QUERY SELECT true, v_new_lead_id, 'Lead assigned successfully'::TEXT;
END;
$$;

-- 2. UPDATE SELECTION FUNCTION WITH LOCKING
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
    out_user_id UUID,
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
    v_selected_id UUID;
BEGIN
    -- normalize input
    v_team_array := string_to_array(REPLACE(p_team_code, ' ', ''), ',');

    -- PHASE 1: ATOMIC SELECTION WITH LOCKING
    -- This block ensures that if multiple leads hit at once, they pick different users.
    SELECT u.id INTO v_selected_id
    FROM users u
    WHERE u.team_code = ANY(v_team_array)
      AND u.is_active = true
      AND u.is_online = true
      AND u.role IN ('member', 'manager')
      AND (
          u.total_leads_received < u.total_leads_promised 
          OR u.total_leads_promised = 0 
          OR u.total_leads_promised IS NULL
      )
      AND (
          -- Secondary check for daily limit
          (SELECT COUNT(*) FROM leads l 
           WHERE l.assigned_to = u.id 
           AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
          ) < u.daily_limit 
          OR u.daily_limit = 0 
          OR u.daily_limit IS NULL
      )
    ORDER BY 
        -- 1. Fewest leads today (Primary Round Robin)
        (SELECT COUNT(*) FROM leads l 
         WHERE l.assigned_to = u.id 
         AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
        ) ASC,
        -- 2. Longest wait time (FAIRNESS Tie-breaker)
        u.last_assigned_at ASC NULLS FIRST,
        -- 3. Jitter
        RANDOM()
    LIMIT 1
    FOR UPDATE SKIP LOCKED; -- 🛡️ Prevent race conditions

    -- PHASE 2: RETURN DATA
    IF v_selected_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            eu.id AS user_id,
            eu.name AS user_name,
            eu.email AS user_email,
            eu.plan_name,
            eu.daily_limit,
            (SELECT COUNT(*) FROM leads l WHERE l.assigned_to = eu.id AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')) AS leads_today,
            eu.total_leads_received,
            eu.total_leads_promised,
            -- Webhook Compatibility
            eu.id AS out_user_id,
            eu.name AS out_user_name,
            eu.email AS out_user_email,
            eu.plan_name AS out_plan_name,
            eu.daily_limit AS out_daily_limit,
            (SELECT COUNT(*) FROM leads l WHERE l.assigned_to = eu.id AND to_char(l.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')) AS out_leads_today,
            eu.total_leads_received AS out_total_received,
            eu.total_leads_promised AS out_total_promised
        FROM users eu
        WHERE eu.id = v_selected_id;
    END IF;
END;
$$;

COMMIT;
