-- ============================================================================
-- 🔄 REDISTRIBUTE LEADS (From Saurabh to Others)
-- ============================================================================

-- Issue: Saurabh got all 26 leads due to batch update.
-- Fix: Reassign these 26 leads to other active members of GJ01TEAMFIRE.

DO $$
DECLARE
    v_saurabh_id UUID;
    v_lead_id UUID;
    v_target_user_id UUID;
    v_target_users UUID[];
    v_user_count INT;
    v_index INT := 1;
    v_rec RECORD;
BEGIN
    -- 1. Find Saurabh's ID (The one with high leads)
    SELECT id INTO v_saurabh_id
    FROM users 
    WHERE name ILIKE '%Saurabh%' AND team_code = 'GJ01TEAMFIRE'
    LIMIT 1;

    IF v_saurabh_id IS NULL THEN
        RAISE EXCEPTION 'Saurabh not found!';
    END IF;

    RAISE NOTICE 'Found Saurabh ID: %', v_saurabh_id;

    -- 2. Find Other Active Users (Targets)
    SELECT ARRAY_AGG(id) INTO v_target_users
    FROM users
    WHERE team_code = 'GJ01TEAMFIRE'
      AND id != v_saurabh_id
      AND is_active = true
      AND role IN ('member', 'manager');

    v_user_count := ARRAY_LENGTH(v_target_users, 1);
    
    IF v_user_count IS NULL OR v_user_count = 0 THEN
        RAISE EXCEPTION 'No other users found to redistribute to!';
    END IF;

    RAISE NOTICE 'Found % target users for redistribution.', v_user_count;

    -- 3. Loop through Saurabh's Force-Distributed Leads
    FOR v_rec IN 
        SELECT id 
        FROM leads 
        WHERE assigned_to = v_saurabh_id 
          AND notes LIKE '%Force Distributed%'
          AND assigned_at >= CURRENT_DATE
    LOOP
        -- Pick next user (Round Robin)
        v_target_user_id := v_target_users[v_index];
        
        -- Update Lead
        UPDATE leads
        SET assigned_to = v_target_user_id,
            user_id = v_target_user_id, -- Sync dashboard visibility too
            notes = notes || ' [Redistributed]',
            updated_at = NOW()
        WHERE id = v_rec.id;

        -- Update Counters (Decrement Saurabh, Increment Target)
        UPDATE users SET leads_today = leads_today - 1, total_leads_received = total_leads_received - 1 WHERE id = v_saurabh_id;
        UPDATE users SET leads_today = leads_today + 1, total_leads_received = total_leads_received + 1 WHERE id = v_target_user_id;

        -- Move index
        v_index := v_index + 1;
        IF v_index > v_user_count THEN
            v_index := 1;
        END IF;
    END LOOP;

    RAISE NOTICE '✅ Redistribution Complete!';

END $$;

-- 4. Verify New Distribution
SELECT 
    u.name,
    COUNT(l.id) as leads_assigned,
    STRING_AGG(CASE WHEN l.notes LIKE '%Redistributed%' THEN '♻️ Distrib' ELSE 'Normal' END, ', ') as types
FROM leads l
JOIN users u ON l.assigned_to = u.id
WHERE u.team_code = 'GJ01TEAMFIRE'
  AND l.assigned_at >= CURRENT_DATE
GROUP BY u.name
ORDER BY leads_assigned DESC;
