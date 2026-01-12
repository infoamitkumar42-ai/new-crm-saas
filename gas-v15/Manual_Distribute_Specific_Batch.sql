-- ============================================================================
-- 🔧 MANUAL SPECIFIC DISTRIBUTION (23 Leads -> Rajwinder, Sandeep, Gurnam)
-- ============================================================================

DO $$
DECLARE
    v_rajwinder_id UUID;
    v_sandeep_id UUID;
    v_gurnam_id UUID;
BEGIN
    -- 1. Get User IDs
    SELECT id INTO v_rajwinder_id FROM users WHERE email = 'workwithrajwinder@gmail.com';
    SELECT id INTO v_sandeep_id FROM users WHERE email = 'sunnymehre451@gmail.com';
    SELECT id INTO v_gurnam_id FROM users WHERE email = 'gurnambal01@gmail.com';

    IF v_rajwinder_id IS NULL OR v_sandeep_id IS NULL OR v_gurnam_id IS NULL THEN
        RAISE EXCEPTION 'One or more users not found!';
    END IF;

    -- ========================================================================
    -- 2. INSERT & ASSIGN LEADS (Round Robin: Rajwinder -> Sandeep -> Gurnam)
    -- ========================================================================

    -- 1. Sukh chaurwala (Rajwinder)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('ਸੁੱਖ ਚੌਰਵਾਲਾ ਸੁਖਵਿੰਦਰ ਸਿੰਘ', '+918872907030', 'Village Hadaitpura', 'Assigned', v_rajwinder_id, NOW(), 'Manual_Import');

    -- 2. Prince Singh Dadhwal (Sandeep)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Prince Singh Dadhwal', '+919812275591', 'Mohali', 'Assigned', v_sandeep_id, NOW(), 'Manual_Import');

    -- 3. Navdeep Kaur (Gurnam)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Navdeep Kaur', '+919646791401', 'Batala road Amritsar', 'Assigned', v_gurnam_id, NOW(), 'Manual_Import');

    -- 4. Siman khushal (Rajwinder)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Siman khushal', '8360906266', 'Mohali', 'Assigned', v_rajwinder_id, NOW(), 'Manual_Import');

    -- 5. Kumar Rajat (Sandeep)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Kumar Rajat', '+917986506279', 'Anandpur Sahib', 'Assigned', v_sandeep_id, NOW(), 'Manual_Import');

    -- 6. Velly Sonu (Gurnam)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Velly Sonu', '+917707885586', 'Ludhiana', 'Assigned', v_gurnam_id, NOW(), 'Manual_Import');

    -- 7. Shampreet singh (Rajwinder)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Shampreet singh', '+918283866619', 'Ludhiana', 'Assigned', v_rajwinder_id, NOW(), 'Manual_Import');

    -- 8. Lucky Rampuria (Sandeep)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Lucky Rampuria', '+919888870482', 'Rampuraphul', 'Assigned', v_sandeep_id, NOW(), 'Manual_Import');

    -- 9. Maneet (Gurnam)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Maneet', '7419052348', 'Patiala', 'Assigned', v_gurnam_id, NOW(), 'Manual_Import');

    -- 10. Rupinder kaur (Rajwinder)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Rupinder kaur', '+918289017920', 'Punjab', 'Assigned', v_rajwinder_id, NOW(), 'Manual_Import');

    -- 11. ManJinder Singh (Sandeep)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('ManJinder Singh', '+919888647828', 'Jagraon', 'Assigned', v_sandeep_id, NOW(), 'Manual_Import');

    -- 12. im karan 002 (Gurnam)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('im karan 002', '+919855803866', 'Fatehgarh Sahib', 'Assigned', v_gurnam_id, NOW(), 'Manual_Import');

    -- 13. Maninder Singh (Rajwinder)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Maninder Singh', '+917973365016', 'jalandar', 'Assigned', v_rajwinder_id, NOW(), 'Manual_Import');

    -- 14. Simran Garg (Sandeep)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Simran Garg', '+917009698774', 'Bathinda', 'Assigned', v_sandeep_id, NOW(), 'Manual_Import');

    -- 15. Sandeep Sandi (Gurnam)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Sandeep Sandi', '+919855223723', 'Fazilka', 'Assigned', v_gurnam_id, NOW(), 'Manual_Import');

    -- 16. Parampreet Singh (Rajwinder)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Parampreet Singh', '+918872423198', 'moga', 'Assigned', v_rajwinder_id, NOW(), 'Manual_Import');

    -- 17. prabjot Singh (Sandeep)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('prabjot Singh', '+918968908536', 'Rajpura', 'Assigned', v_sandeep_id, NOW(), 'Manual_Import');

    -- 18. Amanpreet Singh (Gurnam)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('𝔸𝕞𝕒𝕟𝕡𝕣𝕖𝕖𝕥 𝕊𝕚𝕟𝕘𝕙', '+917814623150', 'Khamanon', 'Assigned', v_gurnam_id, NOW(), 'Manual_Import');

    -- 19. Amandeep Singh (Rajwinder)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Amandeep Singh', '+919814859315', 'Makhu', 'Assigned', v_rajwinder_id, NOW(), 'Manual_Import');

    -- 20. Jashan Singh virk (Sandeep)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Jashan Singh virk', '+919872824753', 'Patiala', 'Assigned', v_sandeep_id, NOW(), 'Manual_Import');

    -- 21. Jaismeen sahibjot (Gurnam)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Jaismeen sahibjot', '+918628930396', 'Nalagarh', 'Assigned', v_gurnam_id, NOW(), 'Manual_Import');

    -- 22. Jaskaran Singh Toor (Rajwinder)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('ਜਸਕਰਨ ਸਿੰਘ ਤੂਰ', '+919592174992', 'Ludhiana', 'Assigned', v_rajwinder_id, NOW(), 'Manual_Import');

    -- 23. Simran kaur (Sandeep)
    INSERT INTO leads (name, phone, city, status, user_id, assigned_at, source)
    VALUES ('Simran kaur', '+919464090244', 'Khanna', 'Assigned', v_sandeep_id, NOW(), 'Manual_Import');


    -- ========================================================================
    -- 3. UPDATE USER COUNTERS
    -- ========================================================================

    -- Update Rajwinder (8 Leads)
    UPDATE users 
    SET leads_today = leads_today + 8,
        total_leads_received = total_leads_received + 8,
        last_lead_time = NOW()
    WHERE id = v_rajwinder_id;

    -- Update Sandeep (8 Leads)
    UPDATE users 
    SET leads_today = leads_today + 8,
        total_leads_received = total_leads_received + 8,
        last_lead_time = NOW()
    WHERE id = v_sandeep_id;

    -- Update Gurnam (7 Leads)
    UPDATE users 
    SET leads_today = leads_today + 7,
        total_leads_received = total_leads_received + 7,
        last_lead_time = NOW()
    WHERE id = v_gurnam_id;

END $$;

-- 4. Verify Assignments
SELECT l.id, l.name, l.phone, l.city, l.assigned_at, u.name as assigned_to
FROM leads l
JOIN users u ON l.user_id = u.id
WHERE l.source = 'Manual_Import' 
AND l.assigned_at > NOW() - INTERVAL '1 minute';
