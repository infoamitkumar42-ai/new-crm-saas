-- ============================================================================
-- 🔧 MANUAL LEAD DISTRIBUTION (5 Leads -> Akash)
-- Re-assigning from Rimpy (chouhansab64) to Akash (dbrar8826)
-- ============================================================================

DO $$
DECLARE
    v_akash_id UUID;
BEGIN
    -- 1. Get User ID (Akash)
    SELECT id INTO v_akash_id FROM users WHERE email = 'dbrar8826@gmail.com';

    IF v_akash_id IS NULL THEN
        RAISE EXCEPTION 'User Akash (dbrar8826@gmail.com) not found!';
    END IF;

    -- ========================================================================
    -- 2. INSERT & ASSIGN LEADS
    -- ========================================================================

    -- 1. Kaushal Pal
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Kaushal Pal', '9310654573', 'neelam', 'Assigned', v_akash_id, NOW(), 'Manual');

    -- 2. Yuvraj Singh Batth
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Yuvraj Singh Batth', '9988289952', 'amritsar', 'Assigned', v_akash_id, NOW(), 'Manual');

    -- 3. Riya Dubey
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Riya Dubey', '7042291992', 'gurugram', 'Assigned', v_akash_id, NOW(), 'Manual');

    -- 4. Rashi papaji
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Rashi papaji', '7982706202', 'haryana', 'Assigned', v_akash_id, NOW(), 'Manual');

    -- 5. madan Geeta 123
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('madan Geeta 123', '9258811849', 'almora', 'Assigned', v_akash_id, NOW(), 'Manual');


    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Akash (+5 leads)
    UPDATE users 
    SET leads_today = leads_today + 5,
        total_leads_received = total_leads_received + 5,
        last_lead_time = NOW()
    WHERE id = v_akash_id;

END $$;

-- 4. Verify Assignments
SELECT id, name, phone, city, assigned_at, user_id, status 
FROM leads 
WHERE source = 'Manual' 
AND assigned_at > NOW() - INTERVAL '1 minute';
