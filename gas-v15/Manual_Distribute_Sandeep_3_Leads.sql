-- ============================================================================
-- 🔧 MANUAL LEAD DISTRIBUTION (3 Leads -> Sandeep/Sunny)
-- ============================================================================

DO $$
DECLARE
    v_sandeep_id UUID;
BEGIN
    -- 1. Get User ID (Sandeep = Sunny)
    SELECT id INTO v_sandeep_id FROM users WHERE email = 'sunnymehre451@gmail.com';

    IF v_sandeep_id IS NULL THEN
        RAISE EXCEPTION 'User Sandeep (sunnymehre451@gmail.com) not found!';
    END IF;

    -- ========================================================================
    -- 2. INSERT & ASSIGN LEADS
    -- ========================================================================

    -- 1. gurmeet bhullar
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('gurmeet bhullar', '9915025864', 'Gurmeet', 'Assigned', v_sandeep_id, NOW(), 'Manual');

    -- 2. Aman Chahal
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Aman Chahal', '9056440751', 'Malerkotla', 'Assigned', v_sandeep_id, NOW(), 'Manual');

    -- 3. Jagga
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Jagga', '9115640004', 'Amritsar', 'Assigned', v_sandeep_id, NOW(), 'Manual');


    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Sandeep (+3 leads)
    UPDATE users 
    SET leads_today = leads_today + 3,
        total_leads_received = total_leads_received + 3,
        last_lead_time = NOW()
    WHERE id = v_sandeep_id;

END $$;

-- 4. Verify Assignments
SELECT id, name, phone, city, assigned_at, user_id, status 
FROM leads 
WHERE source = 'Manual' 
AND assigned_at > NOW() - INTERVAL '1 minute';
