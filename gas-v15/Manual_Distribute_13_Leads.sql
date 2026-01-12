-- ============================================================================
-- 🔧 MANUAL LEAD DISTRIBUTION (13 Leads -> Rajwinder & Sunny)
-- ============================================================================

DO $$
DECLARE
    v_rajwinder_id UUID;
    v_sunny_id UUID;
    v_lead_id UUID;
BEGIN
    -- 1. Get User IDs
    SELECT id INTO v_rajwinder_id FROM users WHERE email = 'workwithrajwinder@gmail.com';
    SELECT id INTO v_sunny_id FROM users WHERE email = 'sunnymehre451@gmail.com';

    IF v_rajwinder_id IS NULL OR v_sunny_id IS NULL THEN
        RAISE EXCEPTION 'One or more users not found via email!';
    END IF;

    -- ========================================================================
    -- 2. INSERT & ASSIGN LEADS (Split: Rajwinder=7, Sunny=6)
    -- ========================================================================

    -- 1. Sardar Gurjant Mann -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Sardar Gurjant Mann', '6284501309', 'Ludhiana', 'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- 2. Palli Rai -> Sunny
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Palli Rai', '9872795169', 'Ludhiana', 'Assigned', v_sunny_id, NOW(), 'Manual');

    -- 3. Sandeep Singh -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Sandeep Singh', '7888815820', 'Khanna', 'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- 4. ਪਰਵ ਸੈਣੀ (Parv Saini) -> Sunny
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('ਪਰਵ ਸੈਣੀ', '9857291436', 'Paonta Sahib', 'Assigned', v_sunny_id, NOW(), 'Manual');

    -- 5. Prabhjot Singh -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Prabhjot Singh', '9988893100', 'Zira', 'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- 6. Sardar JI -> Sunny
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Sardar JI', '8894114349', 'Rehan', 'Assigned', v_sunny_id, NOW(), 'Manual');

    -- 7. Sukhraj -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Sukhraj', '6280610540', 'Batala', 'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- 8. Gurjant singh -> Sunny
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Gurjant singh', '7087273762', 'India', 'Assigned', v_sunny_id, NOW(), 'Manual');

    -- 9. Gurvinder Kaleyan -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Gurvinder Kaleyan', '9888824045', 'Sirhind', 'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- 10. Harwinder Singh -> Sunny
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Harwinder Singh', '6239455024', 'Kurali', 'Assigned', v_sunny_id, NOW(), 'Manual');

    -- 11. Sukh -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Sukh', '9501817015', 'Jagraon', 'Assigned', v_rajwinder_id, NOW(), 'Manual');

    -- 12. Jot kaur -> Sunny
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Jot kaur', '8146896443', 'Fatehgarh sahib', 'Assigned', v_sunny_id, NOW(), 'Manual');

    -- 13. Karan kang -> Rajwinder
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Karan kang', '9872386272', 'Samrala', 'Assigned', v_rajwinder_id, NOW(), 'Manual');


    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Rajwinder (+7 leads)
    UPDATE users 
    SET leads_today = leads_today + 7,
        total_leads_received = total_leads_received + 7,
        last_lead_time = NOW()
    WHERE id = v_rajwinder_id;

    -- Update Sunny (+6 leads)
    UPDATE users 
    SET leads_today = leads_today + 6,
        total_leads_received = total_leads_received + 6,
        last_lead_time = NOW()
    WHERE id = v_sunny_id;

END $$;

-- 4. Verify Assignments
SELECT id, name, phone, city, assigned_at, user_id, status 
FROM leads 
WHERE source = 'Manual' 
AND assigned_at > NOW() - INTERVAL '1 minute';
