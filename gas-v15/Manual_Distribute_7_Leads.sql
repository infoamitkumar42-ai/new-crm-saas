-- ============================================================================
-- 🔧 MANUAL LEAD DISTRIBUTION (7 Leads -> Rajwinder & Sunny)
-- ============================================================================

DO $$
DECLARE
    v_rajwinder_id UUID;
    v_sunny_id UUID;
    v_lead_id UUID;
BEGIN
    -- 1. Get User IDs
    SELECT id INTO v_rajwinder_id FROM users WHERE email = 'workwithrajwinder@gmail.com';
    SELECT id INTO v_sunny_id FROM users WHERE email = 'sunnymehre451@gmail.com';

    IF v_rajwinder_id IS NULL OR v_sunny_id IS NULL THEN
        RAISE EXCEPTION 'One or more users not found via email!';
    END IF;

    -- ========================================================================
    -- 2. INSERT & ASSIGN LEADS (Split: Rajwinder=4, Sunny=3)
    -- ========================================================================

    -- 1. Nirmal Singh -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Nirmal Singh', '8872466059', 'Khanna', 'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- 2. Mani Kulewal -> Sunny
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Mani Kulewal', '8360362881', 'Samrala', 'Assigned', v_sunny_id, NOW(), 'Manual');

    -- 3. Jassi -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Jassi', '7707924312', 'Ludhiana', 'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- 4. Rampi Khattra -> Sunny
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Rampi Khattra', '7719477369', 'Pune', 'Assigned', v_sunny_id, NOW(), 'Manual');

    -- 5. Jot Rara Sahib -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Jot Rara Sahib', '8283836719', 'Ludhiana', 'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- 6. Sukhwinder Singh -> Sunny
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Sukhwinder Singh', '9876061934', 'Patiala', 'Assigned', v_sunny_id, NOW(), 'Manual');

    -- 7. official rohit 786 -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('official rohit 786', '6230484396', 'Pathankot', 'Assigned', v_rajwinder_id, NOW(), 'Manual');


    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Rajwinder (+4 leads)
    UPDATE users 
    SET leads_today = leads_today + 4,
        total_leads_received = total_leads_received + 4,
        last_lead_time = NOW()
    WHERE id = v_rajwinder_id;

    -- Update Sunny (+3 leads)
    UPDATE users 
    SET leads_today = leads_today + 3,
        total_leads_received = total_leads_received + 3,
        last_lead_time = NOW()
    WHERE id = v_sunny_id;

END $$;

-- 4. Verify Assignments
SELECT id, name, phone, city, assigned_at, user_id, status 
FROM leads 
WHERE source = 'Manual' 
AND assigned_at > NOW() - INTERVAL '1 minute';
