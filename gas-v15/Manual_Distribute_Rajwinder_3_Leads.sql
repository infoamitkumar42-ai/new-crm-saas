-- ============================================================================
-- 🔧 MANUAL LEAD DISTRIBUTION (3 Leads -> Rajwinder)
-- ============================================================================

DO $$
DECLARE
    v_rajwinder_id UUID;
BEGIN
    -- 1. Get User ID (Rajwinder)
    SELECT id INTO v_rajwinder_id FROM users WHERE email = 'workwithrajwinder@gmail.com';

    IF v_rajwinder_id IS NULL THEN
        RAISE EXCEPTION 'User Rajwinder (workwithrajwinder@gmail.com) not found!';
    END IF;

    -- ========================================================================
    -- 2. INSERT & ASSIGN LEADS
    -- ========================================================================

    -- 1. Bittu Dhanaula
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Bittu Dhanaula', '7009862104', 'Dhanaula', 'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- 2. it's Vicky (Removed Symbol)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('its Vicky', '8544933635', 'Bathinda', 'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- 3. Monu Bansal
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Monu Bansal', '7508902007', 'Faridkot', 'Assigned', v_rajwinder_id, NOW(), 'Manual');


    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Rajwinder (+3 leads)
    UPDATE users 
    SET leads_today = leads_today + 3,
        total_leads_received = total_leads_received + 3,
        last_lead_time = NOW()
    WHERE id = v_rajwinder_id;

END $$;

-- 4. Verify Assignments
SELECT id, name, phone, city, assigned_at, user_id, status 
FROM leads 
WHERE source = 'Manual' 
AND assigned_at > NOW() - INTERVAL '1 minute';
