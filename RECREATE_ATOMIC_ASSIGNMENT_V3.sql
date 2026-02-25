-- ============================================================================
-- 🚀 DROP & RECREATE ATOMIC ASSIGNMENT (Phase 84)
-- Correcting: FOR UPDATE is not allowed with aggregate functions
-- ============================================================================

-- 1. Drop existing function to clear overloads
DROP FUNCTION IF EXISTS public.assign_lead_atomically(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, INT);

-- 2. Create version with proper user-record locking
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
    -- 1. Lock the USER record to serialize assignments for this specific user
    -- This avoids the "FOR UPDATE is not allowed with aggregate functions" error
    PERFORM 1 FROM users WHERE id = p_user_id FOR UPDATE;

    -- 2. Calculate today's lead count for this user (NO FOR UPDATE HERE)
    SELECT COUNT(*) INTO v_today_count
    FROM leads
    WHERE (assigned_to = p_user_id OR user_id = p_user_id)
      AND created_at >= CURRENT_DATE::timestamp;

    -- 3. Check if still under limit
    IF v_today_count >= p_planned_limit THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Limit reached (' || v_today_count || '/' || p_planned_limit || ')'::TEXT;
        RETURN;
    END IF;

    -- 4. Duplicate Check (Today only, non-deleted)
    IF EXISTS (
        SELECT 1 FROM leads 
        WHERE phone = p_phone 
        AND created_at >= CURRENT_DATE::timestamp
        AND status != 'Duplicate'
    ) THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Duplicate phone found today'::TEXT;
        RETURN;
    END IF;

    -- 5. Atomic Insert (Set BOTH fields for visibility)
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

    -- 6. Update user's leads_today counter for Admin Dashboard
    UPDATE users
    SET leads_today = v_today_count + 1,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN QUERY SELECT true, v_new_lead_id, 'Assignment successful'::TEXT;

EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, SQLERRM::TEXT;
END;
$$;
