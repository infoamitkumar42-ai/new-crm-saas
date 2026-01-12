-- ============================================================================
-- 🔧 MANUAL LEAD DISTRIBUTION (4 Leads -> Akash)
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

    -- 1. Pooja Shivam joshi
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Pooja Shivam joshi', '8854843053', 'vpo kotkasim tehkotkasim distalwar rajshthan', 'Assigned', v_akash_id, NOW(), 'Manual');

    -- 2. Rani
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Rani', '8290544811', 'gangangar', 'Assigned', v_akash_id, NOW(), 'Manual');

    -- 3. Arya jha
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Arya jha', '6352886048', 'surat', 'Assigned', v_akash_id, NOW(), 'Manual');

    -- 4. Ayush Kumar
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Ayush Kumar', '9939064424', 'sallehpur', 'Assigned', v_akash_id, NOW(), 'Manual');


    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Akash (+4 leads)
    UPDATE users 
    SET leads_today = leads_today + 4,
        total_leads_received = total_leads_received + 4,
        last_lead_time = NOW()
    WHERE id = v_akash_id;

END $$;

-- 4. Verify Assignments
SELECT id, name, phone, city, assigned_at, user_id, status 
FROM leads 
WHERE source = 'Manual' 
AND assigned_at > NOW() - INTERVAL '1 minute';
