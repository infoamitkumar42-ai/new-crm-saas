-- ============================================================================
-- 🔧 MANUAL LEAD DISTRIBUTION (10 Leads -> Rajwinder & Sandeep)
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
    -- 2. INSERT & ASSIGN LEADS (Split: 5 each)
    -- ========================================================================

    -- RAJWINDER'S BATCH (5 Leads)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source) VALUES
    ('Gurkirat Thind',    '9465254594', 'Patiala',       'Assigned', v_rajwinder_id, NOW(), 'Manual'),
    ('Rajveer Gill Raaz', '8054912196', 'Kathunangal',   'Assigned', v_rajwinder_id, NOW(), 'Manual'),
    ('Kulwant Lambay',    '9814618736', 'Morinda',       'Assigned', v_rajwinder_id, NOW(), 'Manual'),
    ('Hardilpreet Singh', '9501438401', 'Mohali',        'Assigned', v_rajwinder_id, NOW(), 'Manual'),
    ('Karan Poud',        '9877824085', 'Ludhiana',      'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- SANDEEP'S BATCH (5 Leads)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source) VALUES
    ('Gurtej singh',      '7626965864', 'Punjab',        'Assigned', v_sandeep_id, NOW(), 'Manual'),
    ('ਜੱਸਾ',              '9501938739', 'Balachaur',     'Assigned', v_sandeep_id, NOW(), 'Manual'),
    ('kamaljit sharma',   '7973751301', 'bhawanigarh',   'Assigned', v_sandeep_id, NOW(), 'Manual'),
    ('preeti',            '7526980506', 'Khnouri',       'Assigned', v_sandeep_id, NOW(), 'Manual'),
    ('deep_thind_pb13',   '9878948466', 'Sunam',         'Assigned', v_sandeep_id, NOW(), 'Manual');


    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Rajwinder (+5 leads)
    UPDATE users 
    SET leads_today = leads_today + 5,
        total_leads_received = total_leads_received + 5,
        last_lead_time = NOW()
    WHERE id = v_rajwinder_id;

    -- Update Sandeep (+5 leads)
    UPDATE users 
    SET leads_today = leads_today + 5,
        total_leads_received = total_leads_received + 5,
        last_lead_time = NOW()
    WHERE id = v_sandeep_id;

END $$;

-- 4. Verify Assignments
SELECT id, name, phone, city, assigned_at, user_id, status 
FROM leads 
WHERE source = 'Manual' 
AND assigned_at > NOW() - INTERVAL '1 minute';
