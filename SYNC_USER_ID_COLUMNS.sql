-- ============================================================================
-- 🛠️ SYNC LEAD ID COLUMNS AND FIX ATOMIC FUNCTION
-- ============================================================================

BEGIN;

-- 1. Redefine assign_lead_atomically to populate BOTH user_id and assigned_to
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
    -- 1. LOCK the user row
    PERFORM 1 FROM users WHERE id = p_user_id FOR UPDATE;

    -- 2. Check current count (using assigned_to for consistency)
    SELECT COUNT(*) INTO v_today_count
    FROM leads
    WHERE assigned_to = p_user_id
      AND created_at >= CURRENT_DATE::timestamp;

    -- 3. Check limit
    IF v_today_count >= p_planned_limit THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Limit reached during assignment'::TEXT;
        RETURN;
    END IF;

    -- 4. Insert the lead (POPULATING BOTH COLUMNS NOW)
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

    -- 5. Update user's leads_today counter
    UPDATE users
    SET leads_today = v_today_count + 1,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN QUERY SELECT true, v_new_lead_id, 'Lead assigned successfully'::TEXT;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Error: ' || SQLERRM;
END;
$$;

-- 2. SYNC EXISTING LEADS FOR TODAY
-- Many leads have assigned_to but NULL user_id
UPDATE leads 
SET user_id = assigned_to
WHERE created_at >= CURRENT_DATE 
  AND user_id IS NULL 
  AND assigned_to IS NOT NULL;

COMMIT;

-- 3. Verify Sync
SELECT 
    l.name, 
    l.status, 
    l.user_id, 
    l.assigned_to, 
    u.name as assigned_to_user
FROM leads l
LEFT JOIN users u ON l.user_id = u.id
WHERE l.created_at >= CURRENT_DATE
ORDER BY l.created_at DESC
LIMIT 5;
