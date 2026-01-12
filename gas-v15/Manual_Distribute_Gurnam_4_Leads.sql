-- ============================================================================
-- 🔧 MANUAL LEAD DISTRIBUTION (4 Leads -> Gurnam)
-- ============================================================================

DO $$
DECLARE
    v_gurnam_id UUID;
BEGIN
    -- 1. Get User ID (Gurnam)
    SELECT id INTO v_gurnam_id FROM users WHERE email = 'gurnambal01@gmail.com';

    IF v_gurnam_id IS NULL THEN
        RAISE EXCEPTION 'User Gurnam (gurnambal01@gmail.com) not found!';
    END IF;

    -- ========================================================================
    -- 2. INSERT & ASSIGN LEADS
    -- ========================================================================

    -- 1. Avtar Singh
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Avtar Singh', '8699908997', 'Jalalabad', 'Assigned', v_gurnam_id, NOW(), 'Manual');

    -- 2. Harminder Singh
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Harminder Singh', '9517178758', 'Ludhiana', 'Assigned', v_gurnam_id, NOW(), 'Manual');

    -- 3. Inderpal
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Inderpal', '9779926040', 'Mohali', 'Assigned', v_gurnam_id, NOW(), 'Manual');

    -- 4. Navi gill
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Navi gill', '8872404444', 'Morinda', 'Assigned', v_gurnam_id, NOW(), 'Manual');


    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Gurnam (+4 leads)
    UPDATE users 
    SET leads_today = leads_today + 4,
        total_leads_received = total_leads_received + 4,
        last_lead_time = NOW()
    WHERE id = v_gurnam_id;

END $$;

-- 4. Verify Assignments
SELECT id, name, phone, city, assigned_at, user_id, status 
FROM leads 
WHERE source = 'Manual' 
AND assigned_at > NOW() - INTERVAL '1 minute';
