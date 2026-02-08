-- ============================================================================
-- 🕵️ DIAGNOSTIC PROCESSOR
-- ============================================================================

DO $$
DECLARE
    r RECORD;
    v_team_code TEXT;
    v_user_id UUID;
    v_processed_count INT := 0;
BEGIN
    RAISE NOTICE '--- Starting Diagnostic ---';

    -- Loop through leads that SHOULD match
    FOR r IN 
        SELECT id, name, status, source
        FROM leads 
        WHERE status IN ('Night_Backlog', 'Queued') 
          AND assigned_to IS NULL
    LOOP
        RAISE NOTICE '👉 Found Lead: % (Status: %, Source: %)', r.name, r.status, r.source;
        
        -- Check Page Mapping
        SELECT team_id INTO v_team_code 
        FROM meta_pages 
        WHERE page_name = TRIM(SUBSTRING(r.source FROM 8));
        
        IF v_team_code IS NULL THEN
             RAISE NOTICE '   ❌ No strict match for page: %', TRIM(SUBSTRING(r.source FROM 8));
        ELSE
             RAISE NOTICE '   ✅ Mapped to Team: %', v_team_code;
             
             -- Check Assignee
             -- Simplified check for debugging
             SELECT user_id INTO v_user_id 
             FROM get_best_assignee_for_team(v_team_code::TEXT)
             LIMIT 1;

             IF v_user_id IS NULL THEN
                 RAISE NOTICE '   ❌ No user found by RPC for team %', v_team_code;
             ELSE
                 RAISE NOTICE '   ✅ FOUND USER: %', v_user_id;
                 
                 -- PERFORM UPDATE
                 UPDATE leads
                 SET assigned_to = v_user_id, 
                     assigned_at = NOW(), 
                     status = 'Assigned',
                     notes = COALESCE(notes, '') || ' [Auto-Fix]'
                 WHERE id = r.id;
                 
                 UPDATE users
                 SET total_leads_received = COALESCE(total_leads_received, 0) + 1,
                     leads_today = COALESCE(leads_today, 0) + 1
                 WHERE id = v_user_id;

                 RAISE NOTICE '   🚀 ASSIGNED!';
                 v_processed_count := v_processed_count + 1;
             END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE '--- Finished. Processed: % ---', v_processed_count;
END $$;
