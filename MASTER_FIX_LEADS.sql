
-- ============================================================================
-- 🛡️ MASTER FIX: LEAD ASSIGNMENT & TEAM ACTIVATION v2.1 (FIXED)
-- ============================================================================

DO $$
DECLARE
    -- SQL Syntax Fix: Renamed variables to avoid collision with table aliases
    r_lead RECORD;
    target_user_id UUID;
    v_total_fixed_leads INT := 0;
BEGIN
    -- ---------------------------------------------------------
    -- 1. TEAM ACTIVATION (HIMANSHU & RAJWINDER)
    -- ---------------------------------------------------------
    UPDATE users 
    SET 
        payment_status = 'active', 
        is_active = true, 
        is_online = true,
        valid_until = NOW() + INTERVAL '30 days',
        daily_limit = CASE 
            WHEN daily_limit = 0 THEN 10 
            ELSE daily_limit 
        END,
        updated_at = NOW()
    WHERE team_code IN ('TEAMFIRE', 'TEAMRAJ');

    RAISE NOTICE '✅ Teams Activated and Limits Set.';

    -- ---------------------------------------------------------
    -- 2. RESYNC leads_today COUNTER
    -- ---------------------------------------------------------
    -- Fixed naming collision by using distinct aliases (u_target, l_source)
    UPDATE users u_target
    SET leads_today = (
        SELECT COUNT(*)::int 
        FROM leads l_source
        WHERE l_source.assigned_to = u_target.id 
        AND l_source.created_at >= CURRENT_DATE
    );

    RAISE NOTICE '✅ leads_today counters resynced with actual data.';

    -- ---------------------------------------------------------
    -- 3. ASSIGN STUCK LEADS (HIMANSHU)
    -- ---------------------------------------------------------
    FOR r_lead IN (
        SELECT id, name FROM leads 
        WHERE (status = 'New' OR assigned_to IS NULL) 
        AND (source ILIKE '%Himanshu%' OR source ILIKE '%CBO%' OR source ILIKE '%Web Landing Page%') 
        AND created_at >= CURRENT_DATE
    ) LOOP
        -- Find best candidate in Himanshu's team
        SELECT id INTO target_user_id 
        FROM users 
        WHERE team_code = 'TEAMFIRE' 
          AND is_active = true 
          AND is_online = true 
          AND leads_today < daily_limit
        ORDER BY leads_today ASC, random()
        LIMIT 1;
        
        IF target_user_id IS NOT NULL THEN
            UPDATE leads SET 
                assigned_to = target_user_id, 
                user_id = target_user_id,
                status = 'Assigned', 
                assigned_at = NOW() 
            WHERE id = r_lead.id;

            UPDATE users SET leads_today = leads_today + 1 WHERE id = target_user_id;
            v_total_fixed_leads := v_total_fixed_leads + 1;
        END IF;
    END LOOP;

    -- ---------------------------------------------------------
    -- 4. ASSIGN STUCK LEADS (RAJWINDER)
    -- ---------------------------------------------------------
    FOR r_lead IN (
        SELECT id, name FROM leads 
        WHERE (status = 'New' OR assigned_to IS NULL) 
        AND source ILIKE '%rajwinder%' 
        AND created_at >= CURRENT_DATE
    ) LOOP
        -- Find best candidate in Rajwinder's team
        SELECT id INTO target_user_id 
        FROM users 
        WHERE team_code = 'TEAMRAJ' 
          AND is_active = true 
          AND is_online = true 
          AND leads_today < daily_limit
        ORDER BY leads_today ASC, random()
        LIMIT 1;
        
        IF target_user_id IS NOT NULL THEN
            UPDATE leads SET 
                assigned_to = target_user_id, 
                user_id = target_user_id,
                status = 'Assigned', 
                assigned_at = NOW() 
            WHERE id = r_lead.id;

            UPDATE users SET leads_today = leads_today + 1 WHERE id = target_user_id;
            v_total_fixed_leads := v_total_fixed_leads + 1;
        END IF;
    END LOOP;

    RAISE NOTICE '✅ Distribution complete. Total stuck leads assigned: %', v_total_fixed_leads;

END $$;
