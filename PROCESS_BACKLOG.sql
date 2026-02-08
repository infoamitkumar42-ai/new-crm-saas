-- ============================================================================
-- 🚀 PROCESS NIGHT BACKLOG & QUEUED LEADS (Correction: Direct Update)
-- ============================================================================

DO $$
DECLARE
    r RECORD;
    v_team_code TEXT;
    v_user_id UUID;
    v_page_name TEXT;
    v_processed_count INT := 0;
BEGIN
    RAISE NOTICE 'Starting backlog processing...';

    -- Iterate through all unassigned Night_Backlog AND Queued leads
    FOR r IN 
        SELECT * FROM leads 
        WHERE status IN ('Night_Backlog', 'Queued') 
          AND assigned_to IS NULL
        ORDER BY created_at ASC
    LOOP
        -- 1. Extract page name from source
        IF r.source LIKE 'Meta - %' THEN
            v_page_name := TRIM(SUBSTRING(r.source FROM 8));
        ELSE
            v_page_name := r.source;
        END IF;
        
        -- 2. Get team code for this page
        SELECT team_id INTO v_team_code 
        FROM meta_pages 
        WHERE page_name = v_page_name;
        
        -- If no team code found, try fuzzy match
        IF v_team_code IS NULL THEN
             SELECT team_id INTO v_team_code 
             FROM meta_pages 
             WHERE page_name LIKE '%' || v_page_name || '%'
             LIMIT 1;
        END IF;

        IF v_team_code IS NOT NULL THEN
            -- 3. Get best assignee for this team
            v_user_id := NULL;
            
            BEGIN
                -- Corrected call: only 1 argument (team_code) as per earlier schema check
                -- But checking the file 20260207010000_fix_assignment_logic.sql shown in context,
                -- it accepts (p_team_code). The version in migration 20260207013800 accepts (p_team_code).
                -- The version in context takes 1 argument.
                SELECT user_id INTO v_user_id 
                FROM get_best_assignee_for_team(v_team_code::TEXT)
                LIMIT 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️ Error finding assignee for lead % (Team %): %', r.name, v_team_code, SQLERRM;
                CONTINUE;
            END;
            
            IF v_user_id IS NOT NULL THEN
                -- 4. Assign the lead (DIRECT UPDATE - RPC inserts new lead, we need to update existing)
                UPDATE leads
                SET 
                    assigned_to = v_user_id,
                    assigned_at = NOW(),
                    status = 'Assigned',
                    notes = COALESCE(notes, '') || ' [Auto-Processed from Backlog]'
                WHERE id = r.id;
                
                -- Update user counter
                UPDATE users
                SET total_leads_received = COALESCE(total_leads_received, 0) + 1,
                    leads_today = COALESCE(leads_today, 0) + 1
                WHERE id = v_user_id;
                
                v_processed_count := v_processed_count + 1;
                RAISE NOTICE '✅ Assigned lead % to user % (Team: %)', r.name, v_user_id, v_team_code;
            ELSE
                 RAISE NOTICE '⚠️ No eligible user found for team % (Lead: %)', v_team_code, r.name;
            END IF;
        ELSE
            RAISE NOTICE '❌ No team mapping found for page % (Lead: %)', v_page_name, r.name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '🎉 Total leads processed: %', v_processed_count;
END $$;
