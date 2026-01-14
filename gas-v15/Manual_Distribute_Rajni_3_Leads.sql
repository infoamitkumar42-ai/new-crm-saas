-- ============================================================================
-- 📥 MANUAL DISTRIBUTION: 3 Leads to Rajni
-- Email: rajnikaler01@gmail.com
-- ============================================================================

DO $$
DECLARE
    v_rajni_id UUID;
    v_lead_id UUID;
    v_record RECORD;
    v_counter INT := 0;
BEGIN
    -- 1. Get Rajni's User ID
    SELECT id INTO v_rajni_id FROM users WHERE email = 'rajnikaler01@gmail.com';

    IF v_rajni_id IS NULL THEN
        RAISE EXCEPTION 'Rajni not found with email rajnikaler01@gmail.com';
    END IF;

    RAISE NOTICE 'Found Rajni with ID: %', v_rajni_id;

    -- 2. Insert and Assign Leads
    FOR v_record IN 
        SELECT * FROM (VALUES
            ('ਸਰਦਾਰ ਅਮਰੀਕ ਸਿੰਘ', '+919041119684', 'Jalandhar'),
            ('bhangu saab', '+917814066429', 'Sangrur'),
            ('preet gill', '+919855353071', 'Fazilka')
        ) AS t(name, phone, city)
    LOOP
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
            v_rajni_id,
            'Assigned',
            'Manual_Import',
            NOW()
        ) RETURNING id INTO v_lead_id;

        v_counter := v_counter + 1;
        RAISE NOTICE 'Assigned % (%) to Rajni', v_record.name, v_record.city;
    END LOOP;

    -- 3. Update Rajni's Lead Counter
    UPDATE users 
    SET leads_today = leads_today + v_counter 
    WHERE id = v_rajni_id;

    RAISE NOTICE '✅ Successfully assigned % leads to Rajni', v_counter;
END $$;
