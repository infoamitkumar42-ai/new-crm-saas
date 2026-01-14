-- ============================================================================
-- 📥 MANUAL IMPORT & DISTRIBUTION (17 Leads) - FIXED SYNTAX
-- 👥 Targets: Rajwinder, Sandeep (Round Robin)
-- ============================================================================

DO $$
DECLARE
    v_rajwinder_id UUID;
    v_sandeep_id UUID;
    v_users UUID[];
    v_lead_id UUID;
    v_current_user UUID;
    v_counter INT := 0;
    
    -- Loop Variable
    v_record RECORD;
BEGIN
    -- 1. Get User IDs
    SELECT id INTO v_rajwinder_id FROM users WHERE email = 'workwithrajwinder@gmail.com';
    SELECT id INTO v_sandeep_id FROM users WHERE email = 'sunnymehre451@gmail.com';

    -- Check if users exist
    IF v_rajwinder_id IS NULL OR v_sandeep_id IS NULL THEN
        RAISE EXCEPTION 'One or more users not found via email.';
    END IF;

    -- Array for Round Robin
    v_users := ARRAY[v_rajwinder_id, v_sandeep_id];

    -- 2. Loop through new leads directly
    FOR v_record IN 
        SELECT * FROM (VALUES
            ('Kiran kaur', '9646695853', 'Bathinda'),
            ('Arunpalsingh pal singh', '+917696260462', 'Tarn taran'),
            ('Sukhjot Dhaliwal', '+917973566413', 'Hambran'),
            ('Hardeep Brar', '+917814177940', 'Muktsar'),
            ('Amritpal Singh', '+917087054390', 'sangrur'),
            ('Mani', '+919115944808', 'Kharar'),
            ('⃟ℝ𝕚𝕥', '+917814869162', 'Ludhiana'),
            ('TARAN', '+917696996814', 'Vill Kalewal Beet, Disst Hoshiyarpur, Panjab'),
            ('mahil', '9592389570', '141421'),
            ('Ravi Bhatti Bhatti', '+918194832932', 'Muktsar'),
            ('ਸਤਵਿੰਦਰ ਸਿੰਘ', '+919914482652', 'Samana'),
            ('Ranjeet bhullar', '+917657871195', 'Malout'),
            ('Simran kaur', '8557980251', 'Doraha'),
            ('ਅਕਾਸ਼‌ ਸਿੱਧੂ', '+918699528751', 'Amritsar majitha'),
            ('sagar chouhan', '9877811385', 'Patiala'),
            ('Sanjan preet kaur', '+918360259321', 'Village chadila'),
            ('ਬਲਜੀਤ ਸਿੰਘ ਸਿੱਧੂ', '+917679000002', 'Ludhiana')
        ) AS t(name, phone, city)
    LOOP
        -- Pick user (Round Robin using Modulo)
        v_current_user := v_users[(v_counter % 2) + 1];

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

        -- Increment Counter
        v_counter := v_counter + 1;
        
        RAISE NOTICE 'Assigned % to User ID %', v_record.name, v_current_user;
    END LOOP;

    RAISE NOTICE '✅ Successfully distributed % leads.', v_counter;
END $$;
