-- ============================================================================
-- 🧪 TEST REAL-TIME ASSIGNMENT (Manual Check)
-- ============================================================================

-- Issue: Previously failed with 'Atomic assign failed'.
-- Fix: We updated the function to use proper locking.
-- Test: Manually call the function and check if it inserts a lead.

DO $$
DECLARE
    v_user_id UUID;
    v_success BOOLEAN;
    v_lead_id UUID;
    v_message TEXT;
BEGIN
    -- 1. Create a Fake Environment (Find a User)
    SELECT user_id INTO v_user_id FROM get_best_assignee_for_team('GJ01TEAMFIRE');
    
    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE '✅ Testing with User: %', v_user_id;

        -- 2. Call the Fixed Function
        SELECT success, lead_id, message INTO v_success, v_lead_id, v_message
        FROM assign_lead_atomically(
            'TEST LEAD - PLEASE IGNORE', 
            '9999999999', 
            'Test City', 
            'Test Source', 
            'New', 
            v_user_id, 
            100
        );

        -- 3. Verify Result
        IF v_success THEN
            RAISE NOTICE '✅ SUCCESS! Lead Assigned ID: %', v_lead_id;
            
            -- CLEANUP (Delete test lead so it doesn't mess up data)
            DELETE FROM leads WHERE id = v_lead_id;
            UPDATE users SET leads_today = leads_today - 1 WHERE id = v_user_id;
            RAISE NOTICE '🧹 Cleanup Complete (Test Lead Deleted)';
        ELSE
            RAISE NOTICE '❌ FAILED: %', v_message;
        END IF;

    ELSE
        RAISE NOTICE '❌ No user found to test with (Capacity Issue)';
    END IF;
END $$;
