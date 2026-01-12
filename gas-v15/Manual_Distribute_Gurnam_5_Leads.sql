-- ============================================================================
-- 🔧 MANUAL LEAD DISTRIBUTION (5 Leads -> Gurnam)
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

    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source) VALUES
    ('Lovepreet Balli',          '9914968269', 'Samrala',       'Assigned', v_gurnam_id, NOW(), 'Manual'),
    ('Happy',                    '7814921188', 'Mohali',        'Assigned', v_gurnam_id, NOW(), 'Manual'),
    ('ABHYASS LEARNING ACADEMY', '9803285477', 'Khanna',        'Assigned', v_gurnam_id, NOW(), 'Manual'),
    ('gurjass',                  '7508105574', 'ਪਟਿਆਲਾ',           'Assigned', v_gurnam_id, NOW(), 'Manual'),
    ('Tajinderpal Singh',        '9914995955', 'Talwandi Sabo', 'Assigned', v_gurnam_id, NOW(), 'Manual');


    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Gurnam (+5 leads)
    UPDATE users 
    SET leads_today = leads_today + 5,
        total_leads_received = total_leads_received + 5,
        last_lead_time = NOW()
    WHERE id = v_gurnam_id;

END $$;

-- 4. Verify Assignments
SELECT id, name, phone, city, assigned_at, user_id, status 
FROM leads 
WHERE source = 'Manual' 
AND assigned_at > NOW() - INTERVAL '1 minute';
