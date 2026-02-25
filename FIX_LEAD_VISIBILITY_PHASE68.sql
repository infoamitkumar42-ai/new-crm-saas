-- ============================================================================
-- 🚀 FIX LEAD VISIBILITY - PHASE 68
-- ============================================================================

BEGIN;

-- 1. Update Atomic Assignment Function to populate BOTH user_id and assigned_to
-- This ensures the dashboard realtime listener (which watches user_id) catches new leads.
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
    -- 1. Lock and check current count (prevents race conditions)
    SELECT COUNT(*) INTO v_today_count
    FROM leads
    WHERE assigned_to = p_user_id
      AND created_at >= CURRENT_DATE::timestamp
    FOR UPDATE;

    -- 2. Check if still under limit
    IF v_today_count >= p_planned_limit THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Limit reached during assignment'::TEXT;
        RETURN;
    END IF;

    -- 3. Insert the lead (Crucial: Populate user_id AND assigned_to)
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

    -- 4. Update user's leads_today counter
    UPDATE users
    SET leads_today = v_today_count + 1,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN QUERY SELECT true, v_new_lead_id, 'Lead assigned successfully'::TEXT;
END;
$$;

-- 2. DATA CLEANUP: Sync today's leads where user_id is missing
-- This makes all "missing" leads appear immediately if the user refreshes or opens dashboard.
UPDATE leads
SET user_id = assigned_to,
    updated_at = NOW()
WHERE assigned_to IS NOT NULL
  AND user_id IS NULL
  AND created_at >= CURRENT_DATE::timestamp;

COMMIT;

-- VERIFICATION
SELECT COUNT(*) as leads_fixed_today
FROM leads
WHERE user_id = assigned_to 
  AND created_at >= CURRENT_DATE::timestamp;
