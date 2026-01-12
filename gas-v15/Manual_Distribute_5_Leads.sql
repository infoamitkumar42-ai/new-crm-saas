-- ============================================================================
-- 🔧 MANUAL LEAD DISTRIBUTION (5 Leads -> Rajwinder & Sunny)
-- ============================================================================

DO $$
DECLARE
    v_rajwinder_id UUID;
    v_sunny_id UUID;
BEGIN
    -- 1. Get User IDs
    SELECT id INTO v_rajwinder_id FROM users WHERE email = 'workwithrajwinder@gmail.com';
    SELECT id INTO v_sunny_id FROM users WHERE email = 'sunnymehre451@gmail.com';

    IF v_rajwinder_id IS NULL OR v_sunny_id IS NULL THEN
        RAISE EXCEPTION 'One or more users not found via email!';
    END IF;

    -- ========================================================================
    -- 2. INSERT & ASSIGN LEADS (Split: Rajwinder=3, Sunny=2)
    -- ========================================================================

    -- 1. Deep Karan -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Deep Karan', '9056152595', 'Punjab', 'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- 2. Babaljeet singh -> Sunny
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Babaljeet singh', '6284921125', 'Bhagta Bhai ka', 'Assigned', v_sunny_id, NOW(), 'Manual');

    -- 3. Mandeep Singh Swaich -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Mandeep Singh Swaich', '9888874949', 'Khanna', 'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- 4. Ranveer Singh -> Sunny
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Ranveer Singh', '6284496719', 'Bathinda', 'Assigned', v_sunny_id, NOW(), 'Manual');

    -- 5. tajinder -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('tajinder', '9501931343', 'Khanna', 'Assigned', v_rajwinder_id, NOW(), 'Manual');


    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Rajwinder (+3 leads)
    UPDATE users 
    SET leads_today = leads_today + 3,
        total_leads_received = total_leads_received + 3,
        last_lead_time = NOW()
    WHERE id = v_rajwinder_id;

    -- Update Sunny (+2 leads)
    UPDATE users 
    SET leads_today = leads_today + 2,
        total_leads_received = total_leads_received + 2,
        last_lead_time = NOW()
    WHERE id = v_sunny_id;

END $$;

-- 4. Verify Assignments
SELECT id, name, phone, city, assigned_at, user_id, status 
FROM leads 
WHERE source = 'Manual' 
AND assigned_at > NOW() - INTERVAL '1 minute';
