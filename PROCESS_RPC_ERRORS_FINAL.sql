-- ============================================================================
-- 🚜 PROCESS RPC ERRORS (Retry 71 Failure Leads - ROBUST MATCH)
-- ============================================================================

DO $$
DECLARE
    r RECORD;
    v_user_record RECORD;
    v_count INT := 0;
BEGIN
    RAISE NOTICE 'Starting reprocessing of Queued leads (Robust Match)...';

    FOR r IN 
        SELECT DISTINCT ON (l.id) -- Avoids duplicate processing if multiple pages match
            l.id, l.name, l.phone, l.city, l.source, mp.team_id, mp.page_name
        FROM leads l
        JOIN meta_pages mp ON TRIM(l.source) ILIKE '%' || TRIM(mp.page_name) || '%'
        WHERE l.status = 'Queued'
          AND (l.notes LIKE '%RPC Error%' OR l.notes LIKE '%Atomic assign failed%')
        ORDER BY l.id, LENGTH(mp.page_name) DESC -- Prefer longest page name match if ambiguous
    LOOP
        -- 1. Find Best User for this Team
        SELECT * INTO v_user_record 
        FROM get_best_assignee_for_team(r.team_id)
        LIMIT 1;

        IF v_user_record.user_id IS NOT NULL THEN
            -- 2. Assign Atomically (Updates existing lead because phone matches)
            PERFORM assign_lead_atomically(
                r.name,
                r.phone, 
                r.city,
                r.source,
                'Assigned',
                v_user_record.user_id,
                v_user_record.daily_limit
            );
            v_count := v_count + 1;
            RAISE NOTICE '✅ Assigned Lead % to User % (Team %)', r.name, v_user_record.user_name, r.team_id;
        ELSE
            RAISE NOTICE '⚠️ No user available for Lead % (Team %)', r.name, r.team_id;
        END IF;

    END LOOP;

    RAISE NOTICE '🎉 Processing Complete. Total Assigned: %', v_count;
END $$;
