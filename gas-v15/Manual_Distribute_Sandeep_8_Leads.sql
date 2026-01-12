-- ============================================================================
-- 🔧 MANUAL LEAD DISTRIBUTION (8 Leads -> Sandeep/Sunny)
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

    -- 1. Mandeep Singh
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Mandeep Singh', '9056410270', 'BATHINDA', 'Assigned', v_sandeep_id, NOW(), 'Manual');

    -- 2. GS Mawi
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('GS Mawi', '7009002671', 'Fatehgarh Sahib', 'Assigned', v_sandeep_id, NOW(), 'Manual');

    -- 3. Dil Khan
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Dil Khan', '7355586180', 'Sangrur', 'Assigned', v_sandeep_id, NOW(), 'Manual');

    -- 4. (ᴋᴀʀᴀᴍᴊᴇᴇᴛ ꜱɪɴɢʜ ʙᴀʟᴊᴏᴛ)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Karamjeet Singh Baljot', '9855499192', 'Morinda', 'Assigned', v_sandeep_id, NOW(), 'Manual');

    -- 5. i prit (ਤਰਖਾਣ)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('i prit', '8837828592', 'Amritsar', 'Assigned', v_sandeep_id, NOW(), 'Manual');

    -- 6. Gurpreet Kaur
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Gurpreet Kaur', '8557083205', 'Ludhiana', 'Assigned', v_sandeep_id, NOW(), 'Manual');

    -- 7. Deep Gharu
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Deep Gharu', '9878395512', 'Boha', 'Assigned', v_sandeep_id, NOW(), 'Manual');

    -- 8. Ŕàj Véeŕ
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Raj Veer', '7743094932', 'Sangrur', 'Assigned', v_sandeep_id, NOW(), 'Manual');


    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Sandeep (+8 leads)
    UPDATE users 
    SET leads_today = leads_today + 8,
        total_leads_received = total_leads_received + 8,
        last_lead_time = NOW()
    WHERE id = v_sandeep_id;

END $$;

-- 4. Verify Assignments
SELECT id, name, phone, city, assigned_at, user_id, status 
FROM leads 
WHERE source = 'Manual' 
AND assigned_at > NOW() - INTERVAL '1 minute';
