
-- ============================================================================
-- 🔒 ATOMIC LEAD ASSIGNMENT FUNCTION
-- This ensures that we verify the limit INSIDE the database transaction.
-- Even if 100 requests come at once, the database will handle them strictly sequentially for updates.
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_lead_atomically(
    p_lead_name TEXT,
    p_phone TEXT,
    p_city TEXT,
    p_source TEXT,
    p_status TEXT,
    p_user_id UUID,
    p_planned_limit INT
) 
RETURNS TABLE (success BOOLEAN, fail_reason TEXT) 
LANGUAGE plpgsql 
AS $$
DECLARE
    v_current_count INT;
BEGIN
    -- 1. LOCK the user row to prevent race conditions
    -- This makes other transactions WAIT until this one finishes
    PERFORM 1 FROM users WHERE id = p_user_id FOR UPDATE;

    -- 2. RE-CHECK Daily Quota inside the lock
    -- Logic: Count leads assigned to this user TODAY
    SELECT COUNT(*) INTO v_current_count
    FROM leads
    WHERE assigned_to = p_user_id
    AND created_at >= CURRENT_DATE;

    -- 3. VALIDATE
    IF v_current_count >= p_planned_limit THEN
        -- OOPS! Race condition caught. Someone else filled the quota millisecond ago.
        RETURN QUERY SELECT false, 'Quota Exceeded during Lock';
        RETURN;
    END IF;

    -- 4. INSERT LEAD (If safe)
    INSERT INTO leads (name, phone, city, source, status, user_id, assigned_to, created_at)
    VALUES (p_lead_name, p_phone, p_city, p_source, p_status, p_user_id, p_user_id, NOW());

    -- 5. UPDATE USER COUNTER (Optional, for fast read UI)
    UPDATE users 
    SET leads_today = v_current_count + 1 
    WHERE id = p_user_id;

    RETURN QUERY SELECT true, 'Assigned Successfully';
END;
$$;
