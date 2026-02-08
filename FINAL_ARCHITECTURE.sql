
-- ============================================================================
-- 🚀 SINGLE SOURCE OF TRUTH: GENERIC LEAD DISTRIBUTION ENGINE
-- ============================================================================

-- Function to Distribute a Lead to a Specific Team (Generic)
CREATE OR REPLACE FUNCTION distribute_leads_by_team_logic(
    p_lead_id UUID,
    p_team_code TEXT,  -- 'GJ01TEAMFIRE', 'PUNJAB_TEAM_1', etc.
    p_batch_size INT DEFAULT 2
) 
RETURNS TABLE (
    success BOOLEAN, 
    assigned_user_id UUID, 
    assigned_user_name TEXT, 
    message TEXT
) 
LANGUAGE plpgsql 
AS $$
DECLARE
    v_target_user RECORD;
    v_lead_record RECORD;
    v_team_id UUID;
BEGIN
    -- 1. VALIDATE TEAM CODE
    -- Assuming team_code is text on users. We verify such active users exist.
    IF NOT EXISTS (SELECT 1 FROM users WHERE team_code = p_team_code AND is_active = true) THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'Invalid or Empty Team Code: ' || p_team_code;
        RETURN;
    END IF;

    -- 2. LOCK TARGET LEAD (Prevent double assignment)
    SELECT * INTO v_lead_record FROM leads WHERE id = p_lead_id FOR UPDATE SKIP LOCKED;
    
    IF v_lead_record.id IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'Lead not found or locked';
        RETURN;
    END IF;

    IF v_lead_record.assigned_to IS NOT NULL THEN
        RETURN QUERY SELECT false, v_lead_record.assigned_to, 'Unknown', 'Lead already assigned';
        RETURN;
    END IF;

    -- 3. FIND BEST ELIGIBLE USER IN TEAM (Round Robin Logic)
    -- We select the user with LEAST leads today, who has NOT met their limit.
    -- We LOCK the user row to prevent race conditions.
    SELECT * INTO v_target_user
    FROM users 
    WHERE team_code = p_team_code
    AND is_active = true
    AND leads_today < daily_limit
    ORDER BY 
        leads_today ASC,       -- Fill empty buckets first
        last_lead_time ASC NULLS FIRST -- Tie-breaker: Who waited longest
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_target_user.id IS NULL THEN
        -- Fallback: If everyone is full? We could Log it or Return Failure.
        -- For now, we return failure so it stays in "Backlog" / "Unassigned".
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'Team Quota Full';
        RETURN;
    END IF;

    -- 4. ASSIGN THE LEAD
    UPDATE leads 
    SET 
        assigned_to = v_target_user.id,
        user_id = v_target_user.id,
        status = 'Assigned',
        assigned_at = NOW()
    WHERE id = p_lead_id;

    -- 5. UPDATE USER COUNTER (Atomic Increment)
    UPDATE users 
    SET 
        leads_today = leads_today + 1,
        total_leads_received = total_leads_received + 1,
        last_lead_time = NOW()
    WHERE id = v_target_user.id;

    -- 6. LOG SUCCESS
    -- (Optional: Insert into system_logs table if exists)
    
    RETURN QUERY SELECT true, v_target_user.id, v_target_user.name, 'Assigned successfully';
END;
$$;
