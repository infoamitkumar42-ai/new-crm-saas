-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 3 Leads to MINIMUM-Lead Users
-- Finds users with the LOWEST leads_today (not just 0)
-- ============================================================================

DO $$
DECLARE
    v_users UUID[];
    v_lead_id UUID;
    v_current_user UUID;
    v_counter INT := 0;
    v_record RECORD;
BEGIN
    -- 1. Get User IDs for users with MINIMUM leads (Punjab/Haryana/All India)
    SELECT ARRAY_AGG(id ORDER BY leads_today ASC, name)
    INTO v_users
    FROM users
    WHERE is_active = true 
      AND (target_state IN ('Punjab', 'Haryana', 'All India'))
      AND plan_name != 'none'
      AND daily_limit > 0
      AND leads_today < daily_limit
    LIMIT 10;

    IF v_users IS NULL OR array_length(v_users, 1) = 0 THEN
        RAISE EXCEPTION 'No eligible users found under daily limit';
    END IF;

    RAISE NOTICE 'Found % eligible users', array_length(v_users, 1);

    -- 2. Loop through leads and distribute
    FOR v_record IN 
        SELECT * FROM (VALUES
            ('P_A_R_A_SA_R_O_R_A', '+919877373337', 'Muktsar'),
            ('Huundal_anmol', '+917206952342', 'Haryana'),
            ('Pardeep Bains', '8360935734', 'Ludhiana')
        ) AS t(name, phone, city)
    LOOP
        -- Pick user (Round Robin from sorted list - minimum leads first)
        v_current_user := v_users[(v_counter % array_length(v_users, 1)) + 1];

        -- Insert Lead
        INSERT INTO leads (
            name, 
            phone, 
            city, 
            user_id, 
            status, 
            source, 
            assigned_at
        ) VALUES (
            v_record.name,
            v_record.phone,
            v_record.city,
            v_current_user,
            'Assigned',
            'Manual_Import',
            NOW()
        ) RETURNING id INTO v_lead_id;

        -- Update User's Lead Counter
        UPDATE users 
        SET leads_today = leads_today + 1 
        WHERE id = v_current_user;

        v_counter := v_counter + 1;
        
        RAISE NOTICE 'Assigned % (%) to User ID %', v_record.name, v_record.city, v_current_user;
    END LOOP;

    RAISE NOTICE '✅ Successfully distributed % leads', v_counter;
END $$;
