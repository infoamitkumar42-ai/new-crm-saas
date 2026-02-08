-- ============================================================================
-- 🔥 COMPLETE FIX: user_id Column Population
-- ============================================================================

-- Step 1: Backfill NULL user_id values (639 leads)
UPDATE leads
SET user_id = assigned_to
WHERE user_id IS NULL AND assigned_to IS NOT NULL;

-- Step 2: Verify backfill
SELECT 
    COUNT(*) as total_leads,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as still_null,
    COUNT(CASE WHEN user_id = assigned_to THEN 1 END) as now_synced
FROM leads;

-- Step 3: Update INSERT function to populate user_id
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

    -- 5. Insert lead with BOTH user_id AND assigned_to
    INSERT INTO leads (
        name, phone, city, source, status, 
        user_id, assigned_to,  -- ✅ BOTH columns populated
        created_at, assigned_at
    )
    VALUES (
        p_lead_name, p_phone, p_city, p_source, p_status,
        p_user_id, p_user_id,  -- ✅ Same value for both
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

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.assign_lead_atomically(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_lead_atomically(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, INT) TO service_role;

-- Step 5: Recalculate ALL counters based on user_id (dashboard method)
UPDATE users 
SET total_leads_received = (
    SELECT COUNT(*) FROM leads WHERE leads.user_id = users.id
)
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE');

-- Step 6: Final verification
SELECT 
    'Total Leads' as metric,
    COUNT(*) as value
FROM leads
UNION ALL
SELECT 
    'Leads with user_id',
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END)
FROM leads
UNION ALL
SELECT
    'Leads with NULL user_id',
    COUNT(CASE WHEN user_id IS NULL THEN 1 END)
FROM leads
UNION ALL
SELECT
    'Users synced',
    COUNT(CASE WHEN total_leads_received = (SELECT COUNT(*) FROM leads WHERE user_id = users.id) THEN 1 END)
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE');
