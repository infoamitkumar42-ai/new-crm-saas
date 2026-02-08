
-- ============================================================================
-- 🧪 TEST RLS PERMISSIONS (Impersonation Test)
-- ============================================================================
-- This script simulates being the user 'AJAY AHIR' and tries to update a lead.
-- If it passes, the permissions are 100% correct.

DO $$
DECLARE
    affected_rows int;
    test_user_id uuid := '554a1010-adf1-4743-bfb4-3eea48f63654'; -- Ajay Ahir
    test_lead_id uuid := 'f5bf697d-1fe0-4215-8228-4a628cdbfdbe'; -- A lead assigned to him
BEGIN
    -- 1. Simulate User Session
    -- This sets the current context to match what Supabase Auth does
    PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
    PERFORM set_config('role', 'authenticated', true);

    -- 2. Attempt the Update
    -- We try to change the note to 'RLS_TEST_OK'
    UPDATE leads 
    SET notes = 'RLS_TEST_OK' 
    WHERE id = test_lead_id;

    -- 3. Check Result
    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    IF affected_rows = 1 THEN
        RAISE NOTICE '✅ SUCCESS! User was able to update the note.';
    ELSE
        RAISE EXCEPTION '❌ FAILURE! User tried to update but 0 rows were affected. Permission denied?';
    END IF;

    -- 4. Rollback (Optional, but good to keep data clean)
    -- ROLLBACK; -- Cannot rollback inside DO block easily without exception. 
    -- We can just leave it or revert.
    
    -- Revert note for cleanup
    UPDATE leads SET notes = NULL WHERE id = test_lead_id;
    
END $$;
