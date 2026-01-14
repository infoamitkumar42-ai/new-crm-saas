-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 6 Punjab Leads to Zero-Lead Punjab Users
-- ============================================================================

DO $$
DECLARE
    v_users UUID[];
    v_user_emails TEXT[];
    v_lead_id UUID;
    v_current_user UUID;
    v_counter INT := 0;
    v_record RECORD;
BEGIN
    -- 1. Get User IDs for Punjab users at 0 (in priority order)
    -- Managers first, then Supervisors, then Weekly/Turbo
    SELECT ARRAY_AGG(id ORDER BY 
        CASE 
            WHEN plan_name = 'manager' THEN 1
            WHEN plan_name = 'supervisor' THEN 2
            WHEN plan_name LIKE '%boost' THEN 3
            ELSE 4
        END,
        name
    )
    INTO v_users
    FROM users
    WHERE is_active = true 
      AND leads_today = 0
      AND target_state = 'Punjab'
      AND plan_name != 'none'
      AND daily_limit > 0;

    IF v_users IS NULL OR array_length(v_users, 1) = 0 THEN
        RAISE EXCEPTION 'No eligible Punjab users found at 0 leads';
    END IF;

    RAISE NOTICE 'Found % eligible Punjab users', array_length(v_users, 1);

    -- 2. Loop through leads and distribute in round-robin
    FOR v_record IN 
        SELECT * FROM (VALUES
            ('Pappi singh', '+1919914070127', 'Mohali'),
            ('Tera Wala Deep', '+917888463983', 'Jandiala Guru'),
            ('Kulpreet Jassowal', '+919888905276', 'Ludhiana'),
            ('ਗੁਰਪ੍ਰੀਤ -/-"', '+916280177541', 'Bathinda'),
            ('Kuldeep Sidhu Kaunke Sidhu', '+919877483336', 'Jagraon'),
            ('Narinder Singh', '+917837502591', 'Nabha')
        ) AS t(name, phone, city)
    LOOP
        -- Pick user (Round Robin using Modulo)
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

    RAISE NOTICE '✅ Successfully distributed % leads to Punjab users at 0', v_counter;
END $$;
