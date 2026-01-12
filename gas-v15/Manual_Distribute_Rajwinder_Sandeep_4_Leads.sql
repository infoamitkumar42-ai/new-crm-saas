-- ============================================================================
-- 🔧 MANUAL LEAD DISTRIBUTION (4 Leads -> Rajwinder & Sandeep)
-- ============================================================================

DO $$
DECLARE
    v_rajwinder_id UUID;
    v_sandeep_id UUID;
BEGIN
    -- 1. Get User IDs
    SELECT id INTO v_rajwinder_id FROM users WHERE email = 'workwithrajwinder@gmail.com';
    SELECT id INTO v_sandeep_id FROM users WHERE email = 'sunnymehre451@gmail.com';

    IF v_rajwinder_id IS NULL OR v_sandeep_id IS NULL THEN
        RAISE EXCEPTION 'One or more users not found via email!';
    END IF;

    -- ========================================================================
    -- 2. INSERT & ASSIGN LEADS (Split: 2 each)
    -- ========================================================================

    -- 1. Raaj singh -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Raaj singh', '7696798594', 'Sultanpur Lodhi', 'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- 2. Yatan Kumar -> Sandeep
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Yatan Kumar', '8360525987', 'Khanna', 'Assigned', v_sandeep_id, NOW(), 'Manual');

    -- 3. Bhupinder -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Bhupinder', '9915818275', 'Anandpur Sahib', 'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- 4. Music (Cleaned Name) -> Sandeep
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Music', '6284355736', 'Doraha', 'Assigned', v_sandeep_id, NOW(), 'Manual');


    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Rajwinder (+2 leads)
    UPDATE users 
    SET leads_today = leads_today + 2,
        total_leads_received = total_leads_received + 2,
        last_lead_time = NOW()
    WHERE id = v_rajwinder_id;

    -- Update Sandeep (+2 leads)
    UPDATE users 
    SET leads_today = leads_today + 2,
        total_leads_received = total_leads_received + 2,
        last_lead_time = NOW()
    WHERE id = v_sandeep_id;

END $$;

-- 4. Verify Assignments
SELECT id, name, phone, city, assigned_at, user_id, status 
FROM leads 
WHERE source = 'Manual' 
AND assigned_at > NOW() - INTERVAL '1 minute';
