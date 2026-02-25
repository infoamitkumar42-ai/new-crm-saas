-- ============================================================================
-- 🚀 FIX ATOMIC ASSIGNMENT BUG (Phase 84)
-- Correcting: FOR UPDATE is not allowed with aggregate functions
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
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_today_count INT;
    v_new_lead_id UUID;
BEGIN
    -- 1. Lock the USER record to serialize assignments for this user
    -- This replaces the failing lock on the aggregate COUNT(*)
    PERFORM 1 FROM users WHERE id = p_user_id FOR UPDATE;

    -- 2. Calculate today's lead count for this user
    SELECT COUNT(*) INTO v_today_count
    FROM leads
    WHERE assigned_to = p_user_id
      AND created_at >= CURRENT_DATE::timestamp;

    -- 3. Check if still under limit
    IF v_today_count >= p_planned_limit THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Limit reached during assignment'::TEXT;
        RETURN;
    END IF;

    -- 4. Check for duplicate phone TODAY (Optional safety)
    IF EXISTS (
        SELECT 1 FROM leads 
        WHERE phone = p_phone 
        AND created_at >= CURRENT_DATE::timestamp
        AND status != 'Duplicate'
    ) THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Duplicate phone found today'::TEXT;
        RETURN;
    END IF;

    -- 5. Insert the lead (Synchronize user_id and assigned_to)
    INSERT INTO leads (
        name, phone, city, source, status, 
        assigned_to, user_id, 
        created_at, assigned_at
    )
    VALUES (
        p_lead_name, p_phone, p_city, p_source, p_status, 
        p_user_id, p_user_id, 
        NOW(), NOW()
    )
    RETURNING id INTO v_new_lead_id;

    RETURN QUERY SELECT true, v_new_lead_id, 'Assignment successful'::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, SQLERRM::TEXT;
END;
$$;
