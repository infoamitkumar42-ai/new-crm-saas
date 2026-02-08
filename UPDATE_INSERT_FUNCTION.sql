-- ============================================================================
-- 🔧 UPDATE INSERT FUNCTION - Populate user_id for Future Leads
-- ============================================================================
-- Run this AFTER backfill is complete

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

    -- 2. Check TOTAL quota
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

    -- 5. Insert lead with BOTH user_id AND assigned_to ✅
    INSERT INTO leads (
        name, phone, city, source, status, 
        user_id, assigned_to,
        created_at, assigned_at
    )
    VALUES (
        p_lead_name, p_phone, p_city, p_source, p_status,
        p_user_id, p_user_id,  -- ✅ Both columns set to same value
        NOW(), NOW()
    )
    RETURNING id INTO v_new_lead_id;

    -- 6. Update counters
    UPDATE users
    SET 
        leads_today = v_today_count + 1,
        total_leads_received = COALESCE(total_leads_received, 0) + 1,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN QUERY SELECT true, v_new_lead_id, 'Lead assigned successfully'::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_lead_atomically(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_lead_atomically(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, INT) TO service_role;
