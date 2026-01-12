-- ============================================================================
-- 🛠️ BULK LEAD ASSIGNMENT (9 Leads -> Sunny)
-- ============================================================================

DO $$ 
DECLARE
    v_user_id UUID;
    v_user_name TEXT;
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

    RAISE NOTICE '✅ Assigning 9 leads to: % (ID: %)', v_user_name, v_user_id;

    -- 2. Insert Lead 1: Bhavneet kaur
    INSERT INTO public.leads (name, phone, city, state, source, status, user_id, assigned_at, created_at) 
    VALUES ('Bhavneet kaur', '+919653974263', 'Amritsar', 'Punjab', 'Manual', 'New', v_user_id, NOW(), '2026-01-10 09:14:22-05:00');

    -- 3. Insert Lead 2: Harry Singh Gurdaspur
    INSERT INTO public.leads (name, phone, city, state, source, status, user_id, assigned_at, created_at) 
    VALUES ('Harry Singh Gurdaspur', '+917800253577', 'Delhi', 'Delhi', 'Manual', 'New', v_user_id, NOW(), '2026-01-10 09:23:25-05:00');

    -- 4. Insert Lead 3: Rajni Rajput
    INSERT INTO public.leads (name, phone, city, state, source, status, user_id, assigned_at, created_at) 
    VALUES ('Rajni Rajput', '+918195838297', 'Jalandhar City', 'Punjab', 'Manual', 'New', v_user_id, NOW(), '2026-01-10 09:24:18-05:00');

    -- 5. Insert Lead 4: Tajinder Dhindsa
    INSERT INTO public.leads (name, phone, city, state, source, status, user_id, assigned_at, created_at) 
    VALUES ('Tajinder Dhindsa', '+19855899896', 'samrala', 'Punjab', 'Manual', 'New', v_user_id, NOW(), '2026-01-10 09:26:20-05:00');

    -- 6. Insert Lead 5: Gurpreet Singh
    INSERT INTO public.leads (name, phone, city, state, source, status, user_id, assigned_at, created_at) 
    VALUES ('Gurpreet Singh', '917009037038', 'Faridkot', 'Punjab', 'Manual', 'New', v_user_id, NOW(), '2026-01-10 09:30:27-05:00');

    -- 7. Insert Lead 6: Parkash singh
    INSERT INTO public.leads (name, phone, city, state, source, status, user_id, assigned_at, created_at) 
    VALUES ('Parkash singh', '+918054119845', 'Muktsar', 'Punjab', 'Manual', 'New', v_user_id, NOW(), '2026-01-10 09:32:03-05:00');

    -- 8. Insert Lead 7: ਜਸਵਿੰਦਰ ਸਿੰਘ (Jaswinder Singh)
    INSERT INTO public.leads (name, phone, city, state, source, status, user_id, assigned_at, created_at) 
    VALUES ('ਜਸਵਿੰਦਰ ਸਿੰਘ', '+919878406081', 'machhiwara sahib', 'Punjab', 'Manual', 'New', v_user_id, NOW(), '2026-01-10 09:34:55-05:00');

    -- 9. Insert Lead 8: Truckan WaLe
    INSERT INTO public.leads (name, phone, city, state, source, status, user_id, assigned_at, created_at) 
    VALUES ('Truckan WaLe', '+918872752162', 'Bathinda', 'Punjab', 'Manual', 'New', v_user_id, NOW(), '2026-01-10 09:39:36-05:00');

    -- 10. Insert Lead 9: harish Kumar
    INSERT INTO public.leads (name, phone, city, state, source, status, user_id, assigned_at, created_at) 
    VALUES ('harish Kumar', '+919803899195', 'Nabha', 'Punjab', 'Manual', 'New', v_user_id, NOW(), '2026-01-10 09:43:51-05:00');

    -- 11. Update User's Daily Counter (+9 Leads)
    UPDATE public.users 
    SET 
        leads_today = leads_today + 9,
        total_leads_received = total_leads_received + 9,
        last_lead_time = NOW()
    WHERE id = v_user_id;

    RAISE NOTICE '✅ Successfully assigned 9 leads to Sunny and updated counters.';

END $$;
