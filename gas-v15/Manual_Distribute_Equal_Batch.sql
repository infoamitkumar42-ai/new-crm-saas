-- ============================================================================
-- 🔧 MANUAL EQUAL DISTRIBUTION (5 Leads Each -> Rajwinder, Sandeep, Gurnam)
-- ============================================================================

DO $$
DECLARE
    v_rajwinder_id UUID;
    v_sandeep_id UUID;
    v_gurnam_id UUID;
    v_limit INT := 5; -- Leads per user
BEGIN
    -- 1. Get User IDs
    SELECT id INTO v_rajwinder_id FROM users WHERE email = 'workwithrajwinder@gmail.com';
    SELECT id INTO v_sandeep_id FROM users WHERE email = 'sunnymehre451@gmail.com';
    SELECT id INTO v_gurnam_id FROM users WHERE email = 'gurnambal01@gmail.com';

    IF v_rajwinder_id IS NULL OR v_sandeep_id IS NULL OR v_gurnam_id IS NULL THEN
        RAISE EXCEPTION 'One or more users not found!';
    END IF;

    -- ========================================================================
    -- 2. ASSIGN LEADS (From 'New' Pool)
    -- ========================================================================

    -- A. Assign 5 to Rajwinder
    UPDATE leads
    SET user_id = v_rajwinder_id,
        status = 'Assigned',
        assigned_at = NOW()
    WHERE id IN (
        SELECT id FROM leads 
        WHERE status = 'New' 
        ORDER BY created_at ASC 
        LIMIT v_limit
    );

    -- B. Assign 5 to Sandeep
    UPDATE leads
    SET user_id = v_sandeep_id,
        status = 'Assigned',
        assigned_at = NOW()
    WHERE id IN (
        SELECT id FROM leads 
        WHERE status = 'New' 
        ORDER BY created_at ASC 
        LIMIT v_limit
    );

    -- C. Assign 5 to Gurnam
    UPDATE leads
    SET user_id = v_gurnam_id,
        status = 'Assigned',
        assigned_at = NOW()
    WHERE id IN (
        SELECT id FROM leads 
        WHERE status = 'New' 
        ORDER BY created_at ASC 
        LIMIT v_limit
    );

    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Rajwinder
    UPDATE users 
    SET leads_today = leads_today + v_limit,
        total_leads_received = total_leads_received + v_limit,
        last_lead_time = NOW()
    WHERE id = v_rajwinder_id;

    -- Update Sandeep
    UPDATE users 
    SET leads_today = leads_today + v_limit,
        total_leads_received = total_leads_received + v_limit,
        last_lead_time = NOW()
    WHERE id = v_sandeep_id;

    -- Update Gurnam
    UPDATE users 
    SET leads_today = leads_today + v_limit,
        total_leads_received = total_leads_received + v_limit,
        last_lead_time = NOW()
    WHERE id = v_gurnam_id;

END $$;

-- 4. Verify Assignments
SELECT l.id, l.name, l.phone, l.city, l.assigned_at, u.name as assigned_to
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.assigned_at > NOW() - INTERVAL '1 minute';
