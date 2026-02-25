-- ============================================================================
-- 🚀 FIX LEAD VISIBILITY v2 (Disables Triggers) - PHASE 68
-- ============================================================================

BEGIN;

-- 1. Disable Blocking Triggers Temporarily
-- This allows us to sync metadata for users who are already at their limit.
ALTER TABLE leads DISABLE TRIGGER trg_check_limit_insert;
ALTER TABLE leads DISABLE TRIGGER trg_check_limit_update;

-- 2. Update Atomic Assignment Function
-- This ensures future leads populate BOTH user_id and assigned_to for visibility.
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

-- 3. DATA SYNC: Populate missing user_id for today's leads
-- This makes all "missing" leads appear immediately on user dashboards.
UPDATE leads
SET user_id = assigned_to,
    updated_at = NOW()
WHERE assigned_to IS NOT NULL
  AND user_id IS NULL
  AND created_at >= CURRENT_DATE::timestamp;

-- 4. Re-enable Triggers
ALTER TABLE leads ENABLE TRIGGER trg_check_limit_insert;
ALTER TABLE leads ENABLE TRIGGER trg_check_limit_update;

COMMIT;

-- VERIFICATION
SELECT 
    COUNT(*) filter (where user_id is null and created_at >= CURRENT_DATE::timestamp) as still_missing,
    COUNT(*) filter (where user_id is not null and created_at >= CURRENT_DATE::timestamp) as successfully_visible
FROM leads;
