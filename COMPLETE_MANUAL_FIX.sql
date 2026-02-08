-- ============================================================================
-- ✅ MANUAL FIX SUMMARY - Copy Each Section to Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- SECTION 1: UPDATE COUNTERS (Run This First)
-- ============================================================================

UPDATE users 
SET total_leads_received = (
    SELECT COUNT(*) FROM leads WHERE leads.user_id = users.id
)
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE');

-- Expected: 135 rows updated

-- ============================================================================
-- SECTION 2: VERIFY COUNTERS SYNCED
-- ============================================================================

SELECT 
    name, email,
    total_leads_received as counter,
    (SELECT COUNT(*) FROM leads WHERE user_id = users.id) as actual,
    CASE 
        WHEN total_leads_received = (SELECT COUNT(*) FROM leads WHERE user_id = users.id) 
        THEN '✅ SYNCED' 
        ELSE '❌ OUT OF SYNC' 
    END as status
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE')
  AND is_active = true
ORDER BY actual DESC
LIMIT 10;

-- Expected: All show ✅ SYNCED

-- ============================================================================
-- SECTION 3: UPDATE INSERT FUNCTION (Run After Section 1 & 2)
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
    SELECT 
        COALESCE(total_leads_received, 0),
        COALESCE(total_leads_promised, 0)
    INTO v_total_received, v_total_promised
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_total_promised > 0 AND v_total_received >= v_total_promised THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Total quota exhausted'::TEXT;
        RETURN;
    END IF;

    SELECT COUNT(*) INTO v_today_count
    FROM leads
    WHERE assigned_to = p_user_id
      AND created_at >= CURRENT_DATE::timestamp
    FOR UPDATE;

    IF v_today_count >= p_planned_limit THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Daily limit reached'::TEXT;
        RETURN;
    END IF;

    -- ✅ KEY FIX: Populate BOTH user_id AND assigned_to
    INSERT INTO leads (
        name, phone, city, source, status, 
        user_id, assigned_to,
        created_at, assigned_at
    )
    VALUES (
        p_lead_name, p_phone, p_city, p_source, p_status,
        p_user_id, p_user_id,  -- ✅ Both columns set
        NOW(), NOW()
    )
    RETURNING id INTO v_new_lead_id;

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

-- ============================================================================
-- ✅ FINAL VERIFICATION
-- ============================================================================

SELECT 
    'Counters Fixed' as status,
    COUNT(*) as users,
    SUM(total_leads_received) as total_leads
FROM users
WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE');
