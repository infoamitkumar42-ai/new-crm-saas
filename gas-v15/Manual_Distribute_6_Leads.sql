-- ============================================================================
-- 🔧 MANUAL LEAD DISTRIBUTION (6 Leads -> Rajwinder & Sunny)
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
    -- 2. INSERT & ASSIGN LEADS (Alternating 3 each)
    -- ========================================================================

    -- Lead 1: Sardar Gurjant Mann -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Sardar Gurjant Mann', '6284501309', 'Ludhiana', 'Assigned', v_rajwinder_id, NOW(), 'Manual')
    RETURNING id INTO v_lead_id;

    -- Lead 2: Palli Rai -> Sunny
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Palli Rai', '9872795169', 'Ludhiana', 'Assigned', v_sunny_id, NOW(), 'Manual')
    RETURNING id INTO v_lead_id;

    -- Lead 3: Sandeep Singh -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Sandeep Singh', '7888815820', 'Khanna', 'Assigned', v_rajwinder_id, NOW(), 'Manual')
    RETURNING id INTO v_lead_id;

    -- Lead 4: ਪਰਵ ਸੈਣੀ (Parv Saini) -> Sunny
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Parv Saini', '9857291436', 'Paonta Sahib', 'Assigned', v_sunny_id, NOW(), 'Manual')
    RETURNING id INTO v_lead_id;

    -- Lead 5: Prabhjot Singh -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Prabhjot Singh', '9988893100', 'Zira', 'Assigned', v_rajwinder_id, NOW(), 'Manual')
    RETURNING id INTO v_lead_id;

    -- Lead 6: Sardar JI -> Sunny
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Sardar JI', '8894114349', 'Rehan', 'Assigned', v_sunny_id, NOW(), 'Manual')
    RETURNING id INTO v_lead_id;

    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Rajwinder (+3 leads)
    UPDATE users 
    SET leads_today = leads_today + 3,
        total_leads_received = total_leads_received + 3,
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
