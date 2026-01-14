-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 3 More Leads (Chandigarh + Punjab)
-- ============================================================================

DO $$
DECLARE
    v_users UUID[];
    v_lead_id UUID;
    v_current_user UUID;
    v_counter INT := 0;
    v_record RECORD;
BEGIN
    -- 1. Get User IDs for users at 0 (Chandigarh + Punjab)
    -- Priority: Managers > Supervisors > Weekly/Turbo
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
      AND (target_state IN ('Punjab', 'Chandigarh') OR target_state = 'All India')
      AND plan_name != 'none'
      AND daily_limit > 0;

    IF v_users IS NULL OR array_length(v_users, 1) = 0 THEN
        RAISE EXCEPTION 'No eligible users found at 0 leads';
    END IF;

    RAISE NOTICE 'Found % eligible users', array_length(v_users, 1);

    -- 2. Loop through leads and distribute in round-robin
    FOR v_record IN 
        SELECT * FROM (VALUES
            ('gurleen_kaur', '+919464428968', 'Chandigarh'),
            ('Zora Adampuria', '+918284987969', 'Adampur Doaba'),
            ('Sandeep nimmal', '+916284829946', 'Bathinda')
        ) AS t(name, phone, city)
    LOOP
        -- Pick user (Round Robin)
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
