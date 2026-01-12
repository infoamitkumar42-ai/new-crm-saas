-- ============================================================================
-- 🛡️ ATOMIC SLOT CLAIMING (The Real Fix)
-- ============================================================================

CREATE OR REPLACE FUNCTION claim_lead_slot(p_user_id UUID, p_limit INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_leads_today INT;
BEGIN
    -- Lock the user row for update to prevent race conditions
    SELECT leads_today INTO v_leads_today
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    -- Check if limit reached
    IF v_leads_today >= p_limit THEN
        RETURN FALSE;
    END IF;

    -- Increment counter
    UPDATE users
    SET 
        leads_today = leads_today + 1,
        last_lead_time = NOW()
    WHERE id = p_user_id;

    RETURN TRUE;
END;
$$;
