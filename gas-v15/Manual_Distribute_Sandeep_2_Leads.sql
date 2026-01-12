-- ============================================================================
-- 🔧 MANUAL LEAD DISTRIBUTION (2 Leads -> Sandeep/Sunny)
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

    -- 1. Ajay Kumar
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Ajay Kumar', '7973800386', 'Dinanagar', 'Assigned', v_sandeep_id, NOW(), 'Manual');

    -- 2. Gursharn Singh Lohat
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Gursharn Singh Lohat', '8289005199', 'Dirba sangrur punjab', 'Assigned', v_sandeep_id, NOW(), 'Manual');


    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

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
