
-- ============================================================================
-- 🚫 STOP CHIRAG TEAM (GJ01TEAMFIRE) & REASSIGN LEADS TO HIMANSHU (TEAMFIRE)
-- ============================================================================

DO $$
DECLARE
    r_lead RECORD;
    target_user_id UUID;
    v_team_code_to_stop TEXT := 'GJ01TEAMFIRE';
    v_team_code_to_receive TEXT := 'TEAMFIRE';
    v_count INT := 0;
BEGIN

    -- 1. STOP CHIRAG TEAM (Zero Limits, Inactive)
    UPDATE users 
    SET 
        daily_limit = 0,
        is_active = false,
        payment_status = 'inactive',
        updated_at = NOW()
    WHERE team_code = v_team_code_to_stop;

    RAISE NOTICE '🛑 Chirag Team (GJ01TEAMFIRE) has been completely STOPPED.';


    -- 2. FIND LEADS ASSIGNED TO CHIRAG TEAM TODAY
    FOR r_lead IN (
        SELECT l.id, l.name
        FROM leads l
        JOIN users u ON l.assigned_to = u.id
        WHERE u.team_code = v_team_code_to_stop
        AND l.created_at >= CURRENT_DATE
    ) LOOP
        
        -- 3. FIND NEW RECEIVER IN HIMANSHU TEAM (TEAMFIRE)
        SELECT id INTO target_user_id 
        FROM users 
        WHERE team_code = v_team_code_to_receive
          AND is_active = true 
          AND is_online = true 
          AND leads_today < daily_limit
        ORDER BY leads_today ASC, random()
        LIMIT 1;

        -- 4. REASSIGN LEAD
        IF target_user_id IS NOT NULL THEN
            UPDATE leads 
            SET 
                assigned_to = target_user_id, 
                user_id = target_user_id,
                status = 'Assigned',
                assigned_at = NOW()
            WHERE id = r_lead.id;

            -- Update counters
            UPDATE users SET leads_today = leads_today - 1 WHERE id = (SELECT assigned_to FROM leads WHERE id = r_lead.id); -- Decrease old (Chirag) - Logic complex here, better to just inc new
            UPDATE users SET leads_today = leads_today + 1 WHERE id = target_user_id; -- Increase new (Himanshu)
            
            v_count := v_count + 1;
        END IF;

    END LOOP;

    RAISE NOTICE '✅ Reassigned % leads from Chirag Team to Himanshu Team.', v_count;

    -- 5. Final Safety: Resync everyone's counters to be 100% sure
    UPDATE users u
    SET leads_today = (
        SELECT COUNT(*)::int 
        FROM leads l 
        WHERE l.assigned_to = u.id 
        AND l.created_at >= CURRENT_DATE
    );

END $$;
