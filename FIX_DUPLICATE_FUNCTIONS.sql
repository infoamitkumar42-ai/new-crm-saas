-- ============================================================================
-- 🧹 FIX DUPLICATE FUNCTIONS (Remove Ambiguity)
-- ============================================================================

-- Issue: Two versions of get_best_assignee_for_team exist.
-- 1. get_best_assignee_for_team(p_team_code text)
-- 2. get_best_assignee_for_team(p_team_code text, p_form_id text DEFAULT NULL)
-- This default null makes calls ambiguous.

-- 1. DROP the confusing version
DROP FUNCTION IF EXISTS get_best_assignee_for_team(text, text);

-- 2. Verify only one remains
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_best_assignee_for_team';

-- 3. Re-run debug assignment immediately to prove it works
DO $$
DECLARE
    v_user_id UUID;
    v_success BOOLEAN;
    v_message TEXT;
BEGIN
    SELECT user_id INTO v_user_id FROM get_best_assignee_for_team('GJ01TEAMFIRE');
    
    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE '✅ Function Works! Found User: %', v_user_id;
        -- Just check limit simulation
        SELECT success, message INTO v_success, v_message
        FROM assign_lead_atomically(
            'Test Lead', '9999999999', 'Test City', 'Test Source', 'New', v_user_id, 100
        );
        RAISE NOTICE 'Assignment Result: %', v_message;
    ELSE
        RAISE NOTICE '❌ Function Works but NO USER found (Capacity Issue)';
    END IF;
END $$;
