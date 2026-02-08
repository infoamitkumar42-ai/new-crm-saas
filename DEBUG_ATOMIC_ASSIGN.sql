-- ============================================================================
-- 🕵️ DEBUG REAL-TIME ASSIGNMENT FAILURE (FIXED CASTING)
-- ============================================================================

-- Issue: "function is not unique" error means we have multiple get_best_assignee_for_team functions.
-- Fix: Cast 'GJ01TEAMFIRE'::text explicitly.

DO $$
DECLARE
    v_user_id UUID;
    v_success BOOLEAN;
    v_message TEXT;
BEGIN
    -- 1. Get best user (With explicit cast to avoid ambiguity)
    SELECT user_id INTO v_user_id 
    FROM get_best_assignee_for_team('GJ01TEAMFIRE'::text);
    
    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE '✅ Found Eligible User: %', v_user_id;
        
        -- 2. Try to assign (Simulating webhook call)
        SELECT success, message INTO v_success, v_message
        FROM assign_lead_atomically(
            'Test Lead', 
            '9999999999', 
            'Test City', 
            'Test Source', 
            'New', 
            v_user_id, 
            100 -- Simulate limit passed by webhook
        );
        
        RAISE NOTICE '📝 Assignment Result: Success=%, Message=%', v_success, v_message;
    ELSE
        RAISE NOTICE '❌ NO ELIGIBLE USER FOUND! (Everyone is Full or Offline)';
        
        -- Let's see WHY they are rejected
        RAISE NOTICE '--- Debugging Team Capacity ---';
        PERFORM 1; -- Just a dummy op
    END IF;
END $$;

-- 3. If no user found, dump the status of the team to see WHY
SELECT 
    name, 
    is_active, 
    is_online, 
    leads_today, 
    daily_limit,
    total_leads_received,
    total_leads_promised
FROM users 
WHERE team_code = 'GJ01TEAMFIRE'
ORDER BY leads_today ASC;
