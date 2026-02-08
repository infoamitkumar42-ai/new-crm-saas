-- ============================================================================
-- 🚜 DEBUG & FIX RPC ERRORS (Returns a Table of Actions)
-- ============================================================================

DO $$
DECLARE
    r RECORD;
    v_user_record RECORD;
    v_count INT := 0;
BEGIN
    -- Create a temp table to store results
    CREATE TEMP TABLE processed_results (
        lead_id UUID,
        lead_name TEXT,
        team_id TEXT,
        assigned_to_user TEXT,
        status TEXT
    );

    FOR r IN 
        SELECT DISTINCT ON (l.id)
            l.id, l.name, l.phone, l.city, l.source, mp.team_id
        FROM leads l
        JOIN meta_pages mp ON TRIM(l.source) ILIKE '%' || TRIM(mp.page_name) || '%'
        WHERE l.status = 'Queued'
          AND (l.notes LIKE '%RPC Error%' OR l.notes LIKE '%Atomic assign failed%')
        ORDER BY l.id, LENGTH(mp.page_name) DESC
    LOOP
        -- 1. Find Best User
        SELECT * INTO v_user_record 
        FROM get_best_assignee_for_team(r.team_id)
        LIMIT 1;

        IF v_user_record.user_id IS NOT NULL THEN
            -- 2. Assign
            PERFORM assign_lead_atomically(
                r.name,
                r.phone, 
                r.city,
                r.source,
                'Assigned',
                v_user_record.user_id,
                v_user_record.daily_limit
            );
            
            INSERT INTO processed_results VALUES (r.id, r.name, r.team_id, v_user_record.user_name, 'SUCCESS');
        ELSE
            INSERT INTO processed_results VALUES (r.id, r.name, r.team_id, NULL, 'NO USER AVAILABLE');
        END IF;

    END LOOP;
END $$;

-- SHOW RESULTS
SELECT * FROM processed_results;
