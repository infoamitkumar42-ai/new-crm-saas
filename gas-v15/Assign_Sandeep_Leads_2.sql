DO $$ 
DECLARE
    v_user_id UUID;
    v_user_name TEXT;
    v_new_lead_id UUID;
BEGIN
    -- 1. Find User by Email
    SELECT id, name INTO v_user_id, v_user_name
    FROM public.users 
    WHERE email = 'sunnymehre451@gmail.com' 
    LIMIT 1;

    -- Validate User exists
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ User with email sunnymehre451@gmail.com not found!';
    END IF;

    RAISE NOTICE '✅ Assigning leads to: % (ID: %)', v_user_name, v_user_id;

    -- 2. Insert Lead 1: Simarjeet Kaur
    INSERT INTO public.leads (
        name, phone, city, state, source, status, user_id, assigned_at, created_at
    ) 
    VALUES (
        'Simarjeet Kaur', 
        '+918437829760', 
        'Punjab',          -- City not provided, using State as City
        'Punjab', 
        'Manual', 
        'New', 
        v_user_id, 
        NOW(),
        '2026-01-10 08:56:06-05:00' -- Original Timestamp
    ) RETURNING id INTO v_new_lead_id;
    
    RAISE NOTICE '👉 Lead 1 Assigned: Simarjeet Kaur (ID: %)', v_new_lead_id;

    -- 3. Insert Lead 2: Gurjeet Singh
    INSERT INTO public.leads (
        name, phone, city, state, source, status, user_id, assigned_at, created_at
    ) 
    VALUES (
        'Gurjeet Singh', 
        '+919501546288', 
        'Ludhiana', 
        'Punjab', 
        'Manual', 
        'New', 
        v_user_id, 
        NOW(),
        '2026-01-10 09:00:26-05:00' -- Original Timestamp
    ) RETURNING id INTO v_new_lead_id;

    RAISE NOTICE '👉 Lead 2 Assigned: Gurjeet Singh (ID: %)', v_new_lead_id;

    -- 4. Update User's Daily Counter (IMPORTANT)
    UPDATE public.users 
    SET 
        leads_today = leads_today + 2,
        total_leads_received = total_leads_received + 2,
        last_lead_time = NOW()
    WHERE id = v_user_id;

    RAISE NOTICE '✅ Counters updated for User.';

END $$;
