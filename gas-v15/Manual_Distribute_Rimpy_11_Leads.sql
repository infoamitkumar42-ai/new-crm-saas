-- ============================================================================
-- 🔧 MANUAL LEAD DISTRIBUTION (11 Leads -> Rimpy)
-- ============================================================================

DO $$
DECLARE
    v_rimpy_id UUID;
    v_lead_count INT;
BEGIN
    -- 1. Get User ID (Rimpy) - Using corrected email
    SELECT id INTO v_rimpy_id FROM users WHERE email = 'chouhansab64@gmail.com';

    IF v_rimpy_id IS NULL THEN
        RAISE EXCEPTION 'User Rimpy (chouhansab64@gmail.com) not found!';
    END IF;

    -- ========================================================================
    -- 2. CREATE TEMP TABLE & INSERT VALUES
    -- ========================================================================
    
    CREATE TEMP TABLE new_leads (name TEXT, phone TEXT, city TEXT);
    
    INSERT INTO new_leads (name, phone, city) VALUES
    ('Sam athwal',         '9877845526', 'chanchal'),
    ('komal Singh',        '8559080482', 'chander'),
    ('Indla Sharma',       '9006640033', 'delhi'),
    ('Mahak Prajapati',    '8707234754', 'kan6'),
    ('Varsha Kohli',       '7982550955', 'delhi'),
    ('Anjali Bisht',       '7078311737', 'hridwr'),
    ('anvi',               '8188449968', 'new delhi'),
    ('Akshara',            '8505948556', 'delhi'),
    ('Aarti Sikarwar',     '8868952190', 'udaipur'),
    ('Priyankaaa',         '9899331729', 'delhi'),
    ('Hansraj',            '9351876294', 'kumquat49');

    -- ========================================================================
    -- 3. INSERT & ASSIGN
    -- ========================================================================
    
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    SELECT name, phone, city, 'Assigned', v_rimpy_id, NOW(), 'Manual'
    FROM new_leads;

    -- Count inserted
    SELECT COUNT(*) INTO v_lead_count FROM new_leads;

    -- ========================================================================
    -- 4. UPDATE USER COUNTERS
    -- ========================================================================

    UPDATE users 
    SET leads_today = leads_today + v_lead_count,
        total_leads_received = total_leads_received + v_lead_count,
        last_lead_time = NOW()
    WHERE id = v_rimpy_id;
    
    -- Cleanup
    DROP TABLE new_leads;

END $$;

-- 5. Verify Assignments
SELECT id, name, phone, city, assigned_at, user_id, status 
FROM leads 
WHERE source = 'Manual' 
AND assigned_at > NOW() - INTERVAL '1 minute';
