-- ============================================================================
-- 🔧 MANUAL SPECIFIC DISTRIBUTION (8 Leads -> Rajwinder & Sandeep)
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
    -- 2. INSERT & ASSIGN LEADS (Split: 4 each)
    -- ========================================================================

    -- 1. Abdul Sattar (Rajwinder)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Abdul Sattar', '+919888933378', 'Mohali', 'Assigned', v_rajwinder_id, NOW(), 'Manual_Import');

    -- 2. Jagtar Singh (Sandeep)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Jagtar Singh', '+917009655477', 'Amloh', 'Assigned', v_sandeep_id, NOW(), 'Manual_Import');

    -- 3. Simranjeet Singh (Rajwinder)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Simranjeet Singh', '+919781613707', 'Rampuraphul', 'Assigned', v_rajwinder_id, NOW(), 'Manual_Import');

    -- 4. Rajan Kumar (Sandeep)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Rajan Kumar', '+91985562675', 'Ludhiana', 'Assigned', v_sandeep_id, NOW(), 'Manual_Import');

    -- 5. Gurwinder kaur (Rajwinder)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Gurwinder kaur', '+917527814801', 'Bathinda', 'Assigned', v_rajwinder_id, NOW(), 'Manual_Import');

    -- 6. Lovepreet Singh (Sandeep)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Lovepreet Singh', '7837080626', 'Kotkupra', 'Assigned', v_sandeep_id, NOW(), 'Manual_Import');

    -- 7. Mani Cheema (Rajwinder)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Mani Cheema', '+919779372417', 'Barnala', 'Assigned', v_rajwinder_id, NOW(), 'Manual_Import');

    -- 8. ਭਾਰਦਵਾਜ (Sandeep)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('ਭਾਰਦਵਾਜ', '+916284410527', 'Sirhind', 'Assigned', v_sandeep_id, NOW(), 'Manual_Import');


    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Rajwinder (+4 leads)
    UPDATE users 
    SET leads_today = leads_today + 4,
        total_leads_received = total_leads_received + 4,
        last_lead_time = NOW()
    WHERE id = v_rajwinder_id;

    -- Update Sandeep (+4 leads)
    UPDATE users 
    SET leads_today = leads_today + 4,
        total_leads_received = total_leads_received + 4,
        last_lead_time = NOW()
    WHERE id = v_sandeep_id;

END $$;

-- 4. Verify Assignments
SELECT id, name, phone, city, assigned_at, user_id, status 
FROM leads 
WHERE source = 'Manual_Import' 
AND assigned_at > NOW() - INTERVAL '1 minute';
