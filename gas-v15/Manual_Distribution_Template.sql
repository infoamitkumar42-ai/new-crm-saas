-- ============================================================================
-- 📋 REUSABLE LEAD DISTRIBUTION TEMPLATE
-- ============================================================================
-- HOW TO USE:
-- 1. Replace 'TARGET_EMAIL_HERE' with the real email (e.g., 'sunnymehre451@gmail.com').
-- 2. Paste your leads in the VALUES section below.
-- 3. Run the script.
-- ============================================================================

DO $$
DECLARE
    v_user_email TEXT := 'TARGET_EMAIL_HERE'; -- 👈 CHANGE THIS EMAIL
    v_user_id UUID;
    v_lead_count INT;
BEGIN
    -- 1. Get User ID
    SELECT id INTO v_user_id FROM users WHERE email = v_user_email;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found!', v_user_email;
    END IF;

    -- ========================================================================
    -- 2. PASTE LEADS BELOW 👇
    -- Format: ('Name', 'Phone', 'City'),
    -- ========================================================================
    
    CREATE TEMP TABLE new_leads (name TEXT, phone TEXT, city TEXT);
    
    INSERT INTO new_leads (name, phone, city) VALUES
    ('Ajay Kumar',           '7973800386',   'Dinanagar'),
    ('Gursharn Singh Lohat', '8289005199',   'Dirba sangrur'); -- 👈 Add comma if adding more lines
    
    -- ========================================================================
    -- 3. PROCESSING (DO NOT TOUCH BELOW THIS LINE) 🛑
    -- ========================================================================

    -- Insert into real table
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    SELECT name, phone, city, 'Assigned', v_user_id, NOW(), 'Manual'
    FROM new_leads;

    -- Count how many were added
    SELECT COUNT(*) INTO v_lead_count FROM new_leads;

    -- Update User Counters
    UPDATE users 
    SET leads_today = leads_today + v_lead_count,
        total_leads_received = total_leads_received + v_lead_count,
        last_lead_time = NOW()
    WHERE id = v_user_id;

    RAISE NOTICE 'Success! Assigned % leads to %', v_lead_count, v_user_email;

    -- Cleanup
    DROP TABLE new_leads;

END $$;

-- 4. Verify Last Minute Assignments
SELECT id, name, phone, city, assigned_at, user_id, status 
FROM leads 
WHERE source = 'Manual' 
AND assigned_at > NOW() - INTERVAL '1 minute';
